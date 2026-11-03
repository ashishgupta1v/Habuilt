import { supabase, isSupabaseConfigured, callLocalApi } from '@/lib/supabase';

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

  if (!isGuestUser(userId)) {
    try {
      const records = await callLocalApi('/api/partner-connections');
      if (Array.isArray(records)) {
        const own = records.find((row) => row.user_id === userId && row.invite_code && !String(row.invite_code).startsWith('PAIRED-'));
        if (own?.invite_code) {
          code = own.invite_code;
        } else {
          for (let attempt = 0; attempt < 3; attempt += 1) {
            const created = await callLocalApi('/api/partner-connections', 'POST', {
              invite_code: code,
              status: 'pending',
            }, { returnError: true });
            if (created?.success) break;
            code = generateRandomCode();
          }
        }
      }
    } catch (e) {
      console.warn('[PartnerPairing] Invite lookup error, using generated code:', e);
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

  let partnerUserId = null;

  if (!isGuestUser(currentUserId)) {
    const accepted = await callLocalApi('/api/partner-connections/accept', 'POST', {
      invite_code: cleanCode,
      alias: partnerAlias || '',
    }, { returnError: true });

    if (accepted?.success && accepted.connection) {
      localStorage.setItem(`${LOCAL_PAIR_PREFIX}${currentUserId}`, JSON.stringify(accepted.connection));
      return accepted.connection;
    }

    if (accepted?.error) {
      throw new Error(accepted.error);
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

  // Local Hostinger KVM 2 API check (Primary)
  if (!isGuestUser(userId)) {
    try {
      const records = await callLocalApi(`/api/partner-connections?user_id=${encodeURIComponent(userId)}`);
      if (Array.isArray(records) && records.length > 0) {
        const connected = records.find(r => r.status === 'connected');
        if (connected) {
          const isHost = connected.user_id === userId;
          const connection = {
            user_id: userId,
            partner_user_id: isHost ? connected.partner_user_id : connected.user_id,
            invite_code: connected.invite_code,
            status: 'connected',
            alias: connected.alias || 'Partner',
            updated_at: connected.updated_at
          };
          localStorage.setItem(`${LOCAL_PAIR_PREFIX}${userId}`, JSON.stringify(connection));
          return connection;
        }
      }
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

  if (!isGuestUser(userId)) {
    try {
      await callLocalApi('/api/partner-connections/revoke', 'POST', {});
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
 * Today's kept / not-yet status for an accepted partner.
 * The response has no habit rows, and this client does not cache or rebuild them.
 */
export async function loadPartnerLiveMetrics(partnerUserId) {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const empty = { date, status: 'not_yet' };
  if (!partnerUserId || isGuestUser(partnerUserId)) return empty;

  try {
    const data = await callLocalApi(
      `/api/partner-metrics?partner_user_id=${encodeURIComponent(partnerUserId)}&date=${encodeURIComponent(date)}`,
      'GET',
      null,
      { returnError: true },
    );
    if (data && (data.status === 'kept' || data.status === 'not_yet')) {
      return { date: data.date || date, status: data.status };
    }
  } catch (e) {
    console.warn('[PartnerPairing] loadPartnerLiveMetrics online fetch warning:', e);
  }

  return empty;
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

  const candidateHabits = (userHabits || []).filter(h => {
    const n = (h.name || '').toLowerCase();
    return n.includes('shared') || n.includes('walk') || n.includes('lunch') || n.includes('dinner') || n.includes('family');
  }).slice(0, 4);

  let rawAnchors = [];
  if (candidateHabits.length > 0) {
    rawAnchors = candidateHabits.map((h) => ({
      id: `custom-anchor-${h.id}`,
      time: 'Daily Shared',
      title: h.name,
      subtitle: h.hint || 'Shared commitment with your partner',
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
