<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '@/lib/supabase';
import Dashboard from './Dashboard.vue';
import Auth from './Auth.vue';
import { LogOut, LayoutDashboard, User, Download, Share2 } from 'lucide-vue-next';

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
    showIOSInstructions.value = !showIOSInstructions.value;
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

const handleSignOut = async () => {
  await supabase.auth.signOut();
};

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  activeUser.value = session?.user || null;
  authLoading.value = false;

  supabase.auth.onAuthStateChange((_event, session) => {
    activeUser.value = session?.user || null;
  });

  checkIOS();
});
</script>

<template>
  <div v-if="authLoading" class="app-loading">
    <div class="app-spinner">
      <svg class="spinner-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="spinner-fill" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
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
              <div class="app-nav__logo-icon">
                <LayoutDashboard class="icon-brand" />
              </div>
              <div class="app-nav__brand-info">
                <span class="app-nav__brand-text">Habuilt</span>
                <span class="app-nav__brand-tag">PRO</span>
              </div>
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
