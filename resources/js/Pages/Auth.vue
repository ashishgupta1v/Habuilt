<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import {
  Mail, Lock, ArrowRight, ShieldCheck, Zap, KeyRound, ArrowLeft,
  Smartphone, Download, CheckCircle2, Sparkles, Timer, Award,
  Clock, Check, ChevronRight, Play,
} from 'lucide-vue-next';
import HabuiltLogo from '@/Components/Brand/HabuiltLogo.vue';

const emit = defineEmits(['guest-login']);

const email    = ref('');
const password = ref('');
const newPassword = ref('');
const mode = ref('login');
const loading = ref(false);
const error = ref('');
const successMessage = ref('');
const activeFeature = ref(0);
const isDownloadingApk = ref(false);
let ticker = null;

const apkUrl = 'https://github.com/ashishgupta1v/Habuilt/releases/download/v2.0/habuilt.apk';

/* ─── Feature cards ──────────────────────────────────────────────── */
const features = [
  {
    num: '01',
    color: '#10b981',
    shadow: 'rgba(16,185,129,0.18)',
    label: 'Due-Now Engine',
    headline: "Always know what's\nnext. Never miss.",

    body: 'A live time-phased timeline surfaces exactly what needs your attention right now — not a flat to-do list.',
    stat: '3.2×',
    statDesc: 'daily completion rate',
    pills: ['Time-blocks', 'Auto-sort', 'Flow alerts'],
    preview: {
      badge: 'DUE NOW',
      task: 'Deep Work: Architecture',
      time: '09:00 – 10:30',
      meta: '🔥 18-day streak',
      progress: 68,
    },
  },
  {
    num: '02',
    color: '#818cf8',
    shadow: 'rgba(129,140,248,0.18)',
    label: 'Focus Sessions',
    headline: '90-minute flows.\nNo interruptions.',
    body: 'Pomodoro blocks with lockscreen alerts keep you sealed inside deep work — home screen widget included.',
    stat: '91%',
    statDesc: 'flow completion rate',
    pills: ['Pomodoro', 'Widget', 'Lockscreen'],
    preview: {
      badge: 'ACTIVE',
      task: 'Sprint: Deliverables Block',
      time: '45m target · 28:14 elapsed',
      meta: '⚡ Deep flow active',
      progress: 63,
    },
  },
  {
    num: '03',
    color: '#f59e0b',
    shadow: 'rgba(245,158,11,0.18)',
    label: 'Warrior Ranks',
    headline: 'Discipline becomes\na game you win.',
    body: 'Every completed block earns XP. Climb warrior tiers. Unlock milestone vaults. Your streak is your identity.',
    stat: '5.8×',
    statDesc: '30-day retention vs apps',
    pills: ['XP Rewards', 'Tier ranks', 'Vaults'],
    preview: {
      badge: 'LEVELED UP',
      task: 'Level 8 — Mastery Tier',
      time: '1,420 XP · Next: 80%',
      meta: '👑 Master streak on',
      progress: 80,
    },
  },
  {
    num: '04',
    color: '#38bdf8',
    shadow: 'rgba(56,189,248,0.18)',
    label: 'Adaptive Mode',
    headline: 'Life changes.\nYour routine adapts.',
    body: 'Office day? Travel? Holiday? Habuilt detects your day type and reshapes your entire schedule automatically.',
    stat: '0',
    statDesc: 'broken streaks from life',
    pills: ['4 day modes', 'Travel routing', 'Streak shield'],
    preview: {
      badge: 'AUTO-SET',
      task: 'Office Mode: Detected',
      time: 'Home · Office · Half · Holiday',
      meta: '🛡️ Streak protected',
      progress: 100,
    },
  },
];

const current = computed(() => features[activeFeature.value]);

const setFeature = (i) => {
  activeFeature.value = i;
  resetTicker();
};

const resetTicker = () => {
  clearInterval(ticker);
  ticker = setInterval(() => {
    activeFeature.value = (activeFeature.value + 1) % features.length;
  }, 4500);
};

