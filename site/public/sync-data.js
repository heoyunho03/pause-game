// The original game storage keys and string values stay unchanged.
export const MAX_SNAPSHOT_BYTES = 480 * 1024;
export const MAX_BODY_BYTES = 512 * 1024;
export const MAX_VALUE_BYTES = 128 * 1024;
export const RECOVERY_KEY = 'pause:cloud:recovery:v22';
const encoder = new TextEncoder();
export const byteLength = value => encoder.encode(value).byteLength;
export const validKey = key => typeof key === 'string' && key.length <= 180 &&
  /^(?:pause:v04:[a-zA-Z0-9:_-]+|pause:v20:recent|pause:2048state|pause:2048best|pause:2048:sound|pause:favs|pause:theme)$/.test(key);

export function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) throw new Error('저장 데이터 형식이 올바르지 않습니다.');
  const entries = Object.entries(snapshot);
  if (entries.length > 100 || entries.some(([key, value]) => !validKey(key) || typeof value !== 'string' || byteLength(value) > MAX_VALUE_BYTES)) {
    throw new Error('지원하지 않는 저장 키 또는 너무 큰 기록이 있습니다.');
  }
  if (byteLength(JSON.stringify(snapshot)) > MAX_SNAPSHOT_BYTES) throw new Error('저장 데이터 크기 제한을 초과했습니다.');
  return snapshot;
}

export function captureSnapshot(storage) {
  const snapshot = {};
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (validKey(key)) snapshot[key] = storage.getItem(key);
  }
  return validateSnapshot(snapshot);
}

export function readRecovery(storage) {
  const value = storage.getItem(RECOVERY_KEY);
  if (!value) return null;
  const checkpoint = JSON.parse(value);
  if (checkpoint?.format !== 'pause-backup-v1' || typeof checkpoint.createdAt !== 'string') throw new Error('복구본 형식이 올바르지 않습니다.');
  validateSnapshot(checkpoint.snapshot);
  return checkpoint;
}

// Validate everything, then persist a recovery copy BEFORE touching any game key.
// Restore only supplied keys: local-only records and unrelated apps are preserved.
export function applySnapshot(storage, incoming, {replace = false} = {}) {
  validateSnapshot(incoming);
  const before = captureSnapshot(storage);
  const previousRecovery = storage.getItem(RECOVERY_KEY);
  const checkpoint = JSON.stringify({format:'pause-backup-v1', createdAt:new Date().toISOString(), snapshot:before});
  try { storage.setItem(RECOVERY_KEY, checkpoint); }
  catch { throw new Error('복구본을 보관할 공간이 부족합니다. 기기 백업을 다운로드한 뒤 다시 시도해 주세요.'); }
  const written = [];
  try {
    for (const [key, value] of Object.entries(incoming)) {
      storage.setItem(key, value);
      written.push(key);
    }
    if (replace) {
      for (const key of Object.keys(before)) {
        if (!Object.hasOwn(incoming,key)) { storage.removeItem(key); written.push(key); }
      }
    }
  } catch {
    let rolledBack = true;
    for (const key of written.reverse()) {
      try {
        if (Object.hasOwn(before, key)) storage.setItem(key, before[key]);
        else storage.removeItem(key);
      } catch { rolledBack = false; }
    }
    // Keep the valid BEFORE image if rollback itself ran out of storage.
    if (rolledBack && previousRecovery) {
      try { storage.setItem(RECOVERY_KEY, previousRecovery); } catch { /* current checkpoint remains recoverable */ }
    }
    throw new Error(rolledBack ? '복원을 취소하고 기존 기록을 되돌렸습니다.' : '복원이 중단되었습니다. 복구본 다운로드로 기존 기록을 보관해 주세요.');
  }
  return {count:Object.keys(incoming).length, checkpoint:JSON.parse(checkpoint)};
}
