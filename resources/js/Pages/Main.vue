<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { supabase } from '@/lib/supabase';
import Dashboard from './Dashboard.vue';
import Auth from './Auth.vue';
import FirstRunOnboarding from '@/Components/Onboarding/FirstRunOnboarding.vue';
import HabuiltLogo from '@/Components/Brand/HabuiltLogo.vue';
import { LogOut, Download, Share2, AlertTriangle } from 'lucide-vue-next';

const cachedUserJson = typeof window !== 'undefined' ? localStorage.getItem('habuilt_cached_user') : null;
const isGuestPreCheck = typeof window !== 'undefined' && localStorage.getItem('habuilt_guest_mode') === 'true';
const authLoading = ref(!cachedUserJson && !isGuestPreCheck);

// PWA Install prompt
const deferredPrompt = ref(null);
const showInstallBtn = ref(false);
const isIOS = ref(false);
const showIOSInstructions = ref(false);

// ── Exit-confirmation dialog ───────────────────────────────────────
// Shown when back-button is pressed while inside the app
const showExitDialog = ref(false);

const checkIOS = () => {
  const ua = navigator.userAgent;
  isIOS.value = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS.value && !window.matchMedia('(display-mode: standalone)').matches) {
    showInstallBtn.value = true;
  }
};

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt.value = e;
  showInstallBtn.value = true;
});

window.addEventListener('appinstalled', () => {
  showInstallBtn.value = false;
  deferredPrompt.value = null;
});

const handleInstall = async () => {
  if (isIOS.value) { showIOSInstructions.value = true; return; }
  if (!deferredPrompt.value) return;
  deferredPrompt.value.prompt();
  const { outcome } = await deferredPrompt.value.userChoice;
  if (outcome === 'accepted') showInstallBtn.value = false;
  deferredPrompt.value = null;
};

const todayDate = new Date();
const urlParams = new URLSearchParams(window.location.search);
const qMonth = Number.parseInt(urlParams.get('month') ?? '', 10);
const qYear  = Number.parseInt(urlParams.get('year')  ?? '', 10);

const month = ref(Number.isInteger(qMonth) && qMonth >= 1 && qMonth <= 12 ? qMonth : todayDate.getMonth() + 1);
const year  = ref(Number.isInteger(qYear)  && qYear  >= 2000 && qYear  <= 2100 ? qYear  : todayDate.getFullYear());

const monthDays      = computed(() => new Date(year.value, month.value, 0).getDate());
const isCurrentMonth = computed(() => year.value === todayDate.getFullYear() && month.value === todayDate.getMonth() + 1);
const isFutureMonth  = computed(() => year.value * 100 + month.value > todayDate.getFullYear() * 100 + todayDate.getMonth() + 1);
const currentDay     = computed(() => isCurrentMonth.value ? todayDate.getDate() : monthDays.value);

const previousMonth = computed(() => {
  let m = month.value - 1, y = year.value;
  if (m < 1) { m = 12; y--; }
  return { month: m, year: y };
});
const nextMonth = computed(() => {
  let m = month.value + 1, y = year.value;
  if (m > 12) { m = 1; y++; }
  return { month: m, year: y };
});

const isGuestActive = ref(localStorage.getItem('habuilt_guest_mode') === 'true');

let initialUser = null;
try { initialUser = cachedUserJson ? JSON.parse(cachedUserJson) : null; } catch { initialUser = null; }
if (!initialUser && isGuestActive.value) {
  initialUser = { id: 'guest', email: 'guest@habuilt.com', user_metadata: { full_name: 'Habuilt Champion' } };
}
const activeUser = ref(initialUser);

const userDisplayName = computed(() => {
  return activeUser.value?.user_metadata?.full_name ||
    activeUser.value?.user_metadata?.name ||
    (activeUser.value?.email ? activeUser.value.email.split('@')[0] : 'Warrior');
});

const userInitial = computed(() => {
  return userDisplayName.value.trim().charAt(0).toUpperCase() || 'W';
});

const userTrackLabel = computed(() => {
  return `✨ ${userDisplayName.value}'s Workspace`;
});

