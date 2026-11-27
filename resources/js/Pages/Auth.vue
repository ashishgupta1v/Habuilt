<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { readStoredTodaySummary } from '@/lib/todaySummary';
import { bindLandingMotion } from '@/lib/calmMotion';
import { supabase } from '@/lib/supabase';
import { authFormError } from '@/lib/authFlow';
import { handoffRefreshToken } from '@/lib/browserSession';
import { importGuestListForSignedInUser } from '@/lib/guestImport';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Mail, Lock, Check, ArrowUpRight, ShieldCheck } from 'lucide-vue-next';
import HabuiltLogo from '@/Components/Brand/HabuiltLogo.vue';
import AppInstallModal from '@/Components/Modals/AppInstallModal.vue';

const emit = defineEmits(['login-success']);

const email = ref('');
const password = ref('');
const mode = ref('login');
const loading = ref(false);
const error = ref('');
const successMessage = ref('');
let nativeBackButtonHandle = null;

const onAuthError = (event) => {
  error.value = event?.detail || 'Google sign-in could not be completed. Try again.';
};

const isAppInstallModalOpen = ref(false);
const deferredInstallPrompt = ref(null);
const canInstallPwa = ref(false);

const onBeforeInstallPrompt = (e) => {
  e.preventDefault();
  deferredInstallPrompt.value = e;
  canInstallPwa.value = true;
};

const handleTriggerInstallPwa = async () => {
  if (deferredInstallPrompt.value) {
    try {
      deferredInstallPrompt.value.prompt();
      const { outcome } = await deferredInstallPrompt.value.userChoice;
      if (outcome === 'accepted') {
        canInstallPwa.value = false;
        deferredInstallPrompt.value = null;
      }
    } catch {
      isAppInstallModalOpen.value = true;
    }
  } else {
    isAppInstallModalOpen.value = true;
  }
};

const landingRoot = ref(null);
const landingSummary = ref(readStoredTodaySummary(typeof localStorage !== 'undefined' ? localStorage : null));
let landingMotion = null;

// Interactive sample preview (in-memory only; never writes to user check-in storage)
const previewItems = ref([
  { id: 'sample-1', label: 'Morning water', time: '07:30', kept: true },
  { id: 'sample-2', label: 'Deep focus block', time: '09:30', kept: false },
  { id: 'sample-3', label: 'Screens off', time: '21:30', kept: false },
]);

const hasStoredHabits = computed(() => Number(landingSummary.value?.total || 0) > 0);

const previewKeptCount = computed(() => previewItems.value.filter((item) => item.kept).length);

const phoneHeroLabel = computed(() => {
  if (hasStoredHabits.value) return landingSummary.value.hero;
  return `${previewKeptCount.value} of ${previewItems.value.length} kept today`;
});

const phoneProgressPct = computed(() => {
  if (hasStoredHabits.value) {
    const total = Number(landingSummary.value?.total || 0);
    const done = Number(landingSummary.value?.done || 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }
  return Math.round((previewKeptCount.value / previewItems.value.length) * 100);
});

const togglePreviewItem = (id) => {
  previewItems.value = previewItems.value.map((item) =>
    item.id === id ? { ...item, kept: !item.kept } : item
  );
};

const refreshLandingSummary = () => {
  landingSummary.value = readStoredTodaySummary(typeof localStorage !== 'undefined' ? localStorage : null);
};

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('habuilt-auth-error', onAuthError);
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      canInstallPwa.value = false;
      deferredInstallPrompt.value = null;
    });

    const lastErr = localStorage.getItem('habuilt_auth_last_error');
    if (lastErr) {
      error.value = lastErr;
      localStorage.removeItem('habuilt_auth_last_error');
    }

    refreshLandingSummary();
    window.addEventListener('storage', refreshLandingSummary);
    landingMotion = bindLandingMotion(landingRoot.value);

    if (Capacitor.isNativePlatform()) {
      try {
        App.addListener('backButton', () => {
          if (mode.value !== 'login') {
            mode.value = 'login';
            error.value = '';
            successMessage.value = '';
          } else {
            App.exitApp();
          }
        }).then(handle => {
          nativeBackButtonHandle = handle;
        }).catch(() => {});
      } catch { /* native back button is optional */ }
    }
  }
});

