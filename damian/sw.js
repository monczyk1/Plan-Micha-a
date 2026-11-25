// Pozwala otworzyć aplikację bez internetu (np. na siłowni w piwnicy).
// Najpierw próbuje pobrać najnowszą wersję (z pominięciem pamięci przeglądarki), a gdy nie ma sieci – używa zapisanej.
// ROOT i BUILD ustawia ./sync.sh (w folderach osób ROOT="../", bo wspólne pliki leżą piętro wyżej). Nie zmieniaj ręcznie.
const ROOT = "../";
const BUILD = 19;
const C = "tytanowa-b" + BUILD;
// Wspólne pliki aplikacji – ta sama lista co w index.html (./sync.sh pilnuje, żeby niczego nie brakowało)
const SHARED = [
  "styl.css",
  "kod/profil.js",
  "dane/plan-start.js",
  "dane/plan-damian.js",
  "dane/plan-mateusz.js",
  "kod/plan.js",
  "dane/cwiczenia.js",
  "dane/rysunki.js",
  "dane/opisy.js",
  "kod/talerze.js",
  "kod/odznaki.js",
  "kod/postepy.js",
  "kod/sila.js",
  "kod/raport.js",
  "kod/aplikacja.js",
];
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches
      .open(C)
      .then((c) =>
        c.addAll([
          "./",
          "index.html",
          "manifest.webmanifest",
          "icon-192.png",
          ...SHARED.map((f) => ROOT + f + "?v=" + BUILD),
        ])
      )
      .then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((k) => Promise.all(k.filter((x) => x !== C).map((x) => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const same = new URL(e.request.url).origin === location.origin;
  const net = same
    ? fetch(e.request.url, { cache: "no-cache", credentials: "same-origin" }).then((r) =>
        r.redirected && e.request.mode === "navigate"
          ? r.blob().then((b) => new Response(b, { status: r.status, statusText: r.statusText, headers: r.headers }))
          : r
      )
    : fetch(e.request);
  e.respondWith(
    net
      .then((r) => {
        if (
          r.ok &&
          (same || /fonts\.(googleapis|gstatic)\.com/.test(e.request.url)) &&
          !/version\.json/.test(e.request.url)
        ) {
          const cp = r.clone();
          caches.open(C).then((c) => c.put(e.request, cp));
        }
        return r;
      })
      .catch(() => caches.match(e.request).then((m) => m || caches.match("index.html")))
  );
});
