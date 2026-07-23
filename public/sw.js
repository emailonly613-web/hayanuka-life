// hayanuka.life service worker — app shell + data cache, network-first for html.
const V = "hy-v1";
const SHELL = ["/", "/app.js", "/manifest.webmanifest", "/img/icon-192.png", "/img/icon-512.png",
  "/data/curated.json", "/data/music.json", "/data/alonim.json", "/data/tfilot.json", "/data/facets.json"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() => caches.match("/")));
    return;
  }
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    const copy = res.clone(); caches.open(V).then((c) => c.put(e.request, copy)); return res;
  }).catch(() => hit)));
});
