import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair, SignJWT, createLocalJWKSet, exportJWK} from 'jose';
import {createAuthenticator, verifyGoogleToken} from '../functions/api/_auth.js';
const client = 'test.apps.googleusercontent.com';
const {privateKey, publicKey} = await generateKeyPair('RS256');
const jwk = await exportJWK(publicKey);jwk.kid='test';jwk.alg='RS256';
const keys = createLocalJWKSet({keys:[jwk]});
const mint = async (claims={}, options={}) => new SignJWT({email_verified:true,...claims})
  .setProtectedHeader({alg:'RS256',kid:'test'}).setIssuer(options.issuer || 'https://accounts.google.com')
  .setAudience(options.audience || client).setSubject(options.subject || 'verified-user-1')
  .setIssuedAt().setExpirationTime(options.expiry || '1h').sign(options.key || privateKey);
test('real RSA signature verification returns only verified sub',async () => {
  assert.equal(await verifyGoogleToken(await mint(),client,keys),'verified-user-1');
});
test('reject wrong audience, issuer, expiration, azp, email and signature',async () => {
  const other=await generateKeyPair('RS256');
  for(const [claims,options] of [[{},{audience:'evil'}],[{},{issuer:'evil'}],[{},{expiry:'-1h'}],[{azp:'evil'},{}],[{email_verified:false},{}],[{},{key:other.privateKey}]]){
    await assert.rejects(()=>mint(claims,options).then(token=>verifyGoogleToken(token,client,keys)));
  }
});
test('missing authentication is 401 before Neon is configured',async () => {
  const auth=createAuthenticator();
  for(const value of ['', 'Bearer no-token','Bearer a.b.c extra']) {
    const result=await auth({request:new Request('https://pause-game.pages.dev/api/save',{headers:{authorization:value}}),env:{}});
    assert.equal(result.error.status,401);
  }
});
test('cross-site requests denied without touching identity provider',async () => {
  let calls=0;const auth=createAuthenticator({verify:async()=>{calls++;return 'user';}});
  const result=await auth({request:new Request('https://pause-game.pages.dev/api/save',{headers:{authorization:'Bearer a.b.c',origin:'https://evil.example'}}),env:{GOOGLE_CLIENT_ID:client,DATABASE_URL:'hidden'}});
  assert.equal(result.error.status,403);assert.equal(calls,0);
});
test('identity provider outage distinguished from invalid credentials',async () => {
  const context={request:new Request('https://pause-game.pages.dev/api/save',{headers:{authorization:'Bearer a.b.c'}}),env:{GOOGLE_CLIENT_ID:client,DATABASE_URL:'hidden'}};
  for(const [error,status] of [[new TypeError('network'),503],[new Error('bad claims'),401]]) {
    const auth=createAuthenticator({verify:async()=>{throw error;}});
    assert.equal((await auth(context)).error.status,status);
  }
});
