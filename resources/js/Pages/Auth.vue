<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import {
  Mail, Lock, ArrowRight, ShieldCheck, Zap, KeyRound, ArrowLeft,
  Smartphone, Download, CheckCircle2, Sparkles, Timer, Award,
  Clock, Check, ChevronRight, Play, Star, Flame, Shield,
  Layers, Compass, BarChart3
} from 'lucide-vue-next';
import HabuiltLogo from '@/Components/Brand/HabuiltLogo.vue';
import AppInstallModal from '@/Components/Modals/AppInstallModal.vue';
import { APK_DOWNLOAD_URL } from '@/config/appConfig';

const emit = defineEmits(['guest-login']);

const email    = ref('');
const password = ref('');
const newPassword = ref('');
const mode = ref('login');
const loading = ref(false);
const error = ref('');
const successMessage = ref('');
const activeFeature = ref(0);
const progressPercent = ref(0);
let ticker = null;
let progressTicker = null;

// PWA Install Prompt State
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

const apkUrl = APK_DOWNLOAD_URL;

/* ─── Feature Showcase Data ─────────────────────────────────────── */
const features = [
  {
    num: '01',
    id: 'due-now',
    color: '#10b981',
    colorDark: '#059669',
    shadow: 'rgba(16, 185, 129, 0.22)',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    label: 'Due-Now Engine',
    headline: "Always know what's next.\nNever lose momentum.",
    body: 'A live, time-phased schedule surfaces the exact habit needing your attention right now — so you never stare at an overwhelming list.',
    stat: '3.2×',
    statLabel: 'Higher Daily Completion',
    statDesc: 'vs. static habit checklists',
    pills: ['Dynamic Timeline', 'Auto-Prioritization', 'Smart Alerts'],
    mock: {
      type: 'due-now',
      badge: 'DUE NOW',
      title: 'Deep Work: Core Architecture',
      timeSlot: '09:00 – 10:30 AM',
      streak: '18 Days',
      progress: 68,
      subtext: 'Time remaining: 28 mins in flow window'
    }
  },
  {
    num: '02',
    id: 'focus-station',
    color: '#818cf8',
    colorDark: '#6366f1',
    shadow: 'rgba(129, 140, 248, 0.22)',
    badgeBg: 'rgba(129, 140, 248, 0.12)',
    label: 'Focus Workstation',
    headline: '90-minute deep flows.\nZero interruptions.',
    body: 'Integrated Pomodoro workstation with ambient timers and lockscreen widgets keep your mind locked into high-output focus blocks.',
    stat: '91%',
    statLabel: 'Flow Session Success',
    statDesc: 'avg focus session completion',
    pills: ['Custom Intervals', 'Home Screen Widget', 'Lockscreen Sync'],
    mock: {
      type: 'focus',
      badge: 'FOCUS ACTIVE',
      title: 'Sprint: System Architecture & Refactor',
      timeSlot: '28:14 / 45:00',
      streak: '9 Sessions',
      progress: 63,
      subtext: 'High-discipline zone active'
    }
  },
  {
    num: '03',
    id: 'warrior-ranks',
    color: '#f59e0b',
    colorDark: '#d97706',
    shadow: 'rgba(245, 158, 11, 0.22)',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    label: 'Warrior Ranks',
    headline: 'Discipline turned into\na game you master.',
    body: 'Earn XP for every finished habit. Climb warrior tiers from Novice to Grandmaster. Unlock milestone reward vaults along your journey.',
    stat: '5.8×',
    statLabel: '30-Day Habit Retention',
    statDesc: 'gamified streak consistency',
    pills: ['Warrior Tiers', 'XP Rewards', 'Milestone Vaults'],
    mock: {
      type: 'ranks',
      badge: 'LEVEL 8 · MASTERY',
      title: 'Grandmaster Discipline Tier',
      timeSlot: '1,420 XP · Next Level: 80%',
      streak: '32 Days',
      progress: 80,
      subtext: 'Next milestone reward vault unlocks in 180 XP'
    }
  },
  {
    num: '04',
    id: 'adaptive-mode',
    color: '#38bdf8',
    colorDark: '#0284c7',
    shadow: 'rgba(56, 189, 248, 0.22)',
    badgeBg: 'rgba(56, 189, 248, 0.12)',
    label: 'Adaptive Schedules',
    headline: 'Life changes daily.\nYour system adapts.',
    body: 'Home day? Office commute? Travel or Holiday? Habuilt intelligently shifts your daily habits so you never break a streak when routine changes.',
    stat: '100%',
    statLabel: 'Streak Protection',
    statDesc: 'adaptive routine continuity',
    pills: ['4 Day Profiles', 'Commute Mode', 'Streak Shield'],
    mock: {
      type: 'adaptive',
      badge: 'OFFICE MODE ACTIVE',
      title: 'Adaptive Schedule: Office Day',
      timeSlot: 'Commute · Office · Evening Shift',
      streak: 'Shield Active',
      progress: 100,
      subtext: 'Travel routines automatically re-routed'
    }
  }
];

