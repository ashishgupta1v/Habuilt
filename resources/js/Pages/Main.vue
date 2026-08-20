<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '@/lib/supabase';
import Dashboard from './Dashboard.vue';
import Auth from './Auth.vue';
import HabuiltLogo from '@/Components/Brand/HabuiltLogo.vue';
import { LogOut, Download, Share2 } from 'lucide-vue-next';

const activeUser = ref(null);
const authLoading = ref(true);

// PWA Install prompt
const deferredPrompt = ref(null);
const showInstallBtn = ref(false);
const isIOS = ref(false);
const showIOSInstructions = ref(false);

// Detect iOS (no beforeinstallprompt on Safari)
const checkIOS = () => {
  const ua = navigator.userAgent;
  isIOS.value = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // Show install button on iOS if not already in standalone
  if (isIOS.value && !window.matchMedia('(display-mode: standalone)').matches) {
    showInstallBtn.value = true;
  }
};

// Capture beforeinstallprompt (Chrome, Edge, Samsung, etc.)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt.value = e;
  showInstallBtn.value = true;
});

// Hide button after install
window.addEventListener('appinstalled', () => {
  showInstallBtn.value = false;
  deferredPrompt.value = null;
});

const handleInstall = async () => {
  if (isIOS.value) {
    showIOSInstructions.value = true;
    return;
  }
  if (!deferredPrompt.value) return;
  deferredPrompt.value.prompt();
  const { outcome } = await deferredPrompt.value.userChoice;
  if (outcome === 'accepted') {
    showInstallBtn.value = false;
  }
  deferredPrompt.value = null;
};

const todayDate = new Date();
const urlParams = new URLSearchParams(window.location.search);
const qMonth = Number.parseInt(urlParams.get('month') ?? '', 10);
const qYear = Number.parseInt(urlParams.get('year') ?? '', 10);

const month = ref(Number.isInteger(qMonth) && qMonth >= 1 && qMonth <= 12 ? qMonth : todayDate.getMonth() + 1);
const year = ref(Number.isInteger(qYear) && qYear >= 2000 && qYear <= 2100 ? qYear : todayDate.getFullYear());

const monthDays = computed(() => new Date(year.value, month.value, 0).getDate());

const isCurrentMonth = computed(() => {
  return year.value === todayDate.getFullYear() && month.value === (todayDate.getMonth() + 1);
});
const isFutureMonth = computed(() => {
  const target = year.value * 100 + month.value;
  const current = todayDate.getFullYear() * 100 + (todayDate.getMonth() + 1);
  return target > current;
});
const currentDay = computed(() => isCurrentMonth.value ? todayDate.getDate() : monthDays.value);

const previousMonth = computed(() => {
  let m = month.value - 1; 
  let y = year.value;
  if(m < 1) { m = 12; y--; }
  return { month: m, year: y };
});

const nextMonth = computed(() => {
  let m = month.value + 1; 
  let y = year.value;
  if(m > 12) { m = 1; y++; }
  return { month: m, year: y };
});

const isUserJyoti = computed(() => {
  const email = (activeUser.value?.email || '').toLowerCase().trim();
  return email === 'goyaljyoti007@gmail.com' || email.includes('jyoti');
});

const userInitial = computed(() => {
  if (!activeUser.value?.email) return 'U';
  return activeUser.value.email.charAt(0).toUpperCase();
});

const handleNavigateMonth = (monthOffset) => {
  let newMonth = month.value + monthOffset;
  let newYear = year.value;
  if (newMonth > 12) { newMonth = 1; newYear++; }
  if (newMonth < 1) { newMonth = 12; newYear--; }
  window.location.search = `?month=${newMonth}&year=${newYear}`;
};

const isGuestActive = ref(localStorage.getItem('habuilt_guest_mode') === 'true');
const isNativePlatform = ref(typeof window !== 'undefined' && Boolean(window.Capacitor?.isNativePlatform?.()));
const isMobileDevice = ref(typeof window !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

const getStoredDirectUser = () => {
  try {
    const raw = localStorage.getItem('habuilt_direct_user');
    return raw ? JSON.parse(raw) : { id: 'ashish-profile', email: 'ashish@habuilt.com', user_metadata: { full_name: 'Ashish Gupta' } };
  } catch {
    return { id: 'ashish-profile', email: 'ashish@habuilt.com', user_metadata: { full_name: 'Ashish Gupta' } };
  }
};

const openNativeApp = () => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash || '';
    window.location.href = `habuilt://auth/callback${hash}`;
  }
};

