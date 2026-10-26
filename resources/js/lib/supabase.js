import { createClient } from '@supabase/supabase-js';
import { dispatchZoetiCoachEvent } from './zoetiCoachBridge.js';

const PROD_SUPABASE_URL = 'https://eefrpxxcztapatyqokpv.supabase.co';
const PROD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlZnJweHhjenRhcGF0eXFva3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NjQ5MDAsImV4cCI6MjA4OTA0MDkwMH0.1pct7C4PK0q9MicvOOM0CW99cc6pJLsV4jKVMoy9b5c';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || PROD_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || PROD_SUPABASE_ANON_KEY;

// ── Native Hostinger KVM 2 Local API Transport (Default & Primary) ──
const USE_LOCAL_API = true;

export const callLocalApi = async (endpoint, method = 'GET', body = null) => {
  if (typeof window === 'undefined') return null;
  try {
    const opts = {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };
    if (body) {
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(endpoint, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[Local KVM API] ${method} ${endpoint} note:`, err.message);
    return null;
  }
};

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Cross-tab broadcast channel for instant zero-latency UI synchronization
const tabSyncChannel = typeof window !== 'undefined' && window.BroadcastChannel
  ? new BroadcastChannel('habuilt-local-sync-channel')
  : null;

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ATOMIC ROW-LEVEL CHECK-IN LEDGER (Hostinger KVM 2 PostgreSQL)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Inserts a habit check-in record into the normalized ledger.
 */
export const recordHabitCheckIn = async ({
  userId,
  habitId,
  habitName = '',
  monthKey,
  day,
  completedOn,
  points = 1,
  canonicalKey = '',
  source = 'web',
}) => {
  if (!userId || !habitId || !monthKey || !day) return false;

  const dateStr = completedOn || `${monthKey}-${String(day).padStart(2, '0')}`;

  // 1. Primary: Save directly to Hostinger KVM 2 PostgreSQL via local API
  if (USE_LOCAL_API) {
    const localRes = await callLocalApi('/api/habits/check-ins', 'POST', {
      user_id: userId,
      habit_id: String(habitId),
      habit_name: habitName,
      month_key: monthKey,
      day: Number(day),
      completed_on: dateStr,
      points: Number(points) || 1,
      canonical_key: canonicalKey || null,
      source: source,
    });

    if (localRes && localRes.success) {
      // Notify other open tabs immediately
      if (tabSyncChannel) {
        tabSyncChannel.postMessage({
          type: 'CHECKIN_MUTATION',
          eventType: 'INSERT',
          userId,
          habitId: String(habitId),
          monthKey,
          day: Number(day),
        });
      }

      // Non-blocking async dispatch to ZoetiCoach WS18 Habit Cloud API
      dispatchZoetiCoachEvent({
        externalParticipantId: userId,
        eventType: 'habit_completed',
        eventValue: habitName,
        habitId: habitId,
        points: points,
        occurredAt: dateStr,
        source: source,
      }).catch(() => {});

      return true;
    }
  }

  // Fallback: Supabase or offline queue if local API was unreachable
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('habit_check_ins')
        .upsert(
          {
            user_id: userId,
            habit_id: String(habitId),
            habit_name: habitName,
            month_key: monthKey,
            day: Number(day),
            completed_on: dateStr,
            points: Number(points) || 1,
            canonical_key: canonicalKey || null,
            source: source,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,habit_id,month_key,day' }
        );
      if (!error) {
        dispatchZoetiCoachEvent({
          externalParticipantId: userId,
          eventType: 'habit_completed',
          eventValue: habitName,
          habitId: habitId,
          points: points,
          occurredAt: dateStr,
          source: source,
        }).catch(() => {});
        return true;
      }
    } catch {}
  }

  queueOfflineAction({
    type: 'INSERT',
    payload: { userId, habitId, habitName, monthKey, day, completedOn: dateStr, points, canonicalKey, source },
  });
  return false;
};

/**
 * Removes a habit check-in record from the normalized ledger.
 */
export const removeHabitCheckIn = async ({ userId, habitId, monthKey, day }) => {
  if (!userId || !habitId || !monthKey || !day) return false;

  // 1. Primary: Hostinger KVM 2 local API
  if (USE_LOCAL_API) {
    const localRes = await callLocalApi('/api/habits/check-ins', 'DELETE', {
      user_id: userId,
      habit_id: String(habitId),
      month_key: monthKey,
      day: Number(day),
    });

    if (localRes && localRes.success) {
      if (tabSyncChannel) {
        tabSyncChannel.postMessage({
          type: 'CHECKIN_MUTATION',
          eventType: 'DELETE',
          userId,
          habitId: String(habitId),
          monthKey,
          day: Number(day),
        });
      }

      dispatchZoetiCoachEvent({
        externalParticipantId: userId,
        eventType: 'habit_unmarked',
        eventValue: String(habitId),
        habitId: habitId,
        points: 0,
        occurredAt: `${monthKey}-${String(day).padStart(2, '0')}`,
        source: 'web',
      }).catch(() => {});

      return true;
    }
  }

  // Fallback: Supabase
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('habit_check_ins')
        .delete()
        .eq('user_id', userId)
        .eq('habit_id', String(habitId))
        .eq('month_key', monthKey)
        .eq('day', Number(day));
      if (!error) {
        dispatchZoetiCoachEvent({
          externalParticipantId: userId,
          eventType: 'habit_unmarked',
          eventValue: String(habitId),
          habitId: habitId,
          points: 0,
          occurredAt: `${monthKey}-${String(day).padStart(2, '0')}`,
          source: 'web',
        }).catch(() => {});
        return true;
      }
    } catch {}
  }

  queueOfflineAction({
    type: 'DELETE',
    payload: { userId, habitId, monthKey, day },
  });
  return false;
};

/**
 * Fetches all normalized check-ins for a user in a specific month.
 */
export const loadMonthCheckIns = async (userId, monthKey) => {
  if (!userId || !monthKey) return [];

  // 1. Primary: Local Hostinger KVM 2 PostgreSQL API (< 2ms)
  if (USE_LOCAL_API) {
    const localData = await callLocalApi(`/api/habits/check-ins?user_id=${encodeURIComponent(userId)}&month_key=${encodeURIComponent(monthKey)}`);
    if (Array.isArray(localData)) {
      return localData;
    }
  }

  // Fallback: Supabase
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('habit_check_ins')
        .select('id, habit_id, habit_name, day, completed_on, points, canonical_key, source, created_at')
        .eq('user_id', userId)
        .eq('month_key', monthKey);
      if (!error && Array.isArray(data)) return data;
    } catch {}
  }

  return [];
};

/**
 * Fetches all check-ins across all months for a user (lifetime analytics & streaks).
 */
export const loadAllCheckIns = async (userId) => {
  if (!userId) return [];

  if (USE_LOCAL_API) {
    const localData = await callLocalApi(`/api/habits/check-ins?user_id=${encodeURIComponent(userId)}`);
    if (Array.isArray(localData)) {
      return localData;
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('habit_check_ins')
        .select('habit_id, month_key, day, completed_on, points, canonical_key')
        .eq('user_id', userId);
      if (!error && Array.isArray(data)) return data;
    } catch {}
  }

  return [];
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. USER SETTINGS & REVIEWS STORE (Hostinger KVM 2 PostgreSQL)
// ═══════════════════════════════════════════════════════════════════════════════

export const saveUserSettings = async (userId, settingsPayload) => {
  if (!userId) return false;

  if (USE_LOCAL_API) {
    const localRes = await callLocalApi('/api/user-settings', 'POST', {
      user_id: userId,
      progressive_settings: settingsPayload.progressiveSettings || {},
      custom_habits: settingsPayload.customHabits || [],
      rewards: settingsPayload.rewards || [],
      reward_ledger: settingsPayload.rewardLedger || [],
      weekly_reviews: settingsPayload.weeklyReviews || {},
      enhanced_state: settingsPayload.enhancedState || {},
      day_type: settingsPayload.dayType || 'home',
      dark_mode: false,
    });
    if (localRes && localRes.success) return true;
  }

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          progressive_settings: settingsPayload.progressiveSettings || {},
          custom_habits: settingsPayload.customHabits || [],
          rewards: settingsPayload.rewards || [],
          reward_ledger: settingsPayload.rewardLedger || [],
          weekly_reviews: settingsPayload.weeklyReviews || {},
          enhanced_state: settingsPayload.enhancedState || {},
          day_type: settingsPayload.dayType || 'home',
          dark_mode: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      if (!error) return true;
    } catch {}
  }

  return false;
};

export const loadUserSettings = async (userId) => {
  if (!userId) return null;

  if (USE_LOCAL_API) {
    const localData = await callLocalApi(`/api/user-settings?user_id=${encodeURIComponent(userId)}`);
    if (localData && typeof localData === 'object') {
      return localData;
    }
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && data) return data;
    } catch {}
  }

  return null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. REALTIME SYNC & PARTNER BROADCASTS
// ═══════════════════════════════════════════════════════════════════════════════

export const subscribeToHabitCheckIns = (userId, onCheckInChange) => {
  if (!userId) return null;

  // Local Tab Broadcast listener for instant reactive UI updates
  if (tabSyncChannel) {
    const listener = (event) => {
      if (event.data?.type === 'CHECKIN_MUTATION' && event.data?.userId === userId) {
        if (typeof onCheckInChange === 'function') {
          onCheckInChange({
            eventType: event.data.eventType,
            new: { habit_id: event.data.habitId, day: event.data.day, month_key: event.data.monthKey },
            old: { habit_id: event.data.habitId, day: event.data.day, month_key: event.data.monthKey },
          });
        }
      }
    };
    tabSyncChannel.addEventListener('message', listener);
  }

  if (isSupabaseConfigured()) {
    try {
      return supabase
        .channel(`habuilt-user-checkins-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_check_ins', filter: `user_id=eq.${userId}` }, (payload) => {
          if (typeof onCheckInChange === 'function') {
            onCheckInChange({
              eventType: payload.eventType,
              new: payload.new,
              old: payload.old,
            });
          }
        })
        .subscribe();
    } catch {}
  }

  return { unsubscribe: () => {} };
};

