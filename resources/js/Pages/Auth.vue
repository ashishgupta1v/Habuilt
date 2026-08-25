<script setup>
import { ref, computed, onMounted } from 'vue';
import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Zap,
  KeyRound,
  ArrowLeft,
  Smartphone,
  Download,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  Timer,
  Award,
  Layers,
  Clock,
  Check,
  TrendingUp,
  Activity,
} from 'lucide-vue-next';
import HabuiltLogo from '@/Components/Brand/HabuiltLogo.vue';

const emit = defineEmits(['guest-login']);

const email = ref('');
const password = ref('');
const newPassword = ref('');
const mode = ref('login'); // 'login' | 'signup' | 'forgot' | 'reset'
const loading = ref(false);
const error = ref('');
const successMessage = ref('');
const isDownloadingApk = ref(false);

const apkDownloadUrl = 'https://github.com/ashishgupta1v/Habuilt/releases/download/latest-build/habuilt.apk';

// Interactive Feature Preview Tab on Hero Panel
const activePreviewTab = ref('timeline'); // 'timeline' | 'timer' | 'adaptive' | 'gamification'

const previewFeatures = [
  {
    id: 'timeline',
    label: 'Live Due-Now Timeline',
    icon: Clock,
    badge: 'Real-Time Intelligence',
    title: 'Never wonder what to do next',
    problem: 'Traditional to-do apps dump 30 tasks on your plate with zero time context, leading to overwhelm and decision fatigue.',
    solution: 'Habuilt dynamically organizes your day into time-phased blocks (Morning, Deep Work, Evening), automatically calculating what is DUE NOW.',
    demoTitle: 'CURRENT FOCUS · WORK BLOCK',
    demoTask: 'Deep Architecture & Core Execution',
    demoTime: '09:00 – 10:30 (90 min)',
    demoStatus: 'DUE NOW',
    demoStreak: '🔥 18 Day Streak',
  },
  {
    id: 'timer',
    label: 'Deep Work Focus Station',
    icon: Timer,
    badge: 'Distraction Destroyer',
    title: 'Laser-focused execution blocks',
    problem: 'Context switching and notifications derail deep flow states, leaving high-priority projects unfinished.',
    solution: 'Built-in Pomodoro deep work timers linked directly to your core habits with background completion and lockscreen alerts.',
    demoTitle: 'FOCUS TIMER ACTIVE',
    demoTask: 'Sprint Deliverables Block',
    demoTime: '45m Target · 28:14 Elapsed',
    demoStatus: 'IN PROGRESS',
    demoStreak: '⚡ 100% Flow State',
  },
  {
    id: 'adaptive',
    label: 'Adaptive Day-Type Engine',
    icon: Calendar,
    badge: 'Context-Aware Flexibility',
    title: 'Schedules that adapt when life happens',
    problem: 'Rigid habit trackers break the moment you travel, have an office day, or take a half-day off, causing streak resets.',
    solution: 'Calendar-aware engine automatically switches between Home, Office travel blocks, Half-days, and Holidays with 1-tap manual override.',
    demoTitle: 'SMART SCHEDULE DETECTED',
    demoTask: 'Adaptive Office Travel Routine',
    demoTime: '4 Modes: Home · Office · ½ Day · Holiday',
    demoStatus: 'AUTO-ADJUSTED',
    demoStreak: '🛡️ Streak Protected',
  },
  {
    id: 'gamification',
    label: 'Gamified XP & Reward Vault',
    icon: Award,
    badge: 'Dopamine For Good',
    title: 'Turn daily discipline into real rewards',
    problem: 'Habits fade after week 1 because there is no immediate feedback loop or tangible reward for showing up daily.',
    solution: 'Earn XP for every micro-action, level up your warrior rank, maintain system streaks, and claim custom reward milestones.',
    demoTitle: 'WARRIOR RANK: LEVEL 8',
    demoTask: 'Mastery Tier · 1,420 Total XP',
    demoTime: 'Next Reward: Weekend Tech Gadget (80% unlocked)',
    demoStatus: 'LEVEL UP',
    demoStreak: '👑 Master Status',
  },
];

const currentPreview = computed(() => {
  return previewFeatures.find(f => f.id === activePreviewTab.value) || previewFeatures[0];
});

// Direct APK download trigger
const handleDownloadApk = () => {
  isDownloadingApk.value = true;
  setTimeout(() => {
    isDownloadingApk.value = false;
  }, 3500);
};

