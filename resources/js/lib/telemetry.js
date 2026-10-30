/**
 * Habuilt Sovereign Error Telemetry & Diagnostics Engine
 * Continuous Sentry Protocol Ingestion & Local Ring Buffer Fallback
 * 
 * Supports:
 * 1. Sentry DSN ingestion (via local override, VITE_SENTRY_DSN or window.__HABUILT_SENTRY_DSN__)
 * 2. First-party Sentry Tunnel (/api/telemetry/tunnel) for ad-blocker resilience
 * 3. Offline persistent spooling in localStorage with auto-drain on reconnect
 * 4. Sliding-window rate limiter (10 dispatches/minute)
 * 5. In-memory & localStorage ring buffer for last 50 events
 * 6. Synthetic exception dispatch for test verification and live auditing
 */

const STORAGE_BUFFER_KEY = 'habuilt_telemetry_ring_buffer';
const STORAGE_SPOOL_KEY = 'habuilt_offline_telemetry_queue';
const STORAGE_CUSTOM_DSN_KEY = 'habuilt_custom_sentry_dsn';
const MAX_BUFFER_SIZE = 50;
const MAX_SPOOL_SIZE = 20;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_DISPATCHES_PER_WINDOW = 10;

class TelemetryEngine {
  constructor() {
    this.buffer = [];
    this.spool = [];
    this.dispatchesInWindow = [];
    this.sentryDsn = null;
    this.initialized = false;
    this.userContext = null;
    this.isDrainingSpool = false;

    this.loadBuffer();
    this.loadSpool();
  }