export const getPairChannelId = (userA, userB) => {
  if (!userA || !userB) return null;
  const sorted = [userA.trim().toLowerCase(), userB.trim().toLowerCase()].sort();
  return `habuilt-pair-${sorted[0]}-${sorted[1]}`;
};

let globalLocalPartnerBc = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    globalLocalPartnerBc = new BroadcastChannel('habuilt_local_partner_sync');
  } catch (_) {}
}

export const initCoupleBroadcastChannel = (arg1, arg2) => {
  let onPartnerEvent = null;
  let channelName = null;

  if (typeof arg1 === 'function') {
    onPartnerEvent = arg1;
    channelName = typeof arg2 === 'string' ? arg2 : null;
  } else if (arg1 && typeof arg1 === 'object') {
    onPartnerEvent = arg1.onPartnerEvent;
    if (arg1.userId && arg1.partnerId) {
      channelName = getPairChannelId(arg1.userId, arg1.partnerId);
    } else if (arg1.channelName) {
      channelName = arg1.channelName;
    }
  }

  // 1. Hook into browser BroadcastChannel for zero-latency local multi-tab / offline / test sync
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      if (!globalLocalPartnerBc) {
        globalLocalPartnerBc = new BroadcastChannel('habuilt_local_partner_sync');
      }
      globalLocalPartnerBc.onmessage = (event) => {
        if (event && event.data && typeof onPartnerEvent === 'function') {
          onPartnerEvent(event.data);
        }
      };
    } catch (_) {}
  }

  // 2. Hook into Supabase Realtime channel if configured
  let supabaseChannel = null;
  if (channelName && isSupabaseConfigured()) {
    try {
      supabaseChannel = supabase.channel(channelName, { config: { broadcast: { self: false } } });
      supabaseChannel.on('broadcast', { event: 'partner_action' }, (event) => {
        if (typeof onPartnerEvent === 'function') {
          onPartnerEvent(event.payload);
        }
      });
      supabaseChannel.subscribe();
    } catch (_) {}
  }

  return {
    supabaseChannel,
    send: (payload) => broadcastPartnerEvent(payload, channelName),
    unsubscribe: () => {
      try {
        if (supabaseChannel) supabaseChannel.unsubscribe();
      } catch (_) {}
    }
  };
};

