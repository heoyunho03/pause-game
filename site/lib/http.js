export function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers:{
      'content-type':'application/json; charset=utf-8',
      'cache-control':'no-store',
      'x-content-type-options':'nosniff',
      'referrer-policy':'no-referrer',
      'x-frame-options':'DENY',
      ...extra
    }
  });
}

export function rejectCrossOrigin(request) {
  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');
  if ((origin && origin !== new URL(request.url).origin) || site === 'cross-site') {
    return json({error:'Cross-origin request denied'},403);
  }
  return null;
}
