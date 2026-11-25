<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { readStoredTodaySummary } from '@/lib/todaySummary';
import { bindLandingMotion } from '@/lib/calmMotion';
import { supabase } from '@/lib/supabase';
import { authFormError } from '@/lib/authFlow';
import { handoffRefreshToken } from '@/lib/browserSession';
import { importGuestListForSignedInUser } from '@/lib/guestImport';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Mail, Lock } from 'lucide-vue-next';
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
      <a class="calm-btn calm-btn--quiet" href="#auth-station">Sign in</a>
    </header>

    <main>
      <section class="calm-landing__hero">
        <div class="calm-landing__copy">
          <h1 data-calm-reveal>Keep today's<br>list.</h1>
          <p data-calm-reveal>
            Habuilt keeps the habits on today's list, the next reminder, and a partner's Kept or Not yet.
            An empty day says Nothing scheduled today.
          </p>
          <div class="calm-landing__actions" data-calm-reveal>
            <a class="calm-btn" href="#auth-station">Sign in</a>
          </div>
        </div>
        <div class="calm-landing__phone-col">
          <aside class="calm-phone" data-calm-phone aria-label="Today on this device">
            <div class="calm-phone__screen">
              <p class="calm-phone__mark">Today</p>
              <p class="calm-phone__hero">{{ landingSummary.hero }}</p>
              <ul>
                <li><span>Streak</span><strong>{{ landingSummary.streak }}</strong></li>
                <li><span>Reminder</span><strong>{{ landingSummary.reminder }}</strong></li>
                <li><span>Partner</span><strong>{{ landingSummary.partner }}</strong></li>
              </ul>
              <button v-if="landingSummary.showAddHabit" class="calm-btn" type="button" @click="startWithHabit">Add a habit</button>
            </div>
          </aside>
        </div>
      </section>

      <section class="calm-landing__facts" data-calm-section aria-label="What Habuilt keeps">
        <article>
          <h2>Today</h2>
          <p>Habits kept today, your streak, and the next reminder.</p>
        </article>
        <article>
          <h2>Partner</h2>
          <p>An accepted partner shows Kept or Not yet. A pending invite stays No partner yet.</p>
        </article>
        <article>
          <h2>Review</h2>
          <p>The review reads the week from your own check-ins.</p>
        </article>
      </section>

      <section id="auth-station" class="calm-auth" data-calm-section>
        <h2>
          {{ mode === 'signup' ? 'Create an account' : 'Sign in' }}
        </h2>
        <p v-if="error" class="calm-auth__error" role="alert">{{ error }}</p>
        <p v-if="successMessage" class="calm-auth__ok" role="status">{{ successMessage }}</p>

        <form @submit.prevent="handleAuth">
          <label>
            <Mail :size="16" />
            <input v-model="email" type="email" autocomplete="email" required placeholder="Email" />
          </label>
          <label>
            <Lock :size="16" />
            <input v-model="password" type="password" :autocomplete="mode === 'signup' ? 'new-password' : 'current-password'" :minlength="mode === 'signup' ? 6 : undefined" required placeholder="Password" />
          </label>
          <p v-if="mode === 'signup'" class="calm-auth__hint">Use at least 6 characters.</p>
          <button class="calm-btn" type="submit" :disabled="loading">
            {{ loading ? 'Working…' : 'Continue' }}
          </button>
        </form>

        <div class="calm-auth__alts">
          <button type="button" @click="handleGoogle">Google</button>
          <button type="button" @click="mode = mode === 'signup' ? 'login' : 'signup'">
            {{ mode === 'signup' ? 'Have an account? Sign in' : 'Create an account' }}
          </button>
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
  padding: 16px 0;
  background: color-mix(in srgb, var(--page-bg) 92%, transparent);
}
.calm-landing__bar .calm-btn {
  flex: 0 0 auto;
  margin-left: auto;
}
.calm-landing__hero {
  display: grid;
  grid-template-columns: minmax(0, 34rem) minmax(240px, 320px);
  justify-content: center;
  gap: clamp(20px, 3vw, 48px);
  align-items: center;
  padding: clamp(12px, 3vw, 28px) 0 clamp(40px, 6vw, 72px);
}
.calm-landing__copy h1,
.calm-landing__facts h2,
.calm-auth h2 {
  font-family: var(--font-display);
  letter-spacing: -0.045em;
}
.calm-landing__copy h1 {
  margin: 0 0 18px;
  max-width: 12ch;
  font-size: var(--type-fluid-display, clamp(2.35rem, 1.2rem + 3.6vw, 5.25rem));
  font-weight: 650;
  line-height: 0.94;
  text-wrap: balance;
  overflow-wrap: break-word;
}
.calm-landing__copy p {
  max-width: 38rem;
  margin: 0;
  color: var(--text-secondary);
  font-size: clamp(16px, 1.6vw, 18px);
  line-height: 1.5;
}
.calm-landing__actions,
.calm-pills,
.calm-auth__alts,
footer {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.calm-landing__actions { margin-top: 28px; }
.calm-pills { margin-top: 22px; }
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
  gap: 8px;
  border: 1px solid var(--text-primary);
  border-radius: 999px;
  background: var(--accent);
  padding: 13px 18px;
  font-weight: 650;
  text-decoration: none;
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
  width: min(320px, 100%);
  margin-inline: auto;
  padding: 12px;
  border-radius: 40px;
  background: var(--text-primary);
  box-shadow: var(--card-elev-3);
  will-change: transform;
}
.calm-phone__screen {
  display: flex;
  flex-direction: column;
  min-height: 520px;
  padding: 22px 18px 18px;
  border-radius: 30px;
  background: var(--page-bg);
  color: var(--text-primary);
}
.calm-phone__mark {
  display: inline-flex;
  align-self: flex-start;
  margin: 8px 0 22px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 650;
}
.calm-phone__hero {
  margin: 0 0 22px;
  font-family: var(--font-display);
  font-size: clamp(1.7rem, 4vw, 2.5rem);
  font-weight: 650;
  line-height: 1.02;
  letter-spacing: -0.04em;
  text-wrap: balance;
  overflow-wrap: break-word;
}
.calm-phone ul {
  margin: 0 0 18px;
  padding: 0;
  list-style: none;
}
.calm-phone li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 0;
  border-top: 1px solid var(--surface-border);
}
.calm-phone li span { color: var(--text-secondary); font-size: 13px; }
.calm-phone li strong {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.03em;
}
.calm-phone .calm-btn { margin-top: auto; justify-content: center; }
.calm-landing__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 28px;
  padding: 24px 0 88px;
}
.calm-landing__facts article {
  padding-top: 18px;
  border-top: 1px solid var(--surface-border);
}
.calm-landing__facts h2 {
  margin: 0 0 8px;
  font-size: 32px;
  font-weight: 650;
}
.calm-landing__facts p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.5;
}
.calm-auth {
  width: min(560px, calc(100% - (var(--calm-page-gutter, 16px) * 2)));
  margin: 0 auto 48px;
  padding: clamp(18px, 3vw, 28px);
  border: 1px solid var(--surface-border);
  border-radius: 28px;
  background: var(--surface-card);
  box-sizing: border-box;
}
.calm-auth h2 {
  margin: 0 0 16px;
  font-size: 36px;
  font-weight: 650;
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
}
.calm-auth label:focus-within {
  border-color: var(--text-primary);
}
.calm-btn:focus-visible,
.calm-pill:focus-visible,
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
}
footer {
  align-items: center;
  justify-content: flex-start;
  padding: 8px 0 32px;
}
@media (min-width: 740px) {
  .calm-landing__phone-col {
    position: sticky;
    top: 96px;
  }
}
@media (max-width: 739px) {
  .calm-landing__hero {
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
    padding-top: 8px;
  }
  .calm-landing__phone-col { order: -1; }
  .calm-landing__copy h1 { max-width: 12ch; }
  .calm-phone { width: min(280px, 100%); }
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
  .calm-landing__facts { grid-template-columns: 1fr; gap: 22px; padding-bottom: 48px; }
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
