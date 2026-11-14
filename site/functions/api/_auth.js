import {neon} from '@neondatabase/serverless';
import {createRemoteJWKSet, jwtVerify} from 'jose';
import {json, rejectCrossOrigin} from '../../lib/http.js';

const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'), {
  timeoutDuration:5000, cooldownDuration:30000, cacheMaxAge:3600000
});

export async function verifyGoogleToken(token, clientId, keys = googleKeys) {
  const {payload} = await jwtVerify(token, keys, {
    algorithms:['RS256'],
    audience:clientId,
    issuer:['accounts.google.com','https://accounts.google.com'],
    requiredClaims:['sub','iat','exp'],
    clockTolerance:5
  });
  if (typeof payload.sub !== 'string' || payload.sub.length < 1 || payload.sub.length > 255 ||
      payload.email_verified !== true || (payload.azp && payload.azp !== clientId) ||
      !Number.isFinite(payload.iat) || payload.iat > Date.now()/1000 + 5) {
    throw new Error('Invalid identity claims');
  }
  return payload.sub;
}

export function createAuthenticator({verify = verifyGoogleToken, connect = neon} = {}) {
  return async ({request, env}) => {
    const denied = rejectCrossOrigin(request);
    if (denied) return {error:denied};
    const token = (request.headers.get('authorization') || '').match(/^Bearer ([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)$/i)?.[1];
    if (!token || token.length > 8192) return {error:json({error:'Missing or malformed identity token'},401)};
    if (!env.GOOGLE_CLIENT_ID || !env.DATABASE_URL) return {error:json({error:'Cloud sync not configured'},503)};
    let sub;
    try { sub = await verify(token, env.GOOGLE_CLIENT_ID); }
    catch (error) {
      const unavailable = error?.code === 'ERR_JWKS_TIMEOUT' || error instanceof TypeError || error?.name === 'AbortError';
      return {error:json({error:unavailable ? 'Identity provider unavailable' : 'Invalid or expired identity token'}, unavailable ? 503 : 401)};
    }
    try {
      return {sub, sql:connect(env.DATABASE_URL, {fetchOptions:{signal:AbortSignal.timeout(10000)}})};
    } catch { return {error:json({error:'Database unavailable'},503)}; }
  };
}
export const authenticate = createAuthenticator();
export {json};
