const CACHE = 'idle-frontier-v0.0.8';

const SHELL_ASSETS = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/js/game.js',
  './assets/js/db.js',
  './assets/js/state.js',
  './assets/js/content_loader.js',
  './assets/js/ui.js',
  './assets/js/pwa.js',
  './assets/js/systems/progression.js',
  './assets/js/htmx.min.js',
  './manifest.webmanifest',
  './assets/icons/icon.svg',
  './assets/icons/icon-maskable.svg',
  './content/zones_index.json',
  './content/skills_index.json'
];

const VIEW_ASSETS = [
  './views/combat.html',
  './views/map.html',
  './views/skills.html',
  './views/inventory.html',
  './views/shop.html',
  './views/settings.html'
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

function isContentRequest(url) {
  return url.pathname.includes('/content/');
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (isContentRequest(url)) {
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
    return;
  }

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
});
