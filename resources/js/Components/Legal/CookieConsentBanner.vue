<script setup>
import { ref, onMounted } from 'vue';
import { Shield, X, Check } from 'lucide-vue-next';

const isVisible = ref(false);

const STORAGE_KEY = 'habuilt_privacy_consent';

onMounted(() => {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      setTimeout(() => {
        isVisible.value = true;
      }, 700);
    }
  } catch (e) {
    isVisible.value = false;
  }
});

const acceptAll = () => {
  try {
    localStorage.setItem(STORAGE_KEY, 'accepted');
  } catch (e) {}
  isVisible.value = false;
};

const acceptEssential = () => {
  try {
    localStorage.setItem(STORAGE_KEY, 'essential');
  } catch (e) {}
  isVisible.value = false;
};
</script>

<template>
  <Transition name="banner-slide">
    <aside
      v-if="isVisible"
      id="cookie-consent-banner"
      role="dialog"
      aria-live="polite"
      aria-label="Privacy & Cookie Preferences"
      class="cookie-banner"
    >
      <div class="banner-top">
        <div class="banner-icon-wrap">
          <Shield class="icon-16" />
        </div>
        <div class="banner-body">
          <div class="banner-header">
            <h4 class="banner-title">Sovereign Privacy &amp; Cookies</h4>
            <button
              type="button"
              @click="acceptEssential"
              class="banner-close-btn"
              aria-label="Dismiss banner"
            >
              <X class="icon-14" />
            </button>
          </div>
          <p class="banner-desc">
            Habuilt respects your digital sovereignty. We use minimal local telemetry and essential cookies to keep your habit ledger encrypted and synced.
            Read our
            <a href="/privacy" class="banner-link">Privacy Policy</a>
            and
            <a href="/terms" class="banner-link">Terms</a>.
          </p>
        </div>
      </div>

      <div class="banner-actions">
        <button
          type="button"
          id="cookie-accept-btn"
          @click="acceptAll"
          class="btn-accept"
        >
          <Check class="icon-14" />
          <span>Accept All</span>
        </button>
        <button
          type="button"
          id="cookie-essential-btn"
          @click="acceptEssential"
          class="btn-essential"
        >
          <span>Essential Only</span>
        </button>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 20px;
  right: 20px;
  max-width: 420px;
  width: calc(100% - 40px);
  z-index: 9999;
  background: rgba(15, 20, 31, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  padding: 18px 20px;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.7), 0 0 25px rgba(16, 185, 129, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #e2e8f0;
}

@media (max-width: 480px) {
  .cookie-banner {
    bottom: 12px;
    right: 12px;
    left: 12px;
    width: auto;
  }
}

.banner-top {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.banner-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.28);
  color: #34d399;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.banner-body {
  flex: 1;
  min-width: 0;
}

.banner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.banner-title {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #ffffff;
  margin: 0;
}

.banner-close-btn {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease;
}
.banner-close-btn:hover {
  color: #ffffff;
}

.banner-desc {
  font-size: 12px;
  line-height: 1.55;
  color: #94a3b8;
  margin: 0;
}

.banner-link {
  color: #34d399;
  font-weight: 600;
  text-decoration: underline;
  transition: color 0.15s ease;
}
.banner-link:hover {
  color: #6ee7b7;
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.btn-accept {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 12px;
  background: #10b981;
  border: none;
  color: #022c22;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
}
.btn-accept:hover {
  background: #34d399;
}

.btn-essential {
  padding: 9px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-essential:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.banner-slide-enter-active {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.banner-slide-leave-active {
  transition: all 0.25s ease-in;
}
.banner-slide-enter-from {
  opacity: 0;
  transform: translateY(24px) scale(0.96);
}
.banner-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.96);
}

.icon-14 { width: 14px; height: 14px; }
.icon-16 { width: 16px; height: 16px; }
</style>
