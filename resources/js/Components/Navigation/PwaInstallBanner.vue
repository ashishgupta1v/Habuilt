<script setup>
import { ref, onMounted, computed } from 'vue';
import { Download, Smartphone, X, Sparkles, Share2, ShieldCheck } from 'lucide-vue-next';
import HabuiltLogo from '@/Components/Brand/HabuiltLogo.vue';

const props = defineProps({
  canInstallPwa: { type: Boolean, default: false },
});

const emit = defineEmits(['open-modal', 'trigger-install']);

const isDismissed = ref(true);
const isStandalone = ref(false);
const isIOS = ref(false);

const DISMISS_KEY = 'habuilt_pwa_banner_dismissed_at';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

onMounted(() => {
  if (typeof window === 'undefined') return;

  // Check if already running in standalone mode (installed PWA)
  const isPwaStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://');

  isStandalone.value = !!isPwaStandalone;

  // Check user agent for iOS
  const ua = window.navigator.userAgent || '';
  isIOS.value = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

  // Check dismissal timestamp
  const dismissedAt = localStorage.getItem(DISMISS_KEY);
  if (dismissedAt) {
    const elapsed = Date.now() - Number(dismissedAt);
    if (elapsed < SEVEN_DAYS_MS) {
      isDismissed.value = true;
      return;
    }
  }

  isDismissed.value = false;
});

const shouldShow = computed(() => {
  return !isStandalone.value && !isDismissed.value;
});

const dismissBanner = () => {
  isDismissed.value = true;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }
};

const handleAction = () => {
  if (props.canInstallPwa) {
    emit('trigger-install');
  } else {
    emit('open-modal');
  }
};
</script>

<template>
  <Transition name="banner-slide-up">
    <div v-if="shouldShow" class="pwa-smart-banner">
      <div class="pwa-smart-banner__glow"></div>
      
      <div class="pwa-smart-banner__content">
        <!-- Logo & Badge -->
        <div class="pwa-smart-banner__brand">
          <div class="pwa-smart-banner__logo-wrap">
            <HabuiltLogo size="sm" />
          </div>
          <div class="pwa-smart-banner__text">
            <div class="pwa-smart-banner__title-row">
              <span class="pwa-smart-banner__title">Install Habuilt App</span>
              <span class="pwa-smart-banner__badge">1-Tap Fast</span>
            </div>
            <p class="pwa-smart-banner__sub">
              {{ isIOS ? 'Add to Home Screen for full-screen tracking & offline speed' : 'Install to your Home Screen / Taskbar for instant access' }}
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="pwa-smart-banner__actions">
          <button
            type="button"
            class="pwa-smart-banner__btn-install"
            @click="handleAction"
          >
            <Download v-if="!isIOS" class="icon-xs" />
            <Share2 v-else class="icon-xs" />
            <span>{{ isIOS ? 'How to Add' : (canInstallPwa ? 'Install (1-Tap)' : 'Get App') }}</span>
          </button>

          <button
            type="button"
            class="pwa-smart-banner__btn-close"
            @click="dismissBanner"
            aria-label="Dismiss banner"
            title="Dismiss for 7 days"
          >
            <X class="icon-xs" />
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
