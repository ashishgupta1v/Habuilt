<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { supabase } from '@/lib/supabase';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import {
  Mail, Lock, ArrowRight, ShieldCheck, Zap, KeyRound, ArrowLeft,
  Smartphone, Download, CheckCircle2, Sparkles, Timer, Award,
  Clock, Check, ChevronRight, Play, Star, Flame, Shield,
  Layers, Compass, BarChart3, Crown, MessageSquare
} from 'lucide-vue-next';
import HabuiltLogo from '@/Components/Brand/HabuiltLogo.vue';
import AppInstallModal from '@/Components/Modals/AppInstallModal.vue';
import { APK_DOWNLOAD_URL } from '@/config/appConfig';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const landingRoot = ref(null);
let gsapCtx = null;

const emit = defineEmits(['guest-login', 'login-success']);

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
let nativeBackButtonHandle = null;

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

/* ─── Fitflow Nav Menu & Scroll State ────────────────────────────── */
const isNavMenuOpen = ref(false);
const scrollToAuth = () => {
  isNavMenuOpen.value = false;
  const el = document.getElementById('auth-station');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
};

/* ─── Interactive Landing Bento Demo State ────────────────────────── */
const demoDayType = ref('home');
const demoHabits = ref([
  { id: 'h1', time: '05:00 AM', name: 'Morning Hydration & Electrolytes', points: 2, done: false, category: 'Biohacking' },
  { id: 'h2', time: '07:00 AM', name: '45-Min Zone 2 Cardio & Mobility', points: 4, done: true, category: 'Fitness' },
  { id: 'h3', time: '09:00 AM', name: 'Deep Work: Core Architecture Sprint', points: 5, done: false, category: 'Mindset' },
  { id: 'h4', time: '01:00 PM', name: '100g High-Bioavailability Fuel', points: 3, done: false, category: 'Nutrition' },
  { id: 'h5', time: '09:30 PM', name: 'Circadian Melatonin & Screen Off', points: 2, done: false, category: 'Recovery' },
]);

const demoPoints = computed(() => {
  return demoHabits.value.filter(h => h.done).reduce((acc, h) => acc + h.points, 0);
});

const demoMaxPoints = computed(() => {
  return demoHabits.value.reduce((acc, h) => acc + h.points, 0);
});

const demoProgressPercent = computed(() => {
  if (demoMaxPoints.value === 0) return 0;
  return Math.round((demoPoints.value / demoMaxPoints.value) * 100);
});

const onNavMenuEnter = (el, done) => {
  const backdrop = el.querySelector('.fitflow-menu-backdrop');
  const card = el.querySelector('.fitflow-menu-card');
  const links = el.querySelectorAll('.fitflow-menu-link');

  if (backdrop && card) {
    gsap.set(backdrop, { opacity: 0 });
    gsap.set(card, { y: -25, scale: 0.93, opacity: 0 });
    if (links.length > 0) gsap.set(links, { y: 14, opacity: 0 });

    const tl = gsap.timeline({ onComplete: done });
    tl.to(backdrop, { opacity: 1, duration: 0.28, ease: 'power2.out' })
      .to(card, { y: 0, scale: 1, opacity: 1, duration: 0.38, ease: 'back.out(1.5)' }, '-=0.15');
    if (links.length > 0) {
      tl.to(links, { y: 0, opacity: 1, stagger: 0.04, duration: 0.3, ease: 'power2.out' }, '-=0.22');
    }
  } else {
    done();
  }
};

const onNavMenuLeave = (el, done) => {
  const backdrop = el.querySelector('.fitflow-menu-backdrop');
  const card = el.querySelector('.fitflow-menu-card');

  if (backdrop && card) {
    const tl = gsap.timeline({ onComplete: done });
    tl.to(card, { y: -16, scale: 0.95, opacity: 0, duration: 0.22, ease: 'power2.in' })
      .to(backdrop, { opacity: 0, duration: 0.2, ease: 'power2.in' }, '-=0.1');
  } else {
    done();
  }
};

const toggleDemoHabit = (id) => {
  const habit = demoHabits.value.find(h => h.id === id);
  if (habit) {
    habit.done = !habit.done;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
    if (typeof document !== 'undefined') {
      const el = document.querySelector(`[data-demo-habit="${id}"]`);
      if (el) {
        gsap.fromTo(el, { scale: 0.96 }, { scale: 1, duration: 0.35, ease: 'back.out(2.2)' });
      }
    }
  }
};

