// Real PostgreSQL SQL semantics in local PGlite. This is NOT a live Neon test.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {handleSave} from '../lib/save-service.js';
import {MAX_BODY_BYTES} from '../public/sync-data.js';
const db = new PGlite();
await db.exec(await readFile(new URL('../../sql/001_pausesaves.sql',import.meta.url),'utf8'));
const migration = await readFile(new URL('../../sql/002_safe_sync.sql',import.meta.url),'utf8');
await db.exec(migration);await db.exec(migration);
function sql(parts,...values) {
  const query=parts.reduce((text,part,i)=>text+(i ? '$'+i : '')+part,'');
  return db.query(query,values).then(result=>result.rows);
}
const authenticate=async context=>({sub:context.request.headers.get('x-test-user') || 'alice',sql});
const snapshot={'pause:v04:2048best':'256','pause:v04:runner-3d-v1':'{"best":42}','pause:theme':'dark'};
function request(method='GET',data,user='alice',headers={}) {
  return {env:{},request:new Request('https://pause-game.pages.dev/api/save',{
    method,headers:{'x-test-user':user,...(data ? {'content-type':'application/json'} : {}),...headers},
    ...(data ? {body:JSON.stringify(data)} : {})
  })};
}
const call=(...args)=>handleSave(request(...args),authenticate);
const envelope=(expectedRevision=0,values=snapshot,id=crypto.randomUUID())=>({snapshot:values,expectedRevision,requestId:id});
test('SQL migrations repeat without deleting original data',async () => {
  await db.query("INSERT INTO pause_user_saves(google_sub,snapshot) VALUES ($1,$2::jsonb)",['legacy','{"pause:2048best":"100"}']);
  await db.exec(migration);
  assert.equal((await db.query("SELECT snapshot FROM pause_user_saves WHERE google_sub='legacy'")).rows[0].snapshot['pause:2048best'],'100');
});
test('save, user isolation, read and exact duplicate retry',async () => {
  const payload=envelope();
  const first=await call('PUT',payload);
  assert.equal(first.status,200);assert.equal((await first.json()).revision,1);
  const retry=await call('PUT',payload);assert.equal(retry.status,200);assert.equal((await retry.json()).revision,1);
  const alice=await (await call('GET')).json();assert.deepEqual(alice.snapshot,snapshot);assert.equal(alice.revision,1);
  assert.deepEqual((await (await call('GET',null,'bob')).json()).snapshot,{});
  const different=await call('PUT',{...payload,snapshot:{'pause:theme':'light'}});assert.equal(different.status,409);
});
test('concurrent stale saves permit exactly one winner',async () => {
  const results=await Promise.all(Array.from({length:8},(_,i)=>call('PUT',envelope(1,{'pause:v04:2048best':String(300+i)}))));
  assert.equal(results.filter(r=>r.status===200).length,1);
  assert.equal(results.filter(r=>r.status===409).length,7);
  assert.equal((await (await call('GET')).json()).revision,2);
});
test('no phantom recreation from a nonzero revision',async () => {
  assert.equal((await call('PUT',envelope(8), 'never-saved')).status,409);
});
test('reject unknown identity fields, malformed values, keys and revisions',async () => {
  for(const data of [
    {...envelope(),sub:'bob'},envelope(-1),envelope(0,[]),
    envelope(0,{'pause:favsevil':'a'}),envelope(0,{'pause:theme':7}),
    {...envelope(),requestId:'bad'}, {...envelope(),expectedRevision:1.1}
  ]) assert.equal((await call('PUT',data,'invalid-user')).status,400);
  assert.equal((await call('POST',envelope())).status,405);
  assert.equal((await call('PUT',envelope(),'invalid-user',{'content-type':'text/plain'})).status,415);
});
test('stream limit applies without content-length, including multi-byte text',async () => {
  const body=JSON.stringify(envelope(0,{'pause:theme':'가'.repeat(MAX_BODY_BYTES/2)}));
  const context={env:{},request:new Request('https://pause-game.pages.dev/api/save',{method:'PUT',headers:{'content-type':'application/json'},body})};
  assert.equal((await handleSave(context,authenticate)).status,413);
});
test('invalid JSON and unavailable DB fail safely',async () => {
  const context={request:new Request('https://pause-game.pages.dev/api/save',{method:'PUT',headers:{'content-type':'application/json'},body:'{bad'}),env:{}};
  assert.equal((await handleSave(context,authenticate)).status,400);
  const broken=async()=>({sub:'alice',sql:async()=>{throw Error('secret must not leak');}});
  const result=await handleSave(request(),broken);assert.equal(result.status,503);assert.ok(!(await result.text()).includes('secret'));
});
test.after(()=>db.close());