onUnmounted(() => {
  if (nativeBackButtonHandle) {
    try { nativeBackButtonHandle.remove(); } catch { /* already removed */ }
    nativeBackButtonHandle = null;
  }
  landingMotion?.revert();
  landingMotion = null;
  if (typeof window !== 'undefined') {
    window.removeEventListener('habuilt-auth-error', onAuthError);
    window.removeEventListener('storage', refreshLandingSummary);
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }
});

const finishSignIn = async (session) => {
  try { localStorage.removeItem('habuilt_guest_mode'); } catch { /* guest flag is optional */ }
  const refresh = session?.refresh_token;
  if (typeof refresh !== 'string' || refresh.trim() === '') {
    throw new Error('Sign-in did not return a session.');
  }
  const user = await handoffRefreshToken(refresh);
  try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* refresh material is already in the cookie */ }
  if (!user) {
    throw new Error('Could not start a secure session. Try again.');
  }
  try {
    await importGuestListForSignedInUser(user.id, localStorage);
  } catch {
    console.warn('Dropped guest import');
  }
  emit('login-success', user);
};

const handleAuth = async () => {
  loading.value = true;
  error.value = '';
  successMessage.value = '';
  const cleanEmail = (email.value || '').trim();
  const cleanPassword = password.value;
  try {
    if (mode.value === 'signup' && cleanPassword.length < 6) {
      error.value = 'Use at least 6 characters.';
      return;
    }
    if (mode.value === 'signup') {
      const { data, error: e } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword,
      });
      if (e) throw e;
      if (data?.session?.user) {
        await finishSignIn(data.session);
      } else {
        successMessage.value = 'Account created. Check your email to confirm, then sign in.';
        mode.value = 'login';
      }
    } else {
      const { data, error: e } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });
      if (e) throw e;
      if (data?.session) {
        await finishSignIn(data.session);
      }
    }
  } catch (e) {
    error.value = authFormError(e);
  } finally {
    loading.value = false;
  }
};

const handleGoogle = async () => {
  error.value = '';
  loading.value = true;
  try {
    const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
    const redirectUrl = isNative ? 'habuilt://auth/callback' : `${window.location.origin}/auth/callback`;
    const { data, error: e } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectUrl, skipBrowserRedirect: isNative },
    });
    if (e) throw e;
    if (isNative && data?.url) {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: data.url, windowName: '_self' });
    }
  } catch (e) {
    error.value = e?.message || 'Google authentication error.';
  } finally {
    loading.value = false;
  }
};