// ── First-Run Onboarding Flow Gate ────────────────────────────────
const checkIsOnboardingComplete = (user) => {
  if (!user) return true;
  const uid = user.id || 'guest';
  if (typeof window === 'undefined') return true;

  if (localStorage.getItem(`habuilt_onboarding_completed_${uid}`) === 'true') {
    return true;
  }
  if (user.user_metadata?.onboarding_completed === true) {
    return true;
  }
  if (localStorage.getItem(`habuilt_active_protocol_id_${uid}`)) {
    return true;
  }
  // Check if legacy master profile
  const lowerUid = String(uid).toLowerCase();
  const email = (user.email || '').toLowerCase();
  if (lowerUid === 'ashish' || lowerUid === 'jyoti' || email === 'ashishgupta1v@gmail.com' || email === 'goyaljyoti007@gmail.com') {
    return true;
  }
  return false;
};

const isOnboardingComplete = ref(checkIsOnboardingComplete(activeUser.value));

const handleOnboardingComplete = async (payload) => {
  const uid = activeUser.value?.id || 'guest';

  if (typeof window !== 'undefined') {
    localStorage.setItem(`habuilt_onboarding_completed_${uid}`, 'true');
    localStorage.setItem(`habuilt_user_name_${uid}`, payload.displayName);
    localStorage.setItem(`habuilt_active_protocol_id_${uid}`, payload.archetypeId);
    if (payload.circadian) {
      localStorage.setItem(`habuilt_circadian_${uid}`, JSON.stringify(payload.circadian));
    }
  }

  if (activeUser.value) {
    const updated = {
      ...activeUser.value,
      user_metadata: {
        ...(activeUser.value.user_metadata || {}),
        full_name: payload.displayName,
        onboarding_completed: true,
        preferred_archetype: payload.archetypeId,
        focus_goal: payload.goal,
      }
    };
    activeUser.value = updated;
    if (typeof window !== 'undefined') {
      localStorage.setItem('habuilt_cached_user', JSON.stringify(updated));
    }
  }

  if (supabase && activeUser.value?.id && activeUser.value.id !== 'guest') {
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: payload.displayName,
          onboarding_completed: true,
          preferred_archetype: payload.archetypeId,
          focus_goal: payload.goal
        }
      });
      await supabase.from('user_settings').upsert({
        user_id: activeUser.value.id,
        enhanced_state: {
          onboarding_completed: true,
          focus_goal: payload.goal,
          circadian: payload.circadian
        },
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.debug('[Onboarding] Supabase sync fallback:', e);
    }
  }

  isOnboardingComplete.value = true;
};

const handleOnboardingSkip = () => {
  const uid = activeUser.value?.id || 'guest';
  if (typeof window !== 'undefined') {
    localStorage.setItem(`habuilt_onboarding_completed_${uid}`, 'true');
  }
  isOnboardingComplete.value = true;
};

const handleNavigateMonth = (target) => {
  if (typeof target === 'number') {
    let newMonth = month.value + target, newYear = year.value;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }
    month.value = newMonth;
    year.value = newYear;
  } else if (target && typeof target === 'object' && target.month && target.year) {
    month.value = Number(target.month);
    year.value = Number(target.year);
  }
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.set('month', month.value);
    url.searchParams.set('year', year.value);
    window.history.replaceState({}, '', url.toString());
  }
};

// ── History / Back-button management ─────────────────────────────
// When user enters the app (guest or auth), push a sentinel history
// entry so that browser back-button is intercepted.
const APP_HISTORY_KEY = 'habuilt-app-state';

const pushAppHistoryEntry = () => {
  if (typeof window === 'undefined') return;
  if (window.history.state?.[APP_HISTORY_KEY]) return;
  try {
    window.history.pushState({ [APP_HISTORY_KEY]: true }, '', window.location.href);
  } catch {}
};

const handlePopState = (event) => {
  if (!activeUser.value) return; // Not inside app — let it navigate freely

  // If popping to an internal app state (e.g. mobile tab switch), do not show exit modal
  if (event.state?.[APP_HISTORY_KEY]) {
    return;
  }

  // Popped off app state to landing/external history. Re-push app state to keep primed.
  try {
    window.history.pushState({ [APP_HISTORY_KEY]: true }, '', window.location.href);
  } catch {}
  showExitDialog.value = true;
};

