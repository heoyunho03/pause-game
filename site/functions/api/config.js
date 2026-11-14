import {json} from '../../lib/http.js';
export function onRequestGet({env}) {
  return json({googleClientId:env.GOOGLE_CLIENT_ID || null, cloudEnabled:Boolean(env.GOOGLE_CLIENT_ID && env.DATABASE_URL)});
}
