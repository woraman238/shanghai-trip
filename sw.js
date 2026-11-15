const C='sh-trip-v3';
const CORE=['./','./index.html','./manifest.json','./icon.svg'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',e=>{
  if(e.data==='SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(/firebaseio|firebasedatabase|open-meteo|er-api|nominatim/.test(u.hostname))return;
  if((r.headers.get('accept')||'').includes('text/event-stream'))return;
  const isNav=r.mode==='navigate'||(u.origin===location.origin&&/(\/|index\.html)$/.test(u.pathname));
  e.respondWith(caches.open(C).then(async c=>{
    const hit=await c.match(r);
    const net=fetch(r).then(res=>{
      if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());
      return res;
    }).catch(()=>hit||new Response('Offline',{status:503,statusText:'Offline'}));
    return isNav?(await net||hit):hit||net;
  }));
});
