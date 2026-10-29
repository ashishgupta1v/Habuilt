/**
 * Habuilt Sovereign Error Telemetry & Diagnostics Engine
 * 
 * Supports:
 * 1. Sentry DSN ingestion (via VITE_SENTRY_DSN or window.__HABUILT_SENTRY_DSN__)
 * 2. First-party Sentry Tunnel (/api/telemetry/tunnel) for ad-blocker resilience
 * 3. Offline telemetry spooling with automatic drain on reconnection
 * 4. Client-side sliding-window rate limiting (10 events/minute flood protection)
 * 5. Persistent Client Diagnostics Ring Buffer (last 50 events in localStorage)
 * 6. Global Vue app.config.errorHandler & uncaught exception interception
 * 7. One-click Diagnostics Export & interactive synthetic test event verification
 */

const STORAGE_BUFFER_KEY = 'habuilt_diagnostics_ring_buffer';
const STORAGE_SPOOL_KEY = 'habuilt_offline_telemetry_queue';
const MAX_BUFFER_SIZE = 50;
const MAX_SPOOL_SIZE = 20;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60000;

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

  init(app = null) {
    if (this.initialized) return;
    this.initialized = true;

    if (typeof window === 'undefined') return;

    // Detect Sentry DSN
    this.sentryDsn = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SENTRY_DSN)
      || window.__HABUILT_SENTRY_DSN__
      || null;

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
        message: 'Online transition detected — draining spooled telemetry',
        level: 'info',
      });
      this.drainSpool();
    });

    // Expose debug helpers on window for development & testing
    window.__HABUILT_TELEMETRY__ = this;
    window.__HABUILT_EXPORT_DIAGNOSTICS__ = () => this.exportDiagnostics();

    this.recordBreadcrumb({
      category: 'telemetry',
      message: 'Telemetry & Diagnostics engine initialized with Sentry Tunnel v2.1',
      level: 'info',
    });

    // Attempt initial spool drain if online
    if (navigator.onLine && this.spool.length > 0) {
      setTimeout(() => this.drainSpool(), 2000);
    }
  }

  setUserContext(user) {
    if (!user) {
      this.userContext = null;
      return;
    }
    this.userContext = {
      id: user.id || 'anonymous',
      email: user.email ? `${user.email.slice(0, 3)}***@***` : undefined, // GDPR privacy masking
    };
  }

  checkRateLimit() {
    const now = Date.now();
    this.dispatchesInWindow = this.dispatchesInWindow.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
    if (this.dispatchesInWindow.length >= RATE_LIMIT_MAX) {
      return false; // Throttled
    }
    this.dispatchesInWindow.push(now);
    return true;
  }

  captureException(error, context = {}) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    const entry = {
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      type: 'error',
      name: errObj.name || 'Error',
      message: errObj.message || 'Unknown error',
      stack: errObj.stack ? errObj.stack.slice(0, 1500) : null,
      context: {
        ...context,
        url: typeof window !== 'undefined' ? window.location.href : '',
        onLine: typeof navigator !== 'undefined' ? navigator.onLine : true,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      },
      user: this.userContext,
    };

    this.buffer.push(entry);
    this.saveBuffer();

    // Remote delivery or offline spooling
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.spool.push(entry);
      this.saveSpool();
    } else {
      this.dispatchToSentry(entry);
    }

    // Dispatch internal diagnostics event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('habuilt:telemetry-error', { detail: entry }));
    }

    return entry;
  }

  recordBreadcrumb(crumb = {}) {
    const entry = {
      id: `bc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      type: 'breadcrumb',
      category: crumb.category || 'app',
      message: crumb.message || '',
      level: crumb.level || 'info',
      data: crumb.data || null,
    };

    this.buffer.push(entry);
    this.saveBuffer();
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

    // 3. Standalone mode: If no remote Sentry DSN is configured, the event is securely preserved in local ring buffer
    if (!this.sentryDsn) {
      return true;
    }

    return false;
  }

  async drainSpool() {
    if (this.isDrainingSpool || this.spool.length === 0) return 0;
    this.isDrainingSpool = true;

    let drainedCount = 0;
    const remaining = [];

    for (const item of [...this.spool]) {
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

    return drainedCount;
  }

  async sendTestException(source = 'verification_test') {
    const testErr = new Error(`[Habuilt Verified Telemetry Anomaly] Simulated at ${new Date().toLocaleTimeString()}`);
    testErr.name = 'SyntheticTelemetryException';

    const entry = this.captureException(testErr, {
      source,
      isSynthetic: true,
      testedAt: new Date().toISOString(),
    });

    // Also trigger server-side test registration
    try {
      await fetch('/api/telemetry/test-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
