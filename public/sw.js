const CACHE_NAME = 'lithos-geotech-v1';
const API_CACHE_NAME = 'lithos-telemetry-api-v1';

// Static assets and shell to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching partial assets:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== API_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Telemetry API Endpoints: Network-first with cache fallback
  if (url.pathname.startsWith('/api/telemetry/') || url.pathname.startsWith('/api/sensors/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the successful API response
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(async () => {
          // If offline, check API cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Return a structured offline fallback JSON for live telemetry
          if (url.pathname.includes('/api/telemetry/live')) {
            return new Response(
              JSON.stringify({
                timestamp: new Date().toISOString(),
                timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                epoch: Date.now(),
                spikeActive: false,
                isOfflineFallback: true,
                readings: {},
              }),
              {
                headers: { 'Content-Type': 'application/json', 'X-Offline-Fallback': 'true' },
              }
            );
          }

          return new Response(JSON.stringify({ error: 'Offline', isOffline: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
          });
        })
    );
    return;
  }

  // 2. Static Assets & App Shell: Stale-While-Revalidate / Cache-First
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update for next time
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (request.destination === 'style' ||
             request.destination === 'script' ||
             request.destination === 'image' ||
             request.destination === 'font' ||
             url.origin.includes('fonts.googleapis.com') ||
             url.origin.includes('fonts.gstatic.com'))
          ) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // If navigation request fails, return cached index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
