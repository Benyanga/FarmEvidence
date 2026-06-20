/**
 * FarmEvidence PWA Service Worker
 * Offline-first functionality with cache-first strategy for static assets
 * and network-first strategy for API calls (per Section 19.3)
 */

const CACHE_NAME = 'farmevidence-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx'
];

/**
 * Install event: Cache static assets on service worker installation
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Installing - caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/**
 * Activate event: Clean up old caches when service worker activates
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => {
            console.log(`[SW] Deleting old cache: ${k}`);
            return caches.delete(k);
          })
      );
    })
  );
  self.clients.claim();
});

/**
 * Fetch event: Implement offline-first caching strategy
 * - API calls (/api/*): network-first with cache fallback
 * - Static assets: cache-first with network fallback
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API endpoints: network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses for offline access
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // Fall back to cached response if network fails
          console.log(`[SW] API call failed, using cache: ${request.url}`);
          return caches.match(request).then((cached) => {
            return cached || new Response('Offline - data unavailable', { status: 503 });
          });
        })
    );
    return;
  }

  // Static assets: cache-first strategy
  event.respondWith(
    caches
      .match(request)
      .then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request);
      })
      .catch(() => {
        // Fallback for missing assets
        console.log(`[SW] Asset not found: ${request.url}`);
        return new Response('Offline - asset unavailable', { status: 404 });
      })
  );
});

/**
 * Message event: Handle messages from clients
 * Allows the app to communicate with the service worker
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Clearing cache requested');
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});
