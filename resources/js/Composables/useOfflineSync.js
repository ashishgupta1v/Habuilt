/**
 * useOfflineSync.js
 * Habuilt Composable for Sovereign Offline Mutation Sync & Network Telemetry
 * 
 * Exposes reactive state for UI capsules and controls to trigger manual or automated
 * background sync across Supabase and local storage.
 */

import { ref, computed, onMounted, onUnmounted } from 'vue';
import { syncEngine, enqueueOfflineMutation, flushOfflineMutationQueue } from '@/lib/syncEngine';

export function useOfflineSync() {
  const isOnline = ref(syncEngine.isOnline);
  const syncState = ref(syncEngine.syncState);
  const pendingCount = ref(syncEngine.getQueue().length);
  const lastSyncedAt = ref(syncEngine.lastSyncedAt);

  const updateState = (e) => {
    const detail = e?.detail || syncEngine.getState();
    isOnline.value = detail.isOnline;
    syncState.value = detail.syncState;
    pendingCount.value = detail.pendingCount;
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
      return pendingCount.value > 0 ? `Offline • ${pendingCount.value}` : 'Offline';
    }
    if (syncState.value === 'syncing') {
      return 'Syncing...';
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
    if (syncState.value === 'error') {
      return `${pendingCount.value} changes could not be saved to cloud. Click to retry.`;
    }
    return lastSyncedAt.value
      ? `All habits safely persisted in cloud. Last synced: ${new Date(lastSyncedAt.value).toLocaleTimeString()}`
      : 'All habits safely persisted in cloud.';
  });

  const triggerFlush = async () => {
    return await flushOfflineMutationQueue();
  };

  const clearPending = () => {
    syncEngine.clearQueue();
    updateState();
  };

  return {
    isOnline,
    syncState,
    pendingCount,
    lastSyncedAt,
    statusLabel,
    statusTooltip,
    flushQueue: triggerFlush,
    clearQueue: clearPending,
    enqueue: enqueueOfflineMutation,
  };
}
