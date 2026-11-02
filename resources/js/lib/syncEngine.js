/**
 * Habuilt offline mutation sync.
 *
 * Retries account mutations a small number of times with jittered backoff.
 * After the cap, the mutation moves to a dead-letter list and is not retried
 * until the person chooses retry. Guest ids never reach the API.
 */

import { recordBreadcrumb } from './telemetry';
import {
  isAttemptDue,
  isRetryableAccountId,
  mutationAccountId,
  publicSyncError,
  settleAttempt,
} from './syncQueuePolicy.js';

export const SYNC_QUEUE_KEY = 'habuilt_offline_mutation_queue';
export const LEGACY_QUEUE_KEY = 'habuilt_offline_queue';
export const DEAD_LETTER_KEY = 'habuilt_sync_dead_letters';
export const SYNC_HEARTBEAT_MS = 25000;

class SyncEngine {
  constructor() {
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.syncState = this.isOnline ? 'synced' : 'offline';
    this.isFlushing = false;
    this.lastSyncedAt = null;
    this.deadLetterMessage = '';
    this.retryTimer = null;
    this.mutationExecutors = {};

    this.init();
  }

  init() {
    if (typeof window === 'undefined') return;

    this.migrateLegacyQueue();

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncState = this.getQueue().length > 0 ? 'syncing' : (this.getDeadLetters().length > 0 ? 'error' : 'synced');
      this.broadcastState();
      recordBreadcrumb({ category: 'network', message: 'Device transitioned online', level: 'info' });
      this.flushQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.syncState = 'offline';
      this.broadcastState();
      recordBreadcrumb({ category: 'network', message: 'Device transitioned offline', level: 'warning' });
    });

    setInterval(() => {
      if (this.isOnline && this.getQueue().length > 0 && !this.isFlushing) {
        this.flushQueue();
      }
    }, SYNC_HEARTBEAT_MS);

    const pending = this.getQueue().length;
    const dead = this.getDeadLetters().length;
    if (!this.isOnline) {
      this.syncState = 'offline';
    } else if (dead > 0) {
      this.syncState = 'error';
      const latest = this.getDeadLetters()[dead - 1];
      this.deadLetterMessage = publicSyncError(latest?.lastError);
    } else if (pending > 0) {
      this.syncState = 'syncing';
      this.flushQueue();
    } else {
      this.syncState = 'synced';
    }
    this.broadcastState();
  }

  registerExecutor(type, executorFn) {
    this.mutationExecutors[type] = executorFn;
  }

  readList(key) {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  getQueue() {
    return this.readList(SYNC_QUEUE_KEY);
  }

  getDeadLetters() {
    return this.readList(DEAD_LETTER_KEY);
  }

  saveQueue(queue) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      localStorage.setItem(LEGACY_QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('[SyncEngine] Storage save error:', e);
    }
    this.broadcastState();
  }

  saveDeadLetters(items) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(DEAD_LETTER_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('[SyncEngine] Dead-letter save error:', e);
    }
    if (items.length > 0) {
      this.deadLetterMessage = publicSyncError(items[items.length - 1]?.lastError);
      if (this.isOnline) this.syncState = 'error';
    } else if (this.getQueue().length === 0) {
      this.deadLetterMessage = '';
      this.syncState = this.isOnline ? 'synced' : 'offline';
    }
    this.broadcastState();
  }

  migrateLegacyQueue() {
    if (typeof window === 'undefined') return;
    try {
      const legacyRaw = localStorage.getItem(LEGACY_QUEUE_KEY);
      const modernRaw = localStorage.getItem(SYNC_QUEUE_KEY);

      if (legacyRaw && !modernRaw) {
        const legacy = JSON.parse(legacyRaw);
        if (Array.isArray(legacy) && legacy.length > 0) {
          const modern = legacy.map((item) => ({
            id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            attempts: 0,
            createdAt: item.queuedAt || new Date().toISOString(),
            ...item,
          }));
          this.saveQueue(modern);
        }
      }
    } catch {}
  }

  enqueue(type, payload) {
    if (!isRetryableAccountId(mutationAccountId(payload))) {
      return;
    }

    const queue = this.getQueue();

    const dedupKey = (p) => `${p.userId || ''}_${p.habitId || ''}_${p.monthKey || ''}_${p.day || ''}`;
    const newKey = dedupKey(payload);

    if (newKey !== '___') {
      const existingIdx = queue.findIndex((q) => dedupKey(q.payload || {}) === newKey);
      if (existingIdx !== -1) {
        const prev = queue[existingIdx];
        if ((prev.type === 'INSERT' && type === 'DELETE') || (prev.type === 'DELETE' && type === 'INSERT')) {
          queue.splice(existingIdx, 1);
          this.saveQueue(queue);
          recordBreadcrumb({ category: 'sync', message: `Cancelled conflicting offline mutation for ${newKey}`, level: 'info' });
          return;
        }
      }
    }

    const item = {
      id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      payload,
      attempts: 0,
      createdAt: new Date().toISOString(),
      lastAttemptAt: null,
      nextAttemptAt: null,
      lastError: null,
    };

    queue.push(item);
    this.saveQueue(queue);

    recordBreadcrumb({
      category: 'sync',
      message: `Enqueued offline mutation: ${type}`,
      data: { id: item.id, type, habitId: payload.habitId },
    });

    if (this.isOnline) {
      this.syncState = 'syncing';
      this.broadcastState();
      this.flushQueue();
    } else {
      this.syncState = 'offline';
      this.broadcastState();
    }
  }

  async flushQueue() {
    if (this.isFlushing) return 0;
    if (!this.isOnline) {
      this.syncState = 'offline';
      this.broadcastState();
      return 0;
    }

    const queue = this.getQueue();
    if (queue.length === 0) {
      this.syncState = this.getDeadLetters().length > 0 ? 'error' : 'synced';
      this.broadcastState();
      return 0;
    }

    this.isFlushing = true;
    this.syncState = 'syncing';
    this.broadcastState();

    const remaining = [];
    const deadLetters = this.getDeadLetters();
    let flushedCount = 0;
    let attempted = 0;
    const now = Date.now();

    for (const item of queue) {
      if (!isRetryableAccountId(mutationAccountId(item?.payload))) {
        continue;
      }

      if (!isAttemptDue(item, now)) {
        remaining.push(item);
        continue;
      }

      const executor = this.mutationExecutors[item.type];
      if (!executor) {
        remaining.push(item);
        continue;
      }

      attempted += 1;
      let outcome;
      try {
        const success = await executor(item.payload);
        outcome = success ? { ok: true } : { ok: false, error: 'Executor returned false' };
      } catch (err) {
        outcome = { ok: false, error: err?.message || String(err) };
      }

      const settled = settleAttempt(item, now, outcome);
      if (settled.disposition === 'done' || settled.disposition === 'drop') {
        if (settled.disposition === 'done') flushedCount += 1;
        continue;
      }
      if (settled.disposition === 'dead') {
        deadLetters.push(settled.item);
        continue;
      }
      remaining.push(settled.item);
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
        localStorage.setItem(LEGACY_QUEUE_KEY, JSON.stringify(remaining));
        localStorage.setItem(DEAD_LETTER_KEY, JSON.stringify(deadLetters));
      } catch (e) {
        console.warn('[SyncEngine] Storage save error:', e);
      }
    }

    this.isFlushing = false;
    this.lastSyncedAt = new Date().toISOString();

    if (deadLetters.length > 0) {
      this.deadLetterMessage = publicSyncError(deadLetters[deadLetters.length - 1]?.lastError);
      this.syncState = 'error';
    } else if (remaining.length === 0) {
      this.deadLetterMessage = '';
      this.syncState = 'synced';
    } else if (attempted > 0) {
      this.syncState = 'error';
    } else {
      this.syncState = 'syncing';
    }

    this.broadcastState();

    if (flushedCount > 0) {
      recordBreadcrumb({
        category: 'sync',
        message: `Successfully flushed ${flushedCount} offline mutations to cloud`,
        level: 'info',
      });
    }
    if (deadLetters.length > 0) {
      recordBreadcrumb({
        category: 'sync',
        message: `${deadLetters.length} offline mutation(s) moved to the dead-letter list`,
        level: 'warning',
      });
    }

    return flushedCount;
  }

  retryDeadLetters() {
    const dead = this.getDeadLetters();
    if (dead.length === 0) {
      return this.flushQueue();
    }
    const queue = this.getQueue();
    for (const item of dead) {
      queue.push({
        ...item,
        attempts: 0,
        lastError: null,
        lastAttemptAt: null,
        nextAttemptAt: null,
        deadLetteredAt: null,
      });
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(DEAD_LETTER_KEY, JSON.stringify([]));
        localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
        localStorage.setItem(LEGACY_QUEUE_KEY, JSON.stringify(queue));
      } catch (e) {
        console.warn('[SyncEngine] Dead-letter retry save error:', e);
      }
    }
    this.deadLetterMessage = '';
    this.syncState = this.isOnline ? 'syncing' : 'offline';
    this.broadcastState();
    return this.flushQueue();
  }

  discardDeadLetters() {
    this.deadLetterMessage = '';
    this.saveDeadLetters([]);
  }

  broadcastState() {
    if (typeof window === 'undefined') return;
    const deadLetters = this.getDeadLetters();
    const detail = {
      isOnline: this.isOnline,
      syncState: this.syncState,
      pendingCount: this.getQueue().length,
      deadLetterCount: deadLetters.length,
      deadLetterMessage: deadLetters.length > 0 ? (this.deadLetterMessage || publicSyncError(deadLetters[deadLetters.length - 1]?.lastError)) : '',
      lastSyncedAt: this.lastSyncedAt,
    };
    window.dispatchEvent(new CustomEvent('habuilt:sync-status', { detail }));
  }

  getState() {
    const deadLetters = this.getDeadLetters();
    return {
      isOnline: this.isOnline,
      syncState: this.syncState,
      pendingCount: this.getQueue().length,
      deadLetterCount: deadLetters.length,
      deadLetterMessage: deadLetters.length > 0 ? (this.deadLetterMessage || publicSyncError(deadLetters[deadLetters.length - 1]?.lastError)) : '',
      lastSyncedAt: this.lastSyncedAt,
    };
  }

  clearQueue() {
    this.saveQueue([]);
  }
}

export const syncEngine = new SyncEngine();
export const enqueueOfflineMutation = (type, payload) => syncEngine.enqueue(type, payload);
export const flushOfflineMutationQueue = () => syncEngine.flushQueue();
export const retryDeadLetterMutations = () => syncEngine.retryDeadLetters();
export const discardDeadLetterMutations = () => syncEngine.discardDeadLetters();