/* ─── Auth logic ─────────────────────────────────────────────────── */
onMounted(() => {
  resetTicker();
  if (typeof window !== 'undefined') {
    const h = window.location.hash;
    if (h.includes('type=recovery') || h.includes('access_token')) mode.value = 'reset';
    if (Capacitor.isNativePlatform()) {
      try {
        App.addListener('backButton', () => {
          if (mode.value !== 'login') { mode.value = 'login'; error.value = ''; successMessage.value = ''; }
          else App.exitApp();
        });
      } catch {}
    }
  }
});

onUnmounted(() => clearInterval(ticker));

const handleAuth = async () => {
  loading.value = true; error.value = ''; successMessage.value = '';
  try {
    if (mode.value === 'signup') {
      const { error: e } = await supabase.auth.signUp({ email: email.value, password: password.value });
      if (e) throw e;
      successMessage.value = 'Account created — check your email or sign in.';
      mode.value = 'login';
    } else if (mode.value === 'forgot') {
      const isNative = typeof window !== 'undefined' && (window.Capacitor?.isNativePlatform?.() || window.location.origin.includes('localhost'));
      const { error: e } = await supabase.auth.resetPasswordForEmail(email.value, {
        redirectTo: isNative ? 'habuilt://auth/callback' : `${window.location.origin}/auth/callback`,
      });
      if (e) throw e;
      successMessage.value = `Reset link sent to ${email.value}`;
    } else if (mode.value === 'reset') {
      const { error: e } = await supabase.auth.updateUser({ password: newPassword.value });
      if (e) throw e;
      successMessage.value = 'Password updated.';
      mode.value = 'login';
    } else {
      const { error: e } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value });
      if (e) throw e;
    }
  } catch (e) {
    error.value = e.message || 'Authentication error.';
  } finally {
    loading.value = false;
  }
};

const handleGoogle = async () => {
  error.value = ''; loading.value = true;
  try {
    const isNative = typeof window !== 'undefined' && (window.Capacitor?.isNativePlatform?.() || window.location.origin.includes('localhost'));
    const { data, error: e } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: isNative ? 'habuilt://auth/callback' : `${window.location.origin}/auth/callback`, skipBrowserRedirect: isNative },
    });
    if (e) throw e;
    if (isNative && data?.url) {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: data.url, windowName: '_self' });
    }
  } catch (e) { error.value = e.message; }
  finally { loading.value = false; }
};

const handleGuest = () => {
  const g = { id: 'guest', email: 'guest@habuilt.com', user_metadata: { full_name: 'Habuilt Champion' } };
  localStorage.setItem('habuilt_guest_mode', 'true');
  localStorage.setItem('habuilt_cached_user', JSON.stringify(g));
  window.dispatchEvent(new CustomEvent('habuilt-guest-auth', { detail: g }));
  emit('guest-login', g);
};
</script>

