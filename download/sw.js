const CACHE_NAME = "monpatch-download-2.71.0";
const APP_FILES = [
  "./",
  "./index.html",
  "./game.html",
  "./manifest.webmanifest",
  "./monpatch-icon-192.png",
  "./monpatch-icon-512.png",
  "./apple-touch-icon.png",
  "./pwa.js",
  "./version.json",
  "./js/ui-sfx.js",
  "./js/app.js",
  "./js/bootstrap.js",
  "./js/game-core.js",
  "./js/game-ui.js",
  "./js/multi.js",
  "./js/profile.js",
  "./js/single.js",
  "./js/tutorial.js",
  "./assets/bg-defense.png",
  "./assets/blocks/red.png",
  "./assets/blocks/blue.png",
  "./assets/blocks/green.png",
  "./assets/blocks/yellow.png",
  "./assets/blocks/purple.png",
  "./assets/blocks/arrow-h.png",
  "./assets/blocks/arrow-v.png",
  "./assets/blocks/asteroid.png",
  "./assets/blocks/black-hole.png",
  "./assets/blocks/chain.png",
  "./assets/blocks/em-red.png",
  "./assets/blocks/em-yellow.png",
  "./assets/ui/board-frame.png",
  "./assets/ui/button.png",
  "./assets/ui/button-pill.png",
  "./assets/ui/panel.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(names => Promise.all(
    names.filter(name => name.startsWith("monpatch-download-") && name !== CACHE_NAME).map(name => caches.delete(name))
  )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/version.json")) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  })));
});
