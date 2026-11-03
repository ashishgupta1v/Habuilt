/**
 * ZoetiCoach habit events go through the same-origin Laravel proxy.
 * The ZoetiCoach bearer token stays on the server. This module never reads
 * or sends that credential.
 */

const OFFLINE_QUEUE_KEY = 'habuilt_zoeticoach_offline_queue';
const MAX_QUEUE_SIZE = 250;
const EVENTS_PATH = '/api/zoeticoach/events';
const ADHERENCE_PATH = '/api/zoeticoach/adherence';
let isFlushingQueue = false;

export const getZoetiCoachConfig = () => {
  return { url: '', token: '' };
};

export const isZoetiCoachConnected = () => {
  return typeof window !== 'undefined';
};

const sessionAuthorization = async () => {
  try {
    const { getMemoryAccessToken, isGuestMode } = await import('./browserSession.js');
    if (isGuestMode()) return '';
    const token = getMemoryAccessToken();
    if (typeof token === 'string' && token.trim() !== '') {
      return `Bearer ${token.trim()}`;
    }
  } catch {
    // Session lookup is best-effort. Guest mode has no server session.
  }

  return '';
};

const postProxy = async (path, method, body) => {
  const authorization = await sessionAuthorization();
  if (!authorization) {
    return { ok: false, status: 401, skipped: false, unauthenticated: true, data: null };
  }

  const response = await fetch(path, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authorization,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  return {
    ok: response.ok,
    status: response.status,
    skipped: Boolean(data?.skipped || data?.disabled),
    unauthenticated: response.status === 401,
    data,
  };
};

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
 * Flushes queued habit events through the same-origin proxy.
 * The proxy attaches the server credential, or reports that ZoetiCoach is disabled.
 */
export const flushZoetiCoachQueue = async () => {
  if (isFlushingQueue) return { flushed: 0, pending: getZoetiCoachQueueCount() };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { flushed: 0, pending: getZoetiCoachQueueCount() };
  }

  const queue = getZoetiCoachQueue();
  if (queue.length === 0) return { flushed: 0, pending: 0 };

  isFlushingQueue = true;
  let flushedCount = 0;

  try {
    const remainingQueue = [...queue];

    for (let i = 0; i < remainingQueue.length; i++) {
      const item = remainingQueue[i];

      try {
        const response = await postProxy(EVENTS_PATH, 'POST', item.payload);

        if (response.unauthenticated) {
          break;
        }

        if (response.ok && response.skipped) {
          break;
        }

        if (response.ok) {
          flushedCount++;
          remainingQueue.splice(i, 1);
          i--;
          saveZoetiCoachQueue(remainingQueue);
        } else if (response.status >= 400 && response.status < 500) {
          console.debug('[ZoetiCoach Bridge] Discarding invalid queued event:', response.status, item.id);
          remainingQueue.splice(i, 1);
          i--;
          saveZoetiCoachQueue(remainingQueue);
        } else {
          item.attempts = (item.attempts || 0) + 1;
          item.lastAttempt = Date.now();
          saveZoetiCoachQueue(remainingQueue);
          break;
        }
      } catch (networkErr) {
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

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.debug('[ZoetiCoach Bridge] Network online: triggering auto-flush');
    flushZoetiCoachQueue().catch(() => {});
  });

  setInterval(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine && getZoetiCoachQueueCount() > 0) {
      flushZoetiCoachQueue().catch(() => {});
    }
  }, 60000);
}

const buildPayload = ({
  eventType = 'habit_completed',
  eventValue = '',
  habitId = '',
  points = 1,
  unit = 'session',
  occurredAt = null,
  source = 'web',
  metadata = {},
}) => ({
  event_type: eventType,
  event_value: eventValue || habitId || 'Habit Completed',
  habit_id: String(habitId),
  unit,
  occurred_at: occurredAt || new Date().toISOString(),
  points: Number(points) || 0,
  source,
  metadata,
});

/**
 * Dispatches a habit event through the authenticated same-origin proxy.
 * The participant id is taken from the JWT on the server.
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
  const participantId = String(externalParticipantId || '');
  if (!participantId || participantId === 'guest' || participantId.startsWith('guest')) {
    return false;
  }

  const payload = buildPayload({
    eventType,
    eventValue,
    habitId,
    points,
    unit,
    occurredAt,
    source,
    metadata,
  });

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    enqueueZoetiCoachEvent(payload);
    console.debug('[ZoetiCoach Bridge] Offline: enqueued habit event for auto-flush:', payload.event_value);
    return { queued: true };
  }

  try {
    const response = await postProxy(EVENTS_PATH, 'POST', payload);

    if (response.unauthenticated) {
      enqueueZoetiCoachEvent(payload);
      return { queued: true };
    }

    if (!response.ok) {
      if (response.status >= 500 || response.status === 429) {
        enqueueZoetiCoachEvent(payload);
        return { queued: true };
      }
      return false;
    }

    if (response.skipped) {
      return false;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('zoeticoach:event-synced', {
          detail: { payload, success: true, timestamp: Date.now() },
        })
      );
    }

    if (getZoetiCoachQueueCount() > 0) {
      flushZoetiCoachQueue().catch(() => {});
    }

    return true;
  } catch (err) {
    console.debug('[ZoetiCoach Bridge] Network error during event dispatch, enqueuing:', err?.message || err);
    enqueueZoetiCoachEvent(payload);
    return { queued: true };
  }
};

/**
 * Fetches adherence for the signed-in user. The server ignores any other participant id.
 */
export const fetchZoetiCoachAdherence = async (_externalParticipantId = '', days = 30) => {
  const boundedDays = Math.max(1, Math.min(365, Number(days) || 30));

  try {
    const response = await postProxy(`${ADHERENCE_PATH}?days=${boundedDays}`, 'GET');
    if (!response.ok || response.skipped) return null;
    return response.data?.data || null;
  } catch (err) {
    console.debug('[ZoetiCoach Bridge] Adherence fetch note:', err?.message || err);
    return null;
  }
};
