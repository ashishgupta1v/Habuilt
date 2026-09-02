// Habuilt Service Worker — auto-versioned cache with stale-while-revalidate for hashed assets
// Version is bumped by registration query string (?v=timestamp) from app.js

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
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n !== CACHE_NAME && n !== 'habuilt-action-queue').map((n) => caches.delete(n))
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

  // Hashed assets — cache first, immutable
  const isHashedAsset = /\/assets\/[^/]+-[a-zA-Z0-9]{8}\.\w+$/.test(url.pathname);

  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?|ttf|eot)$/) ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/')
  ) {
    if (isHashedAsset) {
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

// ══════════════════════════════════════════════════════════════════════
// DUE NOW NOTIFICATION & AUTO-REMOVAL ACTION ENGINE
// ══════════════════════════════════════════════════════════════════════

let activeExpiryTimer = null;

const dismissDueNowNotifications = async (targetHabitId = null) => {
  try {
    const notifications = await self.registration.getNotifications();
    for (const notif of notifications) {
      if (notif.tag && (notif.tag === 'habuilt-due-now' || notif.tag.startsWith('habuilt-habit-'))) {
        if (!targetHabitId || notif.data?.habitId === targetHabitId) {
          notif.close();
        }
      }
    }
  } catch (err) {
    console.warn('Error dismissing due-now notifications:', err);
  }
};

// Check for expired due-now notifications and auto-remove them
const checkAndPurgeExpiredNotifications = async () => {
  try {
    const notifications = await self.registration.getNotifications();
    const now = Date.now();
    for (const notif of notifications) {
      if (notif.tag && (notif.tag === 'habuilt-due-now' || notif.tag.startsWith('habuilt-habit-'))) {
        if (notif.data?.expiryTimestamp && now >= notif.data.expiryTimestamp) {
          notif.close();
        }
      }
    }
  } catch { /* ignore */ }
};

// Listen for messages from client app
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Show interactive Due Now notification
  if (data.type === 'SHOW_DUE_NOW_NOTIFICATION') {
    const p = data.payload;
    if (!p || !p.habitId) return;

    if (activeExpiryTimer) clearTimeout(activeExpiryTimer);

    const habitTag = `habuilt-habit-${p.habitId}-${p.day || ''}`;
    const title = `⚡ Due Now: ${p.habitName}`;
    const options = {
      body: p.customBody || `⏰ ${p.timeLabel || 'Current Routine'} • +${p.points} pts\nTap [Mark Done] to complete without opening app.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-monochrome-96.png',
      tag: habitTag,
      renotify: false, // Prevents buzzing/chiming repeatedly for the same task
      requireInteraction: true,
      data: {
        habitId: p.habitId,
        habitName: p.habitName,
        points: p.points,
        day: p.day,
        expiryTimestamp: p.expiryTimestamp,
        url: '/',
      },
      actions: [
        { action: 'mark-done', title: '✅ Mark Done' },
        { action: 'open-dashboard', title: '🚀 Open Dashboard' },
      ],
    };

    // Check if notification for this habit is already shown; if so, do not re-show
    event.waitUntil(
      (async () => {
        const existing = await self.registration.getNotifications({ tag: habitTag });
        if (existing.length > 0) {
          return;
        }
        await self.registration.showNotification(title, options);
      })()
    );

    // Auto-remove notification as soon as the task window finishes!
    if (p.expiryTimestamp && p.expiryTimestamp > Date.now()) {
      const delay = p.expiryTimestamp - Date.now();
      activeExpiryTimer = setTimeout(() => {
        checkAndPurgeExpiredNotifications();
      }, delay + 500);
    }
  }

  // Dismiss notification when habit is completed or timing is over
  if (data.type === 'DISMISS_DUE_NOW_NOTIFICATION') {
    if (activeExpiryTimer) clearTimeout(activeExpiryTimer);
    dismissDueNowNotifications(data.payload?.habitId);
  }

  if (data.type === 'CHECK_EXPIRED_NOTIFICATIONS') {
    checkAndPurgeExpiredNotifications();
  }
});

// Push notification handler — receives push from server and shows notification
self.addEventListener('push', (event) => {
  const defaults = {
    title: 'Habuilt',
    body: 'Time to check in on your habits!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-monochrome-96.png',
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
        { action: 'open-dashboard', title: '🚀 Open Dashboard' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// ══════════════════════════════════════════════════════════════════════
// NOTIFICATION CLICK — INTERACTIVE 1-TAP [MARK DONE] & [OPEN DASHBOARD]
// ══════════════════════════════════════════════════════════════════════
self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const notif = event.notification;
  const data = notif.data || {};

  notif.close();

  if (action === 'dismiss') return;

  // 1. Background 1-Tap Mark Done (Zero App Opening Required)
  if (action === 'mark-done') {
    event.waitUntil(
      (async () => {
        // Broadcast completion to all active client tabs
        try {
          const channel = new BroadcastChannel('habuilt-channel');
          channel.postMessage({
            type: 'HABIT_COMPLETED_VIA_NOTIFICATION',
            habitId: data.habitId,
            habitName: data.habitName,
            points: data.points,
            day: data.day,
          });
          channel.close();
        } catch { /* channel fallback */ }

        const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of allClients) {
          client.postMessage({
            type: 'HABIT_COMPLETED_VIA_NOTIFICATION',
            habitId: data.habitId,
            habitName: data.habitName,
            points: data.points,
            day: data.day,
          });
        }

        // Queue completion in persistent cache in case app is currently closed
        try {
          const cache = await caches.open('habuilt-action-queue');
          const existing = await cache.match('/queued-completions');
          let list = [];
          if (existing) {
            try { list = await existing.json(); } catch { list = []; }
          }
          list.push({
            habitId: data.habitId,
            day: data.day,
            timestamp: Date.now(),
          });
          await cache.put('/queued-completions', new Response(JSON.stringify(list), {
            headers: { 'Content-Type': 'application/json' },
          }));
        } catch { /* cache fallback */ }

        // 3. Show instant celebratory confirmation toast on Android
        await self.registration.showNotification('🎉 Habit Completed!', {
          body: `"${data.habitName || 'Habit'}" (+${data.points || 1} pts) marked done!`,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-monochrome-96.png',
          tag: 'habuilt-completion-toast',
          renotify: false,
          data: { url: '/' },
        });

        // Auto-dismiss confirmation after 3.5s
        setTimeout(async () => {
          try {
            const successNotifs = await self.registration.getNotifications({ tag: 'habuilt-completion-toast' });
            for (const s of successNotifs) s.close();
          } catch { /* ignore */ }
        }, 3500);
      })()
    );
    return;
  }

  // 2. Open Dashboard Action or Direct Body Click
  const url = data.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
