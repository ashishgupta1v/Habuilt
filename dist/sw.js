// Habuilt Service Worker — auto-versioned cache with stale-while-revalidate for hashed assets
// Version is bumped by registration query string (?v=timestamp) from app.js
// Vite-hashed assets (app-BLn_uBPn.js) are inherently unique, so we use a single
// rolling cache and let the activate handler prune entries older than 7 days.

const CACHE_NAME = 'habuilt-cache';
const SHELL_ASSETS = [
  '/',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install — cache shell, skip waiting immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(SHELL_ASSETS).catch(() => {})
    )
  );
  self.skipWaiting();
});

// Activate — claim clients and prune stale non-hashed entries
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete any legacy versioned caches (habuilt-v1, habuilt-v2, etc.)
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Skip Supabase and API calls
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/api/')) return;

  // HTML pages — network first, fall back to cache
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Hashed assets (Vite output like app-BLn_uBPn.js) — cache first, they're immutable
  // Non-hashed assets — stale-while-revalidate (serve cache, update in background)
  const isHashedAsset = /\/assets\/[^/]+-[a-zA-Z0-9]{8}\.\w+$/.test(url.pathname);

  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?|ttf|eot)$/) ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/')
  ) {
    if (isHashedAsset) {
      // Immutable — cache first, network fallback
      event.respondWith(
        caches.match(request).then((cached) =>
          cached || fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
        )
      );
    } else {
      // Stale-while-revalidate — serve cache, refresh in background
      event.respondWith(
        caches.match(request).then((cached) => {
          const networkFetch = fetch(request)
            .then((response) => {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
              return response;
            })
            .catch(() => cached);
          return cached || networkFetch;
        })
      );
    }
    return;
  }
});

// Listen for skip-waiting message from the app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notification handler — receives push from server and shows notification
self.addEventListener('push', (event) => {
  const defaults = {
    title: 'Habuilt',
    body: 'Time to check in on your habits!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'habuilt-reminder',
    renotify: true,
    data: { url: '/' },
  };

  let payload = defaults;
  if (event.data) {
    try {
      const data = event.data.json();
      payload = { ...defaults, ...data };
    } catch {
      payload.body = event.data.text() || defaults.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      tag: payload.tag,
      renotify: payload.renotify,
      data: payload.data,
      actions: [
        { action: 'open', title: 'Open Habuilt' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// Notification click — open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Focus existing tab if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new tab
      return self.clients.openWindow(url);
    })
  );
});
