const CACHE = 'idle-frontier-v4';
const APP_ASSETS = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/js/game.js',
  './assets/js/htmx.min.js',
  './manifest.webmanifest',
  './assets/icons/icon.svg',
  './assets/icons/icon-maskable.svg',
  './views/combat.html',
  './views/gathering.html',
  './views/crafting.html',
  './views/inventory.html',
  './views/settings.html',
  './views/journal.html',
  './views/shop.html',
  './views/equipment.html',
  './views/shop_item.html'
];

// Force immediate activation
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
    ])
  );
});

// Network-First Strategy (Prefer fresh content, fallback to cache)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Skip caching for external icon requests or similar if needed,
  // but for local assets we want network-first.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If valid response, update cache
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      })
  );
});
