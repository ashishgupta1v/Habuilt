<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '@/lib/supabase';
import Dashboard from './Dashboard.vue';
import Auth from './Auth.vue';
import HabuiltLogo from '@/Components/Brand/HabuiltLogo.vue';
import { LogOut, Download, Share2 } from 'lucide-vue-next';

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

// Synchronous initial auth check from local cache to eliminate loading flash
const cachedUserJson = typeof window !== 'undefined' ? localStorage.getItem('habuilt_cached_user') : null;
let initialUser = null;
try {
  initialUser = cachedUserJson ? JSON.parse(cachedUserJson) : null;
} catch {
  initialUser = null;
}
if (!initialUser && isGuestActive.value) {
  initialUser = { id: 'guest', email: 'guest@habuilt.com', user_metadata: { full_name: 'Habuilt Champion' } };
}
const activeUser = ref(initialUser);

const handleSignOut = async () => {
  localStorage.removeItem('habuilt_guest_mode');
  localStorage.removeItem('habuilt_cached_user');
  isGuestActive.value = false;
  activeUser.value = null;
  await supabase.auth.signOut();
};

onMounted(async () => {
  // Configure Native Status Bar
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#090D16' });
  } catch { /* non-native */ }

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    activeUser.value = session.user;
    localStorage.setItem('habuilt_cached_user', JSON.stringify(session.user));
  } else if (isGuestActive.value) {
    activeUser.value = { id: 'guest', email: 'guest@habuilt.com', user_metadata: { full_name: 'Habuilt Champion' } };
  } else if (!activeUser.value) {
    activeUser.value = null;
  }
  authLoading.value = false;

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      activeUser.value = session.user;
      localStorage.setItem('habuilt_cached_user', JSON.stringify(session.user));
    } else if (localStorage.getItem('habuilt_guest_mode') === 'true') {
      activeUser.value = { id: 'guest', email: 'guest@habuilt.com', user_metadata: { full_name: 'Habuilt Champion' } };
    } else {
      activeUser.value = null;
      localStorage.removeItem('habuilt_cached_user');
    }
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
              localStorage.setItem('habuilt_cached_user', JSON.stringify(data.user));
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