const switchDemoDayType = (type) => {
  demoDayType.value = type;
  if (type === 'office') {
    demoHabits.value = [
      { id: 'h1', time: '06:00 AM', name: 'Early Commute Hydration & Mobility', points: 2, done: true, category: 'Biohacking' },
      { id: 'h2', time: '08:00 AM', name: 'Commute Audio Mastery & Planning', points: 3, done: true, category: 'Mindset' },
      { id: 'h3', time: '10:00 AM', name: 'Executive Deep Focus Session', points: 6, done: false, category: 'Discipline' },
      { id: 'h4', time: '07:30 PM', name: 'Post-Office Spinal Decompression', points: 3, done: false, category: 'Recovery' },
    ];
  } else if (type === 'travel') {
    demoHabits.value = [
      { id: 'h1', time: 'Anytime', name: 'Streak Shield Protection Active', points: 5, done: true, category: 'Shield' },
      { id: 'h2', time: 'Morning', name: 'Hotel Mobility & Bodyweight Flow', points: 3, done: false, category: 'Fitness' },
      { id: 'h3', time: 'Evening', name: 'Zero Late-Night Screen Consumption', points: 3, done: false, category: 'Recovery' },
    ];
  } else {
    demoHabits.value = [
      { id: 'h1', time: '05:00 AM', name: 'Morning Hydration & Electrolytes', points: 2, done: false, category: 'Biohacking' },
      { id: 'h2', time: '07:00 AM', name: '45-Min Zone 2 Cardio & Mobility', points: 4, done: true, category: 'Fitness' },
      { id: 'h3', time: '09:00 AM', name: 'Deep Work: Core Architecture Sprint', points: 5, done: false, category: 'Mindset' },
      { id: 'h4', time: '01:00 PM', name: '100g High-Bioavailability Fuel', points: 3, done: false, category: 'Nutrition' },
      { id: 'h5', time: '09:30 PM', name: 'Circadian Melatonin & Screen Off', points: 2, done: false, category: 'Recovery' },
    ];
  }
};

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

    // Check for incoming auth error from redirect
    const lastErr = localStorage.getItem('habuilt_auth_last_error');
    if (lastErr) {
      error.value = lastErr;
      localStorage.removeItem('habuilt_auth_last_error');
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
        }).then(handle => {
          nativeBackButtonHandle = handle;
        }).catch(() => {});
      } catch {}
    }

    // GSAP Fitflow Cinematic Choreography
    if (landingRoot.value) {
      gsapCtx = gsap.context(() => {
        // 1. Hero Stagger Entrance Timeline
        const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        heroTl.from('.fitflow-header', {
          y: -25,
          opacity: 0,
          duration: 0.7,
        })
        .from('.fitflow-trust-pill', {
          y: 20,
          opacity: 0,
          duration: 0.6,
        }, '-=0.35')
        .from('.fitflow-hero-headline', {
          y: 35,
          opacity: 0,
          duration: 0.85,
        }, '-=0.4')
        .from('.fitflow-hero-col-right', {
          y: 30,
          opacity: 0,
          duration: 0.75,
        }, '-=0.55');

        // 2. Ambient Split Illumination Breathing
        gsap.to('.fitflow-hero-glow--pink', {
          scale: 1.15,
          opacity: 0.65,
          duration: 5.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });
        gsap.to('.fitflow-hero-glow--cyan', {
          scale: 1.12,
          opacity: 0.7,
          duration: 6.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut'
        });

        // 3. Typographic Watermark Parallax on Scroll
        gsap.to('.fitflow-watermark-text', {
          scrollTrigger: {
            trigger: '.fitflow-about-section',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2,
          },
          y: -50,
          ease: 'none',
        });

        // 4. Monumental Metrics Reveal
        gsap.from('.fitflow-metric-card', {
          scrollTrigger: {
            trigger: '.fitflow-monumental-metrics',
            start: 'top 85%',
          },
          y: 30,
          opacity: 0,
          stagger: 0.14,
          duration: 0.75,
          ease: 'power3.out',
        });

        // 5. 3D Bento Props Cards Reveal & Idle Floating Physics
        gsap.from('.fitflow-prop-card', {
          scrollTrigger: {
            trigger: '.fitflow-bento-props-grid',
            start: 'top 85%',
          },
          y: 40,
          opacity: 0,
          stagger: 0.16,
          duration: 0.8,
          ease: 'power3.out',
        });

        // Subtle continuous floating for 3D props
        gsap.to('.fitflow-prop-stage-img--dumbbell', {
          y: '-=6px',
          duration: 2.6,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
        gsap.to('.fitflow-prop-stage-img--bottle', {
          y: '-=8px',
          duration: 3.1,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
        gsap.to('.fitflow-prop-stage-img--trophy', {
          y: '-=7px',
          duration: 2.9,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });

        // 6. Interactive Playground Reveal
        gsap.from('.fitflow-playground-section .lp__mock-window', {
          scrollTrigger: {
            trigger: '.fitflow-playground-section',
            start: 'top 80%',
          },
          y: 35,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.out',
        });

        // 7. Blueprint Showcase & Auth Station Reveal
        gsap.from('.fitflow-blueprints-grid > div', {
          scrollTrigger: {
            trigger: '#auth-station',
            start: 'top 80%',
          },
          y: 35,
          opacity: 0,
          stagger: 0.18,
          duration: 0.75,
          ease: 'power3.out',
        });
      }, landingRoot.value);
    }
  }
});

onUnmounted(() => {
  if (gsapCtx) {
    try { gsapCtx.revert(); } catch {}
    gsapCtx = null;
  }
  if (nativeBackButtonHandle) {
    try { nativeBackButtonHandle.remove(); } catch {}
    nativeBackButtonHandle = null;
  }
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
  const cleanEmail = (email.value || '').trim();
  const cleanPassword = password.value;
  try {
    if (mode.value === 'signup') {
      const { data, error: e } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPassword
      });
      if (e) throw e;
      if (data?.session?.user) {
        emit('login-success', data.session.user);
      } else {
        successMessage.value = 'Account created! Please check your email to confirm, then sign in.';
        mode.value = 'login';
      }
    } else if (mode.value === 'forgot') {
      const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
      const { error: e } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: isNative ? 'habuilt://auth/callback' : `${window.location.origin}/auth/callback`,
      });
      if (e) throw e;
      successMessage.value = `Password reset link sent to ${cleanEmail}. Check your inbox.`;
    } else if (mode.value === 'otp') {
      const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
      const { error: e } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: isNative ? 'habuilt://auth/callback' : `${window.location.origin}/auth/callback`,
        }
      });
      if (e) throw e;
      successMessage.value = `Instant sign-in link sent to ${cleanEmail}. Check your inbox!`;
    } else if (mode.value === 'reset') {
      const { data, error: e } = await supabase.auth.updateUser({ password: newPassword.value });
      if (e) throw e;
      successMessage.value = 'Password updated successfully. You can now sign in.';
      mode.value = 'login';
    } else {
      const { data, error: e } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword
      });
      if (e) throw e;
      if (data?.user) {
        emit('login-success', data.user);
      }
    }
  } catch (e) {
    const msg = e?.message || 'Authentication error.';
    if (msg.toLowerCase().includes('invalid login credentials')) {
      error.value = 'Invalid email or password. If you originally signed up with Google, tap "Continue with Google" above or click "Forgot?" to set a password.';
    } else if (msg.toLowerCase().includes('email not confirmed')) {
      error.value = 'Your email address is not confirmed yet. Check your inbox to confirm, or continue with Google / Guest mode.';
    } else {
      error.value = msg;
    }
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
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: isNative
      },
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

