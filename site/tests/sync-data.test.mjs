import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_VALUE_BYTES, RECOVERY_KEY, applySnapshot, captureSnapshot, readRecovery, validKey, validateSnapshot} from '../public/sync-data.js';
class Storage {
  values = new Map(); failOn = null;
  get length() { return this.values.size; }
  key(i) { return [...this.values.keys()][i] ?? null; }
  getItem(k) { return this.values.get(k) ?? null; }
  setItem(k,v) { if (k === this.failOn) { this.failOn = null; throw new Error('QuotaExceededError'); } this.values.set(k,String(v)); }
  removeItem(k) { this.values.delete(k); }
}
test('all legacy storage key families remain byte-for-byte strings',() => {
  const storage = new Storage();
  for (const [key,value] of Object.entries({'pause:v04:2048best':'900','pause:v04:sky-roll-3d-v1':'{"best":9}','pause:v04:runner-3d-v1':'{"best":10}','pause:2048state':'[]','pause:2048best':'8','pause:2048:sound':'1','pause:favs':'["rolling"]','pause:theme':'light','pause:v20:recent':'["runner"]'})) storage.setItem(key,value);
  storage.setItem('other-app','untouched');storage.setItem(RECOVERY_KEY,'not included');
  const snapshot = captureSnapshot(storage);
  assert.equal(Object.keys(snapshot).length,9);assert.equal(snapshot['pause:v04:2048best'],'900');
  for (const key of ['pause:favs-evil','pause:v20:recent:bad','pause:themeoops','pause:v04:','__proto__',RECOVERY_KEY]) assert.equal(validKey(key),false,key);
});
test('reject arrays, non-string values and UTF-8 oversize',() => {
  for (const data of [null,[],{'pause:favs':[]},{'unrelated':'x'},{'pause:theme':'가'.repeat(MAX_VALUE_BYTES/2)}]) assert.throws(()=>validateSnapshot(data));
  assert.throws(()=>validateSnapshot(Object.fromEntries(Array.from({length:101},(_,i)=>['pause:v04:x'+i,'0']))));
});
test('restore retains local-only and unrelated keys, saves BEFORE image',() => {
  const s = new Storage();s.setItem('pause:2048best','500');s.setItem('pause:theme','light');s.setItem('other','keep');
  applySnapshot(s,{'pause:2048best':'800'});
  assert.equal(s.getItem('pause:2048best'),'800');assert.equal(s.getItem('pause:theme'),'light');assert.equal(s.getItem('other'),'keep');
  assert.equal(readRecovery(s).snapshot['pause:2048best'],'500');
});
test('quota during restore rolls back partial changes',() => {
  const s = new Storage();s.setItem('pause:2048best','500');s.setItem('pause:theme','light');s.failOn='pause:theme';
  assert.throws(()=>applySnapshot(s,{'pause:2048best':'800','pause:theme':'dark'}));
  assert.equal(s.getItem('pause:2048best'),'500');assert.equal(s.getItem('pause:theme'),'light');
  assert.equal(readRecovery(s).snapshot['pause:2048best'],'500');
});
test('checkpoint failure prevents all game changes',() => {
  const s = new Storage();s.setItem('pause:2048best','500');s.failOn=RECOVERY_KEY;
  assert.throws(()=>applySnapshot(s,{'pause:2048best':'800'}));assert.equal(s.getItem('pause:2048best'),'500');
});
test('invalid remote keys rejected before checkpoint writes',() => {
  const s=new Storage();assert.throws(()=>applySnapshot(s,{'pause:theme':'dark',evil:'yes'}));assert.equal(s.length,0);
});