const current = computed(() => features[activeFeature.value]);

const setFeature = (i) => {
  activeFeature.value = i;
  startTicker();
};

const CYCLE_DURATION = 4200;
const TICK_STEP = 50;

const startTicker = () => {
  clearInterval(ticker);
  clearInterval(progressTicker);
  progressPercent.value = 0;

  const startTime = Date.now();
  progressTicker = setInterval(() => {
    const elapsed = Date.now() - startTime;
    progressPercent.value = Math.min(100, (elapsed / CYCLE_DURATION) * 100);
  }, TICK_STEP);

  ticker = setInterval(() => {
    activeFeature.value = (activeFeature.value + 1) % features.length;
    startTicker();
  }, CYCLE_DURATION);
};

/* ─── Social Proof Data ─────────────────────────────────────────── */
const socialUsers = [
  { initial: 'A', bg: 'linear-gradient(135deg, #10b981, #047857)' },
  { initial: 'J', bg: 'linear-gradient(135deg, #818cf8, #4f46e5)' },
  { initial: 'M', bg: 'linear-gradient(135deg, #f59e0b, #b45309)' },
  { initial: 'S', bg: 'linear-gradient(135deg, #38bdf8, #0284c7)' },
];

/* ─── Auth Logic ─────────────────────────────────────────────────── */
onMounted(() => {
  startTicker();
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      canInstallPwa.value = false;
      deferredInstallPrompt.value = null;
    });

    const h = window.location.hash;
    if (h.includes('type=recovery')) mode.value = 'reset';
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
        });
      } catch {}
    }
  }
});

onUnmounted(() => {
  clearInterval(ticker);
  clearInterval(progressTicker);
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  }
});

const handleAuth = async () => {
  loading.value = true;
  error.value = '';
  successMessage.value = '';
  try {
    if (mode.value === 'signup') {
      const { error: e } = await supabase.auth.signUp({ email: email.value, password: password.value });
      if (e) throw e;
      successMessage.value = 'Account created — check your email or sign in.';
      mode.value = 'login';
    } else if (mode.value === 'forgot') {
      const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
      const { error: e } = await supabase.auth.resetPasswordForEmail(email.value, {
        redirectTo: isNative ? 'habuilt://auth/callback' : `${window.location.origin}/auth/callback`,
      });
      if (e) throw e;
      successMessage.value = `Reset link sent to ${email.value}`;
    } else if (mode.value === 'reset') {
      const { error: e } = await supabase.auth.updateUser({ password: newPassword.value });
      if (e) throw e;
      successMessage.value = 'Password updated successfully.';
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
  error.value = '';
  loading.value = true;
  try {
    const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
    const { data, error: e } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: isNative ? 'habuilt://auth/callback' : `${window.location.origin}/auth/callback`, skipBrowserRedirect: isNative },
    });
    if (e) throw e;
    if (isNative && data?.url) {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: data.url, windowName: '_self' });
    }
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
};