// Check if user reached here via a password reset recovery link
onMounted(() => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('access_token'))) {
      mode.value = 'reset';
    }

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
      } catch (e) {
        console.warn('Auth back button note:', e);
      }
    }
  }
});

const handleAuth = async () => {
  loading.value = true;
  error.value = '';
  successMessage.value = '';

  try {
    if (mode.value === 'signup') {
      const { data, error: err } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      });
      if (err) throw err;
      successMessage.value = 'Account created successfully! Check your email or log in.';
      mode.value = 'login';
    } else if (mode.value === 'forgot') {
      const isCapacitor = typeof window !== 'undefined' && (window.Capacitor?.isNativePlatform?.() || window.location.origin.includes('localhost'));
      const redirectUrl = isCapacitor ? 'habuilt://auth/callback' : `${window.location.origin}/auth/callback`;

      const { error: err } = await supabase.auth.resetPasswordForEmail(email.value, {
        redirectTo: redirectUrl,
      });
      if (err) throw err;
      successMessage.value = `Password reset link sent to ${email.value}! Please check your email inbox.`;
    } else if (mode.value === 'reset') {
      const { error: err } = await supabase.auth.updateUser({
        password: newPassword.value,
      });
      if (err) throw err;
      successMessage.value = 'Password updated successfully! You can now log in with your new password.';
      mode.value = 'login';
    } else {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      });
      if (err) throw err;
    }
  } catch (err) {
    error.value = err.message || 'An error occurred during authentication.';
  } finally {
    loading.value = false;
  }
};

const handleGoogleSignIn = async () => {
  error.value = '';
  loading.value = true;
  try {
    const isCapacitor = typeof window !== 'undefined' && (window.Capacitor?.isNativePlatform?.() || window.location.origin.includes('localhost'));
    const redirectUrl = isCapacitor ? 'habuilt://auth/callback' : `${window.location.origin}/auth/callback`;
    
    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: isCapacitor,
      },
    });
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
  const guestUser = {
    id: 'guest',
    email: 'guest@habuilt.com',
    user_metadata: { full_name: 'Habuilt Champion' }
  };
  localStorage.setItem('habuilt_guest_mode', 'true');
  localStorage.setItem('habuilt_cached_user', JSON.stringify(guestUser));
  window.dispatchEvent(new CustomEvent('habuilt-guest-auth', { detail: guestUser }));
  emit('guest-login', guestUser);
};
</script>

