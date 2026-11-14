// Pages advanced-mode adapter reusing the original API handlers.
import {onRequest as save} from '../functions/api/save.js';
import {onRequestGet as config} from '../functions/api/config.js';
import {json} from '../lib/http.js';
import html from '../public/index.html';
import cloudSync from '../public/cloud-sync.js?text';
import syncData from '../public/sync-data.js?text';
const assets = new Map([
  ['/',[html,'text/html; charset=utf-8']],
  ['/index.html',[html,'text/html; charset=utf-8']],
  ['/cloud-sync.js',[cloudSync,'text/javascript; charset=utf-8']],
  ['/sync-data.js',[syncData,'text/javascript; charset=utf-8']]
]);
export default {
  async fetch(request, env, execution = {}) {
    const url = new URL(request.url);
    if (url.pathname === '/api/config') {
      if (request.method !== 'GET') return json({error:'Method not allowed'},405,{allow:'GET'});
      return config({request,env});
    }
    if (url.pathname === '/api/save') return save({request,env,waitUntil:execution.waitUntil?.bind(execution)});
    if (url.pathname.startsWith('/api/')) return json({error:'Not found'},404);
    if (!['GET','HEAD'].includes(request.method)) return json({error:'Method not allowed'},405,{allow:'GET, HEAD'});
    const asset = assets.get(url.pathname);
    if (!asset) return new Response('Not found',{status:404,headers:{'x-content-type-options':'nosniff'}});
    return new Response(request.method === 'HEAD' ? null : asset[0],{headers:{
      'content-type':asset[1],'cache-control':'no-cache',
      'x-content-type-options':'nosniff','x-frame-options':'SAMEORIGIN',
      'referrer-policy':'strict-origin-when-cross-origin',
      'cross-origin-opener-policy':'same-origin-allow-popups'
    }});
  }
};
