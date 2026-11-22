// Pozwala otworzyć aplikację bez internetu (np. na siłowni w piwnicy).
// Najpierw próbuje pobrać najnowszą wersję, a gdy nie ma sieci – używa zapisanej.
const C="trening-v11";
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(["./","index.html","manifest.webmanifest","icon-192.png"])).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok&&(new URL(e.request.url).origin===location.origin||/fonts\.(googleapis|gstatic)\.com/.test(e.request.url))){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match("index.html"))))});
