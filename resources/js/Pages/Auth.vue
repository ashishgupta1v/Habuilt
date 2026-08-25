<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import {
  Mail, Lock, ArrowRight, ShieldCheck, Zap, KeyRound, ArrowLeft,
  Smartphone, Download, CheckCircle2, Sparkles, Timer, Award,
  Clock, Check, TrendingUp,
} from 'lucide-vue-next';
import HabuiltLogo from '@/Components/Brand/HabuiltLogo.vue';

const emit = defineEmits(['guest-login']);

const email = ref('');
const password = ref('');
const newPassword = ref('');
const mode = ref('login');
const loading = ref(false);
const error = ref('');
const successMessage = ref('');
const isDownloadingApk = ref(false);
const activePreviewTab = ref(0);
let autoPlayInterval = null;

const apkDownloadUrl = 'https://github.com/ashishgupta1v/Habuilt/releases/download/v2.0/habuilt.apk';

// ─── Feature Pillars ────────────────────────────────────────────
const features = [
  {
    icon: Clock,
    accentColor: '#10b981',
    accentGlow: 'rgba(16,185,129,0.3)',
    category: 'Intelligence',
    headline: 'Live Due-Now Timeline',
    pitch: 'Know exactly what to do, right now.',
    stat: '3.2×',
    statLabel: 'more tasks completed daily',
    tags: ['Time-Phased Blocks', 'Automatic Prioritization', 'Flow State Triggers'],
    mockTitle: 'CURRENT FOCUS',
    mockTask: 'Deep Work — Architecture Sprint',
    mockTime: '09:00 – 10:30',
    mockBadge: 'DUE NOW',
    mockBadgeStyle: 'emerald',
    mockMeta: '🔥 18-day streak',
  },
  {
    icon: Timer,
    accentColor: '#6366f1',
    accentGlow: 'rgba(99,102,241,0.3)',
    category: 'Focus',
    headline: 'Deep Work Engine',
    pitch: '90-minute Pomodoro blocks with lockscreen alerts.',
    stat: '91%',
    statLabel: 'flow state completion rate',
    tags: ['Pomodoro Timers', 'Lockscreen Alerts', '1-Tap Widget'],
    mockTitle: 'FOCUS TIMER',
    mockTask: 'Sprint Deliverables Block',
    mockTime: '45m target · 28:14 elapsed',
    mockBadge: 'ACTIVE',
    mockBadgeStyle: 'indigo',
    mockMeta: '⚡ Deep flow engaged',
  },
  {
    icon: Award,
    accentColor: '#c8a456',
    accentGlow: 'rgba(200,164,86,0.3)',
    category: 'Gamification',
    headline: 'XP & Warrior Ranks',
    pitch: 'Turn discipline into a game you actually win.',
    stat: '5.8×',
    statLabel: 'higher 30-day retention',
    tags: ['XP Rewards', 'Warrior Levels', 'Milestone Vaults'],
    mockTitle: 'WARRIOR RANK',
    mockTask: 'Level 8 — Mastery Tier',
    mockTime: '1,420 XP · Next reward: 80%',
    mockBadge: 'LEVELED UP',
    mockBadgeStyle: 'gold',
    mockMeta: '👑 Master streak active',
  },
  {
    icon: Sparkles,
    accentColor: '#38bdf8',
    accentGlow: 'rgba(56,189,248,0.3)',
    category: 'Adaptive AI',
    headline: 'Context-Aware Scheduling',
    pitch: 'Office day? Holiday? Your routine auto-adjusts.',
    stat: '0',
    statLabel: 'broken streaks from life events',
    tags: ['4 Day-Type Modes', 'Travel Routing', 'Streak Shield'],
    mockTitle: 'SMART DETECTION',
    mockTask: 'Adaptive Office Travel Mode',
    mockTime: 'Home · Office · Half-Day · Holiday',
    mockBadge: 'AUTO-SET',
    mockBadgeStyle: 'sky',
    mockMeta: '🛡️ Streak protected',
  },
];