// Confirm exit / sign-out from dialog
const confirmSignOut = async () => {
  showExitDialog.value = false;
  await handleSignOut();
};

const dismissExitDialog = () => {
  showExitDialog.value = false;
};

const handleKeydown = (e) => {
  if (e.key === 'Escape' && showExitDialog.value) {
    dismissExitDialog();
  }
};

// ── Auth helpers ──────────────────────────────────────────────────
const enterGuestMode = (guestUser) => {
  const user = guestUser || { id: 'guest', email: 'guest@habuilt.com', user_metadata: { full_name: 'Habuilt Champion' } };
  localStorage.setItem('habuilt_guest_mode', 'true');
  localStorage.setItem('habuilt_cached_user', JSON.stringify(user));
  isGuestActive.value = true;
  activeUser.value = user;
  isOnboardingComplete.value = checkIsOnboardingComplete(user);
  pushAppHistoryEntry(); // ← sentinel so back-button is intercepted
};



const handleSignOut = async () => {
  localStorage.removeItem('habuilt_guest_mode');
  localStorage.removeItem('habuilt_cached_user');
  isGuestActive.value = false;
  activeUser.value = null;
  showExitDialog.value = false;
  try {
    await supabase.auth.signOut();
  } catch {}
  // Reset history state to clean landing page
  try {
    window.history.replaceState({ [APP_HISTORY_KEY]: false }, '', window.location.pathname);
  } catch {}
};