const handleGuest = () => {
  const user = { id: 'guest', email: 'guest@habuilt.com', user_metadata: { full_name: 'Habuilt Champion' } };
  localStorage.setItem('habuilt_guest_mode', 'true');
  localStorage.setItem('habuilt_cached_user', JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('habuilt-guest-auth', { detail: user }));
  emit('guest-login', user);
};

const handleTrackPreview = (track) => {
  const user = track === 'jyoti'
    ? { id: 'jyoti', email: 'goyaljyoti007@gmail.com', user_metadata: { full_name: 'Jyoti Goyal' } }
    : track === 'ashish'
    ? { id: 'ashish', email: 'ashishgupta1v@gmail.com', user_metadata: { full_name: 'Ashish Gupta' } }
    : { id: 'guest', email: 'guest@habuilt.com', user_metadata: { full_name: 'Habuilt Champion' } };
  localStorage.setItem('habuilt_guest_mode', 'true');
  localStorage.setItem('habuilt_cached_user', JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('habuilt-guest-auth', { detail: user }));
  emit('guest-login', user);
};
</script>

<template>
  <div class="lp">

    <!-- ── Ambient Spatial Background ────────────────────────────── -->
    <div class="lp__bg" aria-hidden="true">
      <!-- Animated multi-stop color orbs -->
      <div class="lp__orb lp__orb--primary" :style="`background: radial-gradient(circle, ${current.color}1c 0%, transparent 70%)`"></div>
      <div class="lp__orb lp__orb--secondary"></div>
      <div class="lp__orb lp__orb--accent"></div>

      <!-- Linear-style SVG Grid Pattern with Vignette -->
      <svg class="lp__grid-pattern" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <pattern id="lux-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
            <circle cx="60" cy="0" r="1" fill="rgba(255,255,255,0.07)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lux-grid)"/>
      </svg>

      <!-- Ambient Light Sweep -->
      <div class="lp__light-sweep"></div>
    </div>

    <!-- ── Main Viewport Split Container ─────────────────────────── -->
    <div class="lp__container">

      <!-- ═══════════════════════════════════════════════════════════
           LEFT COLUMN: HERO, VALUE PROP & INTERACTIVE 3D SHOWCASE
           ═══════════════════════════════════════════════════════════ -->
      <section class="lp__hero">

        <!-- Top Brand Bar -->
        <div class="lp__brand-row">
          <HabuiltLogo size="md" />
          <div class="lp__brand-meta">
            <span class="lp__brand-name">Habuilt</span>
            <span class="lp__brand-tag">Daily Habit &amp; Focus System</span>
          </div>
        </div>

        <!-- Editorial Hero Headline Block -->
        <div class="lp__headline-block">
          <!-- Familiar, Trustworthy Eyebrow -->
          <div class="lp__eyebrow">
            <span class="lp__eyebrow-dot"></span>
            <span class="lp__eyebrow-text">Daily Habit &amp; Routine System</span>
          </div>

          <h1 class="lp__h1">
            Build unshakeable daily habits,<br>
            <span class="lp__h1-gradient">effortlessly engineered.</span>
          </h1>

          <p class="lp__sub">
            Transform vague intentions into automatic daily momentum. Live Due-Now timelines, deep focus workstations, and warrior streak levels — with zero clutter.
          </p>

          <!-- Social Proof Section -->
          <div class="lp__social-proof">
            <div class="lp__avatar-stack">
              <div
                v-for="(user, idx) in socialUsers"
                :key="idx"
                class="lp__avatar"
                :style="{ background: user.bg, zIndex: 5 - idx }"
              >
                <span>{{ user.initial }}</span>
              </div>
            </div>
            <div class="lp__social-text">
              <div class="lp__stars">
                <Star v-for="s in 5" :key="s" class="lp__star-icon" />
                <span class="lp__rating-num">4.9/5</span>
              </div>
              <p class="lp__proof-label">Trusted by <strong>1,400+ builders &amp; high performers</strong></p>
            </div>
          </div>
        </div>

        <!-- ── Interactive 4-Part Feature Tabs with Live Progress ── -->
        <div class="lp__tabs-wrapper">
          <div class="lp__tabs-nav" role="tablist">
            <button
              v-for="(f, i) in features"
              :key="f.id"
              class="lp__tab-btn"
              :class="{ 'lp__tab-btn--active': activeFeature === i }"
              :style="activeFeature === i ? `--tab-color: ${f.color}` : ''"
              type="button"
              role="tab"
              :aria-selected="activeFeature === i"
              @click="setFeature(i)"
            >
              <div class="lp__tab-header">
                <span class="lp__tab-num">{{ f.num }}</span>
                <span class="lp__tab-label">{{ f.label }}</span>
              </div>
              <!-- Animated Progress Bar -->
              <div class="lp__tab-track">
                <div
                  class="lp__tab-fill"
                  :style="activeFeature === i ? { width: `${progressPercent}%`, background: f.color } : { width: '0%' }"
                ></div>
              </div>
            </button>
          </div>

          <!-- ── Feature Spotlight 3D Card ──────────────────────── -->
          <div
            class="lp__showcase-3d"
            :style="`--accent-color: ${current.color}; --accent-shadow: ${current.shadow}; --accent-bg: ${current.badgeBg}`"
          >
            <div class="lp__card-inner">

              <!-- Top Row: Oversized Stat Callout + Headline -->
              <div class="lp__card-header">
                <!-- Oversized Stat Callout -->
                <div class="lp__stat-box">
                  <span class="lp__stat-value">{{ current.stat }}</span>
                  <div class="lp__stat-info">
                    <span class="lp__stat-title">{{ current.statLabel }}</span>
                    <span class="lp__stat-sub">{{ current.statDesc }}</span>
                  </div>
                </div>

                <!-- Feature Description -->
                <div class="lp__feature-info">
                  <h2 class="lp__feature-title">{{ current.headline }}</h2>
                  <p class="lp__feature-desc">{{ current.body }}</p>
                  <div class="lp__feature-tags">
                    <span v-for="tag in current.pills" :key="tag" class="lp__tag-pill">
                      <Sparkles class="lp__tag-icon" />
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- ── 3D Live App Simulation Mock Widget ─────────── -->
              <div class="lp__mock-stage">
                <div class="lp__mock-window">
                  <div class="lp__mock-titlebar">
                    <div class="lp__mock-dots">
                      <span class="lp__dot lp__dot--red"></span>
                      <span class="lp__dot lp__dot--yellow"></span>
                      <span class="lp__dot lp__dot--green"></span>
                    </div>
                    <span class="lp__mock-uri">habuilt.com/app · {{ current.label }}</span>
                    <span class="lp__mock-badge" :style="{ color: current.color, borderColor: `${current.color}40`, background: current.badgeBg }">
                      {{ current.mock.badge }}
                    </span>
                  </div>

                  <!-- Dynamic Mock Content -->
                  <div class="lp__mock-body">
                    <div class="lp__mock-icon-wrap" :style="{ background: `${current.color}20`, borderColor: `${current.color}50` }">
                      <Zap v-if="current.id === 'due-now'" class="lp__mock-svg" :style="{ color: current.color }" />
                      <Timer v-else-if="current.id === 'focus-station'" class="lp__mock-svg" :style="{ color: current.color }" />
                      <Award v-else-if="current.id === 'warrior-ranks'" class="lp__mock-svg" :style="{ color: current.color }" />
                      <Compass v-else class="lp__mock-svg" :style="{ color: current.color }" />
                    </div>

                    <div class="lp__mock-details">
                      <div class="lp__mock-row-top">
                        <span class="lp__mock-name">{{ current.mock.title }}</span>
                        <span class="lp__mock-streak">
                          <Flame class="lp__mock-flame" />
                          {{ current.mock.streak }}
                        </span>
                      </div>
                      <div class="lp__mock-row-meta">
                        <span class="lp__mock-time">{{ current.mock.timeSlot }}</span>
                        <span class="lp__mock-hint">{{ current.mock.subtext }}</span>
                      </div>
                      <div class="lp__mock-progress-track">
                        <div
                          class="lp__mock-progress-fill"
                          :style="{ width: `${current.mock.progress}%`, background: `linear-gradient(90deg, ${current.colorDark}, ${current.color})` }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer Strip: APK Download CTA -->
              <div class="lp__card-foot">
                <span class="lp__foot-tip">Available on Android &amp; Modern Web Browsers</span>
                <a :href="apkUrl" download="habuilt.apk" class="lp__apk-btn">
                  <Download class="lp__apk-icon" />
                  <span>Download for Android</span>
                </a>
              </div>

            </div>
          </div>
        </div>

      </section>

      <!-- ═══════════════════════════════════════════════════════════
           RIGHT COLUMN: FLOATING FROSTED AUTH CARD
           ═══════════════════════════════════════════════════════════ -->
      <aside class="lp__auth-col">
        <div class="lp__auth-glass">

          <!-- Mobile-only logo -->
          <div class="lp__mobile-brand">
            <HabuiltLogo size="sm" />
            <span class="lp__mobile-brand-name">Habuilt</span>
          </div>

          <!-- Quick Track Direct Launch CTAs -->
          <div class="lp__track-picker">
            <button class="lp__hero-guest-btn" type="button" @click="handleTrackPreview('ashish')" style="margin-bottom: 8px;">
              <div class="lp__guest-main">
                <div class="lp__guest-bolt-wrap" style="background: rgba(14, 107, 103, 0.25); color: #2dd4bf;">
                  <Zap class="lp__guest-bolt" />
                </div>
                <div class="lp__guest-text">
                  <span class="lp__guest-head">⚡ Ashish Track (Health &amp; Focus)</span>
                  <span class="lp__guest-sub">Full MOVERS, Isabgol, Yoga, Deep Work &amp; 3L Water</span>
                </div>
              </div>
              <ChevronRight class="lp__guest-arrow" />
            </button>

            <button class="lp__hero-guest-btn" type="button" @click="handleTrackPreview('jyoti')" style="margin-bottom: 16px; border-color: rgba(142, 59, 95, 0.4);">
              <div class="lp__guest-main">
                <div class="lp__guest-bolt-wrap" style="background: rgba(142, 59, 95, 0.25); color: #f472b6;">
                  <Sparkles class="lp__guest-bolt" />
                </div>
                <div class="lp__guest-text">
                  <span class="lp__guest-head">🌸 Jyoti Track (Nursing &amp; Career)</span>
                  <span class="lp__guest-sub">B12, D3 + DHA, IBP Planning, Tummy Time &amp; Sleep</span>
                </div>
              </div>
              <ChevronRight class="lp__guest-arrow" />
            </button>
          </div>

          <!-- Auth Header -->
          <div class="lp__auth-header">
            <h3 class="lp__auth-h3">
              <template v-if="mode === 'login'">Sign In to Your Workspace</template>
              <template v-else-if="mode === 'signup'">Create Free Account</template>
              <template v-else-if="mode === 'forgot'">Reset Password</template>
              <template v-else>Set New Password</template>
            </h3>
            <p class="lp__auth-subtext">
              <template v-if="mode === 'login'">Sync habits, streaks, and focus across all devices.</template>
              <template v-else-if="mode === 'signup'">Join ambitious builders tracking daily discipline.</template>
              <template v-else-if="mode === 'forgot'">We'll send a secure password reset link to your email.</template>
              <template v-else>Choose a strong new password for your account.</template>
            </p>
          </div>

          <!-- Google OAuth Button -->
          <template v-if="mode === 'login' || mode === 'signup'">
            <button class="lp__google-btn" type="button" @click="handleGoogle">
              <svg class="lp__google-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div class="lp__divider">
              <span class="lp__divider-line"></span>
              <span class="lp__divider-text">or email</span>
              <span class="lp__divider-line"></span>
            </div>
          </template>

          <!-- Feedback Alerts -->
          <div v-if="successMessage" class="lp__alert lp__alert--success">
            <CheckCircle2 class="lp__alert-icon" />
            <span>{{ successMessage }}</span>
          </div>
          <div v-if="error" class="lp__alert lp__alert--error">
            <ShieldCheck class="lp__alert-icon" />
            <span>{{ error }}</span>
          </div>

          <!-- Auth Form -->
          <form @submit.prevent="handleAuth" class="lp__form-fields">
            <div v-if="mode !== 'reset'" class="lp__input-group">
              <label class="lp__input-label" for="auth-email">Email Address</label>
              <div class="lp__input-box">
                <Mail class="lp__field-icon" />
                <input
                  id="auth-email"
                  v-model="email"
                  type="email"
                  required
                  placeholder="name@domain.com"
                  class="lp__text-input"
                  autocomplete="email"
                />
              </div>
            </div>

            <div v-if="mode === 'login' || mode === 'signup'" class="lp__input-group">
              <div class="lp__label-row">
                <label class="lp__input-label" for="auth-password">Password</label>
                <button
                  v-if="mode === 'login'"
                  type="button"
                  class="lp__forgot-link"
                  @click="mode = 'forgot'; error = ''; successMessage = ''"
                >
                  Forgot?
                </button>
              </div>
              <div class="lp__input-box">
                <Lock class="lp__field-icon" />
                <input
                  id="auth-password"
                  v-model="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  class="lp__text-input"
                  autocomplete="current-password"
                />
              </div>
            </div>

            <div v-if="mode === 'reset'" class="lp__input-group">
              <label class="lp__input-label" for="auth-new-password">New Password</label>
              <div class="lp__input-box">
                <KeyRound class="lp__field-icon" />
                <input
                  id="auth-new-password"
                  v-model="newPassword"
                  type="password"
                  required
                  minlength="6"
                  placeholder="Min. 6 characters"
                  class="lp__text-input"
                />
              </div>
            </div>

            <!-- Submit Button -->
            <button type="submit" :disabled="loading" class="lp__submit-btn">
              <template v-if="loading">
                <svg class="lp__spin-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity=".2"/>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span>Processing…</span>
              </template>
              <template v-else>
                <span v-if="mode === 'login'">Sign In</span>
                <span v-else-if="mode === 'signup'">Create Free Account</span>
                <span v-else-if="mode === 'forgot'">Send Reset Link</span>
                <span v-else>Update Password</span>
                <ArrowRight class="lp__btn-arrow" />
              </template>
            </button>
          </form>

          <!-- Toggle Mode Switcher -->
          <div class="lp__auth-toggle">
            <template v-if="mode === 'forgot' || mode === 'reset'">
              <button type="button" class="lp__back-btn" @click="mode = 'login'; error = ''; successMessage = ''">
                <ArrowLeft class="lp__back-icon" />
                <span>Back to sign in</span>
              </button>
            </template>
            <template v-else>
              <span class="lp__toggle-text">
                {{ mode === 'login' ? "Don't have an account?" : "Already have an account?" }}
                <button
                  type="button"
                  class="lp__toggle-link"
                  @click="mode = mode === 'login' ? 'signup' : 'login'; error = ''; successMessage = ''"
                >
                  {{ mode === 'login' ? 'Sign up free' : 'Sign in' }}
                </button>
              </span>
            </template>
          </div>

          <!-- Bottom Privacy & Security Micro-Badge -->
          <div class="lp__auth-badges">
            <span class="lp__security-pill">
              <Shield class="lp__sec-icon" />
              End-to-End Encrypted Sync
            </span>
          </div>

        </div>
      </aside>

    </div>
  </div>
</template>
