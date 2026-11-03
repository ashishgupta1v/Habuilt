/**
 * useOfflineSync.js
 * Habuilt Composable for Sovereign Offline Mutation Sync & Network Telemetry
 * 
 * Exposes reactive state for UI capsules and controls to trigger manual or automated
 * background sync across Supabase and local storage.
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { syncEngine, enqueueOfflineMutation, flushOfflineMutationQueue, retryDeadLetterMutations, discardDeadLetterMutations } from '@/lib/syncEngine';

export function useOfflineSync() {
  const initial = syncEngine.getState();
  const isOnline = ref(initial.isOnline);
  const syncState = ref(initial.syncState);
  const pendingCount = ref(initial.pendingCount);
  const deadLetterCount = ref(initial.deadLetterCount || 0);
  const deadLetterMessage = ref(initial.deadLetterMessage || '');
  const lastSyncedAt = ref(initial.lastSyncedAt);
  const widgetDeadLetterCount = ref(0);
  const widgetLastSuccessAt = ref('');

  const readWidgetSync = () => {
    if (typeof localStorage === 'undefined') return;
    try {
      const parsed = JSON.parse(localStorage.getItem('habuilt_widget_sync_status') || 'null');
      widgetDeadLetterCount.value = Number(parsed?.deadLetterCount) || 0;
      widgetLastSuccessAt.value = parsed?.lastSuccessAt || '';
    } catch {
      widgetDeadLetterCount.value = 0;
      widgetLastSuccessAt.value = '';
    }
  };
  readWidgetSync();

  const updateState = (e) => {
    const detail = e?.detail || syncEngine.getState();
    isOnline.value = detail.isOnline;
    syncState.value = detail.syncState;
    pendingCount.value = detail.pendingCount;
    deadLetterCount.value = detail.deadLetterCount || 0;
    deadLetterMessage.value = detail.deadLetterMessage || '';
    lastSyncedAt.value = detail.lastSyncedAt;
  };

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('habuilt:sync-status', updateState);
      window.addEventListener('habuilt:widget-sync-status', readWidgetSync);
      // Fetch latest on mount
      updateState();
    }
  });

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('habuilt:sync-status', updateState);
      window.removeEventListener('habuilt:widget-sync-status', readWidgetSync);
    }
  });

  const totalDeadLetters = computed(() => deadLetterCount.value + widgetDeadLetterCount.value);
  const latestSuccessAt = computed(() => {
    const stamps = [lastSyncedAt.value, widgetLastSuccessAt.value].filter(Boolean).sort();
    return stamps.length > 0 ? stamps[stamps.length - 1] : '';
  });

  const statusLabel = computed(() => {
    if (totalDeadLetters.value > 0) return `Sync stopped (${totalDeadLetters.value})`;
    if (!isOnline.value) {
      return pendingCount.value > 0 ? `Offline • ${pendingCount.value}` : 'Offline';
    }
    if (syncState.value === 'syncing') {
      return 'Syncing...';
    }
    if (syncState.value === 'error') {
      return pendingCount.value > 0 ? `Retry (${pendingCount.value})` : 'Sync Failed';
    }
    return pendingCount.value > 0 ? `Syncing (${pendingCount.value})` : 'Synced';
  });

  const statusTooltip = computed(() => {
    const success = latestSuccessAt.value
      ? `Last success ${new Date(latestSuccessAt.value).toLocaleString()}.`
      : 'No successful sync yet.';
    const dead = `${deadLetterCount.value} web dead letter(s), ${widgetDeadLetterCount.value} phone dead letter(s).`;
    return `${success} ${dead}`;
  });

  const triggerFlush = async () => {
    if ((syncEngine.getState().deadLetterCount || 0) > 0) {
      return await retryDeadLetterMutations();
    }
    return await flushOfflineMutationQueue();
  };

  const clearPending = () => {
    syncEngine.clearQueue();
    updateState();
  };

  const discardStopped = () => {
    discardDeadLetterMutations();
    updateState();
  };

  return {
    isOnline,
    syncState,
    pendingCount,
    deadLetterCount,
    deadLetterMessage,
    lastSyncedAt,
    statusLabel,
    statusTooltip,
    flushQueue: triggerFlush,
    clearQueue: clearPending,
    discardDeadLetters: discardStopped,
    enqueue: enqueueOfflineMutation,
  };
}
