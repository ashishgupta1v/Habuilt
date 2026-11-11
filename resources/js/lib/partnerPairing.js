import { callLocalApi } from '@/lib/supabase';
import { partnerAcceptPayload, partnerConnectionFromAccept } from '@/lib/followUpGates';

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
  if (isGuestUser(currentUserId)) {
    throw new Error('An account is required.');
  }

  const accepted = await callLocalApi(
    '/api/partner-connections/accept',
    'POST',
    partnerAcceptPayload(cleanCode, partnerAlias || ''),
    { returnError: true },
  );
  const decision = partnerConnectionFromAccept({ isGuest: false, response: accepted });
  if (!decision.connected) {
    throw new Error(decision.message);
  }

  localStorage.setItem(`${LOCAL_PAIR_PREFIX}${currentUserId}`, JSON.stringify(decision.connection));
  return decision.connection;
}

/**
 * Retrieve active partner connection status
 */
export async function getPartnerConnection(userId) {
  if (!userId || isGuestUser(userId)) return null;

  const cached = localStorage.getItem(`${LOCAL_PAIR_PREFIX}${userId}`);
  let localConnection = null;
  if (cached) {
    try {
      localConnection = JSON.parse(cached);
    } catch (_) {}
  }
  const confirmedLocal = localConnection?.confirmed === true && localConnection?.status === 'connected'
    ? localConnection
    : null;

  try {
    const records = await callLocalApi(`/api/partner-connections?user_id=${encodeURIComponent(userId)}`, 'GET', null, { returnError: true });
    if (records && (records.offline || records.error)) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('habuilt:read-failed'));
      }
      return confirmedLocal;
    }
    if (Array.isArray(records)) {
      const connected = records.find((row) => row.status === 'connected' || row.status === 'accepted');
      if (connected) {
        const isHost = connected.user_id === userId;
        const connection = {
          user_id: userId,
          partner_user_id: isHost ? connected.partner_user_id : connected.user_id,
          invite_code: connected.invite_code,
          status: 'connected',
          alias: connected.alias || 'Partner',
          updated_at: connected.updated_at,
          confirmed: true,
        };
        localStorage.setItem(`${LOCAL_PAIR_PREFIX}${userId}`, JSON.stringify(connection));
        return connection;
      }
      localStorage.removeItem(`${LOCAL_PAIR_PREFIX}${userId}`);
      return null;
    }
  } catch (_) {}

  return confirmedLocal;
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
export function subscribeToPartnerConnection() {
  return { unsubscribe() {} };
}

/**
 * Today's kept / not-yet status for an accepted partner.
 * The response has no habit rows, and this client does not cache or rebuild them.
 */
export async function loadPartnerLiveMetrics(partnerUserId) {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (!partnerUserId || isGuestUser(partnerUserId)) {
    return { ok: false, date, status: null };
  }

  try {
    const data = await callLocalApi(
      `/api/partner-metrics?partner_user_id=${encodeURIComponent(partnerUserId)}&date=${encodeURIComponent(date)}`,
      'GET',
      null,
      { returnError: true },
    );
    if (data && !data.error && !data.offline && (data.status === 'kept' || data.status === 'not_yet')) {
      return { ok: true, date: data.date || date, status: data.status };
    }
  } catch (e) {
    console.warn('[PartnerPairing] loadPartnerLiveMetrics online fetch warning:', e);
  }

  return { ok: false, date, status: null };
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
