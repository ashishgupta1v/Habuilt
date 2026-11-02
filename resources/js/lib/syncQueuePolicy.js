/**
 * Pure rules for the offline mutation queue.
 * Guest and other non-account ids are never retried against the API.
 * Failed account mutations back off, then move to the dead-letter list.
 */

export const MAX_SYNC_ATTEMPTS = 5;
export const BASE_BACKOFF_MS = 25000;
export const MAX_BACKOFF_MS = 10 * 60 * 1000;

export function isRetryableAccountId(userId) {
  if (typeof userId !== 'string') return false;
  const value = userId.trim().toLowerCase();
  if (value === '' || value === 'guest' || value.startsWith('guest')) return false;
  if (value === 'anonymous' || value === 'null' || value === 'undefined') return false;
  return true;
}

export function mutationAccountId(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const raw = payload.userId ?? payload.user_id ?? '';
  return typeof raw === 'string' ? raw : String(raw);
}

export function backoffDelayMs(attempts, random = Math.random) {
  const exponent = Math.max(0, Number(attempts) - 1);
  const base = Math.min(BASE_BACKOFF_MS * (2 ** exponent), MAX_BACKOFF_MS);
  const unit = typeof random === 'function' ? random() : Number(random);
  const jitter = base * 0.25 * (Number.isFinite(unit) ? Math.min(1, Math.max(0, unit)) : 0);
  return Math.round(base + jitter);
}

export function isAttemptDue(item, nowMs) {
  if (!item?.nextAttemptAt) return true;
  const due = Date.parse(item.nextAttemptAt);
  if (Number.isNaN(due)) return true;
  return nowMs >= due;
}

export function publicSyncError(message) {
  const text = String(message || 'The change could not be saved.')
    .replace(/bearer\s+\S+/gi, 'bearer [redacted]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted]');
  return text.slice(0, 180);
}

/**
 * @returns {{disposition: 'drop'|'done'|'retry'|'dead', item?: object}}
 */
export function settleAttempt(item, nowMs, outcome, random = Math.random) {
  if (!isRetryableAccountId(mutationAccountId(item?.payload))) {
    return { disposition: 'drop' };
  }

  const attempts = (Number(item?.attempts) || 0) + 1;
  const errorText = outcome?.ok ? null : publicSyncError(outcome?.error || 'The change could not be saved.');
  const next = {
    ...item,
    attempts,
    lastAttemptAt: new Date(nowMs).toISOString(),
    lastError: errorText,
  };

  if (outcome?.ok) {
    return { disposition: 'done', item: next };
  }

  if (attempts >= MAX_SYNC_ATTEMPTS) {
    return {
      disposition: 'dead',
      item: {
        ...next,
        deadLetteredAt: new Date(nowMs).toISOString(),
      },
    };
  }

  return {
    disposition: 'retry',
    item: {
      ...next,
      nextAttemptAt: new Date(nowMs + backoffDelayMs(attempts, random)).toISOString(),
    },
  };
}
