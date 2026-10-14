/**
 * ZoetiCoach Habit Cloud Integration Bridge
 * Connects Habuilt / ZoetiHabit client events directly to ZoetiCoach WS18 Habit Cloud API.
 * Endpoint: /api/v3/habit-cloud/events
 */

const getZoetiCoachConfig = () => {
  const url =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ZOETICOACH_API_URL) ||
    (typeof window !== 'undefined' && window.ZOETICOACH_API_URL) ||
    '';

  const token =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ZOETICOACH_API_KEY) ||
    (typeof window !== 'undefined' && window.ZOETICOACH_API_KEY) ||
    '';

  return { url: url.replace(/\/+$/, ''), token };
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

  const endpoint = `${url}/api/v3/habit-cloud/events`;

  const payload = {
    external_participant_id: String(externalParticipantId),
    event_type: eventType,
    event_value: eventValue || habitId || 'Habit Completed',
    unit: unit,
    occurred_at: occurredAt || new Date().toISOString(),
    payload: {
      habit_id: String(habitId),
      points: Number(points) || 1,
      source: source,
      app: 'zoetihabit',
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
    console.debug('[ZoetiCoach Bridge] Event synced successfully:', data?.data?.id || 'OK');
    return true;
  } catch (err) {
    // Graceful offline tolerance
    console.debug('[ZoetiCoach Bridge] Network note during event dispatch:', err?.message || err);
    return false;
  }
};