const startWithHabit = () => {
  const station = typeof document !== 'undefined' ? document.getElementById('auth-station') : null;
  if (station && typeof station.scrollIntoView === 'function') {
    station.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
</script>

<template>
  <div class="calm-landing" ref="landingRoot">
    <header class="calm-landing__bar">
      <HabuiltLogo with-text :show-badge="false" size="sm" />
      <nav class="calm-landing__nav" aria-label="Landing">
        <a class="calm-landing__nav-link" href="#how-it-works">How it works</a>
        <a class="calm-landing__nav-link" href="#calm-preview">Preview</a>
        <a class="calm-btn calm-btn--quiet" href="#auth-station">Sign in</a>
      </nav>
    </header>

    <main>
      <section class="calm-landing__hero">
        <div class="calm-landing__copy">
          <h1 data-calm-reveal>Keep today's<br>list.</h1>
          <p class="calm-landing__lead" data-calm-reveal>
            Habuilt keeps the habits on today's list, the next reminder, and a partner's Kept or Not yet.
            An empty day says Nothing scheduled today.
          </p>
          <div class="calm-landing__actions" data-calm-reveal>
            <a class="calm-btn" href="#auth-station">
              <span>Sign in</span>
              <ArrowUpRight :size="17" aria-hidden="true" />
            </a>
            <a class="calm-btn calm-btn--quiet" href="#calm-preview">Try preview</a>
          </div>
          <ul class="calm-landing__proof" data-calm-reveal aria-label="Included">
            <li><Check :size="15" aria-hidden="true" /> <span>Local-first storage</span></li>
            <li><Check :size="15" aria-hidden="true" /> <span>Quiet partner status</span></li>
            <li><Check :size="15" aria-hidden="true" /> <span>Web &amp; Android sync</span></li>
          </ul>
        </div>
        <div id="calm-preview" class="calm-landing__phone-col">
          <aside class="calm-phone" data-calm-phone aria-label="Today on this device">
            <div class="calm-phone__island" aria-hidden="true"></div>
            <div class="calm-phone__screen">
              <div class="calm-phone__top">
                <p class="calm-phone__mark">{{ hasStoredHabits ? 'Today' : 'Interactive preview' }}</p>
                <span class="calm-phone__pct">{{ phoneProgressPct }}%</span>
              </div>
              <p class="calm-phone__hero">{{ phoneHeroLabel }}</p>
              <div class="calm-phone__meter" aria-hidden="true">
                <span :style="{ width: `${phoneProgressPct}%` }"></span>
              </div>

              <div v-if="!hasStoredHabits" class="calm-phone__checklist" role="group" aria-label="Interactive sample habits">
                <button
                  v-for="item in previewItems"
                  :key="item.id"
                  type="button"
                  class="calm-phone__item"
                  :class="{ 'is-kept': item.kept }"
                  :aria-pressed="item.kept ? 'true' : 'false'"
                  @click="togglePreviewItem(item.id)"
                >
                  <span class="calm-phone__check" aria-hidden="true">
                    <Check v-if="item.kept" :size="14" stroke-width="2.6" />
                  </span>
                  <span class="calm-phone__item-copy">
                    <strong>{{ item.label }}</strong>
                    <small>{{ item.time }}</small>
                  </span>
                </button>
              </div>

              <ul v-else class="calm-phone__summary">
                <li><span>Streak</span><strong>{{ landingSummary.streak }}</strong></li>
                <li><span>Reminder</span><strong>{{ landingSummary.reminder }}</strong></li>
                <li><span>Partner</span><strong>{{ landingSummary.partner }}</strong></li>
              </ul>

              <button
                v-if="!hasStoredHabits || landingSummary.showAddHabit"
                class="calm-btn calm-phone__cta"
                type="button"
                @click="startWithHabit"
              >
                {{ hasStoredHabits ? 'Add a habit' : 'Start your list' }}
              </button>
            </div>
          </aside>
        </div>
      </section>

      <section id="how-it-works" class="calm-landing__facts" data-calm-section aria-label="What Habuilt keeps">
        <article class="calm-fact calm-fact--accent">
          <div class="calm-fact__head">
            <h2>Today</h2>
            <span class="calm-fact__pill">Checklist</span>
          </div>
          <p>Habits kept today, your streak, and the next reminder.</p>
          <div class="calm-fact__sample" aria-hidden="true">
            <span class="calm-fact__check is-done"><Check :size="12" stroke-width="2.8" /></span>
            <span>Morning routine</span>
            <span class="calm-fact__status">Kept</span>
          </div>
        </article>
        <article class="calm-fact">
          <div class="calm-fact__head">
            <h2>Partner</h2>
            <span class="calm-fact__pill calm-fact__pill--quiet">Paired</span>
          </div>
          <p>An accepted partner shows Kept or Not yet. A pending invite stays No partner yet.</p>
          <div class="calm-fact__chips" aria-hidden="true">
            <span class="is-on">Kept</span>
            <span>Not yet</span>
          </div>
        </article>
        <article class="calm-fact">
          <div class="calm-fact__head">
            <h2>Review</h2>
            <span class="calm-fact__pill calm-fact__pill--quiet">Weekly</span>
          </div>
          <p>The review reads the week from your own check-ins.</p>
          <div class="calm-fact__dots" aria-hidden="true">
            <span class="is-on"></span>
            <span class="is-on"></span>
            <span class="is-on"></span>
            <span class="is-on"></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </article>
      </section>

      <section id="auth-station" class="calm-auth" data-calm-section>
        <div class="calm-auth__intro">
          <h2>
            {{ mode === 'signup' ? 'Create an account' : 'Sign in' }}
          </h2>
          <p class="calm-auth__sub">
            Keep your list local on this device or sign in to sync across web and Android.
          </p>
          <div class="calm-auth__trust">
            <ShieldCheck :size="16" aria-hidden="true" />
            <span>Your check-ins stay private and exportable anytime.</span>
          </div>
        </div>

        <div class="calm-auth__panel">
          <p v-if="error" class="calm-auth__error" role="alert">{{ error }}</p>
          <p v-if="successMessage" class="calm-auth__ok" role="status">{{ successMessage }}</p>

          <form @submit.prevent="handleAuth">
            <label>
              <Mail :size="16" aria-hidden="true" />
              <input v-model="email" type="email" autocomplete="email" required placeholder="Email" />
            </label>
            <label>
              <Lock :size="16" aria-hidden="true" />
              <input v-model="password" type="password" :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'" :minlength="mode === 'signup' ? 6 : undefined" required placeholder="Password" />
            </label>
            <p v-if="mode === 'signup'" class="calm-auth__hint">Use at least 6 characters.</p>
            <button class="calm-btn calm-auth__submit" type="submit" :disabled="loading">
              {{ loading ? 'Working…' : 'Continue' }}
            </button>
          </form>

          <div class="calm-auth__alts">
            <button type="button" @click="handleGoogle">Google</button>
            <button type="button" @click="mode = mode === 'signup' ? 'login' : 'signup'">
              {{ mode === 'signup' ? 'Have an account? Sign in' : 'Create an account' }}
            </button>
          </div>
        </div>
      </section>
    </main>

    <footer>
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
      <a href="/disclaimer">Disclaimer</a>
      <button type="button" @click="isAppInstallModalOpen = true">Install</button>
    </footer>

    <AppInstallModal
      :is-open="isAppInstallModalOpen"
      :can-install-native="canInstallPwa"
      @close="isAppInstallModalOpen = false"
      @trigger-install="handleTriggerInstallPwa"
    />
  </div>
</template>

<style scoped>
/* Hallmark · checked: 2026-11-13 · genre: modern-minimal (inferred)
 * floor: 0 FAIL · fixed: 48, 63, 26a · structural: printed, not rebuilt
 * waive: 29 landing bar stays a solid tint, not a wash behind the headline
 * waive: 24b spacing stays, the polish keeps the layout
 * waive: 47b one phone frame holds the real today summary
 * built: the project · redesign: polish · v2.0.0 */
.calm-landing {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--page-bg);
  color: var(--text-primary);
  font-family: var(--font-base);
  font-size: 16px;
  overflow-x: clip;
}
.calm-landing__bar,
.calm-landing__hero,
.calm-landing__facts,
footer {
  width: min(1120px, calc(100% - (var(--calm-page-gutter, 20px) * 2)));
  margin-inline: auto;
}
.calm-landing__bar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: calc(14px + env(safe-area-inset-top, 0px)) 0 14px;
  background: color-mix(in srgb, var(--page-bg) 88%, transparent);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid color-mix(in srgb, var(--surface-border) 75%, transparent);
}
.calm-landing__nav {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}
.calm-landing__nav-link {
  display: none;
  align-items: center;
  min-height: 44px;
  padding: 0 12px;
  border-radius: 999px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.18s ease, background-color 0.18s ease;
}
.calm-landing__nav-link:hover {
  color: var(--text-primary);
  background: color-mix(in srgb, var(--surface-card) 85%, transparent);
}
@media (min-width: 768px) {
  .calm-landing__nav-link {
    display: inline-flex;
  }
}
.calm-landing__hero {
  display: grid;
  grid-template-columns: minmax(0, 34rem) minmax(240px, 320px);
  justify-content: center;
  gap: clamp(24px, 4vw, 56px);
  align-items: center;
  padding: clamp(20px, 4vw, 44px) 0 clamp(36px, 5vw, 64px);
}
.calm-landing__copy h1,
.calm-landing__facts h2,
.calm-auth h2 {
  font-family: var(--font-display);
  letter-spacing: -0.04em;
}
.calm-landing__copy h1 {
  margin: 0 0 16px;
  max-width: 12ch;
  font-size: var(--type-fluid-display, clamp(2.5rem, 1.35rem + 3.6vw, 5.15rem));
  font-weight: 650;
  line-height: 0.94;
  text-wrap: balance;
  overflow-wrap: break-word;
}
.calm-landing__lead {
  max-width: 38rem;
  margin: 0;
  color: var(--text-secondary);
  font-size: clamp(16px, 1.55vw, 18px);
  line-height: 1.55;
}
.calm-landing__actions,
.calm-pills,
.calm-auth__alts,
footer {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.calm-landing__actions { margin-top: 24px; }
.calm-pills { margin-top: 22px; }
.calm-landing__proof {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin: 22px 0 0;
  padding: 0;
  list-style: none;
  color: var(--text-secondary);
  font-size: 13.5px;
}
.calm-landing__proof li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.calm-landing__proof svg {
  color: var(--text-primary);
  flex-shrink: 0;
}
.calm-btn,
.calm-pill,
.calm-auth__alts button,
footer button {
  font: inherit;
  color: var(--text-primary);
  cursor: pointer;
}
.calm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  border: 1px solid var(--text-primary);
  border-radius: 999px;
  background: var(--accent);
  padding: 11px 20px;
  font-weight: 650;
  text-decoration: none;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, border-color 0.2s ease;
}
.calm-btn:hover { background: color-mix(in srgb, var(--accent) 78%, var(--surface-card)); }
.calm-btn--quiet {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
}
.calm-btn--quiet:hover {
  background: var(--surface-card);
  border-color: var(--text-primary);
}
.calm-btn:active,
.calm-pill:active,
.calm-auth__alts button:active {
  transform: scale(0.98);
}
.calm-pill {
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 100%;
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  background: var(--surface-card);
  padding: 10px 14px;
}
.calm-pill:hover { border-color: var(--text-primary); }
.calm-pill span { color: var(--text-secondary); font-size: 14px; }
.calm-landing__phone-col {
  align-self: start;
}
.calm-phone {
  position: relative;
  width: min(320px, 100%);
  margin-inline: auto;
  padding: 10px;
  border-radius: 40px;
  background: #171D18;
  border: 1px solid rgba(12, 17, 13, 0.12);
  box-shadow: 0 28px 60px -24px rgba(12, 17, 13, 0.28), 0 4px 12px rgba(12, 17, 13, 0.08);
  will-change: transform;
}
.calm-phone__island {
  width: 72px;
  height: 16px;
  margin: 2px auto 8px;
  border-radius: 999px;
  background: #0C110D;
}
.calm-phone__screen {
  display: flex;
  flex-direction: column;
  min-height: 492px;
  padding: 18px 16px 16px;
  border-radius: 30px;
  background: var(--page-bg);
  color: var(--text-primary);
}
.calm-phone__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 16px;
}
.calm-phone__mark {
  display: inline-flex;
  margin: 0;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 650;
}
.calm-phone__pct {
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  font-weight: 650;
  color: var(--text-secondary);
}
.calm-phone__hero {
  margin: 0 0 12px;
  font-family: var(--font-display);
  font-size: clamp(1.55rem, 3.6vw, 2.25rem);
  font-weight: 650;
  line-height: 1.04;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
  text-wrap: balance;
  overflow-wrap: break-word;
}
.calm-phone__meter {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: #E4E6DC;
  overflow: hidden;
  margin-bottom: 16px;
}
.calm-phone__meter span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--text-primary);
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.calm-phone__checklist {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}
.calm-phone__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  padding: 10px 12px;
  border: 1px solid #E4E6DC;
  border-radius: 16px;
  background: #ffffff;
  color: var(--text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s ease, background-color 0.18s ease, transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}