onMounted(async () => {
  // If user was already logged in (page refresh), push the sentinel
  if (activeUser.value) {
    pushAppHistoryEntry();
  }

  window.addEventListener('popstate', handlePopState);
  window.addEventListener('keydown', handleKeydown);

  window.addEventListener('habuilt-guest-auth', (e) => {
    enterGuestMode(e?.detail);
  });

  // Configure Native Status Bar
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#090D16' });
  } catch { /* non-native */ }

  try {
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ data: {} }), 2500));
    const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
    if (session?.user) {
      activeUser.value = session.user;
      isOnboardingComplete.value = checkIsOnboardingComplete(session.user);
      localStorage.setItem('habuilt_cached_user', JSON.stringify(session.user));
      pushAppHistoryEntry();
    } else if (isGuestActive.value) {
      activeUser.value = activeUser.value || { id: 'guest', email: 'guest@habuilt.com', user_metadata: { full_name: 'Habuilt Champion' } };
      isOnboardingComplete.value = checkIsOnboardingComplete(activeUser.value);
      pushAppHistoryEntry();
    } else if (!activeUser.value) {
      activeUser.value = null;
    }
  } catch (err) {
    console.debug('[MainAuth] Session check fallback:', err);
  } finally {
    authLoading.value = false;
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      activeUser.value = session.user;
      isOnboardingComplete.value = checkIsOnboardingComplete(session.user);
      localStorage.setItem('habuilt_cached_user', JSON.stringify(session.user));
      pushAppHistoryEntry();
    } else if (localStorage.getItem('habuilt_guest_mode') === 'true') {
      activeUser.value = activeUser.value || { id: 'guest', email: 'guest@habuilt.com', user_metadata: { full_name: 'Habuilt Champion' } };
      isOnboardingComplete.value = checkIsOnboardingComplete(activeUser.value);
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
      try { await Browser.close(); } catch { /* ignore */ }
      if (event.url) {
        const rawUrl = event.url
          .replace('habuilt://', 'https://habuilt.com/')
          .replace('com.habuilt.app://', 'https://habuilt.com/');
        try {
          const parsed = new URL(rawUrl);
          const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
          const accessToken  = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const code = parsed.searchParams.get('code') || hashParams.get('code');

          if (accessToken && refreshToken) {
            const { data } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            if (data?.user) {
              activeUser.value = data.user;
              localStorage.setItem('habuilt_cached_user', JSON.stringify(data.user));
              pushAppHistoryEntry();
            }
          } else if (code) {
            const { data } = await supabase.auth.exchangeCodeForSession(code);
            if (data?.user) {
              activeUser.value = data.user;
              localStorage.setItem('habuilt_cached_user', JSON.stringify(data.user));
              pushAppHistoryEntry();
            }
          }
        } catch (e) { console.warn('Error parsing deep link auth:', e); }
      }
    });
  } catch { /* non-native */ }

  // ── Web OAuth Code Exchange ──
  if (typeof window !== 'undefined' && !window.Capacitor?.isNativePlatform?.()) {
    const search = window.location.search;
    if (search && search.includes('code=')) {
      const params = new URLSearchParams(search);
      const code = params.get('code');
      if (code) {
        try {
          const { data } = await supabase.auth.exchangeCodeForSession(code);
          if (data?.user) {
            activeUser.value = data.user;
            localStorage.setItem('habuilt_cached_user', JSON.stringify(data.user));
            window.history.replaceState({}, document.title, window.location.pathname);
            pushAppHistoryEntry();
          }
        } catch (e) { console.warn('Error exchanging web OAuth code:', e); }
      }
    }
  }

  checkIOS();
});

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState);
  window.removeEventListener('keydown', handleKeydown);
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
    <template v-if="activeUser">
      <!-- First-Run Guided Onboarding Flow -->
      <FirstRunOnboarding
        v-if="!isOnboardingComplete"
        :initial-name="userDisplayName"
        :user-email="activeUser.email"
        :user-id="activeUser.id"
        @complete="handleOnboardingComplete"
        @skip="handleOnboardingSkip"
      />

      <!-- Main Habit Matrix & Workspace -->
      <div v-else class="app-root">
        <main class="app-main-content">
          <nav class="app-nav">
            <div class="app-nav__container">
              <div class="app-nav__left">
                <HabuiltLogo size="md" :with-text="true" />
                <!-- Guest mode indicator -->
                <span v-if="isGuestActive" class="guest-mode-pill">
                  Guest Preview
                </span>
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

                <div
                  class="user-badge"
                  :title="isGuestActive ? 'Guest Mode Active — Data Saved Locally' : activeUser.email"
                  :style="{ cursor: 'default' }"
                >
                  <div class="user-avatar user-avatar--generic">
                    {{ userInitial }}
                  </div>
                  <span class="user-badge__text">{{ activeUser.email }}</span>
                  <span class="user-track-pill user-track-pill--generic">
                    {{ userTrackLabel }}
                  </span>
                </div>

                <button @click="handleSignOut" class="btn btn--logout" title="Sign out of Habuilt">
                  <LogOut class="icon-sm" />
                  <span class="logout-text">{{ isGuestActive ? 'Exit Guest' : 'Sign Out' }}</span>
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
            @navigate-month="handleNavigateMonth"
            @sign-out="handleSignOut"
          />
        </main>
      </div>
    </template>

    <Auth v-else @guest-login="enterGuestMode" />
  </template>

  <!-- ── Exit / Sign-out Confirmation Dialog ─────────────────────── -->
  <Teleport to="body">
    <Transition name="exit-dialog">
      <div v-if="showExitDialog" class="exit-overlay" @click.self="dismissExitDialog">
        <div class="exit-dialog" role="dialog" aria-modal="true" aria-labelledby="exit-dialog-title">
          <div class="exit-dialog__icon">
            <AlertTriangle class="exit-dialog__icon-svg" />
          </div>
          <h2 id="exit-dialog-title" class="exit-dialog__title">
            {{ isGuestActive ? 'Exit Guest Mode?' : 'Sign out?' }}
          </h2>
          <p class="exit-dialog__body">
            <template v-if="isGuestActive">
              Your guest session will be ended and you'll return to the landing page. Create a free account to save your habits permanently.
            </template>
            <template v-else>
              You'll be returned to the sign-in screen. Your habits and streaks are safely synced to the cloud.
            </template>
          </p>
          <div class="exit-dialog__actions">
            <button class="exit-dialog__btn exit-dialog__btn--cancel" @click="dismissExitDialog">
              Stay in app
            </button>
            <button class="exit-dialog__btn exit-dialog__btn--confirm" @click="confirmSignOut">
              <LogOut class="exit-dialog__btn-icon" />
              {{ isGuestActive ? 'Exit to Landing Page' : 'Sign out' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>