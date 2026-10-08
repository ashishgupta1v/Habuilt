import { createClient } from '@supabase/supabase-js';

const PROD_SUPABASE_URL = 'https://eefrpxxcztapatyqokpv.supabase.co';
const PROD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlZnJweHhjenRhcGF0eXFva3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NjQ5MDAsImV4cCI6MjA4OTA0MDkwMH0.1pct7C4PK0q9MicvOOM0CW99cc6pJLsV4jKVMoy9b5c';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || PROD_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || PROD_SUPABASE_ANON_KEY;

// Local-first architecture: when VITE_SUPABASE_URL is unconfigured, system operates silently in local peer mode.
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

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ATOMIC ROW-LEVEL CHECK-IN LEDGER (Normalized Event Persistence)
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

  const { data, error } = await supabase
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
      {
        onConflict: 'user_id,habit_id,month_key,day',
      }
    );

  if (error) {
    console.warn('[Habuilt Ledger] Error inserting check-in:', error.message);
    queueOfflineAction({
      type: 'INSERT',
      payload: { userId, habitId, habitName, monthKey, day, completedOn: dateStr, points, canonicalKey, source },
    });
    return false;
  }

  return true;
};

/**
 * Removes a habit check-in record from the normalized ledger.
 */
export const removeHabitCheckIn = async ({ userId, habitId, monthKey, day }) => {
  if (!userId || !habitId || !monthKey || !day) return false;

  const { error } = await supabase
    .from('habit_check_ins')
    .delete()
    .eq('user_id', userId)
    .eq('habit_id', String(habitId))
    .eq('month_key', monthKey)
    .eq('day', Number(day));

  if (error) {
    console.warn('[Habuilt Ledger] Error removing check-in:', error.message);
    queueOfflineAction({
      type: 'DELETE',
      payload: { userId, habitId, monthKey, day },
    });
    return false;
  }

  return true;
};

/**
 * Fetches all normalized check-ins for a user in a specific month.
 */
export const loadMonthCheckIns = async (userId, monthKey) => {
  if (!userId || !monthKey) return [];

  const { data, error } = await supabase
    .from('habit_check_ins')
    .select('id, habit_id, habit_name, day, completed_on, points, canonical_key, source, created_at')
    .eq('user_id', userId)
    .eq('month_key', monthKey);

  if (error) {
    // If table doesn't exist yet in user's Supabase, fall back gracefully
    console.warn('[Habuilt Ledger] Check-in fetch note:', error.message);
    return null;
  }

  return data || [];
};

/**
 * Fetches all check-ins across all months for a user (lifetime analytics & streaks).
 */
export const loadAllCheckIns = async (userId) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('habit_check_ins')
    .select('habit_id, month_key, day, completed_on, points, canonical_key')
    .eq('user_id', userId);

  if (error) {
    console.warn('[Habuilt Ledger] Lifetime check-ins fetch note:', error.message);
    return [];
  }

  return data || [];
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. USER SETTINGS & REVIEWS STORE
// ═══════════════════════════════════════════════════════════════════════════════

export const saveUserSettings = async (userId, settingsPayload) => {
  if (!userId) return false;

  const { error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        progressive_settings: settingsPayload.progressiveSettings || {},
        custom_habits: settingsPayload.customHabits || [],
        rewards: settingsPayload.rewards || [],
        reward_ledger: settingsPayload.rewardLedger || [],
        weekly_reviews: settingsPayload.weeklyReviews || {},
        enhanced_state: settingsPayload.enhancedState || {},
        day_type: settingsPayload.dayType || 'home',
        dark_mode: settingsPayload.darkMode !== undefined ? settingsPayload.darkMode : true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

  if (error) {
    console.warn('[Habuilt Settings] Error saving user settings:', error.message);
    return false;
  }

  return true;
};

export const loadUserSettings = async (userId) => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[Habuilt Settings] Note on loading settings:', error.message);
    return null;
  }

  return data || null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. REALTIME SYNC & PARTNER BROADCASTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Subscribes to real-time check-in mutations (INSERT, DELETE, UPDATE) for a user.
 */
