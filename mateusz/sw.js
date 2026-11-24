// Pozwala otworzyć aplikację bez internetu (np. na siłowni w piwnicy).
// Najpierw próbuje pobrać najnowszą wersję (z pominięciem pamięci przeglądarki), a gdy nie ma sieci – używa zapisanej.
const C="trening-v16";
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(["./","index.html","manifest.webmanifest","icon-192.png"])).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;
  const same=new URL(e.request.url).origin===location.origin;
  const net=same?fetch(e.request.url,{cache:"no-cache",credentials:"same-origin"}).then(r=>r.redirected&&e.request.mode==="navigate"?r.blob().then(b=>new Response(b,{status:r.status,statusText:r.statusText,headers:r.headers})):r):fetch(e.request);
  e.respondWith(net.then(r=>{if(r.ok&&(same||/fonts\.(googleapis|gstatic)\.com/.test(e.request.url))&&!/version\.json/.test(e.request.url)){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match("index.html"))))});
