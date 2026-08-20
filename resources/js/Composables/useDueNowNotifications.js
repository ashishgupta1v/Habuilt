import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export function useDueNowNotifications({
  upNextHabitInfo,
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
    typeof localStorage !== 'undefined' && localStorage.getItem('habuilt.dueNowNotifications.enabled') === 'true'
  );

  const activeNotifiedHabitSessionKey = ref(null);
  let channel = null;
  let heartbeatInterval = null;
  let queueDrainInterval = null;

  // Creative Copy Generator based on habit category & context
  const getCreativeNotificationCopy = (habit, sched, timeLabel) => {
    const name = habit.name || 'Habit';
    const pts = habit.points || 1;
    const lowerName = name.toLowerCase();

    // 1. Deep Work & Focus Blocks
    if (lowerName.includes('deep work') || lowerName.includes('focus') || lowerName.includes('sprint') || lowerName.includes('dev')) {
      return {
        title: `⚡ Deep Work Sprint: ${name}`,
        body: `🎯 ${timeLabel || 'Active Window'} (+${pts} pts). Protect your focus & build unstoppable momentum!`,
        actionTitle: '✓ Mark Block Done',
      };
    }

    // 2. Morning Anchor & Alarm
    if (lowerName.includes('alarm') || lowerName.includes('sunlight') || lowerName.includes('water') || lowerName.includes('morning')) {
      return {
        title: `☀️ Morning Anchor: ${name}`,
        body: `🌱 Win the morning (+${pts} pt). Set your baseline strong today!`,
        actionTitle: '✓ Complete Anchor',
      };
    }

    // 3. Health, Walk, Workout & Nutrition
    if (lowerName.includes('walk') || lowerName.includes('workout') || lowerName.includes('gym') || lowerName.includes('protein') || lowerName.includes('meal')) {
      return {
        title: `🏃 Energy & Vitality: ${name}`,
        body: `💪 Active window: ${timeLabel || 'Now'} (+${pts} pts). Step away, recharge, and hit your target!`,
        actionTitle: '✓ Log Activity',
      };
    }

    // 4. Family, Shaarvi, Connection
    if (lowerName.includes('shaarvi') || lowerName.includes('family') || lowerName.includes('call') || lowerName.includes('connect')) {
      return {
        title: `❤️ Quality Time: ${name}`,
        body: `✨ ${timeLabel || 'Scheduled'}. Be 100% present with loved ones (+${pts} pts).`,
        actionTitle: '✓ Mark Done',
      };
    }

    // 5. Evening Wind-down & Floor Protocol
    if (lowerName.includes('reading') || lowerName.includes('sleep') || lowerName.includes('journal') || lowerName.includes('night') || lowerName.includes('wind')) {
      return {
        title: `🌙 Evening Recovery: ${name}`,
        body: `🛡️ Lock in your daily Floor Protocol & protect your streak (+${pts} pt).`,
        actionTitle: '✓ Lock In Protocol',
      };
    }

    // Default creative fallback
    return {
      title: `⚡ Due Now: ${name}`,
      body: `🎯 Scheduled: ${timeLabel || 'Now'} • Tap to earn +${pts} pts and advance your streak!`,
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
                title: 'Open Station',
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
        const res = await LocalNotifications.checkPermissions();
        permissionState.value = res.display;
      } catch {
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

  // Helper: compute timestamp when habit time window ends
  const calculateExpiryTimestamp = (habitId) => {
    if (!habitTimeSchedule || !habitTimeSchedule[habitId]) {
      return Date.now() + 45 * 60 * 1000;
    }
    const sched = habitTimeSchedule[habitId];
    const [eh, em] = sched.end.split(':').map(Number);
    const now = new Date();
    const expiry = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em, 0);
    return expiry.getTime();
  };

  // Send creative notification
  const syncDueNowNotification = async () => {
    if (!isSupported || !notificationsEnabled.value || permissionState.value !== 'granted') return;
    if (!isCurrentMonth?.value) {
      dismissDueNowNotification();
      return;
    }

    const info = upNextHabitInfo?.value;
    if (!info || info.status !== 'due' || !info.habit) {
      dismissDueNowNotification();
      return;
    }

    const habit = info.habit;
    const day = Number(currentDay?.value || new Date().getDate());

    // If already completed today, dismiss notification immediately
    if (hasCompletedDay && hasCompletedDay(habit, day)) {
      dismissDueNowNotification();
      return;
    }

    const expiryTimestamp = calculateExpiryTimestamp(habit.id);
    const now = Date.now();

    if (now >= expiryTimestamp) {
      dismissDueNowNotification();
      return;
    }

    const currentSessionKey = `${habit.id}:${day}:${info.status}`;
    if (activeNotifiedHabitSessionKey.value === currentSessionKey) {
      return;
    }

    const sched = habitTimeSchedule?.[habit.id];
    const creativeCopy = getCreativeNotificationCopy(habit, sched, info.timeLabel);

    // 1. Native Android Local Notification
    if (isNative) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 1001,
              title: creativeCopy.title,
              body: creativeCopy.body,
              actionTypeId: 'HABUILT_HABIT_ACTION',
              extra: {
                habitId: habit.id,
                day: day,
              },
              schedule: { at: new Date(Date.now() + 200) },
              sound: 'default',
              smallIcon: 'ic_launcher_round',
              iconColor: '#10B981',
            },
          ],
        });
        activeNotifiedHabitSessionKey.value = currentSessionKey;
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
          habitName: creativeCopy.title,
          points: habit.points,
          timeLabel: info.timeLabel || '',
          day: day,
          expiryTimestamp: expiryTimestamp,
          customBody: creativeCopy.body,
        },
      });
      activeNotifiedHabitSessionKey.value = currentSessionKey;
    }
  };

  // Dismiss Notification
  const dismissDueNowNotification = async () => {
    if (isNative) {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: 1001 }] });
      } catch { /* cancel fallback */ }
    }
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'DISMISS_DUE_NOW_NOTIFICATION',
      });
    }
    activeNotifiedHabitSessionKey.value = null;
  };

  // Check and process queued background actions
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
            onCompleteHabit(habitId, Number(day));
            dismissDueNowNotification();
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
              onCompleteHabit(habitId, Number(day));
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
            onCompleteHabit(habitId, Number(day));
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
    () => upNextHabitInfo?.value,
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