<template>
  <div class="lp">

    <!-- ── Canvas Background ─────────────────────────────────────── -->
    <div class="lp__bg" aria-hidden="true">
      <div class="lp__bg-orb lp__bg-orb--a"></div>
      <div class="lp__bg-orb lp__bg-orb--b"></div>
      <div class="lp__bg-orb lp__bg-orb--c"></div>
      <svg class="lp__bg-grid" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
            <path d="M 72 0 L 0 0 0 72" fill="none" stroke="rgba(255,255,255,0.025)" stroke-width="0.8"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
      <!-- Horizontal scan line -->
      <div class="lp__bg-scanline"></div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         HERO PANEL
         ═══════════════════════════════════════════════════════════ -->
    <div class="lp__hero">

      <!-- Logo -->
      <div class="lp__logo-row">
        <HabuiltLogo size="sm" />
        <span class="lp__logo-wordmark">Habuilt</span>
      </div>

      <!-- Headline -->
      <div class="lp__headline-block">
        <p class="lp__eyebrow">Execution Operating System</p>
        <h1 class="lp__h1">
          The OS for people<br>
          who <em class="lp__h1-em">actually ship.</em>
        </h1>
        <p class="lp__sub">
          Replace dead lists with a living time-engine.<br>
          Due-now alerts. Adaptive schedules. Real momentum.
        </p>

        <!-- Credibility bar -->
        <div class="lp__cred">
          <span class="lp__cred-dot"></span>
          <span>Trusted by ambitious builders</span>
          <span class="lp__cred-sep">·</span>
          <span>Android &amp; Web</span>
        </div>
      </div>

      <!-- Feature selector -->
      <div class="lp__feat-nav">
        <button
          v-for="(f, i) in features"
          :key="f.num"
          class="lp__feat-pill"
          :class="{ 'lp__feat-pill--on': activeFeature === i }"
          :style="activeFeature === i ? `--ac: ${f.color}` : ''"
          type="button"
          @click="setFeature(i)"
        >
          <span class="lp__feat-pill-num">{{ f.num }}</span>
          <span>{{ f.label }}</span>
        </button>
      </div>

      <!-- Feature spotlight -->
      <div
        class="lp__card"
        :style="`--ac: ${current.color}; --sh: ${current.shadow}`"
      >
        <!-- Top row: stat + headline -->
        <div class="lp__card-top">
          <div class="lp__stat-block">
            <span class="lp__stat-num">{{ current.stat }}</span>
            <span class="lp__stat-desc">{{ current.statDesc }}</span>
          </div>
          <div class="lp__card-text">
            <h2 class="lp__card-h2">{{ current.headline }}</h2>
            <p class="lp__card-body">{{ current.body }}</p>
            <div class="lp__pills">
              <span v-for="p in current.pills" :key="p" class="lp__pill">{{ p }}</span>
            </div>
          </div>
        </div>

        <!-- App Preview widget -->
        <div class="lp__preview">
          <div class="lp__preview-top">
            <div class="lp__preview-dots">
              <span></span><span></span><span></span>
            </div>
            <span class="lp__preview-label">habuilt · live</span>
            <span class="lp__preview-badge" :style="`color: ${current.color}; border-color: ${current.color}33; background: ${current.shadow}`">
              {{ current.preview.badge }}
            </span>
          </div>
          <div class="lp__preview-row">
            <div class="lp__preview-tick" :style="`background: ${current.color}22; border-color: ${current.color}55`">
              <Check class="lp__preview-tick-icon" :style="`color: ${current.color}`" />
            </div>
            <div class="lp__preview-info">
              <span class="lp__preview-task">{{ current.preview.task }}</span>
              <span class="lp__preview-time">{{ current.preview.time }}</span>
            </div>
            <span class="lp__preview-meta">{{ current.preview.meta }}</span>
          </div>
          <div class="lp__preview-bar">
            <div
              class="lp__preview-fill"
              :style="`width: ${current.preview.progress}%; background: linear-gradient(90deg, ${current.color}cc, ${current.color})`"
            ></div>
          </div>
        </div>

        <!-- Progress strip -->
        <div class="lp__card-footer">
          <div class="lp__progress-dots">
            <button
              v-for="(f, i) in features"
              :key="i"
              class="lp__pdot"
              :class="{ 'lp__pdot--on': activeFeature === i }"
              :style="activeFeature === i ? `background: ${f.color}; box-shadow: 0 0 8px ${f.color}80` : ''"
              @click="setFeature(i)"
              type="button"
            />
          </div>
          <a
            :href="apkUrl"
            download="habuilt.apk"
            class="lp__dl-link"
            @click="isDownloadingApk = true"
          >
            <Download class="lp__dl-icon" />
            <span>Download for Android</span>
          </a>
        </div>
      </div>

    </div>

    <!-- ═══════════════════════════════════════════════════════════
         AUTH PANEL
         ═══════════════════════════════════════════════════════════ -->
    <div class="lp__auth">
      <div class="lp__auth-card">

        <!-- Mobile logo -->
        <div class="lp__auth-mobile-logo">
          <HabuiltLogo size="sm" />
          <span class="lp__logo-wordmark">Habuilt</span>
        </div>

        <!-- Guest CTA — hero action -->
        <button class="lp__guest" type="button" @click="handleGuest">
          <div class="lp__guest-left">
            <span class="lp__guest-glyph">⚡</span>
            <div>
              <p class="lp__guest-title">Try instantly — no account</p>
              <p class="lp__guest-sub">Full dashboard · Zero setup</p>
            </div>
          </div>
          <ChevronRight class="lp__guest-arrow" />
        </button>

        <!-- Auth form header -->
        <div class="lp__auth-header">
          <h2 class="lp__auth-h2">
            <template v-if="mode === 'login'">Sign in</template>
            <template v-else-if="mode === 'signup'">Create account</template>
            <template v-else-if="mode === 'forgot'">Reset password</template>
            <template v-else>New password</template>
          </h2>
          <p class="lp__auth-sub">
            <template v-if="mode === 'login'">Welcome back. Your dashboard awaits.</template>
            <template v-else-if="mode === 'signup'">Start building unshakeable habits.</template>
            <template v-else-if="mode === 'forgot'">We'll send a reset link to your email.</template>
            <template v-else>Choose a strong new password.</template>
          </p>
        </div>

        <!-- Google OAuth -->
        <template v-if="mode === 'login' || mode === 'signup'">
          <button class="lp__google" type="button" @click="handleGoogle">
            <svg class="lp__google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div class="lp__sep">
            <span class="lp__sep-line"></span>
            <span class="lp__sep-text">or continue with email</span>
            <span class="lp__sep-line"></span>
          </div>
        </template>

        <!-- Alerts -->
        <p v-if="successMessage" class="lp__alert lp__alert--ok">
          <CheckCircle2 class="lp__alert-icon" /> {{ successMessage }}
        </p>
        <p v-if="error" class="lp__alert lp__alert--err">
          <ShieldCheck class="lp__alert-icon" /> {{ error }}
        </p>

        <!-- Form -->
        <form @submit.prevent="handleAuth" class="lp__form">
          <div v-if="mode !== 'reset'" class="lp__field">
            <label class="lp__label" for="f-email">Email</label>
            <div class="lp__input-wrap">
              <Mail class="lp__input-icon" />
              <input
                id="f-email" v-model="email" type="email" required
                placeholder="you@domain.com" class="lp__input"
                autocomplete="email"
              />
            </div>
          </div>

          <div v-if="mode === 'login' || mode === 'signup'" class="lp__field">
            <div class="lp__field-top">
              <label class="lp__label" for="f-pw">Password</label>
              <button v-if="mode === 'login'" type="button" class="lp__forgot" @click="mode = 'forgot'; error = ''; successMessage = ''">Forgot?</button>
            </div>
            <div class="lp__input-wrap">
              <Lock class="lp__input-icon" />
              <input
                id="f-pw" v-model="password" type="password" required
                placeholder="••••••••" class="lp__input"
                autocomplete="current-password"
              />
            </div>
          </div>

          <div v-if="mode === 'reset'" class="lp__field">
            <label class="lp__label" for="f-newpw">New Password</label>
            <div class="lp__input-wrap">
              <KeyRound class="lp__input-icon" />
              <input
                id="f-newpw" v-model="newPassword" type="password" required minlength="6"
                placeholder="Min. 6 characters" class="lp__input"
              />
            </div>
          </div>

          <button type="submit" :disabled="loading" class="lp__submit">
            <template v-if="loading">
              <svg class="lp__spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity=".2"/>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Processing…
            </template>
            <template v-else>
              <span v-if="mode === 'login'">Sign in</span>
              <span v-else-if="mode === 'signup'">Create account</span>
              <span v-else-if="mode === 'forgot'">Send reset link</span>
              <span v-else>Update password</span>
              <ArrowRight class="lp__submit-arrow" />
            </template>
          </button>
        </form>

        <!-- Footer toggle -->
        <div class="lp__auth-foot">
          <template v-if="mode === 'forgot' || mode === 'reset'">
            <button type="button" class="lp__back" @click="mode = 'login'; error = ''; successMessage = ''">
              <ArrowLeft class="lp__back-icon" /> Back to sign in
            </button>
          </template>
          <template v-else>
            <span class="lp__foot-text">
              {{ mode === 'login' ? "No account?" : "Have an account?" }}
              <button type="button" class="lp__switch" @click="mode = mode === 'login' ? 'signup' : 'login'; error = ''; successMessage = ''">
                {{ mode === 'login' ? 'Sign up free' : 'Sign in' }}
              </button>
            </span>
          </template>
        </div>

      </div>
    </div>

  </div>
</template>