const handleQuickLaunchAshish = () => {
  const ashishUser = {
    id: 'ashish',
    email: 'ashishgupta1v@gmail.com',
    user_metadata: {
      full_name: 'Ashish Gupta',
      preferred_archetype: 'archetype-ashish',
      onboarding_completed: true,
    },
  };
  localStorage.setItem('habuilt_cached_user', JSON.stringify(ashishUser));
  localStorage.setItem('habuilt_active_protocol_id_ashish', 'archetype-ashish');
  localStorage.removeItem('habuilt_guest_mode');
  window.dispatchEvent(new CustomEvent('habuilt-guest-auth', { detail: ashishUser }));
  emit('login-success', ashishUser);
};

const handleQuickLaunchJyoti = () => {
  const jyotiUser = {
    id: 'jyoti',
    email: 'goyaljyoti007@gmail.com',
    user_metadata: {
      full_name: 'Jyoti Goyal',
      preferred_archetype: 'archetype-jyoti',
      onboarding_completed: true,
    },
  };
  localStorage.setItem('habuilt_cached_user', JSON.stringify(jyotiUser));
  localStorage.setItem('habuilt_active_protocol_id_jyoti', 'archetype-jyoti');
  localStorage.removeItem('habuilt_guest_mode');
  window.dispatchEvent(new CustomEvent('habuilt-guest-auth', { detail: jyotiUser }));
  emit('login-success', jyotiUser);
};

const handleGuest = (preferredArchetype = 'archetype-founder') => {
  const user = {
    id: 'guest',
    email: 'guest@habuilt.com',
    user_metadata: { full_name: 'Habuilt Champion', preferred_archetype: preferredArchetype },
  };
  localStorage.setItem('habuilt_guest_mode', 'true');
  localStorage.setItem('habuilt_cached_user', JSON.stringify(user));
  if (preferredArchetype) {
    localStorage.setItem('habuilt_active_protocol_id_guest', preferredArchetype);
  }
  window.dispatchEvent(new CustomEvent('habuilt-guest-auth', { detail: user }));
  emit('guest-login', user);
};
</script>

