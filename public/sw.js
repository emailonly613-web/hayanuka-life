// hayanuka.life service worker — app shell + data cache.
// V is stamped per deploy by scripts/stamp-sw.mjs so every release busts the cache
// (a fixed name left phones on the first version forever — the tefillos-missing bug).
const V = "hy-1784798469305";
const SHELL = ["/", "/app.js", "/player.js", "/manifest.webmanifest", "/img/icon-192.png", "/img/icon-512.png",
  "/data/curated.json", "/data/music.json", "/data/alonim.json", "/data/tfilot.json", "/data/facets.json", "/data/tefillot-latest.json"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() => caches.match("/")));
    return;
  }
  // scripts + data: stale-while-revalidate — serve instantly, refresh in the background
  const swr = url.pathname === "/app.js" || url.pathname === "/player.js" || url.pathname.startsWith("/data/");
  if (swr) {
    e.respondWith(caches.match(e.request).then((hit) => {
      const net = fetch(e.request).then((res) => { const copy = res.clone(); caches.open(V).then((c) => c.put(e.request, copy)); return res; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  // everything else: cache-first (immutable hashed assets, images)
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    const copy = res.clone(); caches.open(V).then((c) => c.put(e.request, copy)); return res;
  }).catch(() => hit)));
});