<template>
  <div class="auth-layout">
    
    <!-- Ambient Backdrop Light Orbs -->
    <div class="auth-bg-blob auth-bg-blob--primary"></div>
    <div class="auth-bg-blob auth-bg-blob--secondary"></div>
    <div class="auth-bg-blob auth-bg-blob--tertiary"></div>

    <div class="auth-container-unified">
      
      <!-- Left Hero & Dynamic Problem/Solution Showcase Panel -->
      <div class="auth-panel-premium">
        <div class="auth-panel__content-wrapper">
          
          <!-- Logo & Live Badge -->
          <div class="auth-brand-row">
            <HabuiltLogo size="lg" animated />
            <div class="auth-live-pill">
              <span class="auth-live-dot"></span>
              <span>v2.0 Native Android & Web</span>
            </div>
          </div>

          <h1 class="auth-panel__title">
            The Daily Execution OS for <span class="text-gradient">High Performers.</span>
          </h1>
          <p class="auth-panel__description">
            Replace chaotic to-do lists with a time-anchored routine engine. Stay in flow with live due-now alerts, adaptive schedules, and 1-tap mobile widgets.
          </p>

          <!-- Interactive Feature Navigation Tabs -->
          <div class="auth-feature-nav">
            <button
              v-for="feat in previewFeatures"
              :key="feat.id"
              type="button"
              class="auth-feature-nav__btn"
              :class="{ 'auth-feature-nav__btn--active': activePreviewTab === feat.id }"
              @click="activePreviewTab = feat.id"
            >
              <component :is="feat.icon" class="icon-xs" />
              <span>{{ feat.label }}</span>
            </button>
          </div>

          <!-- Dynamic Feature Spotlight Card -->
          <div class="auth-spotlight-card">
            <div class="auth-spotlight-card__header">
              <div class="auth-spotlight-badge">
                <Sparkles class="icon-xs" />
                <span>{{ currentPreview.badge }}</span>
              </div>
              <h3 class="auth-spotlight-title">{{ currentPreview.title }}</h3>
            </div>

            <!-- Problem vs Solution Callout -->
            <div class="auth-contrast-grid">
              <div class="auth-contrast-box auth-contrast-box--problem">
                <span class="auth-contrast-label">❌ The Problem</span>
                <p class="auth-contrast-text">{{ currentPreview.problem }}</p>
              </div>
              <div class="auth-contrast-box auth-contrast-box--solution">
                <span class="auth-contrast-label">✨ Habuilt Solution</span>
                <p class="auth-contrast-text">{{ currentPreview.solution }}</p>
              </div>
            </div>

            <!-- Live Interactive UI Simulation Widget -->
            <div class="auth-live-demo-widget">
              <div class="auth-live-demo-widget__top">
                <span class="auth-demo-badge">{{ currentPreview.demoTitle }}</span>
                <span class="auth-demo-status">{{ currentPreview.demoStatus }}</span>
              </div>
              <div class="auth-live-demo-widget__main">
                <div class="auth-demo-check">
                  <Check class="icon-xs" />
                </div>
                <div class="auth-demo-info">
                  <span class="auth-demo-task">{{ currentPreview.demoTask }}</span>
                  <span class="auth-demo-time">{{ currentPreview.demoTime }}</span>
                </div>
                <div class="auth-demo-streak-pill">
                  {{ currentPreview.demoStreak }}
                </div>
              </div>
            </div>
          </div>

          <!-- Android APK Direct Download Banner (Single Direct Action) -->
          <div class="auth-apk-showcase-card">
            <div class="auth-apk-showcase-card__content">
              <div class="auth-apk-showcase-card__icon">
                <Smartphone class="icon-md" />
              </div>
              <div class="auth-apk-showcase-card__text">
                <div class="auth-apk-badge-row">
                  <span class="auth-apk-title">Habuilt for Android</span>
                  <span class="auth-apk-version-tag">Latest APK</span>
                </div>
                <p class="auth-apk-desc">Includes Live Due Now 1-Tap Home Screen Widget & offline sync</p>
              </div>
            </div>
            <a
              :href="apkDownloadUrl"
              download="habuilt.apk"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-apk-direct-download"
              @click="handleDownloadApk"
              title="Download habuilt.apk directly"
            >
              <Download class="icon-sm" :class="{ 'icon-spin': isDownloadingApk }" />
              <span>{{ isDownloadingApk ? 'Downloading APK...' : 'Download Latest APK (habuilt.apk)' }}</span>
            </a>
          </div>

        </div>
      </div>

      <!-- Right Form & Authentication Panel -->
      <div class="auth-panel-form">
        <div class="auth-form-card">
          
          <!-- Mobile Brand Header -->
          <div class="auth-mobile-brand">
            <HabuiltLogo size="md" :with-text="true" />
            <span class="auth-mobile-tagline">Daily Execution Operating System</span>
          </div>

          <div class="auth-header">
            <h2 class="auth-header__title">
              <template v-if="mode === 'login'">Welcome back</template>
              <template v-else-if="mode === 'signup'">Create your account</template>
              <template v-else-if="mode === 'forgot'">Reset password</template>
              <template v-else-if="mode === 'reset'">Set new password</template>
            </h2>
            <p class="auth-header__subtitle">
              <template v-if="mode === 'login'">Sign in to access your routine dashboard & analytics.</template>
              <template v-else-if="mode === 'signup'">Start building unshakable daily discipline today.</template>
              <template v-else-if="mode === 'forgot'">Enter your email to receive a recovery link.</template>
              <template v-else-if="mode === 'reset'">Enter a secure new password for your account.</template>
            </p>
          </div>

          <!-- Instant Guest Mode Entry Pill (Top Recommendation) -->
          <div class="auth-guest-banner" @click="handleGuestAccess">
            <div class="auth-guest-banner__icon">
              <Zap class="icon-sm" />
            </div>
            <div class="auth-guest-banner__info">
              <span class="auth-guest-banner__title">Instant Guest Access</span>
              <span class="auth-guest-banner__sub">Enter workspace immediately with 0 setup</span>
            </div>
            <ArrowRight class="icon-xs auth-guest-banner__arrow" />
          </div>

          <!-- Google OAuth Button -->
          <template v-if="mode === 'login' || mode === 'signup'">
            <button 
              @click="handleGoogleSignIn"
              type="button" 
              class="btn-oauth-premium"
            >
              <svg class="icon-oauth" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <!-- Divider -->
            <div class="auth-divider-modern">
              <div class="auth-divider-modern__line"></div>
              <span class="auth-divider-modern__text">or continue with email</span>
              <div class="auth-divider-modern__line"></div>
            </div>
          </template>

          <!-- Email/Password Form -->
          <form @submit.prevent="handleAuth" class="auth-form-modern">
            
            <!-- Success Notification -->
            <div v-if="successMessage" class="auth-alert auth-alert--success">
              <CheckCircle2 class="auth-alert__icon" />
              <span>{{ successMessage }}</span>
            </div>

            <!-- Error Notification -->
            <div v-if="error" class="auth-alert auth-alert--error">
              <ShieldCheck class="auth-alert__icon" />
              <span>{{ error }}</span>
            </div>

            <!-- Email Field -->
            <div v-if="mode !== 'reset'" class="auth-field">
              <label for="email" class="auth-field__label">Email address</label>
              <div class="auth-field__input-box">
                <Mail class="auth-field__icon" />
                <input 
                  v-model="email" 
                  id="email" 
                  type="email" 
                  required 
                  placeholder="you@domain.com"
                  class="auth-field__input" 
                />
              </div>
            </div>

            <!-- Password Field -->
            <div v-if="mode === 'login' || mode === 'signup'" class="auth-field">
              <div class="auth-field__label-row">
                <label for="password" class="auth-field__label">Password</label>
                <button 
                  v-if="mode === 'login'" 
                  type="button" 
                  @click="mode = 'forgot'; error = ''; successMessage = '';"
                  class="auth-field__forgot-btn"
                >
                  Forgot password?
                </button>
              </div>
              <div class="auth-field__input-box">
                <Lock class="auth-field__icon" />
                <input 
                  v-model="password" 
                  id="password" 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  class="auth-field__input" 
                />
              </div>
            </div>

            <!-- New Password (Reset Mode) -->
            <div v-if="mode === 'reset'" class="auth-field">
              <label for="new-password" class="auth-field__label">New Password</label>
              <div class="auth-field__input-box">
                <KeyRound class="auth-field__icon" />
                <input 
                  v-model="newPassword" 
                  id="new-password" 
                  type="password" 
                  required 
                  minlength="6"
                  placeholder="Enter new password (min 6 chars)"
                  class="auth-field__input" 
                />
              </div>
            </div>

            <!-- Submit Action -->
            <button 
              type="submit" 
              :disabled="loading" 
              class="btn-auth-submit-glow"
            >
              <span v-if="loading" class="btn-auth-submit__inner">
                <svg class="spinner-icon spinner-icon--small" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="spinner-fill" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </span>
              <span v-else class="btn-auth-submit__inner">
                <template v-if="mode === 'login'">
                  <span>Sign in to your account</span>
                  <ArrowRight class="icon-sm" />
                </template>
                <template v-else-if="mode === 'signup'">
                  <span>Create free account</span>
                  <ArrowRight class="icon-sm" />
                </template>
                <template v-else-if="mode === 'forgot'">
                  <span>Send Recovery Link</span>
                  <ArrowRight class="icon-sm" />
                </template>
                <template v-else-if="mode === 'reset'">
                  <span>Update Password</span>
                  <ArrowRight class="icon-sm" />
                </template>
              </span>
            </button>
          </form>

          <!-- Toggle Mode switch -->
          <div class="auth-footer-toggle">
            <p v-if="mode === 'forgot' || mode === 'reset'" class="auth-footer-toggle__text">
              <button 
                type="button" 
                @click="mode = 'login'; error = ''; successMessage = '';" 
                class="auth-footer-toggle__btn-back"
              >
                <ArrowLeft class="icon-xs" /> <span>Back to Login</span>
              </button>
            </p>
            <p v-else class="auth-footer-toggle__text">
              {{ mode === 'login' ? "Don't have an account?" : 'Already have an account?' }}
              <button 
                type="button" 
                @click="mode = mode === 'login' ? 'signup' : 'login'; error = ''; successMessage = '';" 
                class="auth-footer-toggle__btn-link"
              >
                {{ mode === 'login' ? "Sign up for free" : 'Log in here' }}
              </button>
            </p>
          </div>

          <!-- Mobile / Secondary Direct APK Download Bar (Single Action, No QR Code) -->
          <div class="auth-mobile-apk-box">
            <div class="auth-mobile-apk-box__header">
              <Smartphone class="icon-xs icon-emerald" />
              <span>Android App & Widget</span>
            </div>
            <a
              :href="apkDownloadUrl"
              download="habuilt.apk"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-mobile-apk-download"
              @click="handleDownloadApk"
              title="Download Latest Android APK (habuilt.apk)"
            >
              <Download class="icon-xs" />
              <span>Download Habuilt APK</span>
            </a>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
::-webkit-scrollbar {
  display: none;
}
</style>