export const broadcastPartnerEvent = async (arg1, arg2) => {
  let payload = null;
  let channel = null;

  if (arg1 && typeof arg1 === 'object' && ('type' in arg1 || 'event' in arg1 || 'nudge' in arg1)) {
    payload = arg1;
    channel = arg2;
  } else {
    channel = arg1;
    payload = arg2;
  }

  if (!payload) return false;
  const enrichedPayload = { ...payload, sentAt: new Date().toISOString() };

  // Always broadcast locally across browser contexts
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      if (!globalLocalPartnerBc) {
        globalLocalPartnerBc = new BroadcastChannel('habuilt_local_partner_sync');
      }
      globalLocalPartnerBc.postMessage(enrichedPayload);
    } catch (_) {}
  }

  // Broadcast to remote Supabase Realtime channel if available
  if (channel && typeof channel.send === 'function') {
    try {
      await channel.send({
        type: 'broadcast',
        event: 'partner_action',
        payload: enrichedPayload,
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  return true;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. OFFLINE QUEUE
// ═══════════════════════════════════════════════════════════════════════════════

const OFFLINE_QUEUE_KEY = 'habuilt_offline_queue';

const queueOfflineAction = (action) => {
  if (typeof window === 'undefined') return;
  try {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    queue.push({ ...action, queuedAt: new Date().toISOString() });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch {}
};

export const flushOfflineQueue = async () => {
  if (typeof window === 'undefined') return 0;
  let queue = [];
  try {
    queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch {
    queue = [];
  }
  if (!queue.length) return 0;

  const remaining = [];
  let flushed = 0;

  for (const item of queue) {
    try {
      if (item.type === 'INSERT') {
        const ok = await recordHabitCheckIn(item.payload);
        if (ok) flushed++; else remaining.push(item);
      } else if (item.type === 'DELETE') {
        const ok = await removeHabitCheckIn(item.payload);
        if (ok) flushed++; else remaining.push(item);
      }
    } catch {
      remaining.push(item);
    }
  }

  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
  } catch {}
  return flushed;
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushOfflineQueue();
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. LEGACY FALLBACK API
// ═══════════════════════════════════════════════════════════════════════════════

export const loadUserMonthlyState = async () => null;
export const saveUserMonthlyState = async () => false;
export const loadAllUserMonthlyStates = async () => [];
export const silentBackfillLegacyState = async () => 0;

// ═══════════════════════════════════════════════════════════════════════════════
// 6. USER BIOMARKERS & WELLNESS LOGS (Hostinger KVM 2 PostgreSQL)
// ═══════════════════════════════════════════════════════════════════════════════

export const saveUserBiomarker = async ({
  userId,
  logDate,
  stiffnessMinutes = 0,
  hydrationMl = 0,
  energyLevel = null,
  sleepHours = 0,
  notes = '',
}) => {
  if (!userId || !logDate) return false;

  const payload = {
    user_id: userId,
    log_date: logDate,
    stiffness_minutes: Number(stiffnessMinutes) || 0,
    hydration_ml: Number(hydrationMl) || 0,
    energy_level: energyLevel ? Number(energyLevel) : null,
    sleep_hours: Number(sleepHours) || 0,
    notes: notes || null,
  };

  if (USE_LOCAL_API) {
    const localRes = await callLocalApi('/api/user-biomarkers', 'POST', payload);
    if (localRes && localRes.success) return true;
  }

  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('user_biomarkers').upsert({
        ...payload,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,log_date' });
      if (!error) return true;
    } catch {}
  }

  return false;
};

export const loadUserBiomarkers = async (userId, limit = 30) => {
  if (!userId) return [];

  if (USE_LOCAL_API) {
    const localData = await callLocalApi(`/api/user-biomarkers?user_id=${encodeURIComponent(userId)}`);
    if (Array.isArray(localData)) return localData;
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('user_biomarkers')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(limit);
      if (!error && Array.isArray(data)) return data;
    } catch {}
  }

  return [];
};

export const loadLatestBiomarker = async (userId, logDate) => {
  if (!userId || !logDate) return null;

  if (USE_LOCAL_API) {
    const localData = await callLocalApi(`/api/user-biomarkers?user_id=${encodeURIComponent(userId)}&latest=true`);
    if (localData && typeof localData === 'object') return localData;
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('user_biomarkers')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', logDate)
        .maybeSingle();
      if (!error && data) return data;
    } catch {}
  }

  return null;
};
