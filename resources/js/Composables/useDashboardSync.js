import { ref, onMounted, onBeforeUnmount } from 'vue';
import {
  subscribeToHabitCheckIns,
  subscribeToPartnerConnection,
  subscribeToPartnerBroadcast,
  getPartnerConnection,
} from '@/lib/supabase';

/**
 * ══════════════════════════════════════════════════════════════════════
 * useDashboardSync.js — Real-Time Cloud & Multi-Device Sync Composable
 * ══════════════════════════════════════════════════════════════════════
 */

export function useDashboardSync(options = {}) {
  const isSyncingCloud = ref(false);
  let realtimeCheckInsChannel = null;
  let realtimePartnerChannel = null;
  let realtimeCoupleBroadcastChannel = null;

  const initRealtimeSubscriptions = ({
    userId,
    monthScope,
    onCheckInChange,
    onPartnerChange,
    onPartnerBroadcast,
  }) => {
    if (!userId || userId === 'guest') return;

    // 1. Multi-device check-in subscription
    realtimeCheckInsChannel = subscribeToHabitCheckIns(userId, ({ eventType, new: newRec, old: oldRec }) => {
      if (typeof onCheckInChange === 'function') {
        onCheckInChange({ eventType, new: newRec, old: oldRec, monthScope });
      }
    });

    // 2. Partner connection status subscription
    realtimePartnerChannel = subscribeToPartnerConnection(userId, (payload) => {
      if (typeof onPartnerChange === 'function') {
        onPartnerChange(payload);
      }
    });
  };

  const subscribeCoupleChannel = (pairChannelId, onBroadcast) => {
    if (realtimeCoupleBroadcastChannel) {
      try { realtimeCoupleBroadcastChannel.unsubscribe(); } catch (_) {}
      realtimeCoupleBroadcastChannel = null;
    }
    if (pairChannelId && typeof onBroadcast === 'function') {
      realtimeCoupleBroadcastChannel = subscribeToPartnerBroadcast(pairChannelId, onBroadcast);
    }
  };

  const teardownSubscriptions = () => {
    if (realtimeCheckInsChannel) {
      try { realtimeCheckInsChannel.unsubscribe(); } catch (_) {}
      realtimeCheckInsChannel = null;
    }
    if (realtimePartnerChannel) {
      try { realtimePartnerChannel.unsubscribe(); } catch (_) {}
      realtimePartnerChannel = null;
    }
    if (realtimeCoupleBroadcastChannel) {
      try { realtimeCoupleBroadcastChannel.unsubscribe(); } catch (_) {}
      realtimeCoupleBroadcastChannel = null;
    }
  };

  onBeforeUnmount(() => {
    teardownSubscriptions();
  });

  return {
    isSyncingCloud,
    initRealtimeSubscriptions,
    subscribeCoupleChannel,
    teardownSubscriptions,
  };
}
