/**
 * Habuilt Sovereign Error Telemetry & Diagnostics Engine
 * 
 * Supports:
 * 1. Optional Sentry DSN ingestion (via VITE_SENTRY_DSN or window.__HABUILT_SENTRY_DSN__)
 * 2. Persistent Client Diagnostics Ring Buffer (last 50 events in localStorage)
 * 3. Global Vue app.config.errorHandler
 * 4. Uncaught window error and unhandled promise rejection interception
 * 5. One-click Diagnostics Export for user support and crash debugging
 */

const STORAGE_BUFFER_KEY = 'habuilt_diagnostics_ring_buffer';
const MAX_BUFFER_SIZE = 50;

class TelemetryEngine {
  constructor() {
    this.buffer = [];
    this.sentryDsn = null;
    this.initialized = false;
    this.userContext = null;
    this.loadBuffer();
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
      // Storage full or restricted
    }
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

    this.recordBreadcrumb({
      category: 'telemetry',
      message: 'Telemetry & Diagnostics engine initialized',
      level: 'info',
    });
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

    // Send to remote Sentry if DSN is configured
    this.dispatchToSentry(entry);

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

  async dispatchToSentry(entry) {
    if (!this.sentryDsn) return;
    try {
      // Parse DSN: https://<key>@<host>/<project_id>
      const match = this.sentryDsn.match(/^https:\/\/([^@]+)@([^/]+)\/(\d+)$/);
      if (!match) return;
      const [, key, host, projectId] = match;
      const endpoint = `https://${host}/api/${projectId}/store/?sentry_version=7&sentry_key=${key}&sentry_client=habuilt-sovereign/2.1`;

      const payload = {
        event_id: entry.id.replace('err_', '').padEnd(32, '0').slice(0, 32),
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
        },
        extra: entry.context,
        user: entry.user || undefined,
      };

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'cors',
      }).catch(() => {});
    } catch {
      // Failsafe: never allow telemetry delivery failures to throw
    }
  }

  getRecentErrors() {
    return this.buffer.filter((item) => item.type === 'error');
  }

  getBuffer() {
    return [...this.buffer];
  }

  clearBuffer() {
    this.buffer = [];
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_BUFFER_KEY);
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
      device: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        onLine: navigator.onLine,
        screen: `${window.innerWidth}x${window.innerHeight}`,
      },
      events: this.buffer,
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
