// Habuilt Service Worker — auto-versioned cache with stale-while-revalidate for hashed assets
// Version is bumped by registration query string (?v=timestamp) from app.js

const CACHE_NAME = 'habuilt-cache-calm-2026-11-09';
const SHELL_ASSETS = [
  '/',
  '/manifest.webmanifest',
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
      await armStoredReminders();
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
        .catch(() => caches.match(request, { ignoreSearch: true }).then((cached) => cached || caches.match('/', { ignoreSearch: true })))
    );
    return;
  }

  // Hashed assets — cache first, immutable
  const isHashedAsset = /(?:\/build)?\/assets\/[^/]+-[a-zA-Z0-9_-]{8,}\.\w+$/.test(url.pathname);

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
const scheduledAlarms = new Map();
const REMINDER_DB = 'habuilt-reminders';
const REMINDER_STORE = 'alarms';

function openReminderDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(REMINDER_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(REMINDER_STORE)) db.createObjectStore(REMINDER_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveReminderList(list) {
  const db = await openReminderDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(REMINDER_STORE, 'readwrite');
    tx.objectStore(REMINDER_STORE).put(list, 'next');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function loadReminderList() {
  try {
    const db = await openReminderDb();
    const list = await new Promise((resolve, reject) => {
      const tx = db.transaction(REMINDER_STORE, 'readonly');
      const request = tx.objectStore(REMINDER_STORE).get('next');
      request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return list;
  } catch {
    return [];
  }
}

function reminderTitle(item) {
  if (item?.title) return item.title;
  const name = item?.habitName || 'Habit';
  const time = item?.time || '';
  return time ? `${name} · ${time}` : name;
}

async function showHabitReminder(item) {
  const title = reminderTitle(item);
  const options = {
    body: 'Starts now.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-monochrome-96.png',
    tag: `habuilt-habit-${item.habitId}-${item.day || ''}`,
    renotify: true,
    data: {
      habitId: item.habitId,
      habitName: item.habitName || title,
      day: item.day,
      url: '/',
    },
    actions: [
      { action: 'mark-done', title: 'Mark done' },
      { action: 'open-dashboard', title: 'Open' },
    ],
  };
  await self.registration.showNotification(title, options);
}

function armTimeout(item, delay) {
  if (scheduledAlarms.has(item.habitId)) {
    clearTimeout(scheduledAlarms.get(item.habitId));
  }
  const timer = setTimeout(async () => {
    try {
      await showHabitReminder(item);
      const list = await loadReminderList();
      await saveReminderList(list.map((row) => (
        row.habitId === item.habitId && row.triggerTimestamp === item.triggerTimestamp
          ? { ...row, fired: true }
          : row
      )));
      await armStoredReminders();
    } catch (err) {
      console.warn('[SW] Error showing scheduled notification:', err);
    } finally {
      scheduledAlarms.delete(item.habitId);
    }
  }, delay);
  scheduledAlarms.set(item.habitId, timer);
}

async function armStoredReminders() {
  const list = await loadReminderList();
  const now = Date.now();
  const sorted = [...list].sort((a, b) => (a.triggerTimestamp || 0) - (b.triggerTimestamp || 0));
  const pending = [];
  let armed = false;
  for (const item of sorted) {
    if (!item || !item.habitId || !item.triggerTimestamp) continue;
    if (item.fired) {
      pending.push(item);
      continue;
    }
    if (item.triggerTimestamp <= now) {
      if (!item.handedOff) {
        try { await showHabitReminder(item); } catch { /* show on the next wake */ }
      }
      pending.push({ ...item, fired: true });
      continue;
    }
    if (item.handedOff) {
      pending.push(item);
      armed = true;
      continue;
    }
    pending.push(item);
    if (!armed) {
      armed = true;
      const delay = item.triggerTimestamp - now;
      let triggered = false;
      if (typeof TimestampTrigger === 'function') {
        try {
          await self.registration.showNotification(reminderTitle(item), {
            body: 'Starts now.',
            tag: `habuilt-habit-${item.habitId}-${item.day || ''}`,
            showTrigger: new TimestampTrigger(item.triggerTimestamp),
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-monochrome-96.png',
            data: {
              habitId: item.habitId,
              habitName: item.habitName,
              day: item.day,
              url: '/',
            },
          });
          item.handedOff = true;
          triggered = true;
        } catch { /* fall back to a timer while this worker is alive */ }
      }
      if (!triggered && delay < 172800000) armTimeout(item, delay);
    }
  }
  await saveReminderList(pending);
}

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

  if (data.type === 'PING') {
    event.source?.postMessage({ type: 'PONG', timestamp: Date.now() });
  }

  // Show interactive Due Now notification
  if (data.type === 'SHOW_DUE_NOW_NOTIFICATION') {
    const p = data.payload;
    if (!p || !p.habitId) return;

    if (activeExpiryTimer) clearTimeout(activeExpiryTimer);

    const habitTag = `habuilt-habit-${p.habitId}-${p.day || ''}`;
    const title = p.title || (p.timeLabel ? `${p.habitName} · ${p.timeLabel}` : (p.habitName || 'Habit'));
    const options = {
      body: p.customBody || 'Starts now.',
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

  // Ahead-of-time scheduled habit alarms. Stored so they can fire after the page closes.
  if (data.type === 'SCHEDULE_HABIT_ALERTS') {
    const list = Array.isArray(data.payload) ? data.payload : [];
    event.waitUntil((async () => {
      for (const timer of scheduledAlarms.values()) clearTimeout(timer);
      scheduledAlarms.clear();
      const normalized = list
        .filter((item) => item && item.habitId && item.triggerTimestamp)
        .map((item) => ({
          habitId: item.habitId,
          habitName: item.habitName || 'Habit',
          title: item.title || '',
          time: item.time || '',
          day: item.day,
          triggerTimestamp: item.triggerTimestamp,
          fired: false,
        }));
      await saveReminderList(normalized);
      await armStoredReminders();
    })());
  }

  if (data.type === 'CANCEL_SCHEDULED_ALERT') {
    const habitId = data.payload?.habitId;
    if (habitId && scheduledAlarms.has(habitId)) {
      clearTimeout(scheduledAlarms.get(habitId));
      scheduledAlarms.delete(habitId);
    }
    dismissDueNowNotifications(habitId);
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
        await self.registration.showNotification('Habit marked done', {
          body: `${data.habitName || 'Habit'} is marked done.`,
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

// ── Background Sync Event (Replay Offline Check-Ins) ──
self.addEventListener('sync', (event) => {
  if (event.tag === 'habuilt-sync-queue' || event.tag === 'habuilt-offline-checkins') {
    event.waitUntil(
      (async () => {
        const allClients = await self.clients.matchAll({ includeUncontrolled: true });
        for (const client of allClients) {
          client.postMessage({ type: 'FLUSH_OFFLINE_QUEUE' });
        }
      })()
    );
  }
});

// ── Periodic Background Sync Event (Partner Presence & Habit Checklists) ──
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'habuilt-habit-reminder' || event.tag === 'habuilt-periodic-sync') {
    event.waitUntil(
      (async () => {
        console.debug('[SW] Periodic background sync running:', event.tag);
        const allClients = await self.clients.matchAll({ includeUncontrolled: true });

        // 1. Dispatch periodic sync wakeup to any running or idle clients
        for (const client of allClients) {
          client.postMessage({
            type: 'HABUILT_PERIODIC_SYNC',
            timestamp: Date.now(),
            tag: event.tag,
          });
        }

        try { await armStoredReminders(); } catch { /* reminder store may be empty */ }

        // 2. Offline Action Queue Drain & Check-In Reconciliation
        try {
          const cache = await caches.open('habuilt-action-queue');
          const queued = await cache.match('/queued-completions');
          if (queued) {
            for (const client of allClients) {
              client.postMessage({ type: 'FLUSH_OFFLINE_QUEUE' });
            }
          }
        } catch (e) {
          console.debug('[SW] Periodic sync cache access fallback:', e);
        }
      })()
    );
  }
});


