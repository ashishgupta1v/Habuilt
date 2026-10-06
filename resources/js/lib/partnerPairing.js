import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const LOCAL_PAIR_PREFIX = 'habuilt_partner_connection_';
const LOCAL_INVITE_PREFIX = 'habuilt_my_invite_code_';

/**
 * Generate a clean, 6-character human-friendly code (e.g. 'HAB-8942')
 */
export function generateRandomCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HAB-${rand}`;
}

const isGuestUser = (uid) => {
  if (typeof window === 'undefined') return false;
  return (localStorage.getItem('habuilt_guest_mode') === 'true' && uid === 'guest') || uid === 'guest';
};

/**
 * Get or create an invite code for the current user.
 */
export async function getOrCreateInviteCode(userId) {
  if (!userId) return 'HAB-DEMO';

  // 1. Check local storage cache first
  const cached = localStorage.getItem(`${LOCAL_INVITE_PREFIX}${userId}`);
  if (cached) return cached;

  let code = generateRandomCode();

  if (isSupabaseConfigured() && !isGuestUser(userId)) {
    try {
      // Check if user already has an existing connection row with invite_code
      const { data, error } = await supabase
        .from('partner_connections')
        .select('invite_code')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (!error && data?.invite_code) {
        code = data.invite_code;
      } else {
        // Upsert new invite record
        await supabase
          .from('partner_connections')
          .upsert({
            user_id: userId,
            invite_code: code,
            status: 'pending',
            updated_at: new Date().toISOString()
          }, { onConflict: 'invite_code' });
      }
    } catch (e) {
      console.warn('[PartnerPairing] Supabase lookup error, using generated code:', e);
    }
  }

  localStorage.setItem(`${LOCAL_INVITE_PREFIX}${userId}`, code);
  return code;
}

/**
 * Accept an invite code to pair with a partner.
 */
export async function pairWithInviteCode(currentUserId, rawCode, partnerAlias = '') {
  if (!currentUserId || !rawCode) {
    throw new Error('Both User ID and invite code are required.');
  }

  const cleanCode = rawCode.trim().toUpperCase();

  // Ashish & Jyoti built-in auto-link short circuit
  if (cleanCode === 'ASHISH' || cleanCode === 'JYOTI') {
    const partnerId = cleanCode === 'ASHISH' ? 'ashish' : 'jyoti';
    const connection = {
      user_id: currentUserId,
      partner_user_id: partnerId,
      invite_code: cleanCode,
      status: 'connected',
      alias: partnerAlias || (partnerId === 'ashish' ? 'Ashish' : 'Jyoti'),
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(`${LOCAL_PAIR_PREFIX}${currentUserId}`, JSON.stringify(connection));
    return connection;
  }

  let partnerUserId = null;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('partner_connections')
        .select('*')
        .eq('invite_code', cleanCode)
        .maybeSingle();

      if (error) {
        console.warn('[PartnerPairing] Error looking up invite code:', error);
      } else if (data) {
        partnerUserId = data.user_id;

        if (partnerUserId === currentUserId) {
          throw new Error('You cannot pair with your own invite code.');
        }

        // Update host connection record
        await supabase
          .from('partner_connections')
          .update({
            partner_user_id: currentUserId,
            status: 'connected',
            updated_at: new Date().toISOString()
          })
          .eq('invite_code', cleanCode);

        // Also create reciprocal connection row for current user
        await supabase
          .from('partner_connections')
          .upsert({
            user_id: currentUserId,
            partner_user_id: partnerUserId,
            invite_code: `PAIRED-${cleanCode}`,
            status: 'connected',
            alias: partnerAlias || 'Partner',
            updated_at: new Date().toISOString()
          });
      }
    } catch (e) {
      console.warn('[PartnerPairing] Online pairing failed, falling back to local pair:', e);
      if (e.message && e.message.includes('own invite code')) throw e;
    }
  }

  // Save connection to local storage
  const connection = {
    user_id: currentUserId,
    partner_user_id: partnerUserId || `partner-${cleanCode.replace('HAB-', '')}`,
    invite_code: cleanCode,
    status: 'connected',
    alias: partnerAlias || 'My Partner',
    updated_at: new Date().toISOString()
  };

  localStorage.setItem(`${LOCAL_PAIR_PREFIX}${currentUserId}`, JSON.stringify(connection));
  return connection;
}

/**
 * Retrieve active partner connection status
 */
export async function getPartnerConnection(userId) {
  if (!userId) return null;

  // Local check
  const cached = localStorage.getItem(`${LOCAL_PAIR_PREFIX}${userId}`);
  let localConnection = null;
  if (cached) {
    try {
      localConnection = JSON.parse(cached);
    } catch (_) {}
  }

  if (isSupabaseConfigured() && !isGuestUser(userId)) {
    try {
      const { data, error } = await supabase
        .from('partner_connections')
        .select('*')
        .or(`user_id.eq.${userId},partner_user_id.eq.${userId}`)
        .eq('status', 'connected')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        const isHost = data.user_id === userId;
        const connection = {
          user_id: userId,
          partner_user_id: isHost ? data.partner_user_id : data.user_id,
          invite_code: data.invite_code,
          status: 'connected',
          alias: data.alias || 'Partner',
          updated_at: data.updated_at
        };
        localStorage.setItem(`${LOCAL_PAIR_PREFIX}${userId}`, JSON.stringify(connection));
        return connection;
      }
    } catch (e) {
      console.warn('[PartnerPairing] getPartnerConnection error:', e);
    }
  }

  return localConnection;
}

/**
 * Disconnect/Unpair partner
 */
export async function disconnectPartner(userId) {
  if (!userId) return;

  localStorage.removeItem(`${LOCAL_PAIR_PREFIX}${userId}`);

  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('partner_connections')
        .update({ status: 'revoked', partner_user_id: null, updated_at: new Date().toISOString() })
        .or(`user_id.eq.${userId},partner_user_id.eq.${userId}`);
    } catch (e) {
      console.warn('[PartnerPairing] Revoke error:', e);
    }
  }
}

/**
 * Subscribes to realtime updates on partner_connections.
 */
export function subscribeToPartnerConnection(userId, onPartnerChange) {
  if (!isSupabaseConfigured() || !userId || isGuestUser(userId)) return null;

  const channel = supabase
    .channel(`habuilt-partner-sync-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'partner_connections',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (typeof onPartnerChange === 'function') {
          onPartnerChange(payload);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'partner_connections',
        filter: `partner_user_id=eq.${userId}`,
      },
      (payload) => {
        if (typeof onPartnerChange === 'function') {
          onPartnerChange(payload);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Loads partner's live progress metrics from habit_check_ins, with offline fallback cache.
 */
export async function loadPartnerLiveMetrics(partnerUserId, monthKey, targetDay = null) {
  if (!partnerUserId) return null;

  const todayNum = targetDay !== null ? Number(targetDay) : new Date().getDate();
  const cacheKey = `habuilt_partner_metrics_${partnerUserId}_${monthKey}`;

  // Helper to process raw check-in rows
  const processCheckIns = (checkIns, isCached = false) => {
    const list = Array.isArray(checkIns) ? checkIns : [];
    const todayCheckIns = list.filter(d => Number(d.day) === todayNum);
    const todayPoints = todayCheckIns.reduce((acc, cur) => acc + (Number(cur.points) || 1), 0);
    const todayCompletedHabitIds = todayCheckIns.map(d => String(d.habit_id || d.habitId));
    const uniqueDays = new Set(list.map(d => Number(d.day)));
    const totalMonthPoints = list.reduce((acc, cur) => acc + (Number(cur.points) || 1), 0);

    return {
      todayPoints,
      todayCompletedCount: todayCheckIns.length,
      todayCompletedHabitIds,
      todayCheckIns,
      totalMonthPoints,
      completedDaysCount: uniqueDays.size,
      checkInsCount: list.length,
      isTodayActive: todayCheckIns.length > 0,
      isOfflineCache: isCached,
      lastUpdated: new Date().toISOString(),
    };
  };

  // If Supabase is configured and not guest, fetch live
  if (isSupabaseConfigured() && !isGuestUser(partnerUserId)) {
    try {
      const { data, error } = await supabase
        .from('habit_check_ins')
        .select('habit_id, habit_name, points, day, completed_on, canonical_key')
        .eq('user_id', partnerUserId)
        .eq('month_key', monthKey);

      if (!error && Array.isArray(data)) {
        const metrics = processCheckIns(data, false);
        try {
          localStorage.setItem(cacheKey, JSON.stringify(metrics));
        } catch (_) {}
        return metrics;
      }
    } catch (e) {
      console.warn('[PartnerPairing] loadPartnerLiveMetrics online fetch warning:', e);
    }
  }

  // Fallback: Read from local cache if online fetch failed or offline
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      return { ...parsed, isOfflineCache: true };
    }
  } catch (_) {}

  // If local pair simulation (e.g. Ashish & Jyoti on local test mode)
  try {
    const partnerStateKey = `habuilt_state_${partnerUserId}_${monthKey}`;
    const rawLocal = localStorage.getItem(partnerStateKey);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      const habits = parsed.habits || [];
      const syntheticCheckIns = [];
      habits.forEach(h => {
        const cds = Array.isArray(h.completed_days) ? h.completed_days.map(Number) : [];
        cds.forEach(day => {
          syntheticCheckIns.push({
            habit_id: h.id,
            habit_name: h.name,
            points: h.points || 1,
            day,
          });
        });
      });
      return processCheckIns(syntheticCheckIns, true);
    }
  } catch (_) {}

  return {
    todayPoints: 0,
    todayCompletedCount: 0,
    todayCompletedHabitIds: [],
    todayCheckIns: [],
    totalMonthPoints: 0,
    completedDaysCount: 0,
    checkInsCount: 0,
    isTodayActive: false,
    isOfflineCache: false,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Dynamically computes couple shared anchors and calculates live alignment %
 */
export function computeSharedAnchorsStatus(userHabits = [], partnerMetrics = null, isAshish = false, isJyoti = false, currentDay = 1) {
  const curDay = Number(currentDay) || 1;
  const partnerCompletedIds = new Set(partnerMetrics?.todayCompletedHabitIds || []);

  const isHabitCompletedByUser = (habitIds) => {
    const ids = Array.isArray(habitIds) ? habitIds : [habitIds];
    return (userHabits || []).some(h => {
      if (ids.includes(String(h.id))) {
        const cds = Array.isArray(h.completed_days) ? h.completed_days.map(Number) : [];
        return cds.includes(curDay);
      }
      return false;
    });
  };

  const isHabitCompletedByPartner = (habitIds) => {
    const ids = Array.isArray(habitIds) ? habitIds : [habitIds];
    return ids.some(id => partnerCompletedIds.has(String(id)));
  };

  // Flagship couple anchor definitions with exact reciprocal habit ID mappings
  let rawAnchors = [];

  if (isAshish || isJyoti) {
    const ashishUser = isAshish;
    rawAnchors = [
      {
        id: 'anchor-lunch',
        time: '13:30 - 14:15',
        title: 'Shared Wholesome Lunch',
        subtitle: 'Warm nourishing food, zero screens, active listening',
        badge: 'Nutrition',
        userHabitIds: ashishUser ? ['a-29'] : ['j-6'],
        partnerHabitIds: ashishUser ? ['j-6'] : ['a-29'],
      },
      {
        id: 'anchor-stroller',
        time: '18:35 - 19:15',
        title: 'Shaarvi Stroller Park Walk',
        subtitle: 'Outdoor metabolic walk, fresh air, baby bonding',
        badge: 'Family',
        userHabitIds: ashishUser ? ['a-20', 'at-17', 'af-21'] : ['j-18'],
        partnerHabitIds: ashishUser ? ['j-18'] : ['a-20', 'at-17', 'af-21'],
      },
      {
        id: 'anchor-dinner',
        time: '19:25 - 20:15',
        title: 'Family Dinner Preparation',
        subtitle: 'Cooking together, table setup & peaceful evening meal',
        badge: 'Household',
        userHabitIds: ashishUser ? ['a-21', 'at-18', 'af-23'] : ['j-19'],
        partnerHabitIds: ashishUser ? ['j-19'] : ['a-21', 'at-18', 'af-23'],
      },
      {
        id: 'anchor-diya',
        time: '20:35 - 20:50',
        title: 'Evening Diya & Gratitude',
        subtitle: 'Lighting the lamp, quiet reflection & daily thanks',
        badge: 'Spiritual',
        userHabitIds: ashishUser ? ['a-76'] : ['j-21'],
        partnerHabitIds: ashishUser ? ['j-21'] : ['a-76'],
      },
    ];
  } else {
    // Universal dynamic matching for generic paired warriors:
    // Match habits with '★', 'shared', or matching titles
    const candidateHabits = (userHabits || []).filter(h => {
      const n = (h.name || '').toLowerCase();
      return n.includes('★') || n.includes('shared') || n.includes('walk') || n.includes('lunch') || n.includes('dinner');
    }).slice(0, 4);

    if (candidateHabits.length > 0) {
      rawAnchors = candidateHabits.map((h, idx) => ({
        id: `custom-anchor-${h.id}`,
        time: 'Daily Shared',
        title: h.name,
        subtitle: h.hint || 'Synchronized co-warrior commitment',
        badge: 'Shared Goal',
        userHabitIds: [String(h.id)],
        partnerHabitIds: [String(h.id)],
      }));
    } else {
      rawAnchors = [
        {
          id: 'anchor-generic-focus',
          time: 'Morning Focus',
          title: 'Daily Primary Anchor',
          subtitle: 'Synchronized morning execution and focus block',
          badge: 'Focus',
          userHabitIds: [(userHabits[0]?.id || '1')],
          partnerHabitIds: [(userHabits[0]?.id || '1')],
        }
      ];
    }
  }

  const computedAnchors = rawAnchors.map(anchor => {
    const completedByUser = isHabitCompletedByUser(anchor.userHabitIds);
    const completedByPartner = isHabitCompletedByPartner(anchor.partnerHabitIds);
    const completedTogether = completedByUser && completedByPartner;

    return {
      ...anchor,
      completedByUser,
      completedByPartner,
      completedTogether,
    };
  });

  const total = computedAnchors.length;
  const completedTogetherCount = computedAnchors.filter(a => a.completedTogether).length;
  const userCompletedCount = computedAnchors.filter(a => a.completedByUser).length;
  const partnerCompletedCount = computedAnchors.filter(a => a.completedByPartner).length;

  const alignmentPercentage = total > 0 ? Math.round((completedTogetherCount / total) * 100) : 0;

  return {
    anchors: computedAnchors,
    totalAnchors: total,
    completedTogetherCount,
    userCompletedCount,
    partnerCompletedCount,
    alignmentPercentage,
  };
}
