const CACHE = 'provedor-cache-v1';
const OFFLINE_URL = '/index.html';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/plans.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(res => {
      if (res) return res;
      return fetch(e.request).then(networkRes => {
        // populate cache for future
        return caches.open(CACHE).then(cache => {
          cache.put(e.request, networkRes.clone());
          return networkRes;
        });
      }).catch(() => {
        // fallback to offline page for navigation requests
        if (e.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});