export const subscribeToHabitCheckIns = (userId, onCheckInChange) => {
  if (!userId) return null;

  const channel = supabase
    .channel(`habuilt-user-checkins-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'habit_check_ins',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (typeof onCheckInChange === 'function') {
          onCheckInChange({
            eventType: payload.eventType, // 'INSERT', 'DELETE', 'UPDATE'
            new: payload.new,
            old: payload.old,
          });
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        // Connected to real-time stream
      }
    });

  return channel;
};

/**
 * Generates a deterministic, collision-free pair channel name for any two users.
 */
export const getPairChannelId = (userId1, userId2) => {
  if (!userId1 || !userId2) return 'habuilt:couple_live_channel';
  const u1 = String(userId1).trim().toLowerCase();
  const u2 = String(userId2).trim().toLowerCase();
  const sorted = [u1, u2].sort();
  return `habuilt:partner_pair_${sorted[0]}__${sorted[1]}`;
};

/**
 * Broadcasts an instant event to the shared couple channel.
 */
let coupleChannel = null;
let currentChannelName = 'habuilt:couple_live_channel';
let localBroadcastChannel = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    localBroadcastChannel = new BroadcastChannel('habuilt_local_partner_sync');
  } catch (_) {}
}

export const initCoupleBroadcastChannel = (onPartnerMessage, channelName = 'habuilt:couple_live_channel') => {
  const targetChannelName = channelName || 'habuilt:couple_live_channel';

  // Listen to local tab BroadcastChannel for local/dual-context test speed
  if (localBroadcastChannel) {
    localBroadcastChannel.onmessage = (event) => {
      if (event?.data && typeof onPartnerMessage === 'function') {
        onPartnerMessage(event.data);
      }
    };
  }

  if (coupleChannel && currentChannelName === targetChannelName) {
    return coupleChannel;
  }

  if (coupleChannel) {
    try {
      coupleChannel.unsubscribe();
    } catch {}
    coupleChannel = null;
  }

  currentChannelName = targetChannelName;

  try {
    coupleChannel = supabase.channel(targetChannelName, {
      config: {
        broadcast: { ack: false, self: false },
      },
    });

    coupleChannel
      .on('broadcast', { event: 'partner_activity' }, ({ payload }) => {
        if (typeof onPartnerMessage === 'function') {
          onPartnerMessage(payload);
        }
      })
      .subscribe();
  } catch (err) {
    console.warn('[Habuilt Couple] Realtime subscription init note:', err);
  }

  return coupleChannel;
};

export const broadcastPartnerEvent = async (eventData, channelName = null) => {
  const targetChannel = channelName || currentChannelName || 'habuilt:couple_live_channel';
  const payload = {
    ...eventData,
    timestamp: Date.now(),
  };

  // 1. Send via local browser BroadcastChannel (instant for local tabs/contexts)
  if (localBroadcastChannel) {
    try {
      localBroadcastChannel.postMessage(payload);
    } catch (_) {}
  }

  // 2. Send via Supabase Realtime WebSocket for cross-device peering
  if (!coupleChannel || currentChannelName !== targetChannel) {
    initCoupleBroadcastChannel(null, targetChannel);
  }

  if (coupleChannel) {
    try {
      await coupleChannel.send({
        type: 'broadcast',
        event: 'partner_activity',
        payload,
      });
    } catch (e) {
      console.warn('[Habuilt Couple] Broadcast warning:', e);
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. OFFLINE IDEMPOTENT QUEUE & SILENT RECONCILIATION
// ═══════════════════════════════════════════════════════════════════════════════

const OFFLINE_QUEUE_KEY = 'habuilt.offline_checkin_queue';

export const queueOfflineAction = (action) => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    queue.push({ ...action, queuedAt: Date.now() });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('[Habuilt Queue] Could not queue offline action:', e);
  }
};

export const flushOfflineQueue = async () => {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return;
    const queue = JSON.parse(raw);
    if (!Array.isArray(queue) || queue.length === 0) return;

    localStorage.removeItem(OFFLINE_QUEUE_KEY);

    for (const item of queue) {
      if (item.type === 'INSERT') {
        await recordHabitCheckIn(item.payload);
      } else if (item.type === 'DELETE') {
        await removeHabitCheckIn(item.payload);
      }
    }
  } catch (e) {
    console.warn('[Habuilt Queue] Error flushing offline queue:', e);
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushOfflineQueue();
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. LEGACY FALLBACK API (Maintained for Backward Compatibility)
// ═══════════════════════════════════════════════════════════════════════════════

export const loadUserMonthlyState = async (userId, monthKey) => {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('user_monthly_states')
    .select('state_data')
    .eq('user_id', userId)
    .eq('month_key', monthKey)
    .maybeSingle();

  if (error) {
    return null;
  }
  return data?.state_data || null;
};

export const saveUserMonthlyState = async (userId, monthKey, stateData) => {
  if (!userId) return false;
  
  const { error } = await supabase
    .from('user_monthly_states')
    .upsert(
      {
        user_id: userId,
        month_key: monthKey,
        state_data: stateData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,month_key',
      }
    );

  if (error) {
    return false;
  }
  return true;
};

export const loadAllUserMonthlyStates = async (userId) => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('user_monthly_states')
    .select('month_key, state_data')
    .eq('user_id', userId);

  if (error) {
    return [];
  }
  return data || [];
};

/**
 * Silently migrates completed days from legacy monthly JSON to normalized habit_check_ins.
 */
export const silentBackfillLegacyState = async (userId, monthKey, habits) => {
  if (!userId || !monthKey || !Array.isArray(habits)) return 0;

  const rowsToInsert = [];
  for (const habit of habits) {
    if (!habit || !Array.isArray(habit.completed_days)) continue;
    for (const d of habit.completed_days) {
      const dayNum = Number(d);
      if (dayNum >= 1 && dayNum <= 31) {
        rowsToInsert.push({
          user_id: userId,
          habit_id: String(habit.id),
          habit_name: habit.name || '',
          month_key: monthKey,
          day: dayNum,
          completed_on: `${monthKey}-${String(dayNum).padStart(2, '0')}`,
          points: Number(habit.points) || 1,
          source: 'auto_backfill',
          updated_at: new Date().toISOString(),
        });
      }
    }
  }

  if (rowsToInsert.length === 0) return 0;

  // Insert in batches of 50 with onConflict ignore
  let count = 0;
  for (let i = 0; i < rowsToInsert.length; i += 50) {
    const chunk = rowsToInsert.slice(i, i + 50);
    const { error } = await supabase
      .from('habit_check_ins')
      .upsert(chunk, { onConflict: 'user_id,habit_id,month_key,day', ignoreDuplicates: true });
    if (!error) count += chunk.length;
  }

  return count;
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. USER BIOMARKERS & WELLNESS LOGS (Stiffness, Hydration, Energy)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Saves or updates a daily biomarker record for a user.
 */
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
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('user_biomarkers')
    .upsert(payload, { onConflict: 'user_id,log_date' });

  if (error) {
    console.warn('[Habuilt Biomarkers] Error saving biomarker log:', error.message);
    return false;
  }

  return true;
};

/**
 * Loads recent biomarker records for a user.
 */
export const loadUserBiomarkers = async (userId, limit = 30) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('user_biomarkers')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.warn('[Habuilt Biomarkers] Note on loading biomarkers:', error.message);
    return [];
  }

  return data || [];
};

/**
 * Loads today's biomarker record for a user.
 */
export const loadLatestBiomarker = async (userId, logDate) => {
  if (!userId || !logDate) return null;

  const { data, error } = await supabase
    .from('user_biomarkers')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', logDate)
    .maybeSingle();

  if (error) {
    console.warn('[Habuilt Biomarkers] Note on loading latest biomarker:', error.message);
    return null;
  }

  return data || null;
};