const currentFeature = computed(() => features[activePreviewTab.value]);

const mockBadgeClass = computed(() => {
  const s = currentFeature.value.mockBadgeStyle;
  return {
    'mock-badge--emerald': s === 'emerald',
    'mock-badge--indigo': s === 'indigo',
    'mock-badge--gold': s === 'gold',
    'mock-badge--sky': s === 'sky',
  };
});

// auto-cycle every 4 seconds
onMounted(() => {
  autoPlayInterval = setInterval(() => {
    activePreviewTab.value = (activePreviewTab.value + 1) % features.length;
  }, 4000);

  if (typeof window !== 'undefined') {
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('access_token'))) {
      mode.value = 'reset';
    }
    if (Capacitor.isNativePlatform()) {
      try {
        App.addListener('backButton', () => {
          if (mode.value !== 'login') { mode.value = 'login'; error.value = ''; successMessage.value = ''; }
          else { App.exitApp(); }
        });
      } catch (e) {}
    }
  }
});

onUnmounted(() => {
  if (autoPlayInterval) clearInterval(autoPlayInterval);
});

const selectTab = (i) => {
  activePreviewTab.value = i;
  clearInterval(autoPlayInterval);
  autoPlayInterval = setInterval(() => {
    activePreviewTab.value = (activePreviewTab.value + 1) % features.length;
  }, 4000);
};

const handleDownloadApk = () => {
  isDownloadingApk.value = true;
  setTimeout(() => { isDownloadingApk.value = false; }, 3500);
};

const handleAuth = async () => {
  loading.value = true; error.value = ''; successMessage.value = '';
  try {
    if (mode.value === 'signup') {
      const { error: err } = await supabase.auth.signUp({ email: email.value, password: password.value });
      if (err) throw err;
      successMessage.value = 'Account created! Check your email or log in.';
      mode.value = 'login';
    } else if (mode.value === 'forgot') {
      const isCapacitor = typeof window !== 'undefined' && (window.Capacitor?.isNativePlatform?.() || window.location.origin.includes('localhost'));
      const redirectUrl = isCapacitor ? 'habuilt://auth/callback' : `${window.location.origin}/auth/callback`;
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.value, { redirectTo: redirectUrl });
      if (err) throw err;
      successMessage.value = `Reset link sent to ${email.value}`;
    } else if (mode.value === 'reset') {
      const { error: err } = await supabase.auth.updateUser({ password: newPassword.value });
      if (err) throw err;
      successMessage.value = 'Password updated. You can now log in.';
      mode.value = 'login';
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value });
      if (err) throw err;
    }
  } catch (err) {
    error.value = err.message || 'Authentication error. Try again.';
  } finally {
    loading.value = false;
  }
};

const handleGoogleSignIn = async () => {
  error.value = ''; loading.value = true;
  try {
    const isCapacitor = typeof window !== 'undefined' && (window.Capacitor?.isNativePlatform?.() || window.location.origin.includes('localhost'));
    const redirectUrl = isCapacitor ? 'habuilt://auth/callback' : `${window.location.origin}/auth/callback`;
    const { data, error: err } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirectUrl, skipBrowserRedirect: isCapacitor } });
    if (err) throw err;
    if (isCapacitor && data?.url) {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: data.url, windowName: '_self' });
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

const handleGuestAccess = () => {
  const guestUser = { id: 'guest', email: 'guest@habuilt.com', user_metadata: { full_name: 'Habuilt Champion' } };
  localStorage.setItem('habuilt_guest_mode', 'true');
  localStorage.setItem('habuilt_cached_user', JSON.stringify(guestUser));
  window.dispatchEvent(new CustomEvent('habuilt-guest-auth', { detail: guestUser }));
  emit('guest-login', guestUser);
};
</script>

