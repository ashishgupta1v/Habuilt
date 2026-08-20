import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

export function useDueNowNotifications({
  upNextHabitInfo,
  currentDay,
  isCurrentMonth,
  hasCompletedDay,
  onCompleteHabit,
  habitTimeSchedule,
}) {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
  const permissionState = ref(isSupported ? Notification.permission : 'denied');
  
  // Persisted user preference
  const notificationsEnabled = ref(
    typeof localStorage !== 'undefined' && localStorage.getItem('habuilt.dueNowNotifications.enabled') === 'true'
  );

  const activeNotifiedHabitId = ref(null);
  let channel = null;
  let heartbeatInterval = null;

  // Request Notification Permission
  const requestPermission = async () => {
    if (!isSupported) return false;
    try {
      const perm = await Notification.requestPermission();
      permissionState.value = perm;
      if (perm === 'granted') {
        notificationsEnabled.value = true;
        localStorage.setItem('habuilt.dueNowNotifications.enabled', 'true');
        syncDueNowNotification();
        return true;
      } else {
        notificationsEnabled.value = false;
        localStorage.setItem('habuilt.dueNowNotifications.enabled', 'false');
        dismissDueNowNotification();
        return false;
      }
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
      // Default expiry: 45 minutes from now
      return Date.now() + 45 * 60 * 1000;
    }
    const sched = habitTimeSchedule[habitId];
    const [eh, em] = sched.end.split(':').map(Number);
    const now = new Date();
    const expiry = new Date(now.getFullYear(), now.getMonth(), now.getDate(), eh, em, 0);
    return expiry.getTime();
  };

  // Send message to Service Worker to display or update the Due Now notification
  const syncDueNowNotification = () => {
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
    const day = currentDay?.value || new Date().getDate();

    // If already completed today, dismiss notification immediately
    if (hasCompletedDay && hasCompletedDay(habit, day)) {
      dismissDueNowNotification();
      return;
    }

    const expiryTimestamp = calculateExpiryTimestamp(habit.id);
    const now = Date.now();

    // If time window has already expired, dismiss and don't show
    if (now >= expiryTimestamp) {
      dismissDueNowNotification();
      return;
    }

    const currentSessionKey = `${habit.id}:${day}:${info.status}`;

    // STRICT GUARD: If we already dispatched notification for this exact habit and day, DO NOT send again!
    if (activeNotifiedHabitId.value === currentSessionKey) {
      return;
    }

    // Post to service worker
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_DUE_NOW_NOTIFICATION',
        payload: {
          habitId: habit.id,
          habitName: habit.name,
          points: habit.points,
          timeLabel: info.timeLabel || '',
          day: day,
          expiryTimestamp: expiryTimestamp,
        },
      });
      activeNotifiedHabitId.value = currentSessionKey;
    }
  };

  // Dismiss Due Now Notification
  const dismissDueNowNotification = () => {
    if (!isSupported) return;
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'DISMISS_DUE_NOW_NOTIFICATION',
      });
    }
    activeNotifiedHabitId.value = null;
  };

  // Check and process any queued completions from background actions when offline/closed
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
              onCompleteHabit(item.habitId, item.day);
            }
          }
          // Clear processed queue
          await cache.delete('/queued-completions');
        }
      }
    } catch { /* ignore */ }
  };

  // Setup communication channels
  onMounted(() => {
    if (typeof window === 'undefined') return;

    // 1. Drain any offline completions
    drainQueuedCompletions();

    // 2. BroadcastChannel for real-time background notification completion
    if ('BroadcastChannel' in window) {
      try {
        channel = new BroadcastChannel('habuilt-channel');
        channel.onmessage = (event) => {
          if (event.data?.type === 'HABIT_COMPLETED_VIA_NOTIFICATION') {
            const { habitId, day } = event.data;
            if (habitId && day && onCompleteHabit) {
              onCompleteHabit(habitId, day);
            }
          }
        };
      } catch { /* channel fallback */ }
    }

    // 3. Service Worker message listener
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'HABIT_COMPLETED_VIA_NOTIFICATION') {
          const { habitId, day } = event.data;
          if (habitId && day && onCompleteHabit) {
            onCompleteHabit(habitId, day);
          }
        }
      });
    }

    // 4. Initial Sync & Heartbeat every 30s to check timing & auto-remove when task finishes
    syncDueNowNotification();
    heartbeatInterval = setInterval(() => {
      syncDueNowNotification();
    }, 30000);
  });

  onUnmounted(() => {
    if (channel) channel.close();
    if (heartbeatInterval) clearInterval(heartbeatInterval);
  });

  // Watch for changes in upNextHabitInfo or currentDay
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
  };
}