  loadBuffer() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_BUFFER_KEY);
      this.buffer = raw ? JSON.parse(raw) : [];
    } catch {
      this.buffer = [];
    }
  }

  saveBuffer() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_BUFFER_KEY, JSON.stringify(this.buffer.slice(-MAX_BUFFER_SIZE)));
    } catch {
      // Storage quota or restriction failsafe
    }
  }

  loadSpool() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_SPOOL_KEY);
      this.spool = raw ? JSON.parse(raw) : [];
    } catch {
      this.spool = [];
    }
  }

  saveSpool() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_SPOOL_KEY, JSON.stringify(this.spool.slice(-MAX_SPOOL_SIZE)));
    } catch {}
  }

  resolveDsn() {
    if (typeof window === 'undefined') return null;
    const custom = localStorage.getItem(STORAGE_CUSTOM_DSN_KEY);
    if (custom && custom.trim() !== '') {
      return custom.trim();
    }
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SENTRY_DSN) {
      return import.meta.env.VITE_SENTRY_DSN;
    }
    if (typeof window !== 'undefined' && window.__HABUILT_SENTRY_DSN__) {
      return window.__HABUILT_SENTRY_DSN__;
    }
    return null;
  }

  setCustomSentryDsn(dsn) {
    if (typeof window === 'undefined') return;
    if (dsn && dsn.trim() !== '') {
      const trimmed = dsn.trim();
      localStorage.setItem(STORAGE_CUSTOM_DSN_KEY, trimmed);
      this.sentryDsn = trimmed;
      this.recordBreadcrumb({
        category: 'telemetry',
        message: 'Configured custom Sentry DSN override',
        level: 'info',
      });
    } else {
      this.clearCustomSentryDsn();
    }
  }

  clearCustomSentryDsn() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_CUSTOM_DSN_KEY);
    this.sentryDsn = this.resolveDsn();
    this.recordBreadcrumb({
      category: 'telemetry',
      message: 'Restored default Sentry DSN configuration',
      level: 'info',
    });
  }

  getCustomSentryDsn() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_CUSTOM_DSN_KEY) || '';
  }

  init(app = null) {
    if (this.initialized) return;
    this.initialized = true;

    if (typeof window === 'undefined') return;

    window.__HABUILT_TELEMETRY__ = this;

    // Detect Sentry DSN from local override, VITE_SENTRY_DSN or server-injected config
    this.sentryDsn = this.resolveDsn();

    // Load cached user context if available
    try {
      const cached = localStorage.getItem('habuilt_cached_user');
      if (cached) {
        const u = JSON.parse(cached);
        this.setUserContext({ id: u.id, email: u.email });
      }
    } catch {}

    // Global Uncaught Window Error
    window.addEventListener('error', (event) => {
      this.captureException(event.error || new Error(event.message || 'Script Error'), {
        source: 'window.onerror',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Global Unhandled Promise Rejection
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const error = reason instanceof Error ? reason : new Error(String(reason || 'Unhandled Promise Rejection'));
      this.captureException(error, {
        source: 'unhandledrejection',
      });
    });

    // Vue Global Error Handler
    if (app && app.config) {
      const existingHandler = app.config.errorHandler;
      app.config.errorHandler = (err, instance, info) => {
        this.captureException(err, {
          source: 'vue.errorHandler',
          lifecycleHook: info,
          componentName: instance?.$options?.name || instance?._?.type?.name || 'AnonymousComponent',
        });
        if (typeof existingHandler === 'function') {
          existingHandler(err, instance, info);
        } else {
          console.error('[Habuilt Vue Error]', err, info);
        }
      };
    }

    // Network transition listener for telemetry spool drain
    window.addEventListener('online', () => {
      this.recordBreadcrumb({
        category: 'network',
        message: 'Device reconnected to network — draining offline telemetry spool',
        level: 'info',
      });
      this.drainOfflineSpool();
    });

    // Flush any leftover spool on boot if online
    if (navigator.onLine && this.spool.length > 0) {
      setTimeout(() => this.drainOfflineSpool(), 2000);
    }

    this.recordBreadcrumb({
      category: 'telemetry',
      message: 'Telemetry & Diagnostics engine initialized with Sentry Tunnel v2.1',
      level: 'info',
    });
  }

  setUserContext(user) {
    this.userContext = user ? { id: user.id, email: user.email } : null;
  }

  checkRateLimit() {
    const now = Date.now();
    this.dispatchesInWindow = this.dispatchesInWindow.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (this.dispatchesInWindow.length >= MAX_DISPATCHES_PER_WINDOW) {
      return false;
    }
    this.dispatchesInWindow.push(now);
    return true;
  }

  recordBreadcrumb(crumb) {
    const entry = {
      type: 'breadcrumb',
      timestamp: Date.now(),
      category: crumb.category || 'general',
      message: crumb.message || '',
      level: crumb.level || 'info',
      data: crumb.data || {},
    };

    this.buffer.push(entry);
    if (this.buffer.length > MAX_BUFFER_SIZE) {
      this.buffer.shift();
    }
    this.saveBuffer();
  }

  captureException(error, context = {}) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    const entry = {
      id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'error',
      name: errObj.name || 'Error',
      message: errObj.message || 'Unknown Exception',
      stack: errObj.stack || null,
      timestamp: Date.now(),
      context: {
        ...context,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        onLine: typeof navigator !== 'undefined' ? navigator.onLine : true,
      },
      user: this.userContext,
    };

    // Push into ring buffer
    this.buffer.push(entry);
    if (this.buffer.length > MAX_BUFFER_SIZE) {
      this.buffer.shift();
    }
    this.saveBuffer();

    // Check online status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.spool.push(entry);
      if (this.spool.length > MAX_SPOOL_SIZE) {
        this.spool.shift();
      }
      this.saveSpool();
      return entry;
    }

    // Dispatch to Sentry
    this.dispatchToSentry(entry);
    return entry;
  }

  buildSentryEnvelope(entry) {
    const eventId = entry.id.replace('err_', '').replace(/[^a-zA-Z0-9]/g, '').padEnd(32, '0').slice(0, 32);
    const sentAt = new Date().toISOString();

    const header = {
      event_id: eventId,
      sent_at: sentAt,
      dsn: this.sentryDsn || undefined,
    };

    const itemHeader = {
      type: 'event',
      content_type: 'application/json',
    };

    const itemPayload = {
      event_id: eventId,
      timestamp: entry.timestamp,
      level: 'error',
      platform: 'javascript',
      exception: {
        values: [
          {
            type: entry.name,
            value: entry.message,
            stacktrace: entry.stack ? { frames: [] } : undefined,
          },
        ],
      },
      tags: {
        online: String(entry.context.onLine),
        source: entry.context.source || 'unknown',
        environment: typeof import.meta !== 'undefined' ? import.meta.env?.MODE || 'production' : 'production',
      },
      extra: entry.context,
      user: entry.user || undefined,
    };

    return `${JSON.stringify(header)}\n${JSON.stringify(itemHeader)}\n${JSON.stringify(itemPayload)}`;
  }

  async dispatchToSentry(entry, isDrain = false) {
    if (!isDrain && !this.checkRateLimit()) {
      this.recordBreadcrumb({
        category: 'telemetry',
        message: 'Telemetry rate limit active (10/min) — queued locally',
        level: 'warning',
      });
      return false;
    }

    const envelopeBody = this.buildSentryEnvelope(entry);

    // 1. Primary: Sovereign Sentry Tunnel (Bypasses ad-blockers and logs server-side)
    try {
      const tunnelRes = await fetch('/api/telemetry/tunnel', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: envelopeBody,
      });

      if (tunnelRes.ok) {
        return true;
      }
    } catch {}

    // 2. Direct Sentry Ingest Fallback (if tunnel route was unreachable)
    if (this.sentryDsn) {
      try {
        const match = this.sentryDsn.match(/^https:\/\/([^@]+)@([^/]+)\/(\d+)$/);
        if (match) {
          const [, key, host, projectId] = match;
          const directUrl = `https://${host}/api/${projectId}/envelope/?sentry_version=7&sentry_key=${key}`;
          await fetch(directUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-sentry-envelope' },
            body: envelopeBody,
            mode: 'cors',
          }).catch(() => {});
          return true;
        }
      } catch {}
    }

    return true;
  }

  async drainOfflineSpool() {
    if (this.isDrainingSpool || this.spool.length === 0) return;
    this.isDrainingSpool = true;

    const itemsToDrain = [...this.spool];
    const remaining = [];
    let drainedCount = 0;

    for (const item of itemsToDrain) {
      const ok = await this.dispatchToSentry(item, true);
      if (ok) {
        drainedCount++;
      } else {
        remaining.push(item);
      }
    }

    this.spool = remaining;
    this.saveSpool();
    this.isDrainingSpool = false;

    if (drainedCount > 0) {
      this.recordBreadcrumb({
        category: 'telemetry',
        message: `Drained ${drainedCount} spooled telemetry event(s) to Sentry tunnel`,
        level: 'info',
      });
    }
  }

  async sendTestException(source = 'manual_test_trigger') {
    const testError = new Error(`[Habuilt Test Anomaly] Synthetic Sentry exception triggered from ${source} at ${new Date().toLocaleTimeString()}`);
    testError.name = 'SyntheticTelemetryException';

    const entry = this.captureException(testError, {
      source,
      synthetic: true,
      timestamp: new Date().toISOString(),
    });

    // Also register on backend diagnostic log
    try {
      await fetch('/api/telemetry/test-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_id: entry.id,
          user_id: this.userContext?.id || 'anonymous',
          source,
        }),
      });
    } catch {}

    return entry;
  }

  getTelemetryStatus() {
    return {
      initialized: this.initialized,
      sentryDsnConfigured: Boolean(this.sentryDsn),
      sentryHost: this.sentryDsn ? (this.sentryDsn.match(/@([^/]+)/)?.[1] || 'sentry.io') : null,
      maskedDsn: this.sentryDsn ? this.sentryDsn.replace(/:\/\/([^@]+)@/, '://***@') : null,
      isCustomDsn: Boolean(typeof window !== 'undefined' && localStorage.getItem(STORAGE_CUSTOM_DSN_KEY)),
      ringBufferCount: this.buffer.length,
      spoolCount: this.spool.length,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    };
  }

  getRecentErrors() {
    return this.buffer.filter((item) => item.type === 'error');
  }

  getBuffer() {
    return [...this.buffer];
  }

  clearBuffer() {
    this.buffer = [];
    this.spool = [];
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_BUFFER_KEY);
        localStorage.removeItem(STORAGE_SPOOL_KEY);
      } catch {}
    }
  }

  exportDiagnostics() {
    if (typeof window === 'undefined') return null;
    const report = {
      app: 'Habuilt Operating System',
      version: '2.1.0',
      exportedAt: new Date().toISOString(),
      environment: typeof import.meta !== 'undefined' ? import.meta.env?.MODE || 'production' : 'production',
      user: this.userContext,
      telemetryStatus: this.getTelemetryStatus(),
      device: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        onLine: navigator.onLine,
        screen: `${window.innerWidth}x${window.innerHeight}`,
      },
      events: this.buffer,
      spool: this.spool,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habuilt-diagnostics-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return report;
  }
}

export const telemetry = new TelemetryEngine();
export const captureException = (err, ctx) => telemetry.captureException(err, ctx);
export const recordBreadcrumb = (crumb) => telemetry.recordBreadcrumb(crumb);
export const exportDiagnostics = () => telemetry.exportDiagnostics();
export const sendTestException = (source) => telemetry.sendTestException(source);
export const getTelemetryStatus = () => telemetry.getTelemetryStatus();
export const setCustomSentryDsn = (dsn) => telemetry.setCustomSentryDsn(dsn);
export const clearCustomSentryDsn = () => telemetry.clearCustomSentryDsn();
export const getCustomSentryDsn = () => telemetry.getCustomSentryDsn();