<template>
  <div class="lp-root">

    <!-- Cinematic Mesh Background -->
    <div class="lp-canvas" aria-hidden="true">
      <div class="lp-canvas__blob lp-canvas__blob--a"></div>
      <div class="lp-canvas__blob lp-canvas__blob--b"></div>
      <div class="lp-canvas__blob lp-canvas__blob--c"></div>
      <div class="lp-canvas__grid"></div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         HERO SECTION — Left 57%
         ═══════════════════════════════════════════════════════════ -->
    <div class="lp-hero">

      <!-- Top nav bar -->
      <header class="lp-nav">
        <div class="lp-nav__brand">
          <HabuiltLogo size="md" />
          <span class="lp-nav__name">Habuilt</span>
        </div>
        <div class="lp-nav__badges">
          <span class="lp-badge lp-badge--pulse">
            <span class="lp-badge__dot"></span>
            v2.0 Live
          </span>
          <span class="lp-badge lp-badge--outline">Android &amp; Web</span>
        </div>
      </header>

      <!-- Hero Copy -->
      <div class="lp-hero__copy">
        <div class="lp-hero__eyebrow">
          <TrendingUp class="lp-eyebrow__icon" />
          <span>Daily Execution Operating System</span>
        </div>

        <h1 class="lp-hero__h1">
          Build habits that<br>
          <span class="lp-hero__h1-accent">actually stick.</span>
        </h1>

        <p class="lp-hero__sub">
          Replace chaotic to-do lists with a time-anchored routine engine.<br>
          Live due-now alerts. Adaptive schedules. Real-time momentum.
        </p>

        <!-- Social proof strip -->
        <div class="lp-social-proof">
          <div class="lp-social-proof__avatars">
            <div class="lp-avatar lp-avatar--1">A</div>
            <div class="lp-avatar lp-avatar--2">R</div>
            <div class="lp-avatar lp-avatar--3">S</div>
            <div class="lp-avatar lp-avatar--4">V</div>
          </div>
          <span class="lp-social-proof__text">Join <strong>2,000+</strong> high performers tracking daily wins</span>
        </div>
      </div>

      <!-- ── Feature Tabs ── -->
      <div class="lp-tabs">
        <button
          v-for="(feat, i) in features"
          :key="feat.headline"
          class="lp-tab"
          :class="{ 'lp-tab--active': activePreviewTab === i }"
          :style="activePreviewTab === i ? `--tab-accent: ${feat.accentColor}` : ''"
          @click="selectTab(i)"
          type="button"
        >
          <component :is="feat.icon" class="lp-tab__icon" />
          <span>{{ feat.headline }}</span>
        </button>
      </div>

      <!-- ── Feature Spotlight ── -->
      <div
        class="lp-spotlight"
        :style="`--spot-accent: ${currentFeature.accentColor}; --spot-glow: ${currentFeature.accentGlow}`"
      >
        <!-- Category eyebrow -->
        <div class="lp-spotlight__eyebrow">
          <component :is="currentFeature.icon" class="lp-spotlight__eyebrow-icon" />
          <span>{{ currentFeature.category }}</span>
        </div>

        <h2 class="lp-spotlight__headline">{{ currentFeature.headline }}</h2>
        <p class="lp-spotlight__pitch">{{ currentFeature.pitch }}</p>

        <!-- Stat callout -->
        <div class="lp-stat-callout">
          <span class="lp-stat-callout__number">{{ currentFeature.stat }}</span>
          <span class="lp-stat-callout__label">{{ currentFeature.statLabel }}</span>
        </div>

        <!-- Tags -->
        <div class="lp-tags">
          <span v-for="tag in currentFeature.tags" :key="tag" class="lp-tag">{{ tag }}</span>
        </div>

        <!-- Live UI Mock -->
        <div class="lp-mock">
          <div class="lp-mock__bar">
            <span class="lp-mock__bar-title">{{ currentFeature.mockTitle }}</span>
            <span class="lp-mock__badge" :class="mockBadgeClass">{{ currentFeature.mockBadge }}</span>
          </div>
          <div class="lp-mock__row">
            <div class="lp-mock__check">
              <Check class="lp-mock__check-icon" />
            </div>
            <div class="lp-mock__details">
              <span class="lp-mock__task">{{ currentFeature.mockTask }}</span>
              <span class="lp-mock__time">{{ currentFeature.mockTime }}</span>
            </div>
            <span class="lp-mock__meta">{{ currentFeature.mockMeta }}</span>
          </div>
          <!-- Progress indicator -->
          <div class="lp-mock__progress">
            <div class="lp-mock__progress-fill" :style="`width: ${(activePreviewTab + 1) * 25}%; background: ${currentFeature.accentColor}`"></div>
          </div>
        </div>

        <!-- Tab progress dots -->
        <div class="lp-dots">
          <button
            v-for="(f, i) in features"
            :key="i"
            class="lp-dot"
            :class="{ 'lp-dot--active': activePreviewTab === i }"
            :style="activePreviewTab === i ? `background: ${f.accentColor}; box-shadow: 0 0 8px ${f.accentColor}` : ''"
            @click="selectTab(i)"
            type="button"
          />
        </div>
      </div>

      <!-- APK Download -->
      <div class="lp-apk">
        <div class="lp-apk__icon">
          <Smartphone class="lp-apk__phone-icon" />
        </div>
        <div class="lp-apk__info">
          <span class="lp-apk__title">Habuilt for Android</span>
          <span class="lp-apk__sub">Home screen widget · Offline sync · Lockscreen alerts</span>
        </div>
        <a
          :href="apkDownloadUrl"
          download="habuilt.apk"
          target="_blank"
          rel="noopener noreferrer"
          class="lp-apk__btn"
          @click="handleDownloadApk"
        >
          <Download class="lp-apk__btn-icon" :class="{ 'icon-spin': isDownloadingApk }" />
          <span>{{ isDownloadingApk ? 'Downloading…' : 'Download APK' }}</span>
        </a>
      </div>

    </div>

    <!-- ═══════════════════════════════════════════════════════════
         AUTH PANEL — Right 43%
         ═══════════════════════════════════════════════════════════ -->
    <div class="lp-auth">
      <div class="lp-auth__card">

        <!-- Mobile brand header (hidden on desktop) -->
        <div class="lp-auth__mobile-brand">
          <HabuiltLogo size="sm" />
          <span class="lp-auth__mobile-name">Habuilt</span>
        </div>

        <div class="lp-auth__header">
          <h2 class="lp-auth__title">
            <template v-if="mode === 'login'">Welcome back</template>
            <template v-else-if="mode === 'signup'">Start your journey</template>
            <template v-else-if="mode === 'forgot'">Reset password</template>
            <template v-else>Set new password</template>
          </h2>
          <p class="lp-auth__subtitle">
            <template v-if="mode === 'login'">Your routine dashboard awaits.</template>
            <template v-else-if="mode === 'signup'">Build unshakeable daily discipline.</template>
            <template v-else-if="mode === 'forgot'">Enter your email to receive a reset link.</template>
            <template v-else>Enter a strong new password.</template>
          </p>
        </div>

        <!-- Instant Guest Access CTA -->
        <button class="lp-guest-btn" type="button" @click="handleGuestAccess">
          <div class="lp-guest-btn__left">
            <div class="lp-guest-btn__icon">
              <Zap class="icon-sm" />
            </div>
            <div class="lp-guest-btn__text">
              <span class="lp-guest-btn__title">Explore as Guest</span>
              <span class="lp-guest-btn__sub">Full dashboard, zero setup</span>
            </div>
          </div>
          <ArrowRight class="lp-guest-btn__arrow" />
        </button>

        <!-- Google OAuth -->
        <template v-if="mode === 'login' || mode === 'signup'">
          <button class="lp-oauth-btn" type="button" @click="handleGoogleSignIn">
            <svg class="lp-oauth-btn__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div class="lp-divider">
            <div class="lp-divider__line"></div>
            <span class="lp-divider__text">or email</span>
            <div class="lp-divider__line"></div>
          </div>
        </template>

        <!-- Success / Error -->
        <div v-if="successMessage" class="lp-alert lp-alert--success">
          <CheckCircle2 class="lp-alert__icon" />
          <span>{{ successMessage }}</span>
        </div>
        <div v-if="error" class="lp-alert lp-alert--error">
          <ShieldCheck class="lp-alert__icon" />
          <span>{{ error }}</span>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleAuth" class="lp-form">

          <div v-if="mode !== 'reset'" class="lp-field">
            <label for="lp-email" class="lp-field__label">Email</label>
            <div class="lp-field__wrap">
              <Mail class="lp-field__icon" />
              <input v-model="email" id="lp-email" type="email" required placeholder="you@domain.com" class="lp-field__input" />
            </div>
          </div>

          <div v-if="mode === 'login' || mode === 'signup'" class="lp-field">
            <div class="lp-field__top">
              <label for="lp-password" class="lp-field__label">Password</label>
              <button v-if="mode === 'login'" type="button" class="lp-forgot-btn" @click="mode = 'forgot'; error = ''; successMessage = ''">Forgot?</button>
            </div>
            <div class="lp-field__wrap">
              <Lock class="lp-field__icon" />
              <input v-model="password" id="lp-password" type="password" required placeholder="••••••••" class="lp-field__input" />
            </div>
          </div>

          <div v-if="mode === 'reset'" class="lp-field">
            <label for="lp-new-pw" class="lp-field__label">New Password</label>
            <div class="lp-field__wrap">
              <KeyRound class="lp-field__icon" />
              <input v-model="newPassword" id="lp-new-pw" type="password" required minlength="6" placeholder="Min. 6 characters" class="lp-field__input" />
            </div>
          </div>

          <button type="submit" :disabled="loading" class="lp-submit-btn">
            <span v-if="loading" class="lp-submit-btn__inner">
              <svg class="spinner-icon spinner-icon--small" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="spinner-fill" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Processing…
            </span>
            <span v-else class="lp-submit-btn__inner">
              <template v-if="mode === 'login'">Sign in <ArrowRight class="icon-sm" /></template>
              <template v-else-if="mode === 'signup'">Create account <ArrowRight class="icon-sm" /></template>
              <template v-else-if="mode === 'forgot'">Send reset link <ArrowRight class="icon-sm" /></template>
              <template v-else>Update password <ArrowRight class="icon-sm" /></template>
            </span>
          </button>
        </form>

        <!-- Toggle -->
        <div class="lp-auth__footer">
          <p v-if="mode === 'forgot' || mode === 'reset'" class="lp-auth__footer-text">
            <button type="button" class="lp-back-btn" @click="mode = 'login'; error = ''; successMessage = ''">
              <ArrowLeft class="icon-xs" /> Back to sign in
            </button>
          </p>
          <p v-else class="lp-auth__footer-text">
            {{ mode === 'login' ? "Don't have an account?" : 'Already have an account?' }}
            <button type="button" class="lp-toggle-btn" @click="mode = mode === 'login' ? 'signup' : 'login'; error = ''; successMessage = ''">
              {{ mode === 'login' ? 'Sign up free' : 'Sign in' }}
            </button>
          </p>
        </div>

        <!-- Mobile APK -->
        <div class="lp-auth__mobile-apk">
          <Smartphone class="lp-auth__mobile-apk-icon" />
          <a :href="apkDownloadUrl" download="habuilt.apk" target="_blank" rel="noopener noreferrer" class="lp-auth__mobile-apk-link" @click="handleDownloadApk">
            Download Android APK
          </a>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
/* ── Scrollbar ── */
::-webkit-scrollbar { display: none; }
</style>