<template>
  <div class="lp fitflow-landing-root" ref="landingRoot">

    <!-- ── Ambient Spatial Background Mesh ───────────────────────── -->
    <div class="lp__bg" aria-hidden="true">
      <div class="lp__orb lp__orb--primary"></div>
      <div class="lp__orb lp__orb--secondary"></div>
      <div class="lp__orb lp__orb--accent"></div>
    </div>

    <!-- ── Fitflow Fixed / Floating Top Header Bar ────────────────── -->
    <header class="fitflow-header">
      <div class="fitflow-header__inner">
        <div class="fitflow-header__brand">
          <HabuiltLogo size="md" :with-text="true" />
        </div>

        <div class="fitflow-header__actions">
          <button
            type="button"
            class="fitflow-pill-btn fitflow-pill-btn--menu"
            @click="isNavMenuOpen = !isNavMenuOpen"
            aria-label="Toggle navigation menu"
          >
            MENU
          </button>
        </div>
      </div>
    </header>

    <!-- ══════════════════════════════════════════════════════════════
         SECTION 1: THE FULL-BLEED CINEMATIC FITFLOW HERO
         ══════════════════════════════════════════════════════════════ -->
    <section class="fitflow-hero-stage">
      <!-- Split Dual-Tone Lighting & Cinematic Athlete Visual -->
      <div class="fitflow-hero-backdrop">
        <img
          src="/images/fitflow/hero_athlete.jpg"
          alt="Fitflow Executive Athlete"
          class="fitflow-hero-img"
        />
        <div class="fitflow-hero-glow fitflow-hero-glow--pink"></div>
        <div class="fitflow-hero-glow fitflow-hero-glow--cyan"></div>
        <div class="fitflow-hero-gradient-overlay"></div>
      </div>

      <div class="fitflow-hero-container">
        <!-- Floating Trust Badge -->
        <div class="fitflow-trust-pill">
          <span class="fitflow-star">★</span>
          <span>Excellent <strong>4.9 out of 5</strong> • Trusted by 1,400+ High Performers</span>
        </div>

        <!-- Hero Main Split: Left Monumental Title, Right Body & CTAs -->
        <div class="fitflow-hero-split">
          <div class="fitflow-hero-col-left">
            <h1 class="fitflow-hero-headline">
              Discipline.<br>
              <span class="fitflow-gradient-pink">Momentum.</span><br>
              <span class="fitflow-gradient-cyan">You.</span>
            </h1>
          </div>

          <div class="fitflow-hero-col-right">
            <p class="fitflow-hero-subtext">
              Transform vague intentions into automatic executive momentum. Real-time ZoetiCoach Adherence HUD, WhatsApp daily check-ins with Coach Vikas, and adaptive routines tailored to your lifestyle.
            </p>

            <div class="fitflow-hero-ctas">
              <button
                type="button"
                class="fitflow-pill-btn fitflow-pill-btn--white"
                @click="handleGuest('archetype-founder')"
              >
                <span>Start Your Protocol</span>
                <span class="fitflow-pill-btn__arrow">↗</span>
              </button>

              <a
                href="https://zoeticoach.com/join/vikas"
                target="_blank"
                rel="noopener noreferrer"
                class="fitflow-pill-btn fitflow-pill-btn--glass"
              >
                <span>Chat with Coach Vikas</span>
                <span class="fitflow-pill-btn__arrow" style="background: #25d366; color: #ffffff;">💬</span>
              </a>
            </div>

            <!-- Social Proof Avatar Stack & Stars -->
            <div class="fitflow-hero-social">
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
              <div class="fitflow-hero-social-info">
                <div class="fitflow-hero-stars">
                  <Star v-for="s in 5" :key="s" class="fitflow-star-icon" />
                  <span class="fitflow-rating-val">4.9/5</span>
                </div>
                <span class="fitflow-social-caption">Consistency rating across iOS, Android &amp; Web</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════
         SECTION 2: ABOUT / WATERMARK & MONUMENTAL METRIC RIBBON
         ══════════════════════════════════════════════════════════════ -->
    <section class="fitflow-section fitflow-about-section">
      <!-- Faint Oversized Watermark Typography -->
      <div class="fitflow-watermark-text" aria-hidden="true">
        HABIT VELOCITY
      </div>

      <div class="fitflow-content-container">
        <div class="fitflow-section-header">
          <span class="fitflow-eyebrow">ABOUT HABUILT</span>
          <h2 class="fitflow-section-title">
            Your Discipline, <span class="fitflow-gradient-pink">Your Flow.</span>
          </h2>
          <p class="fitflow-section-desc">
            At Habuilt by ZoetiCoach, we believe habit consistency is more than just checklists — it's an executive operating system tailored to your energy, calendar, and mindset. Whether you're optimizing deep work, dialing in sleep, or building athletic endurance, our adaptive protocols guide every step.
          </p>
        </div>

        <!-- 3 Monumental Metric Cards -->
        <div class="fitflow-monumental-metrics">
          <div class="fitflow-metric-card">
            <span class="fitflow-metric-number fitflow-metric-number--pink">1,400+</span>
            <span class="fitflow-metric-label">ACTIVE BUILDERS</span>
          </div>
          <div style="width: 1px; height: 50px; background: rgba(15, 23, 42, 0.08);"></div>
          <div class="fitflow-metric-card">
            <span class="fitflow-metric-number fitflow-metric-number--purple">98.4%</span>
            <span class="fitflow-metric-label">CONSISTENCY RATE</span>
          </div>
          <div style="width: 1px; height: 50px; background: rgba(15, 23, 42, 0.08);"></div>
          <div class="fitflow-metric-card">
            <span class="fitflow-metric-number fitflow-metric-number--cyan">120K+</span>
            <span class="fitflow-metric-label">HABITS LOGGED</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════
         SECTION 3: SIGNATURE 3D BENTO CARDS WITH PROTRUDING PROPS
         ══════════════════════════════════════════════════════════════ -->
    <section class="fitflow-section fitflow-bento-section">
      <div class="fitflow-content-container">
        <div class="fitflow-section-header">
          <span class="fitflow-eyebrow">ENGINEERED FOR EXECUTION</span>
          <h2 class="fitflow-section-title">
            Precision Habit Architecture.
          </h2>
          <p class="fitflow-section-desc">
            Tangible physical depth meets 0ms reactive software. Built to keep high performers locked in flow state without mental fatigue.
          </p>
        </div>

        <div class="fitflow-bento-props-grid">
          <!-- Bento Card 1: 3D Yellow Dumbbell Prop -->
          <div class="fitflow-prop-card fitflow-prop-card--dumbbell">
            <div class="fitflow-card-corner-arrow">↗</div>
            <div class="fitflow-prop-stage fitflow-prop-stage--yellow">
              <div class="fitflow-prop-stage-glow"></div>
              <img src="/images/fitflow/prop_dumbbell.jpg" alt="Fitness Dumbbell" class="fitflow-prop-stage-img fitflow-prop-stage-img--dumbbell" />
            </div>
            <div class="fitflow-prop-card__content">
              <h3 class="fitflow-prop-card__title">Kinetic Flow &amp; Mobility.</h3>
              <p class="fitflow-prop-card__desc">
                Build daily strength, posture alignment, and physical resilience with structured progressive movement training.
              </p>
              <div class="fitflow-check-list">
                <div class="fitflow-check-item">
                  <div class="fitflow-check-icon">✓</div>
                  <span>10-Minute Morning Spinal Decompression</span>
                </div>
                <div class="fitflow-check-item">
                  <div class="fitflow-check-icon">✓</div>
                  <span>Zone 2 Cardio &amp; Metabolic Pacing</span>
                </div>
                <div class="fitflow-check-item">
                  <div class="fitflow-check-icon">✓</div>
                  <span>Posture &amp; Energy Alignment</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bento Card 2: 3D Blue Water Bottle Prop -->
          <div class="fitflow-prop-card fitflow-prop-card--bottle">
            <div class="fitflow-card-corner-arrow">↗</div>
            <div class="fitflow-prop-stage fitflow-prop-stage--blue">
              <div class="fitflow-prop-stage-glow"></div>
              <img src="/images/fitflow/prop_bottle.jpg" alt="Hydration Shaker" class="fitflow-prop-stage-img fitflow-prop-stage-img--bottle" />
            </div>
            <div class="fitflow-prop-card__content">
              <h3 class="fitflow-prop-card__title">Circadian Hydration &amp; Rest.</h3>
              <p class="fitflow-prop-card__desc">
                Optimize cellular recovery, eliminate brain fog, and lock in uninterrupted restorative slow-wave sleep.
              </p>
              <div class="fitflow-check-list">
                <div class="fitflow-check-item">
                  <div class="fitflow-check-icon fitflow-check-icon--teal">✓</div>
                  <span>500ml Electrolyte Jumpstart on Waking</span>
                </div>
                <div class="fitflow-check-item">
                  <div class="fitflow-check-icon fitflow-check-icon--teal">✓</div>
                  <span>Caffeine Curfew at 02:00 PM Sharp</span>
                </div>
                <div class="fitflow-check-item">
                  <div class="fitflow-check-icon fitflow-check-icon--teal">✓</div>
                  <span>90-Minute Circadian Melatonin Shield</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bento Card 3: 3D Golden Trophy Prop -->
          <div class="fitflow-prop-card fitflow-prop-card--trophy">
            <div class="fitflow-card-corner-arrow">↗</div>
            <div class="fitflow-prop-stage fitflow-prop-stage--gold">
              <div class="fitflow-prop-stage-glow"></div>
              <img src="/images/fitflow/prop_trophy.jpg" alt="Discipline Trophy" class="fitflow-prop-stage-img fitflow-prop-stage-img--trophy" />
            </div>
            <div class="fitflow-prop-card__content">
              <h3 class="fitflow-prop-card__title">Gamified XP &amp; Reward Vault.</h3>
              <p class="fitflow-prop-card__desc">
                Transform mundane discipline into dopamine wins with real-time XP, streak shields, and real-world milestone rewards.
              </p>
              <div class="fitflow-check-list">
                <div class="fitflow-check-item">
                  <div class="fitflow-check-icon fitflow-check-icon--purple">✓</div>
                  <span>0ms Reactive Instant Point Feedback</span>
                </div>
                <div class="fitflow-check-item">
                  <div class="fitflow-check-icon fitflow-check-icon--purple">✓</div>
                  <span>Streak Shield Protection on Travel Days</span>
                </div>
                <div class="fitflow-check-item">
                  <div class="fitflow-check-icon fitflow-check-icon--purple">✓</div>
                  <span>Milestone Tier Unlocks from Baseline to Master</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════
         SECTION 4: LIVE 0MS INTERACTIVE BENTO PLAYGROUND
         ══════════════════════════════════════════════════════════════ -->
    <section class="fitflow-section fitflow-playground-section" style="background: #ffffff;">
      <div class="fitflow-content-container">
        <div class="fitflow-section-header">
          <span class="fitflow-eyebrow">INTERACTIVE HABIT ENGINE</span>
          <h2 class="fitflow-section-title">
            Try the 0ms Experience.
          </h2>
          <p class="fitflow-section-desc">
            Toggle schedules and tap habits below to experience zero-latency state synchronization in real time.
          </p>
        </div>

        <div class="framer-card framer-glow-box" style="padding: 0; border-radius: 24px; border: 1px solid #e2e8f0; background: #ffffff; max-width: 900px; margin: 0 auto; width: 100%;">
          <div class="lp__mock-window" style="background: #ffffff; border: none;">
            <div class="lp__mock-titlebar" style="border-bottom: 1px solid #e2e8f0; background: #f8fafc; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; border-radius: 24px 24px 0 0;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="lp__mock-dots">
                  <span class="lp__dot lp__dot--red"></span>
                  <span class="lp__dot lp__dot--yellow"></span>
                  <span class="lp__dot lp__dot--green"></span>
                </div>
                <span style="font-size: 13px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 8px;">
                  <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #0d9488; box-shadow: 0 0 8px rgba(13, 148, 136, 0.4);"></span>
                  Live Habit Playground • <strong style="color: #0d9488;">Coach Vikas System</strong>
                </span>
              </div>

              <!-- Day Mode Switcher -->
              <div style="display: flex; gap: 4px; background: #f1f5f9; padding: 4px; border-radius: 10px; border: 1px solid #e2e8f0;">
                <button
                  type="button"
                  class="framer-spring-btn"
                  :style="demoDayType === 'home' ? 'background: #ffffff; color: #0d9488; font-weight: 750; border-radius: 7px; padding: 5px 12px; font-size: 12px; border: 1px solid rgba(13, 148, 136, 0.35); box-shadow: 0 1px 3px rgba(0,0,0,0.06); cursor: pointer;' : 'background: transparent; color: #64748b; padding: 5px 12px; font-size: 12px; border: none; cursor: pointer;'"
                  @click="switchDemoDayType('home')"
                >
                  Home
                </button>
                <button
                  type="button"
                  class="framer-spring-btn"
                  :style="demoDayType === 'office' ? 'background: #ffffff; color: #0284c7; font-weight: 750; border-radius: 7px; padding: 5px 12px; font-size: 12px; border: 1px solid rgba(2, 132, 199, 0.35); box-shadow: 0 1px 3px rgba(0,0,0,0.06); cursor: pointer;' : 'background: transparent; color: #64748b; padding: 5px 12px; font-size: 12px; border: none; cursor: pointer;'"
                  @click="switchDemoDayType('office')"
                >
                  Office
                </button>
                <button
                  type="button"
                  class="framer-spring-btn"
                  :style="demoDayType === 'travel' ? 'background: #ffffff; color: #ea580c; font-weight: 750; border-radius: 7px; padding: 5px 12px; font-size: 12px; border: 1px solid rgba(255, 107, 53, 0.35); box-shadow: 0 1px 3px rgba(0,0,0,0.06); cursor: pointer;' : 'background: transparent; color: #64748b; padding: 5px 12px; font-size: 12px; border: none; cursor: pointer;'"
                  @click="switchDemoDayType('travel')"
                >
                  Travel Shield
                </button>
              </div>
            </div>

            <div style="padding: 20px 24px; background: #ffffff; border-radius: 0 0 24px 24px;">
              <!-- Progress Ring & XP Header -->
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px 20px; flex-wrap: wrap; gap: 14px;">
                <div style="display: flex; align-items: center; gap: 16px;">
                  <div style="position: relative; width: 48px; height: 48px; flex-shrink: 0;">
                    <svg viewBox="0 0 36 36" style="width: 100%; height: 100%; transform: rotate(-90deg);">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e2e8f0"
                        stroke-width="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#0d9488"
                        stroke-width="3.4"
                        stroke-linecap="round"
                        :stroke-dasharray="`${demoProgressPercent}, 100`"
                        style="transition: stroke-dasharray 0.5s cubic-bezier(0.16, 1, 0.3, 1); filter: drop-shadow(0 0 4px rgba(13, 148, 136, 0.3));"
                      />
                    </svg>
                    <div style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; color: #0f172a; font-family: 'JetBrains Mono', monospace;">
                      {{ demoProgressPercent }}%
                    </div>
                  </div>

                  <div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 15px; font-weight: 800; color: #0f172a;">Daily Velocity: {{ demoPoints }} / {{ demoMaxPoints }} pts</span>
                      <span class="framer-pill framer-pill--emerald" style="color: #0d9488; background: rgba(13, 148, 136, 0.1); border: 1px solid rgba(13, 148, 136, 0.25);">🔥 18d Streak Active</span>
                    </div>
                    <p style="font-size: 12px; color: #64748b; margin: 3px 0 0 0;">Tap any habit below for instant reactive completion</p>
                  </div>
                </div>

                <button
                  type="button"
                  class="fitflow-pill-btn fitflow-pill-btn--dark"
                  @click="handleGuest('archetype-founder')"
                  style="padding: 9px 18px; font-size: 13px;"
                >
                  <span>Open Full Dashboard</span>
                  <span class="fitflow-pill-btn__arrow">↗</span>
                </button>
              </div>

              <!-- Clickable Habits -->
              <div style="display: flex; flex-direction: column; gap: 10px;">
                <div
                  v-for="h in demoHabits"
                  :key="h.id"
                  :data-demo-habit="h.id"
                  class="framer-spring-btn"
                  :style="h.done
                    ? 'display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-radius: 14px; background: rgba(13, 148, 136, 0.08); border: 1px solid rgba(13, 148, 136, 0.28); cursor: pointer; transition: all 0.2s ease;'
                    : 'display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-radius: 14px; background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04); cursor: pointer; transition: all 0.2s ease;'"
                  @click="toggleDemoHabit(h.id)"
                >
                  <div style="display: flex; align-items: center; gap: 14px;">
                    <div
                      :style="h.done
                        ? 'width: 26px; height: 26px; border-radius: 8px; background: #0d9488; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(13, 148, 136, 0.35);'
                        : 'width: 26px; height: 26px; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #f8fafc; display: flex; align-items: center; justify-content: center;'"
                    >
                      <Check v-if="h.done" class="icon-xs" style="color: #ffffff; width: 15px; height: 15px; stroke-width: 3;" />
                    </div>

                    <div>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span :style="h.done ? 'font-size: 14px; font-weight: 600; color: #64748b; text-decoration: line-through;' : 'font-size: 14px; font-weight: 750; color: #0f172a;'">
                          {{ h.name }}
                        </span>
                        <span style="font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 5px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0;">
                          {{ h.category }}
                        </span>
                      </div>
                      <span style="font-size: 12px; color: #64748b;">{{ h.time }}</span>
                    </div>
                  </div>

                  <span :style="h.done ? 'font-size: 13px; font-weight: 800; color: #0d9488;' : 'font-size: 13px; font-weight: 700; color: #64748b;'">
                    +{{ h.points }} pts
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════
         SECTION 5: BLUEPRINT SHOWCASE & DIRECT SIGN-IN HUB
         ══════════════════════════════════════════════════════════════ -->
    <section class="fitflow-section fitflow-blueprints-section" id="auth-station">
      <div class="fitflow-content-container">
        <div class="fitflow-section-header">
          <span class="fitflow-eyebrow">EXECUTIVE ACCESS</span>
          <h2 class="fitflow-section-title">
            Choose Your Protocol.
          </h2>
          <p class="fitflow-section-desc">
            Launch instantly with tailored founder routines or sign in to synchronize progress across all your devices.
          </p>
        </div>

        <div class="fitflow-blueprints-grid">
          <!-- Left Column: Blueprint Quick Launchers & Coach Vikas Hub -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <!-- WhatsApp Coach Vikas High-Conversion Card -->
            <div style="padding: 20px 24px; border-radius: 24px; background: rgba(37, 211, 102, 0.08); border: 1px solid rgba(37, 211, 102, 0.35); display: flex; align-items: center; justify-content: space-between; gap: 14px;">
              <div style="display: flex; align-items: center; gap: 14px;">
                <div style="width: 44px; height: 44px; border-radius: 50%; background: rgba(37, 211, 102, 0.2); display: flex; align-items: center; justify-content: center; color: #16a34a; flex-shrink: 0;">
                  <MessageSquare class="icon-sm" />
                </div>
                <div>
                  <span style="font-size: 15px; font-weight: 800; color: #065f46; display: block;">Coach Vikas on WhatsApp</span>
                  <span style="font-size: 12.5px; color: #047857; font-weight: 500;">Direct accountability &amp; custom routine calibration</span>
                </div>
              </div>
              <a
                href="https://zoeticoach.com/join/vikas"
                target="_blank"
                rel="noopener noreferrer"
                class="zc-btn-wa"
                style="padding: 8px 18px; font-size: 13px; text-decoration: none; border-radius: 9999px; font-weight: 750;"
              >
                Start Free →
              </a>
            </div>

            <!-- Ashish Blueprint -->
            <button class="lp__hero-guest-btn fitflow-bento-card" type="button" @click="handleQuickLaunchAshish" style="padding: 22px 24px;">
              <div class="lp__guest-main">
                <div class="lp__guest-bolt-wrap" style="background: rgba(212, 160, 62, 0.18); color: #b45309; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                  <Crown class="icon-sm" />
                </div>
                <div class="lp__guest-text">
                  <span class="lp__guest-head" style="color: #92400e; font-weight: 800; font-size: 15px;">👑 Ashish Track &amp; Blueprint</span>
                  <span class="lp__guest-sub" style="color: #475569; font-size: 12.5px;">Dual-Track Blueprint, ZoetiCoach &amp; Digital Builders</span>
                </div>
              </div>
              <ChevronRight class="lp__guest-arrow" />
            </button>

            <!-- Jyoti Blueprint -->
            <button class="lp__hero-guest-btn fitflow-bento-card" type="button" @click="handleQuickLaunchJyoti" style="padding: 22px 24px;">
              <div class="lp__guest-main">
                <div class="lp__guest-bolt-wrap" style="background: rgba(236, 72, 153, 0.18); color: #db2777; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                  <Sparkles class="icon-sm" />
                </div>
                <div class="lp__guest-text">
                  <span class="lp__guest-head" style="color: #9d174d; font-weight: 800; font-size: 15px;">🌸 Jyoti Track &amp; Blueprint</span>
                  <span class="lp__guest-sub" style="color: #475569; font-size: 12.5px;">Mind-Body Longevity &amp; Precision Habit Routine</span>
                </div>
              </div>
              <ChevronRight class="lp__guest-arrow" />
            </button>

            <!-- Instant Guest Workspace -->
            <button class="lp__hero-guest-btn fitflow-bento-card" type="button" @click="handleGuest('archetype-founder')" style="padding: 22px 24px;">
              <div class="lp__guest-main">
                <div class="lp__guest-bolt-wrap" style="background: rgba(13, 148, 136, 0.18); color: #0d9488; width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
                  <Zap class="icon-sm" />
                </div>
                <div class="lp__guest-text">
                  <span class="lp__guest-head" style="color: #0f172a; font-weight: 800; font-size: 15px;">🚀 Instant Guest Workspace</span>
                  <span class="lp__guest-sub" style="color: #475569; font-size: 12.5px;">Try the full executive habit protocol offline with zero setup</span>
                </div>
              </div>
              <ChevronRight class="lp__guest-arrow" />
            </button>

            <!-- APK Download Strip -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: #ffffff; border-radius: 18px; border: 1px solid #e2e8f0;">
              <span style="font-size: 12.5px; color: #475569; font-weight: 600;">Available for Android &amp; Modern Browsers</span>
              <a :href="apkUrl" download="habuilt.apk" class="lp__apk-btn" style="text-decoration: none; padding: 6px 14px; font-size: 12px;">
                <Download class="lp__apk-icon" />
                <span>Download APK</span>
              </a>
            </div>
          </div>

          <!-- Right Column: Frosted Glass Sign-in Card -->
          <div class="lp__auth-glass" style="box-shadow: 0 20px 50px -10px rgba(15, 23, 42, 0.08); border-radius: 28px; border: 1px solid rgba(15, 23, 42, 0.08); background: #ffffff; padding: 36px 32px;">
            <div class="lp__auth-header">
              <h3 class="lp__auth-h3" style="font-size: 1.45rem; font-weight: 850; color: #0f172a;">
                <template v-if="mode === 'login'">Sign In to Workspace</template>
                <template v-else-if="mode === 'signup'">Create Free Account</template>
                <template v-else-if="mode === 'forgot'">Reset Password</template>
                <template v-else>Set New Password</template>
              </h3>
              <p class="lp__auth-subtext" style="color: #64748b; font-size: 13.5px; margin-top: 4px;">
                <template v-if="mode === 'login'">Sync habits, streaks, and focus across all devices.</template>
                <template v-else-if="mode === 'signup'">Join ambitious builders tracking daily discipline.</template>
                <template v-else-if="mode === 'forgot'">We'll send a secure password reset link to your email.</template>
                <template v-else>Choose a strong new password for your account.</template>
              </p>
            </div>

            <!-- Google OAuth Button -->
            <template v-if="mode === 'login' || mode === 'signup'">
              <button class="lp__google-btn" type="button" @click="handleGoogle" style="margin-top: 16px;">
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
                    @click="mode = 'otp'; error = ''; successMessage = ''"
                    style="margin-right: 8px;"
                  >
                    Magic Link?
                  </button>
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
              <button type="submit" :disabled="loading" class="lp__submit-btn" style="border-radius: 9999px;">
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
              <template v-if="mode === 'forgot' || mode === 'reset' || mode === 'otp'">
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

            <!-- Privacy & Encryption Micro-Badge -->
            <div class="lp__auth-badges">
              <span class="lp__security-pill">
                <Shield class="lp__sec-icon" />
                End-to-End Encrypted Sync
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════════════════════════════════════════════════════════
         NAVIGATION MENU MODAL / SHEET (Triggered by MENU pill)
         ══════════════════════════════════════════════════════════════ -->
    <Transition :css="false" @enter="onNavMenuEnter" @leave="onNavMenuLeave">
      <div v-if="isNavMenuOpen" class="fitflow-menu-modal">
        <div class="fitflow-menu-backdrop" @click="isNavMenuOpen = false"></div>
        <div class="fitflow-menu-card">
          <div class="fitflow-menu-header">
            <HabuiltLogo size="sm" :with-text="true" />
            <button
              type="button"
              class="fitflow-menu-close-btn"
              @click="isNavMenuOpen = false"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          <div class="fitflow-menu-nav-links">
            <button
              type="button"
              class="fitflow-menu-link"
              @click="handleGuest('archetype-founder'); isNavMenuOpen = false;"
            >
              <span>🚀 Start Guest Protocol Free</span>
              <span>↗</span>
            </button>

            <button
              type="button"
              class="fitflow-menu-link"
              @click="handleQuickLaunchAshish(); isNavMenuOpen = false;"
            >
              <span>👑 Ashish Master Blueprint</span>
              <span>→</span>
            </button>

            <button
              type="button"
              class="fitflow-menu-link"
              @click="handleQuickLaunchJyoti(); isNavMenuOpen = false;"
            >
              <span>🌸 Jyoti Blueprint</span>
              <span>→</span>
            </button>

            <a
              href="https://zoeticoach.com/join/vikas"
              target="_blank"
              rel="noopener noreferrer"
              class="fitflow-menu-link"
              @click="isNavMenuOpen = false"
            >
              <span>💬 Chat with Coach Vikas</span>
              <span>↗</span>
            </a>

            <button
              type="button"
              class="fitflow-menu-link"
              @click="scrollToAuth"
            >
              <span>🔐 Sign In / Create Account</span>
              <span>↓</span>
            </button>

            <button
              v-if="canInstallPwa"
              type="button"
              class="fitflow-menu-link"
              @click="handleTriggerInstallPwa(); isNavMenuOpen = false;"
            >
              <span>📲 Install Web App (PWA)</span>
              <span>↓</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- PWA Install Modal Component -->
    <AppInstallModal
      :is-open="isAppInstallModalOpen"
      :can-install-native="canInstallPwa"
      @close="isAppInstallModalOpen = false"
      @trigger-install="handleTriggerInstallPwa"
    />

  </div>
</template>
