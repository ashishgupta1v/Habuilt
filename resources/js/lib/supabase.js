import { createClient } from '@supabase/supabase-js';
import { dispatchZoetiCoachEvent } from './zoetiCoachBridge.js';
import { syncEngine, enqueueOfflineMutation, flushOfflineMutationQueue } from './syncEngine.js';
import { isRetryableAccountId } from './syncQueuePolicy.js';

const PROD_SUPABASE_URL = 'https://eefrpxxcztapatyqokpv.supabase.co';
const PROD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlZnJweHhjenRhcGF0eXFva3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NjQ5MDAsImV4cCI6MjA4OTA0MDkwMH0.1pct7C4PK0q9MicvOOM0CW99cc6pJLsV4jKVMoy9b5c';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || PROD_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || PROD_SUPABASE_ANON_KEY;

// ── Native Hostinger KVM 2 Local API Transport (Default & Primary) ──
const USE_LOCAL_API = true;

const collectAccountIds = (endpoint, body) => {
  const ids = [];
  if (body && typeof body === 'object') {
    for (const key of ['user_id', 'userId', 'partner_user_id']) {
      if (body[key] !== undefined && body[key] !== null && String(body[key]) !== '') {
        ids.push(String(body[key]));
      }
    }
  }
  if (typeof endpoint === 'string') {
    try {
      const url = new URL(endpoint, 'http://habuilt.local');
      for (const key of ['user_id', 'partner_user_id']) {
        const value = url.searchParams.get(key);
        if (value) ids.push(value);
      }
    } catch {}
  }
  return ids;
};

