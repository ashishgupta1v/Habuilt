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

const isGuestActive = ref(typeof window !== 'undefined' && localStorage.getItem('habuilt_guest_mode') === 'true');

let initialUser = null;
try {
  const cachedUserJson = typeof window !== 'undefined' ? localStorage.getItem('habuilt_cached_user') : null;
  initialUser = cachedUserJson ? JSON.parse(cachedUserJson) : null;
} catch {
  initialUser = null;
}
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

const enterUserSession = (user) => {
  if (!user) return;
  const isGuest = user.id === 'guest';
  if (isGuest) {
    isGuestActive.value = true;
    localStorage.setItem('habuilt_guest_mode', 'true');
  }
  localStorage.setItem('habuilt_cached_user', JSON.stringify(user));
  activeUser.value = user;
  isOnboardingComplete.value = checkIsOnboardingComplete(user);
  pushAppHistoryEntry(); // ← sentinel so back-button is intercepted
};

const enterGuestMode = (guestUser) => {
  isGuestActive.value = true;
  localStorage.setItem('habuilt_guest_mode', 'true');
  enterUserSession(guestUser || { id: 'guest', email: 'guest@habuilt.com', user_metadata: { full_name: 'Habuilt Champion' } });
};

const handleLoginSuccess = (user) => {
  enterUserSession(user);
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
    window.history.replaceState({ [APP_HISTORY_KEY]: false }, '', '/');
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

  // ── URL OAuth & Deep Link Handlers ──
  const processUrlAuthTokens = async () => {
    if (typeof window === 'undefined') return false;

    // 1. Process URL Hash (#access_token=...&refresh_token=... or #error=...)
    const rawHash = window.location.hash ? window.location.hash.replace(/^#/, '') : '';
    if (rawHash) {
      const hashParams = new URLSearchParams(rawHash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const errorDesc = hashParams.get('error_description') || hashParams.get('error');

      if (accessToken && refreshToken) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (error) throw error;
          if (data?.user) {
            enterUserSession(data.user);
            window.history.replaceState({}, document.title, '/');
            return true;
          }
        } catch (err) {
          console.warn('[MainAuth] Error setting session from hash:', err);
        }
      } else if (errorDesc) {
        console.warn('[MainAuth] OAuth error in hash:', errorDesc);
        localStorage.setItem('habuilt_auth_last_error', errorDesc);
        window.history.replaceState({}, document.title, '/');
      }
    }

    // 2. Process URL Query (?code=... or ?error=...)
    const rawSearch = window.location.search;
    if (rawSearch) {
      const searchParams = new URLSearchParams(rawSearch);
      const code = searchParams.get('code');
      const errorDesc = searchParams.get('error_description') || searchParams.get('error');

      if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (data?.user) {
            enterUserSession(data.user);
            window.history.replaceState({}, document.title, '/');
            return true;
          }
        } catch (err) {
          console.warn('[MainAuth] Error exchanging code for session:', err);
        }
      } else if (errorDesc) {
        console.warn('[MainAuth] OAuth error in query:', errorDesc);
        localStorage.setItem('habuilt_auth_last_error', errorDesc);
        window.history.replaceState({}, document.title, '/');
      }
    }

    return false;
  };

  // 1. Check if returning with OAuth tokens or code in URL
  const hasAuthParams = typeof window !== 'undefined' && (
    (window.location.hash && (window.location.hash.includes('access_token=') || window.location.hash.includes('error='))) ||
    (window.location.search && (window.location.search.includes('code=') || window.location.search.includes('error=')))
  );

  if (hasAuthParams) {
    authLoading.value = true;
    const handled = await processUrlAuthTokens();
    if (handled) {
      authLoading.value = false;
      return;
    }
  }

  // 2. Session check from Supabase or cached user
  try {
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ data: {} }), 2500));
    const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
    if (session?.user) {
      enterUserSession(session.user);
    } else if (activeUser.value) {
      enterUserSession(activeUser.value);
    } else if (isGuestActive.value) {
      enterGuestMode();
    } else {
      activeUser.value = null;
    }
  } catch (err) {
    console.debug('[MainAuth] Session check fallback:', err);
  } finally {
    authLoading.value = false;
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      enterUserSession(session.user);
    } else if (event === 'SIGNED_OUT') {
      activeUser.value = null;
      isGuestActive.value = false;
      localStorage.removeItem('habuilt_cached_user');
      localStorage.removeItem('habuilt_guest_mode');
    } else if (activeUser.value) {
      // Retain active cached user (offline or fast resume)
      isOnboardingComplete.value = checkIsOnboardingComplete(activeUser.value);
    } else if (localStorage.getItem('habuilt_guest_mode') === 'true') {
      enterGuestMode();
    }
  });

  // ── Native Deep Link Handler for OAuth Callback ──
  try {
    const { App } = await import('@capacitor/app');
    const { Browser } = await import('@capacitor/browser');

    const handleDeepLinkUrl = async (url) => {
      if (!url) return;
      try { await Browser.close(); } catch { /* ignore */ }

      let searchStr = '';
      let hashStr = '';
      try {
        const rawUrl = url
          .replace('habuilt://', 'https://www.habuilt.com/')
          .replace('com.habuilt.app://', 'https://www.habuilt.com/');
        const parsed = new URL(rawUrl);
        searchStr = parsed.search.replace(/^\?/, '');
        hashStr = parsed.hash.replace(/^#/, '');
      } catch {}

      if (!searchStr && !hashStr) {
        const queryIdx = url.indexOf('?');
        const hashIdx = url.indexOf('#');
        if (queryIdx !== -1) searchStr = url.substring(queryIdx + 1).split('#')[0];
        if (hashIdx !== -1) hashStr = url.substring(hashIdx + 1);
      }

      const hashParams = new URLSearchParams(hashStr);
      const searchParams = new URLSearchParams(searchStr);
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
      const code = searchParams.get('code') || hashParams.get('code');
      const errorDesc = hashParams.get('error_description') || searchParams.get('error_description') || hashParams.get('error') || searchParams.get('error');

      if (accessToken && refreshToken) {
        try {
          const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) throw error;
          if (data?.user) {
            enterUserSession(data.user);
          }
        } catch (e) {
          console.warn('[MainDeepLink] Error setting session:', e);
        }
      } else if (code) {
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          if (data?.user) {
            enterUserSession(data.user);
          }
        } catch (e) {
          console.warn('[MainDeepLink] Error exchanging code:', e);
        }
      } else if (errorDesc) {
        console.warn('[MainDeepLink] OAuth error:', errorDesc);
        localStorage.setItem('habuilt_auth_last_error', errorDesc);
      }
    };

    // Cold-start deep link (when app is launched by OS via intent)
    const launchUrl = await App.getLaunchUrl();
    if (launchUrl?.url) {
      await handleDeepLinkUrl(launchUrl.url);
    }

    // Warm deep link listener
    App.addListener('appUrlOpen', async (event) => {
      await handleDeepLinkUrl(event?.url);
    });
  } catch { /* non-native */ }

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

    <Auth v-else @guest-login="enterGuestMode" @login-success="handleLoginSuccess" />
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