const handleSignOut = async () => {
  localStorage.removeItem('habuilt_guest_mode');
  localStorage.removeItem('habuilt_direct_user');
  isGuestActive.value = false;
  await supabase.auth.signOut();
};

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    activeUser.value = session.user;
  } else if (isGuestActive.value) {
    activeUser.value = getStoredDirectUser();
  } else {
    activeUser.value = null;
  }
  authLoading.value = false;

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      activeUser.value = session.user;
    } else if (localStorage.getItem('habuilt_guest_mode') === 'true') {
      activeUser.value = getStoredDirectUser();
    } else {
      activeUser.value = null;
    }
  });

  window.addEventListener('habuilt-guest-auth', () => {
    isGuestActive.value = true;
    activeUser.value = getStoredDirectUser();
  });

  // ── Native Deep Link Handler for OAuth Callback ──
  try {
    const { App } = await import('@capacitor/app');
    const { Browser } = await import('@capacitor/browser');
    
    App.addListener('appUrlOpen', async (event) => {
      try {
        await Browser.close();
      } catch { /* ignore */ }

      if (event.url) {
        // Handle habuilt://auth/callback#access_token=... or ?code=...
        const rawUrl = event.url.replace('habuilt://', 'https://habuilt.com/').replace('com.habuilt.app://', 'https://habuilt.com/');
        try {
          const parsed = new URL(rawUrl);
          const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (data?.user) {
              activeUser.value = data.user;
            }
          }
        } catch (e) {
          console.warn('Error parsing deep link auth:', e);
        }
      }
    });
  } catch {
    // Non-native fallback
  }

  // ── Web-to-Native App Automatic Handoff Bridge ──
  if (typeof window !== 'undefined' && !window.Capacitor?.isNativePlatform?.()) {
    const hash = window.location.hash;
    if (hash && (hash.includes('access_token') || hash.includes('refresh_token'))) {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        try {
          // Immediately hand off authentication tokens to the native Habuilt APK
          window.location.href = `habuilt://auth/callback${hash}`;
        } catch { /* ignore */ }
      }
    }
  }

  checkIOS();
});
</script>

<template>
  <div v-if="authLoading" class="app-loading">
    <div class="app-spinner">
      <HabuiltLogo size="xl" animated />
      <div class="loading-text">Loading Habuilt Workspace...</div>
    </div>
  </div>

  <template v-else>
    <div v-if="activeUser" class="app-root">
      <!-- ⚡ Web-to-Native App Handoff Banner (Shown ONLY when viewing inside Mobile Web / Chrome Custom Tab) -->
      <div 
        v-if="!isNativePlatform && isMobileDevice" 
        class="native-app-handoff-banner"
        style="position: sticky; top: 0; left: 0; right: 0; z-index: 999999; background: linear-gradient(135deg, #064e3b 0%, #0f172a 100%); border-bottom: 2px solid #10b981; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 20px rgba(0,0,0,0.6);"
      >
        <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
          <span style="font-size: 20px; filter: drop-shadow(0 0 8px #10b981); flex-shrink: 0;">⚡</span>
          <div style="min-width: 0;">
            <div style="font-size: 13px; font-weight: 800; color: #34d399; letter-spacing: 0.3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">HABUILT ANDROID APP</div>
            <div style="font-size: 11px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Tap to switch to full native viewport & widget</div>
          </div>
        </div>
        <button 
          @click="openNativeApp" 
          style="background: #10b981; color: #022c22; font-weight: 800; font-size: 12px; padding: 8px 14px; border-radius: 8px; border: none; cursor: pointer; box-shadow: 0 0 12px rgba(16,185,129,0.5); flex-shrink: 0;"
        >
          OPEN APP ➔
        </button>
      </div>

      <!-- Dashboard + Top Header Wrapper -->
      <main class="app-main-content">
        <nav class="app-nav">
          <div class="app-nav__container">
            <div class="app-nav__left">
              <HabuiltLogo size="md" :with-text="true" />
            </div>

            <div class="app-nav__right">
              <!-- PWA Install Button -->
              <button
                v-if="showInstallBtn"
                @click="handleInstall"
                class="btn btn--install"
                :title="isIOS ? 'Install on iOS' : 'Install Habuilt App'"
              >
                <Download v-if="!isIOS" class="icon-sm" />
                <Share2 v-else class="icon-sm" />
                <span class="install-text">Install App</span>
              </button>

              <div class="user-badge" :title="activeUser.email">
                <div class="user-avatar" :class="isUserJyoti ? 'user-avatar--jyoti' : 'user-avatar--ashish'">
                  {{ userInitial }}
                </div>
                <span class="user-badge__text">{{ activeUser.email }}</span>
                <span class="user-track-pill" :class="isUserJyoti ? 'user-track-pill--jyoti' : 'user-track-pill--ashish'">
                  {{ isUserJyoti ? 'Jyoti Track' : 'Ashish Track' }}
                </span>
              </div>

              <button @click="handleSignOut" class="btn btn--logout" title="Sign out of Habuilt">
                <LogOut class="icon-sm" />
                <span class="logout-text">Sign Out</span>
              </button>
            </div>
          </div>
        </nav>

        <!-- iOS Install Instructions -->
        <div v-if="showIOSInstructions" class="ios-install-banner">
          <div class="ios-install-content">
            <p class="ios-install-title">Install Habuilt on iOS</p>
            <ol class="ios-install-steps">
              <li>Tap the <strong>Share</strong> button <Share2 style="width:14px;height:14px;vertical-align:middle;" /> in Safari</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Add"</strong> to install</li>
            </ol>
            <button @click="showIOSInstructions = false" class="btn btn--ios-dismiss">Got it</button>
          </div>
        </div>

        <Dashboard
          :userId="activeUser.id"
          :userEmail="activeUser.email"
          :month="month"
          :year="year"
          :monthDays="monthDays"
          :today="todayDate.toISOString().slice(0, 10)"
          :currentDay="currentDay"
          :isCurrentMonth="isCurrentMonth"
          :isFutureMonth="isFutureMonth"
          :canNavigatePrevMonth="true"
          :canNavigateNextMonth="true"
          :previousMonth="previousMonth"
          :nextMonth="nextMonth"
        />
      </main>
    </div>
    
    <Auth v-else />
  </template>
</template>
