/**
 * ZoetiCoach Habit Cloud Integration Bridge
 * Connects Habuilt / ZoetiHabit client events directly to ZoetiCoach WS18 Habit Cloud API.
 * Endpoints:
 *  - POST /api/v3/habit-cloud/events
 *  - GET  /api/v3/habit-cloud/adherence/{participantId}
 */

const DEFAULT_ZOETICOACH_API_URL = 'https://zoeticoach.com';
const DEFAULT_ZOETICOACH_API_KEY = '1|kgJJYPqqpt5XXolV1vJ2enUgrAPDgrpNbOVTu8W011c87abe';

export const getZoetiCoachConfig = () => {
  const url =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ZOETICOACH_API_URL) ||
    (typeof window !== 'undefined' && window.ZOETICOACH_API_URL) ||
    DEFAULT_ZOETICOACH_API_URL;

  const token =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ZOETICOACH_API_KEY) ||
    (typeof window !== 'undefined' && window.ZOETICOACH_API_KEY) ||
    DEFAULT_ZOETICOACH_API_KEY;

  return { url: url.replace(/\/+$/, ''), token };
};

export const isZoetiCoachConnected = () => {
  const { url, token } = getZoetiCoachConfig();
  return Boolean(url && token);
};

/**
 * Dispatches a habit completion event to ZoetiCoach Habit Cloud.
 * Non-blocking, failsafe, and offline-tolerant.
 */
export const dispatchZoetiCoachEvent = async ({
  externalParticipantId,
  eventType = 'habit_completed',
  eventValue = '',
  habitId = '',
  points = 1,
  unit = 'session',
  occurredAt = null,
  source = 'web',
  metadata = {},
}) => {
  const { url, token } = getZoetiCoachConfig();

  // If ZoetiCoach integration credentials are not configured yet, silently pass
  if (!url || !token || !externalParticipantId) {
    return false;
  }

  // Map legacy client IDs to onboarded ZoetiCoach participant IDs
  const participantId = String(externalParticipantId).toLowerCase() === 'ashish'
    ? 'ashish'
    : String(externalParticipantId).toLowerCase() === 'jyoti'
      ? 'jyoti'
      : String(externalParticipantId);

  const endpoint = `${url}/api/v3/habit-cloud/events`;

  const payload = {
    external_participant_id: participantId,
    event_type: eventType,
    event_value: eventValue || habitId || 'Habit Completed',
    unit: unit,
    occurred_at: occurredAt || new Date().toISOString(),
    payload: {
      habit_id: String(habitId),
      points: Number(points) || 1,
      source: source,
      app: 'habuilt',
      ...metadata,
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.debug('[ZoetiCoach Bridge] Dispatch note:', response.status, errData);
      return false;
    }

    const data = await response.json().catch(() => ({}));
    console.debug('[ZoetiCoach Bridge] Event synced successfully:', data?.data?.event_id || 'OK');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('zoeticoach:event-synced', {
          detail: { payload, data, success: true, timestamp: Date.now() },
        })
      );
    }

    return true;
  } catch (err) {
    // Graceful offline tolerance
    console.debug('[ZoetiCoach Bridge] Network note during event dispatch:', err?.message || err);
    return false;
  }
};

/**
 * Fetches 30-day compliance scorecard, streak velocity, and milestones from ZoetiCoach.
 */
export const fetchZoetiCoachAdherence = async (externalParticipantId = 'ashish', days = 30) => {
  const { url, token } = getZoetiCoachConfig();
  if (!url || !token || !externalParticipantId) return null;

  const participantId = String(externalParticipantId).toLowerCase() === 'ashish'
    ? 'ashish'
    : String(externalParticipantId).toLowerCase() === 'jyoti'
      ? 'jyoti'
      : String(externalParticipantId);

  const endpoint = `${url}/api/v3/habit-cloud/adherence/${encodeURIComponent(participantId)}?days=${Math.max(1, Math.min(365, days))}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;
    const json = await response.json().catch(() => null);
    return json?.data || null;
  } catch (err) {
    console.debug('[ZoetiCoach Bridge] Adherence fetch note:', err?.message || err);
    return null;
  }
};
