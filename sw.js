const CACHE = 'idle-frontier-v5-shell';
const SHELL_ASSETS = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/js/game.js',
  './assets/js/db.js',
  './assets/js/state.js',
  './assets/js/content.js',
  './assets/js/ui.js',
  './assets/js/pwa.js',
  './assets/js/systems/tasks.js',
  './assets/js/systems/progression.js',
  './assets/js/htmx.min.js',
  './manifest.webmanifest',
  './assets/icons/icon.svg',
  './assets/icons/icon-maskable.svg'
];

const VIEW_ASSETS = [
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

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await cache.addAll(SHELL_ASSETS);
      await cache.addAll(VIEW_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      )
    ])
  );
});

function isViewRequest(url) {
  return url.pathname.includes('/views/') || url.pathname.endsWith('.html');
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  if (isViewRequest(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});    ])
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
