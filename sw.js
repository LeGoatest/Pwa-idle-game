const CACHE = 'idle-frontier-v1';
const APP_ASSETS = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/js/game.js',
  './manifest.webmanifest',
  './assets/icons/icon.svg',
  './assets/icons/icon-maskable.svg',
  './views/combat.html',
  './views/gathering.html',
  './views/crafting.html',
  './views/inventory.html',
  './views/settings.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
