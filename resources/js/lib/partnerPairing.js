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
 * Loads partner's live progress metrics from habit_check_ins.
 */
export async function loadPartnerLiveMetrics(partnerUserId, monthKey) {
  if (!isSupabaseConfigured() || !partnerUserId) return null;

  try {
    const { data, error } = await supabase
      .from('habit_check_ins')
      .select('points, day, completed_on')
      .eq('user_id', partnerUserId)
      .eq('month_key', monthKey);

    if (error || !data) return null;

    const totalPoints = data.reduce((acc, cur) => acc + (Number(cur.points) || 1), 0);
    const uniqueDays = new Set(data.map(d => Number(d.day)));
    const today = new Date().getDate();
    const isTodayActive = uniqueDays.has(today);

    return {
      totalPoints,
      completedDaysCount: uniqueDays.size,
      checkInsCount: data.length,
      isTodayActive
    };
  } catch (e) {
    console.warn('[PartnerPairing] loadPartnerLiveMetrics note:', e);
    return null;
  }
}
