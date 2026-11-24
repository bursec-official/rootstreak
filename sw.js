const C='rootstreak-1795530574';
const FILES=['./','index.html','styles.css?v=1795530574','data.js?v=1795530574','app.js?v=1795530574','icons.js?v=1795530574','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png','fonts/inter-latin-400-normal.woff2','fonts/inter-latin-500-normal.woff2','fonts/inter-latin-600-normal.woff2','fonts/inter-latin-700-normal.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{ if(e.request.method!=='GET') return;
  const u=new URL(e.request.url);
  if(e.request.mode==='navigate'){ e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put('index.html',cp));return r;}).catch(()=>caches.match('index.html'))); return; }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{ if(u.origin===location.origin){const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp));} return res; })));
});
