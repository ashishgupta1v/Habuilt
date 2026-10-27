/**
 * ZoetiCoach Habit Cloud Integration Bridge
 * Connects Habuilt / ZoetiHabit client events directly to ZoetiCoach WS18 Habit Cloud API.
 * Endpoints:
 *  - POST /api/v3/habit-cloud/events
 *  - GET  /api/v3/habit-cloud/adherence/{participantId}
 */

const DEFAULT_ZOETICOACH_API_URL = 'https://zoeticoach.com';
const DEFAULT_ZOETICOACH_API_KEY = '1|kgJJYPqqpt5XXolV1vJ2enUgrAPDgrpNbOVTu8W011c87abe';
const OFFLINE_QUEUE_KEY = 'habuilt_zoeticoach_offline_queue';
const MAX_QUEUE_SIZE = 250;
let isFlushingQueue = false;

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
 * ── Offline Queue Infrastructure ──
 */
export const getZoetiCoachQueue = () => {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('[ZoetiCoach Bridge] Error reading offline queue:', e);
    return [];
  }
};

const saveZoetiCoachQueue = (queue) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(0, MAX_QUEUE_SIZE)));
  } catch (e) {
    console.warn('[ZoetiCoach Bridge] Error saving offline queue:', e);
  }
};

export const getZoetiCoachQueueCount = () => {
  return getZoetiCoachQueue().length;
};

export const clearZoetiCoachQueue = () => {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }
};

export const enqueueZoetiCoachEvent = (payload) => {
  const queue = getZoetiCoachQueue();
  const queueItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    payload,
    queuedAt: new Date().toISOString(),
    attempts: 0,
    lastAttempt: null,
    error: null,
  };

  queue.push(queueItem);
  saveZoetiCoachQueue(queue);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('zoeticoach:event-queued', {
        detail: { item: queueItem, queueCount: queue.length },
      })
    );
  }

  return queueItem;
};

/**
 * Flushes all pending queued events to ZoetiCoach Habit Cloud API.
 * Tolerant of transient network glitches with FIFO ordering.
 */
export const flushZoetiCoachQueue = async () => {
  if (isFlushingQueue) return { flushed: 0, pending: getZoetiCoachQueueCount() };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { flushed: 0, pending: getZoetiCoachQueueCount() };
  }

  const { url, token } = getZoetiCoachConfig();
  if (!url || !token) return { flushed: 0, pending: 0 };

  const queue = getZoetiCoachQueue();
  if (queue.length === 0) return { flushed: 0, pending: 0 };

  isFlushingQueue = true;
  let flushedCount = 0;
  const endpoint = `${url}/api/v3/habit-cloud/events`;

  try {
    const remainingQueue = [...queue];

    for (let i = 0; i < remainingQueue.length; i++) {
      const item = remainingQueue[i];

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(item.payload),
        });

        if (response.ok) {
          flushedCount++;
          remainingQueue.splice(i, 1);
          i--;
          saveZoetiCoachQueue(remainingQueue);
        } else {
          // If 4xx client validation error (bad habit payload), discard to avoid poison-pill loops
          if (response.status >= 400 && response.status < 500) {
            console.debug('[ZoetiCoach Bridge] Discarding invalid queued event:', response.status, item.id);
            remainingQueue.splice(i, 1);
            i--;
            saveZoetiCoachQueue(remainingQueue);
          } else {
            // 5xx or rate limit: increment attempts and retry on next sweep
            item.attempts = (item.attempts || 0) + 1;
            item.lastAttempt = Date.now();
            saveZoetiCoachQueue(remainingQueue);
            break;
          }
        }
      } catch (networkErr) {
        // Network dropped mid-drain: stop and wait for reconnection
        item.attempts = (item.attempts || 0) + 1;
        item.lastAttempt = Date.now();
        item.error = networkErr?.message || 'Network error';
        saveZoetiCoachQueue(remainingQueue);
        break;
      }
    }

    if (flushedCount > 0 && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('zoeticoach:queue-flushed', {
          detail: { flushedCount, pendingCount: remainingQueue.length },
        })
      );
      window.dispatchEvent(
        new CustomEvent('zoeticoach:event-synced', {
          detail: { flushedCount, timestamp: Date.now() },
        })
      );
    }

    return { flushed: flushedCount, pending: remainingQueue.length };
  } finally {
    isFlushingQueue = false;
  }
};

// Auto-register browser online recovery and periodic sweep
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.debug('[ZoetiCoach Bridge] Network online: triggering auto-flush');
    flushZoetiCoachQueue().catch(() => {});
  });

  // Background drain check every 60s
  setInterval(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine && getZoetiCoachQueueCount() > 0) {
      flushZoetiCoachQueue().catch(() => {});
    }
  }, 60000);
}

/**
 * Dispatches a habit completion event to ZoetiCoach Habit Cloud.
 * Non-blocking, failsafe, and offline-tolerant with persistent queueing.
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

  // If browser reports offline, enqueue immediately without failing
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueZoetiCoachEvent(payload);
    console.debug('[ZoetiCoach Bridge] Offline: enqueued habit event for auto-flush:', payload.event_value);
    return { queued: true };
  }

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

      // If server returned 5xx or 429, enqueue for retry
      if (response.status >= 500 || response.status === 429) {
        enqueueZoetiCoachEvent(payload);
        return { queued: true };
      }
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

    // Opportunistically flush any backlog
    if (getZoetiCoachQueueCount() > 0) {
      flushZoetiCoachQueue().catch(() => {});
    }

    return true;
  } catch (err) {
    // Network failure / unreachable: enqueue into persistent queue
    console.debug('[ZoetiCoach Bridge] Network error during event dispatch, enqueuing:', err?.message || err);
    enqueueZoetiCoachEvent(payload);
    return { queued: true };
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
