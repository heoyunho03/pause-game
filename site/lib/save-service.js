import {MAX_BODY_BYTES, validateSnapshot} from '../public/sync-data.js';
import {json, rejectCrossOrigin} from './http.js';

async function readBody(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) {
    throw Object.assign(new Error('Expected application/json'), {status:415});
  }
  const declared = request.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_BODY_BYTES)) {
    throw Object.assign(new Error('Save too large'), {status:413});
  }
  if (!request.body) throw Object.assign(new Error('Missing body'), {status:400});
  const reader = request.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        throw Object.assign(new Error('Save too large'), {status:413});
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let data;
  try { data = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes)); }
  catch { throw Object.assign(new Error('Invalid JSON'), {status:400}); }
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      Object.keys(data).sort().join(',') !== 'expectedRevision,requestId,snapshot' ||
      !Number.isSafeInteger(data.expectedRevision) || data.expectedRevision < 0 ||
      typeof data.requestId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.requestId)) {
    throw Object.assign(new Error('Invalid save envelope'), {status:400});
  }
  try { validateSnapshot(data.snapshot); }
  catch { throw Object.assign(new Error('Invalid save snapshot'), {status:400}); }
  return data;
}

async function fingerprint(snapshot) {
  const canonical = JSON.stringify(Object.fromEntries(Object.entries(snapshot).sort(([a],[b]) => a.localeCompare(b))));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('');
}

export async function handleSave(context, authenticate) {
  const {request} = context;
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  if (!['GET','PUT'].includes(request.method)) return json({error:'Method not allowed'},405, {allow:'GET, PUT'});
  const auth = await authenticate(context);
  if (auth.error) return auth.error;
  if (request.method === 'GET') {
    try {
      const rows = await auth.sql`SELECT snapshot, revision, updated_at FROM pause_user_saves WHERE google_sub = ${auth.sub} LIMIT 1`;
      const row = rows[0];
      return json({snapshot:row?.snapshot || {}, revision:Number(row?.revision || 0), updatedAt:row?.updated_at || null});
    } catch { return json({error:'Database read failed'},503); }
  }
  let data;
  try { data = await readBody(request); }
  catch (error) { return json({error:error.message},error.status || 400); }
  const {snapshot, expectedRevision, requestId} = data;
  const hash = await fingerprint(snapshot);
  try {
    // One atomic statement: stale writes never overwrite newer saves.
    // A retry of the exact same request returns the same revision.
    const rows = await auth.sql`
      INSERT INTO pause_user_saves AS current_save
        (google_sub,snapshot,revision,last_request_id,last_payload_hash,updated_at)
      SELECT ${auth.sub},${JSON.stringify(snapshot)}::jsonb,1,${requestId}::uuid,${hash},NOW()
      WHERE ${expectedRevision} = 0 OR EXISTS
        (SELECT 1 FROM pause_user_saves WHERE google_sub = ${auth.sub})
      ON CONFLICT (google_sub) DO UPDATE SET
        snapshot = CASE WHEN current_save.last_request_id = EXCLUDED.last_request_id THEN current_save.snapshot ELSE EXCLUDED.snapshot END,
        revision = CASE WHEN current_save.last_request_id = EXCLUDED.last_request_id THEN current_save.revision ELSE current_save.revision + 1 END,
        updated_at = CASE WHEN current_save.last_request_id = EXCLUDED.last_request_id THEN current_save.updated_at ELSE NOW() END,
        last_request_id = EXCLUDED.last_request_id,
        last_payload_hash = EXCLUDED.last_payload_hash
      WHERE (current_save.last_request_id = EXCLUDED.last_request_id AND current_save.last_payload_hash = EXCLUDED.last_payload_hash)
        OR (current_save.revision = ${expectedRevision} AND current_save.last_request_id IS DISTINCT FROM EXCLUDED.last_request_id)
      RETURNING revision,updated_at`;
    if (!rows.length) return json({error:'Save conflict. Read the latest cloud save and confirm again.'},409);
    return json({ok:true, revision:Number(rows[0].revision), updatedAt:rows[0].updated_at});
  } catch { return json({error:'Database write failed'},503); }
}
