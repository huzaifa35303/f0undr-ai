/* =========================================================================
   f0undr AI — Service Worker (PWA Offline & Asset Accelerator)
   Provides offline resilience, instant asset caching, and background sync
   ========================================================================= */

const CACHE_NAME = 'f0undr-ai-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon.ico',
  '/favicon-48x48.png',
  '/favicon-96x96.png',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or browser extension requests
  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // API calls: Network-only with graceful offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'You are currently offline. Local ranker or cached responses remain accessible.',
            offline: true,
          }),
          {
            status: 503,
            headers: { 'content-type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // Static Assets & Navigation: Stale-While-Revalidate strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // If navigation fails completely, return the cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html') || cachedResponse;
          }
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
