const CACHE_NAME = 'brankas-emas-v2';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/gold-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle HTTP and HTTPS GET requests (ignore chrome-extension://, moz-extension://, etc.)
  if (!event.request.url.startsWith('http://') && !event.request.url.startsWith('https://')) {
    return;
  }
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // 1. API endpoint: Network-first, fallback to cached response on network failure or 5xx error
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return response;
          }
          if (response && response.status >= 500) {
            return caches.match(event.request).then((cached) => cached || response);
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => (
          cached || new Response(JSON.stringify({ error: 'Offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } })
        )))
    );
    return;
  }

  // 2. Navigation / HTML requests: Cache-first, fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/index.html').then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // 3. Static assets (JS, CSS, SVGs, Fonts): Stale-while-revalidate with safe offline fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && event.request.url.startsWith('http')) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse || new Response('Offline Asset Unavailable', { status: 503, statusText: 'Offline' }));

      return cachedResponse || fetchPromise;
    })
  );
});
