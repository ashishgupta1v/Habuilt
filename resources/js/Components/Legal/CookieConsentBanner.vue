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
      <div class="banner-row">
        <div class="banner-icon-wrap" aria-hidden="true">
          <Shield class="icon-16" />
        </div>
        <div class="banner-copy">
          <div class="banner-header">
            <h4 class="banner-title">Privacy and cookies</h4>
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
            Check-ins stay in browser storage until you sign in and sync. Essential session cookies only.
            <span class="banner-links-inline">
              <a href="/privacy" class="banner-link">Privacy Policy</a>
              <span aria-hidden="true" class="banner-dot">·</span>
              <a href="/terms" class="banner-link">Terms</a>
            </span>
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
  bottom: 16px;
  left: 16px;
  max-width: 440px;
  width: calc(100% - 32px);
  z-index: 60;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid #E4E6DC;
  border-radius: 18px;
  padding: 12px 14px;
  box-shadow: 0 18px 40px -18px rgba(12, 17, 13, 0.18), 0 2px 6px rgba(12, 17, 13, 0.04);
  font-family: var(--font-sans, 'Inter', -apple-system, BlinkMacSystemFont, sans-serif);
  color: #0C110D;
  box-sizing: border-box;
}

@media (max-width: 767px) {
  .cookie-banner {
    left: 12px;
    right: 12px;
    width: auto;
    max-width: none;
    overflow: visible;
    padding: 12px 14px;
    bottom: calc(8px + var(--calm-tab-offset, 0px) + var(--calm-offline-stack, 0px));
  }
  .banner-actions {
    flex-wrap: wrap;
  }
  .btn-accept,
  .btn-essential {
    white-space: nowrap;
  }
}

.banner-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.banner-icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: #D9F27A;
  border: 1px solid #0C110D;
  color: #0C110D;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.banner-copy {
  flex: 1;
  min-width: 0;
}

.banner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.banner-title {
  font-family: var(--font-display, 'Urbanist', sans-serif);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0C110D;
  margin: 0;
}

.banner-close-btn {
  background: transparent;
  border: none;
  border-radius: 10px;
  color: #3A4338;
  cursor: pointer;
  min-width: 44px;
  min-height: 44px;
  padding: 10px;
  margin: -10px -10px -10px 0;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s ease, background-color 0.15s ease;
}
.banner-close-btn:hover {
  color: #0C110D;
  background: #F7F8F2;
}

.banner-desc {
  font-size: 13px;
  line-height: 1.45;
  color: #3A4338;
  margin: 2px 0 0;
}

.banner-links-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: 4px;
}

.banner-dot {
  color: #6B7266;
}

.banner-link {
  color: #0C110D;
  font-size: 13px;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  min-width: 44px;
  margin-block: -12px;
  transition: opacity 0.15s ease;
}
.banner-link:hover {
  opacity: 0.72;
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #E4E6DC;
}

.btn-accept {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  padding: 10px 14px;
  border-radius: 999px;
  background: #D9F27A;
  border: 1px solid #0C110D;
  color: #0C110D;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.18s ease;
}
.btn-accept:hover {
  background: #E7F7A8;
}

.btn-essential {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  padding: 10px 14px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #E4E6DC;
  color: #0C110D;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease;
}
.btn-accept:focus-visible,
.btn-essential:focus-visible,
.banner-close-btn:focus-visible,
.banner-link:focus-visible {
  outline: 2px solid #0C110D;
  outline-offset: 2px;
}
.btn-essential:hover {
  border-color: #0C110D;
  background: #F7F8F2;
}

.banner-slide-enter-active {
  transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease;
}
.banner-slide-leave-active {
  transition: transform 0.2s cubic-bezier(0.4, 0, 1, 1), opacity 0.18s ease;
}
.banner-slide-enter-from,
.banner-slide-leave-to {
  opacity: 0;
  transform: translateY(16px);
}

.icon-14 { width: 14px; height: 14px; }
.icon-16 { width: 16px; height: 16px; }
</style>
