import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export function useDueNowNotifications({
  upNextHabitInfo,
  habits,
  currentDay,
  isCurrentMonth,
  hasCompletedDay,
  onCompleteHabit,
  habitTimeSchedule,
}) {
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
  const isWebSupported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
  const isSupported = isNative || isWebSupported;

  const permissionState = ref('prompt');
  const notificationsEnabled = ref(
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('habuilt.dueNowNotifications.enabled') !== 'false'
      : true
  );

  const activeNotifiedHabitSessionKey = ref(null);
  let channel = null;
  let heartbeatInterval = null;
  let queueDrainInterval = null;

  // Initialize Android High-Importance Channel
  const initNotificationChannel = async () => {
    if (!isNative) return;
    try {
      await LocalNotifications.createChannel({
        id: 'habuilt_reminders',
        name: 'Habuilt Habit Reminders',
        description: 'Time-block alerts and habit action reminders',
        importance: 5, // High importance (heads-up banner, vibration, sound)
        visibility: 1, // Public on lockscreen
        vibration: true,
        sound: 'default',
      });
    } catch (e) {
      console.warn('Channel creation warning:', e);
    }
  };

  // Notification Copy with exact task instruction
  const getNotificationCopy = (habit, sched, timeLabel) => {
    const name = habit.name || 'Habit';
    const pts = habit.points || 1;
    const instruction = habit.hint || '';

    return {
      title: `⚡ ${name} (+${pts} pts)`,
      body: instruction
        ? `${instruction} • (${timeLabel || 'Scheduled'})`
        : `Scheduled: ${timeLabel || 'Now'} • Tap to mark done and advance your streak.`,
      actionTitle: '✓ Mark Done',
    };
  };

  // Initialize Native Action Types
  const registerNativeActionTypes = async () => {
    if (!isNative) return;
    try {
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'HABUILT_HABIT_ACTION',
            actions: [
              {
                id: 'MARK_DONE',
                title: '✓ Mark Done (+pts)',
                foreground: false,
              },
              {
                id: 'OPEN_APP',
                title: 'Open Dashboard',
                foreground: true,
              },
            ],
          },
        ],
      });
    } catch (e) {
      console.warn('Native action registration note:', e);
    }
  };

  // Check initial permission
  const checkInitialPermission = async () => {
    if (isNative) {
      try {
        let res = await LocalNotifications.checkPermissions();
        if (res.display !== 'granted') {
          res = await LocalNotifications.requestPermissions();
        }
        permissionState.value = res.display;
        if (res.display === 'granted') {
          notificationsEnabled.value = true;
          localStorage.setItem('habuilt.dueNowNotifications.enabled', 'true');
        }
      } catch (err) {
        console.warn('Native permission check note:', err);
        permissionState.value = 'granted';
      }
    } else if (isWebSupported) {
      permissionState.value = Notification.permission;
    }
  };

  // Request Permission
  const requestPermission = async () => {
    if (!isSupported) return false;
    try {
      if (isNative) {
        const res = await LocalNotifications.requestPermissions();
        permissionState.value = res.display;
        if (res.display === 'granted') {
          notificationsEnabled.value = true;
          localStorage.setItem('habuilt.dueNowNotifications.enabled', 'true');
          await initNotificationChannel();
          await registerNativeActionTypes();
          syncDueNowNotification();
          return true;
        }
      } else if (isWebSupported) {
        const perm = await Notification.requestPermission();
        permissionState.value = perm;
        if (perm === 'granted') {
          notificationsEnabled.value = true;
          localStorage.setItem('habuilt.dueNowNotifications.enabled', 'true');
          syncDueNowNotification();
          return true;
        }
      }
      notificationsEnabled.value = false;
      localStorage.setItem('habuilt.dueNowNotifications.enabled', 'false');
      dismissDueNowNotification();
      return false;
    } catch (err) {
      console.warn('Notification permission error:', err);
      return false;
    }
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled.value) {
      if (permissionState.value !== 'granted') {
        return await requestPermission();
      } else {
        notificationsEnabled.value = true;
        localStorage.setItem('habuilt.dueNowNotifications.enabled', 'true');
        syncDueNowNotification();
        return true;
      }
    } else {
      notificationsEnabled.value = false;
      localStorage.setItem('habuilt.dueNowNotifications.enabled', 'false');
      dismissDueNowNotification();
      return false;
    }
  };

  // ── Persistent Notification Registry ──
  // Guarantees that each activity notification appears AT MOST ONCE per day.
  const getTodayKey = (day) => {
    const d = day || currentDay?.value || new Date().getDate();
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const getNotifiedRegistry = (day) => {
    if (typeof localStorage === 'undefined') return {};
    try {
      const key = `habuilt.notified_habits.${getTodayKey(day)}`;
      return JSON.parse(localStorage.getItem(key) || '{}');
    } catch {
      return {};
    }
  };

  const isHabitNotifiedToday = (habitId, day) => {
    if (!habitId) return false;
    const reg = getNotifiedRegistry(day);
    return Boolean(reg[habitId]);
  };

  const markHabitNotifiedToday = (habitId, day) => {
    if (typeof localStorage === 'undefined' || !habitId) return;
    try {
      const dateKey = getTodayKey(day);
      const storageKey = `habuilt.notified_habits.${dateKey}`;
      const reg = getNotifiedRegistry(day);
      reg[habitId] = Date.now();
      localStorage.setItem(storageKey, JSON.stringify(reg));

      // Clean up older date keys (keep only last 3 days)
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('habuilt.notified_habits.') && k !== storageKey) {
          localStorage.removeItem(k);
        }
      }
    } catch (e) {
      console.warn('Error recording notification registry:', e);
    }
  };

  // Helper: hash habit ID to a stable integer for notification ID
  const hashHabitId = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 900000) + 1000;
  };

  // Schedule upcoming habit alerts for the entire day (Runs once per day/schedule load)
  const scheduleDailyHabitAlerts = async (force = false) => {
    if (!isNative || !notificationsEnabled.value || permissionState.value !== 'granted') return;
    if (!isCurrentMonth?.value) return;

    const day = Number(currentDay?.value || new Date().getDate());
    const dateKey = getTodayKey(day);
    const lastSchedKey = 'habuilt.last_scheduled_date';

    // If already scheduled for today and not forced, skip to avoid spamming OS alarm manager
    if (!force && typeof localStorage !== 'undefined' && localStorage.getItem(lastSchedKey) === dateKey) {
      return;
    }

    try {
      const now = new Date();
      const habitList = habits?.value || [];
      const notifsToSchedule = [];

      for (const h of habitList) {
        // Skip if already done today
        if (hasCompletedDay && hasCompletedDay(h, day)) continue;

        // Skip if already notified today
        if (isHabitNotifiedToday(h.id, day)) continue;

        const sched = habitTimeSchedule?.[h.id];
        if (!sched || !sched.start) continue;

        const [sh, sm] = sched.start.split(':').map(Number);
        const [eh, em] = (sched.end || '23:59').split(':').map(Number);
        const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sh, sm, 0);

        // If start time is in the future today (at least 15 seconds from now)
        if (startTime.getTime() > now.getTime() + 15000) {
          const copy = getNotificationCopy(h, sched, `${sched.start} – ${sched.end}`);
          notifsToSchedule.push({
            id: hashHabitId(h.id),
            title: copy.title,
            body: copy.body,
            channelId: 'habuilt_reminders',
            actionTypeId: 'HABUILT_HABIT_ACTION',
            extra: {
              habitId: h.id,
              day: day,
            },
            schedule: { at: startTime },
            sound: 'default',
            smallIcon: 'ic_launcher_round',
            iconColor: '#10B981',
          });
        }
      }

      if (notifsToSchedule.length > 0) {
        const idsToCancel = notifsToSchedule.map(n => ({ id: n.id }));
        try {
          await LocalNotifications.cancel({ notifications: idsToCancel });
        } catch { /* ignore */ }

        await LocalNotifications.schedule({
          notifications: notifsToSchedule,
        });
      }

      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(lastSchedKey, dateKey);
      }
    } catch (e) {
      console.warn('Error scheduling daily habit alerts:', e);
    }
  };

  // Sync Immediate Due Now Notification (when user has app open or task transitions to due)
  const syncDueNowNotification = async () => {
    if (!isSupported || !notificationsEnabled.value || permissionState.value !== 'granted') return;
    if (!isCurrentMonth?.value) {
      dismissDueNowNotification();
      return;
    }

    // Attempt daily schedule once per day
    scheduleDailyHabitAlerts();

    const info = upNextHabitInfo?.value;
    if (!info || info.status !== 'due' || !info.habit) {
      dismissDueNowNotification();
      return;
    }

    const habit = info.habit;
    const day = Number(currentDay?.value || new Date().getDate());

    // If already completed today, dismiss immediately and do not notify
    if (hasCompletedDay && hasCompletedDay(habit, day)) {
      dismissDueNowNotification(habit.id);
      return;
    }

    // STRICT CHECK: If this habit has ALREADY been notified today, DO NOT send again!
    if (isHabitNotifiedToday(habit.id, day)) {
      return;
    }

    const notifId = hashHabitId(habit.id);
    const sched = habitTimeSchedule?.[habit.id];
    const copy = getNotificationCopy(habit, sched, info.timeLabel);

    // 1. Native Android Local Notification
    if (isNative) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: notifId }] });
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title: copy.title,
              body: copy.body,
              channelId: 'habuilt_reminders',
              actionTypeId: 'HABUILT_HABIT_ACTION',
              extra: {
                habitId: habit.id,
                day: day,
              },
              schedule: { at: new Date(Date.now() + 500) },
              sound: 'default',
              smallIcon: 'ic_launcher_round',
              iconColor: '#10B981',
            },
          ],
        });
        markHabitNotifiedToday(habit.id, day);
      } catch (e) {
        console.warn('Native local notification dispatch warning:', e);
      }
    } 
    // 2. Web / Service Worker fallback
    else if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_DUE_NOW_NOTIFICATION',
        payload: {
          habitId: habit.id,
          habitName: copy.title,
          points: habit.points,
          timeLabel: info.timeLabel || '',
          day: day,
          customBody: copy.body,
        },
      });
      markHabitNotifiedToday(habit.id, day);
    }
  };

  // Dismiss Notification
  const dismissDueNowNotification = async (habitId = null) => {
    if (isNative) {
      try {
        const targetId = habitId ? hashHabitId(habitId) : null;
        if (targetId) {
          await LocalNotifications.cancel({ notifications: [{ id: targetId }] });
        }
      } catch { /* cancel fallback */ }
    }
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'DISMISS_DUE_NOW_NOTIFICATION',
        payload: { habitId },
      });
    }
  };

  // Drain queued background completions
  const drainQueuedCompletions = async () => {
    if (typeof caches === 'undefined') return;
    try {
      const cache = await caches.open('habuilt-action-queue');
      const response = await cache.match('/queued-completions');
      if (response) {
        const queue = await response.json();
        if (Array.isArray(queue) && queue.length > 0) {
          for (const item of queue) {
            if (item.habitId && item.day && onCompleteHabit) {
              onCompleteHabit(item.habitId, Number(item.day));
            }
          }
          await cache.delete('/queued-completions');
        }
      }
    } catch { /* ignore */ }
  };

  const handleVisibilityOrFocus = () => {
    drainQueuedCompletions();
    syncDueNowNotification();
  };

  // Setup communication channels and listeners
  onMounted(async () => {
    if (typeof window === 'undefined') return;

    await initNotificationChannel();
    await checkInitialPermission();
    await registerNativeActionTypes();
    drainQueuedCompletions();

    // Native Action Listener (Android Tray [Mark Done])
    if (isNative) {
      try {
        LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
          const habitId = action.notification.extra?.habitId;
          const day = action.notification.extra?.day || new Date().getDate();
          if (action.actionId === 'MARK_DONE' && habitId && onCompleteHabit) {
            markHabitNotifiedToday(habitId, Number(day));
            onCompleteHabit(habitId, Number(day));
            dismissDueNowNotification(habitId);
          }
        });
      } catch (e) {
        console.warn('Local notification action listener error:', e);
      }
    }

    // Web BroadcastChannel & ServiceWorker message listener
    if ('BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('habuilt-channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'HABIT_COMPLETED_VIA_NOTIFICATION') {
            const { habitId, day } = event.data;
            if (habitId && day && onCompleteHabit) {
              markHabitNotifiedToday(habitId, Number(day));
              onCompleteHabit(habitId, Number(day));
              dismissDueNowNotification(habitId);
            }
          }
        };
      } catch { /* channel fallback */ }
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'HABIT_COMPLETED_VIA_NOTIFICATION') {
          const { habitId, day } = event.data;
          if (habitId && day && onCompleteHabit) {
            markHabitNotifiedToday(habitId, Number(day));
            onCompleteHabit(habitId, Number(day));
            dismissDueNowNotification(habitId);
          }
        }
      });
    }

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    queueDrainInterval = setInterval(() => {
      drainQueuedCompletions();
    }, 1500);

    syncDueNowNotification();
    heartbeatInterval = setInterval(() => {
      syncDueNowNotification();
    }, 30000);
  });

  onUnmounted(() => {
    if (channel) channel.close();
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (queueDrainInterval) clearInterval(queueDrainInterval);
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    }
  });

  watch(
    () => [upNextHabitInfo?.value, habits?.value],
    () => {
      syncDueNowNotification();
    },
    { deep: true }
  );

  return {
    isSupported,
    permissionState,
    notificationsEnabled,
    requestPermission,
    toggleNotifications,
    syncDueNowNotification,
    dismissDueNowNotification,
    drainQueuedCompletions,
  };
}
