<script setup>
import { ref, onErrorCaptured } from 'vue';
import { ShieldAlert, RefreshCw, Download, AlertTriangle, ChevronDown, ChevronUp, LifeBuoy } from 'lucide-vue-next';
import { captureException, exportDiagnostics } from '@/lib/telemetry';

const hasError = ref(false);
const capturedError = ref(null);
const errorInfo = ref(null);
const showDetails = ref(false);

onErrorCaptured((err, instance, info) => {
  hasError.value = true;
  capturedError.value = err;
  errorInfo.value = info;

  captureException(err, {
    source: 'ErrorBoundary',
    component: instance?.$options?.name || instance?._?.type?.name || 'Unknown',
    lifecycleHook: info,
  });

  // Return false to prevent unhandled bubbling that breaks the entire root
  return false;
});

const handleReload = () => {
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

const handleSafeMode = () => {
  if (typeof window !== 'undefined') {
    try {
      // Clear ephemeral view state without touching user habits or auth
      sessionStorage.clear();
      localStorage.removeItem('habuilt_active_modal');
      localStorage.removeItem('habuilt_current_tab');
    } catch {}
    window.location.href = '/?mode=safe';
  }
};

const handleExportDiagnostics = () => {
  exportDiagnostics();
};

const handleDismiss = () => {
  hasError.value = false;
  capturedError.value = null;
  errorInfo.value = null;
};
</script>

<template>
  <div v-if="hasError" class="error-boundary-root" role="alert" aria-live="assertive">
    <div class="recovery-card">
      <div class="recovery-header">
        <div class="recovery-badge">
          <ShieldAlert class="icon-18 text-rose" />
          <span>Sovereign Fault Recovery</span>
        </div>
        <h2 class="recovery-title">Runtime Anomaly Contained</h2>
        <p class="recovery-desc">
          An unexpected interface exception was safely intercepted. Your habit records, streaks, and local data remain 100% secure in local storage.
        </p>
      </div>

      <!-- Quick Action Buttons -->
      <div class="recovery-actions">
        <button
          type="button"
          id="btn-recovery-reload"
          class="btn-recovery-primary"
          @click="handleReload"
        >
          <RefreshCw class="icon-14" />
          <span>Reload Workspace</span>
        </button>

        <button
          type="button"
          id="btn-recovery-safe"
          class="btn-recovery-secondary"
          @click="handleSafeMode"
        >
          <LifeBuoy class="icon-14" />
          <span>Safe Mode</span>
        </button>

        <button
          type="button"
          id="btn-recovery-export"
          class="btn-recovery-secondary"
          @click="handleExportDiagnostics"
        >
          <Download class="icon-14" />
          <span>Export Crash Report (JSON)</span>
        </button>
      </div>

      <!-- Collapsible Technical Details -->
      <div class="tech-details-wrap">
        <button
          type="button"
          class="tech-toggle-btn"
          @click="showDetails = !showDetails"
        >
          <span>Diagnostic Technical Log</span>
          <ChevronUp v-if="showDetails" class="icon-14" />
          <ChevronDown v-else class="icon-14" />
        </button>

        <div v-if="showDetails" class="tech-log-content">
          <div class="tech-log-row">
            <strong>Error:</strong> {{ capturedError?.message || 'Unknown exception' }}
          </div>
          <div v-if="errorInfo" class="tech-log-row">
            <strong>Lifecycle:</strong> {{ errorInfo }}
          </div>
          <pre v-if="capturedError?.stack" class="tech-log-stack">{{ capturedError.stack }}</pre>
        </div>
      </div>

      <div class="recovery-footer">
        <button type="button" class="dismiss-link" @click="handleDismiss">
          Attempt to resume session
        </button>
      </div>
    </div>
  </div>

  <slot v-else />
</template>

<style scoped>
.error-boundary-root {
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  background: #F7F8F2;
  font-family: Inter, sans-serif;
  color: #0C110D;
}

.recovery-card {
  max-width: 580px;
  width: 100%;
  background: #ffffff;
  border: 1px solid rgba(244, 63, 94, 0.3);
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(244, 63, 94, 0.08);
  border-radius: 24px;
  padding: 36px 32px;
  backdrop-filter: blur(20px);
}

.recovery-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 9999px;
  background: rgba(244, 63, 94, 0.12);
  border: 1px solid rgba(244, 63, 94, 0.28);
  color: #fb7185;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 16px;
}

.recovery-title {
  font-size: 1.65rem;
  font-weight: 850;
  color: #0C110D;
  margin: 0 0 10px;
  letter-spacing: -0.02em;
}

.recovery-desc {
  font-size: 13.5px;
  color: #3A4338;
  line-height: 1.6;
  margin: 0 0 24px;
}

.recovery-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 24px;
}

@media (min-width: 520px) {
  .recovery-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

.btn-recovery-primary {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 18px;
  border-radius: 14px;
  background: #D9F27A;
  border: none;
  color: #0C110D;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
}
.btn-recovery-primary:hover {
  background: #E7F7A8;
}

.btn-recovery-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #E4E6DC;
  color: #0C110D;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-recovery-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #0C110D;
}

.tech-details-wrap {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 16px;
}

.tech-toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.15s ease;
}
.tech-toggle-btn:hover {
  color: #3A4338;
}

.tech-log-content {
  margin-top: 12px;
  padding: 14px;
  background: #F7F8F2;
  border: 1px solid #E4E6DC;
  border-radius: 12px;
  font-size: 11.5px;
  font-family: 'JetBrains Mono', monospace;
  color: #0C110D;
}

.tech-log-row {
  margin-bottom: 6px;
}

.tech-log-stack {
  margin: 10px 0 0;
  padding: 8px;
  background: #ffffff;
  border-radius: 8px;
  font-size: 10.5px;
  color: #3A4338;
  max-height: 140px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.recovery-footer {
  margin-top: 20px;
  text-align: center;
}

.dismiss-link {
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 12px;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.15s ease;
}
.dismiss-link:hover {
  color: #3A4338;
}

.icon-14 { width: 14px; height: 14px; }
.icon-18 { width: 18px; height: 18px; }
.text-rose { color: #fb7185; }
</style>
