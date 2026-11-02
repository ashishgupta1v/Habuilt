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
      // Fetch latest on mount
      updateState();
    }
  });

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('habuilt:sync-status', updateState);
    }
  });

  const statusLabel = computed(() => {
    if (!isOnline.value) {
      if (deadLetterCount.value > 0) return `Sync stopped (${deadLetterCount.value})`;
      return pendingCount.value > 0 ? `Offline • ${pendingCount.value}` : 'Offline';
    }
    if (syncState.value === 'syncing') {
      return 'Syncing...';
    }
    if (deadLetterCount.value > 0) {
      return `Sync stopped (${deadLetterCount.value})`;
    }
    if (syncState.value === 'error') {
      return pendingCount.value > 0 ? `Retry (${pendingCount.value})` : 'Sync Failed';
    }
    return pendingCount.value > 0 ? `Syncing (${pendingCount.value})` : 'Cloud Synced';
  });

  const statusTooltip = computed(() => {
    if (!isOnline.value) {
      return pendingCount.value > 0
        ? `${pendingCount.value} pending mutation(s) stored locally. Will auto-sync once back online.`
        : 'Working in sovereign offline mode. All actions are cached locally.';
    }
    if (syncState.value === 'syncing') {
      return 'Synchronizing local changes with Supabase cloud...';
    }
    if (deadLetterCount.value > 0) {
      return deadLetterMessage.value
        ? `${deadLetterMessage.value} Click to retry.`
        : `${deadLetterCount.value} change(s) stopped retrying. Click to retry.`;
    }
    if (syncState.value === 'error') {
      return `${pendingCount.value} changes could not be saved to cloud. Click to retry.`;
    }
    return lastSyncedAt.value
      ? `All habits safely persisted in cloud. Last synced: ${new Date(lastSyncedAt.value).toLocaleTimeString()}`
      : 'All habits safely persisted in cloud.';
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