export const callLocalApi = async (endpoint, method = 'GET', body = null, options = null) => {
  if (typeof window === 'undefined') return null;
  const returnError = Boolean(options && options.returnError);

  // Guest and other non-account ids stay on this device.
  if (collectAccountIds(endpoint, body).some((id) => !isRetryableAccountId(id))) {
    return { success: true, guest: true };
  }

  try {
    const opts = {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    };

    // Attach Bearer token from Supabase session if available
    try {
      if (typeof supabase !== 'undefined' && supabase.auth) {
        const sessionRes = await supabase.auth.getSession();
        const token = sessionRes?.data?.session?.access_token;
        if (token) {
          opts.headers['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch {
      // Fallback: check cached session
      try {
        const cached = JSON.parse(localStorage.getItem('habuilt_cached_user') || 'null');
        if (cached?.access_token) {
          opts.headers['Authorization'] = `Bearer ${cached.access_token}`;
        }
      } catch {}
    }

    if (body) {
      opts.body = JSON.stringify(body);
    }
    const res = await fetch(endpoint, opts);
    if (!res.ok) {
      if (returnError) {
        try {
          const parsed = await res.json();
          if (parsed && typeof parsed === 'object') return { ...parsed, status: res.status };
        } catch { /* the status is still useful */ }
        return { success: false, error: `HTTP ${res.status}`, status: res.status };
      }
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[Local KVM API] ${method} ${endpoint} note:`, err.message);
    if (returnError) {
      return { success: false, error: 'offline', offline: true };
    }
    return null;
  }
};

/**
 * Permanently purge user account and all personal data.
 * Complies with Apple App Store Guideline 5.1.1(v) & GDPR Right to Erasure.
 */
export const purgeUserAccount = async (userId) => {
  if (!isRetryableAccountId(typeof userId === 'string' ? userId : '')) {
    return { success: false, guest: true };
  }
  try {
    const res = await callLocalApi('/api/user-account', 'DELETE', { user_id: userId }, { returnError: true });
    if (!res || res.success !== true) {
      return { success: false, error: res?.error || 'Account data was not deleted.' };
    }
    return res;
  } catch (e) {
    console.error('[PurgeAccount] Error:', e);
    return { success: false, error: 'Account data was not deleted.' };
  }
};

export const isSupabaseConfigured = () => Boolean(supabaseUrl && supabaseAnonKey);

const readStoredAccessToken = () => {
  try {
    if (typeof localStorage === 'undefined') return '';
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue;
      const parsed = JSON.parse(localStorage.getItem(key) || 'null');
      const token = parsed?.access_token || parsed?.currentSession?.access_token;
      if (typeof token === 'string' && token.trim() !== '' && token.trim() !== supabaseAnonKey) {
        return token.trim();
      }
    }
    const cached = JSON.parse(localStorage.getItem('habuilt_cached_user') || 'null');
    if (typeof cached?.access_token === 'string' && cached.access_token.trim() !== '' && cached.access_token.trim() !== supabaseAnonKey) {
      return cached.access_token.trim();
    }
  } catch {
    return '';
  }
  return '';
};

let readingSession = false;
let clientReady = false;

const sessionAccessToken = async () => {
  const stored = readStoredAccessToken();
  if (stored) return stored;
  if (!clientReady || readingSession || !supabase?.auth) return '';
  readingSession = true;
  try {
    const sessionRes = await supabase.auth.getSession();
    const token = sessionRes?.data?.session?.access_token;
    if (typeof token === 'string' && token.trim() !== '' && token.trim() !== supabaseAnonKey) {
      return token.trim();
    }
  } catch {
    return '';
  } finally {
    readingSession = false;
  }
  return '';
};

const requestUrl = (input) => {
  if (typeof input === 'string') return input;
  if (typeof URL !== 'undefined' && input instanceof URL) return input.toString();
  if (typeof Request !== 'undefined' && input instanceof Request) return input.url;
  return '';
};

const guardedSupabaseFetch = async (input, init = {}) => {
  const url = requestUrl(input);
  if (url.includes('/rest/v1/') || url.includes('/realtime/v1/')) {
    return new Response(JSON.stringify({ message: 'Habuilt data is served by the app API', code: '403' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return fetch(input, init);
};

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    global: {
      fetch: guardedSupabaseFetch,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
clientReady = true;

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
}, skipQueue = false) => {
  if (!userId || !habitId || !monthKey || !day) return false;

  const dateStr = completedOn || `${monthKey}-${String(day).padStart(2, '0')}`;

  // Guest check-ins stay on this device. The server uses the bearer subject, not a client user id.
  if (!isRetryableAccountId(String(userId))) {
    return true;
  }

  // 1. Primary: Save directly to Hostinger KVM 2 PostgreSQL via local API
  if (USE_LOCAL_API) {
    const localRes = await callLocalApi('/api/habits/check-ins', 'POST', {
      habit_id: String(habitId),
      habit_name: habitName,
      month_key: monthKey,
      day: Number(day),
      completed_on: dateStr,
      points: Number(points) || 1,
      canonical_key: canonicalKey || null,
      source: source,
    });

    if (localRes?.guest) {
      return true;
    }

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

  // The Laravel API is the only writer. A failure stays in the offline queue.
  if (!skipQueue) {
    enqueueOfflineMutation('INSERT', {
      userId,
      habitId: String(habitId),
      habitName,
      monthKey,
      day: Number(day),
      completedOn: dateStr,
      points,
      canonicalKey,
      source,
    });
  }
  return false;
};

/**
 * Removes a habit check-in record from the normalized ledger.
 */
export const removeHabitCheckIn = async ({ userId, habitId, monthKey, day }, skipQueue = false) => {
  if (!userId || !habitId || !monthKey || !day) return false;

  if (!isRetryableAccountId(String(userId))) {
    return true;
  }

  // 1. Primary: Hostinger KVM 2 local API
  if (USE_LOCAL_API) {
    const localRes = await callLocalApi('/api/habits/check-ins', 'DELETE', {
      habit_id: String(habitId),
      month_key: monthKey,
      day: Number(day),
    });

    if (localRes?.guest) {
      return true;
    }

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

  if (!skipQueue) {
    enqueueOfflineMutation('DELETE', {
      userId,
      habitId: String(habitId),
      monthKey,
      day: Number(day),
    });
  }
  return false;
};

/**
 * Fetches all normalized check-ins for a user in a specific month.
 */
export const loadMonthCheckIns = async (userId, monthKey) => {
  if (!userId || !monthKey) return [];

  // 1. Primary: Local Hostinger KVM 2 PostgreSQL API (< 2ms)
  if (!isRetryableAccountId(String(userId))) return [];

  if (USE_LOCAL_API) {
    const localData = await callLocalApi(`/api/habits/check-ins?month_key=${encodeURIComponent(monthKey)}`);
    if (Array.isArray(localData)) {
      return localData;
    }
  }

  return [];
};

/**
 * Fetches all check-ins across all months for a user (lifetime analytics & streaks).
 */
export const loadAllCheckIns = async (userId) => {
  if (!userId) return [];

  if (!isRetryableAccountId(String(userId))) return [];

  if (USE_LOCAL_API) {
    const localData = await callLocalApi('/api/habits/check-ins');
    if (Array.isArray(localData)) {
      return localData;
    }
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

  return false;
};

export const loadUserSettings = async (userId) => {
  if (!userId) return null;

  if (!USE_LOCAL_API) return { error: true, offline: true };

  const localData = await callLocalApi(`/api/user-settings?user_id=${encodeURIComponent(userId)}`, 'GET', null, { returnError: true });
  if (!localData) return null;
  if (localData.offline || localData.error || (localData.status && localData.status >= 400)) {
    return { error: true, offline: true };
  }
  return localData;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. REALTIME SYNC & PARTNER BROADCASTS
// ═══════════════════════════════════════════════════════════════════════════════

export const subscribeToHabitCheckIns = (userId, onCheckInChange) => {
  if (!userId) return { unsubscribe() {} };

  let listener = null;
  if (tabSyncChannel) {
    listener = (event) => {
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

  return {
    unsubscribe() {
      if (listener && tabSyncChannel) tabSyncChannel.removeEventListener('message', listener);
    },
  };
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

  return {
    supabaseChannel: null,
    send: (payload) => broadcastPartnerEvent(payload, channelName),
    unsubscribe() {},
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
// 4. OFFLINE QUEUE & SYNC ENGINE BRIDGE
// ═══════════════════════════════════════════════════════════════════════════════

// Register executors for the background sync engine
syncEngine.registerExecutor('INSERT', async (payload) => {
  return await recordHabitCheckIn(payload, true /* skipQueue to prevent re-enqueue loop */);
});

syncEngine.registerExecutor('DELETE', async (payload) => {
  return await removeHabitCheckIn(payload, true /* skipQueue to prevent re-enqueue loop */);
});

export const queueOfflineAction = (action) => {
  if (!action || !action.type) return;
  enqueueOfflineMutation(action.type, action.payload);
};

export const flushOfflineQueue = async () => {
  return await flushOfflineMutationQueue();
};


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

  return false;
};

export const loadUserBiomarkers = async (userId, limit = 30) => {
  if (!userId) return [];

  if (!USE_LOCAL_API) return { error: true, offline: true };

  const localData = await callLocalApi(`/api/user-biomarkers?user_id=${encodeURIComponent(userId)}`, 'GET', null, { returnError: true });
  if (Array.isArray(localData)) return localData;
  return { error: true, offline: true };
};

export const loadLatestBiomarker = async (userId, logDate) => {
  if (!userId || !logDate) return null;

  if (!USE_LOCAL_API) return { error: true, offline: true };

  const localData = await callLocalApi(
    `/api/user-biomarkers?user_id=${encodeURIComponent(userId)}&latest=true`,
    'GET',
    null,
    { returnError: true },
  );
  if (!localData) return null;
  if (localData.offline || localData.error || (localData.status && localData.status >= 400)) {
    return { error: true, offline: true };
  }
  return localData;
};
