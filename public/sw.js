// Irreecha GateGuard — Service Worker
// Minimal offline-first SW: caches the app shell so the PWA works offline.
// All scan data is stored in IndexedDB (not cached by SW), so SW is intentionally simple.

const CACHE_NAME = 'gateguard-v1';
const APP_SHELL = [
  '/',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for navigation requests (so users get fresh UI when online)
// Cache-first for static assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Skip cross-origin requests
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Skip API requests — always go to network (fall through to fail)
  if (url.pathname.startsWith('/api/')) return;

  // For navigation requests: try network, fall back to cache
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/')))
    );
    return;
  }

  // For static assets: cache-first
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
    )
  );
});