.calm-phone__item:hover {
  border-color: var(--text-primary);
}
.calm-phone__item:active {
  transform: scale(0.985);
}
.calm-phone__item.is-kept {
  background: color-mix(in srgb, var(--accent) 26%, #ffffff);
  border-color: color-mix(in srgb, var(--text-primary) 24%, #E4E6DC);
}
.calm-phone__check {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 1.5px solid #C8CCC0;
  background: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background-color 0.18s ease, border-color 0.18s ease;
}
.calm-phone__item.is-kept .calm-phone__check {
  background: var(--accent);
  border-color: var(--text-primary);
  color: var(--text-primary);
}
.calm-phone__item-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.calm-phone__item-copy strong {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.25;
}
.calm-phone__item-copy small {
  font-size: 12px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
.calm-phone__summary {
  margin: 0 0 18px;
  padding: 0;
  list-style: none;
}
.calm-phone__summary li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 0;
  border-top: 1px solid var(--surface-border);
}
.calm-phone__summary li span { color: var(--text-secondary); font-size: 13px; }
.calm-phone__summary li strong {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.03em;
}
.calm-phone__cta { margin-top: auto; width: 100%; justify-content: center; }
.calm-landing__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  padding: 12px 0 64px;
}
.calm-fact {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px;
  border: 1px solid #E4E6DC;
  border-radius: 24px;
  background: #ffffff;
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.22s ease;
}
.calm-fact:hover {
  transform: translateY(-2px);
  border-color: #C8CCC0;
}
.calm-fact--accent {
  background: color-mix(in srgb, var(--accent) 16%, #ffffff);
}
.calm-fact__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.calm-landing__facts h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 650;
}
.calm-fact__pill {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 650;
}
.calm-fact__pill--quiet {
  background: var(--page-bg);
  border: 1px solid #E4E6DC;
  color: var(--text-secondary);
}
.calm-landing__facts p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.5;
}
.calm-fact__sample {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid #E4E6DC;
  font-size: 13px;
  font-weight: 500;
}
.calm-fact__check {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: var(--accent);
  border: 1px solid var(--text-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.calm-fact__status {
  margin-left: auto;
  font-size: 12px;
  font-weight: 650;
  color: var(--text-secondary);
}
.calm-fact__chips {
  margin-top: auto;
  display: flex;
  gap: 8px;
}
.calm-fact__chips span {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid #E4E6DC;
  background: var(--page-bg);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
}
.calm-fact__chips span.is-on {
  background: var(--accent);
  border-color: var(--text-primary);
  color: var(--text-primary);
}
.calm-fact__dots {
  margin-top: auto;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  padding-top: 8px;
}
.calm-fact__dots span {
  height: 10px;
  border-radius: 999px;
  background: #E4E6DC;
}
.calm-fact__dots span.is-on {
  background: var(--text-primary);
}
.calm-auth {
  width: min(880px, calc(100% - (var(--calm-page-gutter, 16px) * 2)));
  margin: 0 auto 48px;
  padding: clamp(20px, 3vw, 32px);
  border: 1px solid var(--surface-border);
  border-radius: 28px;
  background: var(--surface-card);
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  gap: clamp(20px, 4vw, 48px);
  align-items: start;
}
.calm-auth__intro h2 {
  margin: 0 0 12px;
  font-size: 36px;
  font-weight: 650;
}
.calm-auth__sub {
  margin: 0 0 16px;
  color: var(--text-secondary);
  line-height: 1.5;
}
.calm-auth__trust {
  display: inline-flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 16px;
  background: var(--page-bg);
  border: 1px solid #E4E6DC;
  color: var(--text-secondary);
  font-size: 13.5px;
  line-height: 1.45;
}
.calm-auth__trust svg {
  color: var(--text-primary);
  flex-shrink: 0;
  margin-top: 2px;
}
.calm-auth form { display: grid; gap: 10px; }
.calm-auth label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  border: 1px solid var(--surface-border);
  border-radius: 14px;
  padding: 12px 14px;
  background: #ffffff;
}
.calm-auth label:focus-within {
  border-color: var(--text-primary);
}
.calm-auth__submit {
  width: 100%;
  justify-content: center;
}
.calm-btn:focus-visible,
.calm-pill:focus-visible,
.calm-landing__nav-link:focus-visible,
.calm-phone__item:focus-visible,
.calm-auth input:focus-visible,
.calm-auth__alts button:focus-visible,
footer a:focus-visible,
footer button:focus-visible {
  outline: 2px solid var(--text-primary);
  outline-offset: 3px;
}
.calm-btn:disabled,
.calm-pill:disabled,
.calm-auth__alts button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.calm-auth input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
}
.calm-auth__hint { margin: 0; color: var(--text-muted); font-size: 13px; }
.calm-auth__error { color: var(--danger); }
.calm-auth__ok { color: var(--semantic-success); }
.calm-auth__alts { margin-top: 16px; }
.calm-auth__alts button,
footer a,
footer button {
  border: 0;
  background: transparent;
  color: var(--text-primary);
  text-decoration: underline;
  text-underline-offset: 3px;
  /* 44px touch target via min-height/min-width; keep text-button appearance */
  min-height: 44px;
  min-width: 44px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-block: 10px;
}
footer {
  align-items: center;
  justify-content: flex-start;
  padding: 8px 0 calc(32px + env(safe-area-inset-bottom, 0px));
}
@media (min-width: 768px) {
  .calm-landing__phone-col {
    position: sticky;
    top: 96px;
  }
}
@media (max-width: 767px) {
  .calm-landing__hero {
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
    padding-top: 12px;
    padding-bottom: 32px;
  }
  .calm-landing__copy h1 { max-width: 12ch; }
  .calm-phone { width: min(300px, 100%); }
  .calm-phone__screen { min-height: 0; }
  .calm-landing__actions,
  .calm-pills {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
  .calm-landing__actions .calm-btn {
    width: 100%;
    justify-content: center;
  }
  .calm-landing__facts { grid-template-columns: 1fr; gap: 14px; padding-bottom: 40px; }
  .calm-auth { grid-template-columns: 1fr; gap: 20px; }
}
@media (prefers-reduced-motion: reduce) {
  .calm-landing [data-calm-reveal],
  .calm-landing [data-calm-section],
  .calm-phone,
  .calm-btn,
  .calm-pill {
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
    transition: none;
    animation: none;
  }
}
</style>
