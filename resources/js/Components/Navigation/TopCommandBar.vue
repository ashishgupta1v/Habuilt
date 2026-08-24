<script setup>
import { ref, computed } from 'vue';
import HabuiltLogo from '@/Components/Brand/HabuiltLogo.vue';
import {
  Sparkles,
  Zap,
  Plane,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sun,
  Moon,
  CheckSquare,
  Timer,
  BarChart3,
  Award,
  Info,
  X,
  Download,
  Bell,
  Monitor,
  MapPin,
} from 'lucide-vue-next';

const props = defineProps({
  isJyoti: { type: Boolean, default: false },
  isAshish: { type: Boolean, default: false },
  displayName: { type: String, default: 'User' },
  levelData: { type: Object, required: true },
  levelTitle: { type: String, default: 'Starter' },
  totalXP: { type: Number, default: 0 },
  travelMode: { type: Boolean, default: false },
  dayType: { type: String, default: 'home' },
  dayTypeLabel: { type: String, default: '🏠 Home' },
  canNavigatePrevMonth: { type: Boolean, default: true },
  canNavigateNextMonth: { type: Boolean, default: true },
  isNavigatingMonth: { type: Boolean, default: false },
  monthLabel: { type: String, default: '' },
  year: { type: Number, required: true },
  darkMode: { type: Boolean, default: false },
  activeTab: { type: String, default: 'today' },
  timerRunning: { type: Boolean, default: false },
  notificationsEnabled: { type: Boolean, default: false },
});

const emit = defineEmits([
  'toggle-travel',
  'prev-month',
  'next-month',
  'toggle-theme',
  'set-tab',
  'open-install-modal',
]);

const showLevelInfo = ref(false);
</script>

<template>
  <div class="hero-command-bar">
    <div class="hero-command-bar__left">
      <!-- Habuilt Brand Logo & Name -->
      <HabuiltLogo size="xs" :with-text="true" :show-badge="false" class="hero-brand-logo" />

      <!-- User / Track System Pill -->
      <span class="hero-track-pill" :class="isJyoti ? 'hero-track-pill--jyoti' : (isAshish ? 'hero-track-pill--ashish' : 'hero-track-pill--generic')">
        <Sparkles class="icon-xs" />
        <span v-if="isJyoti">Jyoti's System</span>
        <span v-else-if="isAshish">Ashish's System</span>
        <span v-else>{{ displayName }}'s System</span>
      </span>
      <span class="hero-version-tag">PRO</span>

      <!-- Level & XP Chip (Clickable for info) -->
      <button
        type="button"
        class="hero-level-chip"
        @click="showLevelInfo = !showLevelInfo"
        :title="`Level ${levelData.level} ${levelTitle} • ${levelData.xpInLevel}/${levelData.xpForNext} XP to next level (Click to learn more)`"
      >
        <Zap class="icon-xs icon-zap" />
        <span class="hero-level-chip__text">Lv. {{ levelData.level }} {{ levelTitle }}</span>
        <span class="hero-level-chip__xp mono-num">{{ totalXP }} XP</span>
      </button>
    </div>

    <!-- Desktop Navigation Tab Switcher -->
    <nav class="hero-desktop-nav" aria-label="Desktop Navigation">
      <button
        type="button"
        class="hero-desktop-tab"
        :class="{ 'hero-desktop-tab--active': activeTab === 'today' }"
        @click="emit('set-tab', 'today')"
      >
        <CheckSquare class="icon-xs" />
        <span>Checklist</span>
      </button>
      <button
        type="button"
        class="hero-desktop-tab"
        :class="{ 'hero-desktop-tab--active': activeTab === 'focus' }"
        @click="emit('set-tab', 'focus')"
      >
        <Timer class="icon-xs" />
        <span>Focus Station</span>
        <span v-if="timerRunning" class="hero-desktop-tab__pulse"></span>
      </button>
      <button
        type="button"
        class="hero-desktop-tab"
        :class="{ 'hero-desktop-tab--active': activeTab === 'stats' }"
        @click="emit('set-tab', 'stats')"
      >
        <BarChart3 class="icon-xs" />
        <span>Analytics</span>
      </button>
      <button
        type="button"
        class="hero-desktop-tab"
        :class="{ 'hero-desktop-tab--active': activeTab === 'rewards' }"
        @click="emit('set-tab', 'rewards')"
      >
        <Award class="icon-xs" />
        <span>Reward Vault</span>
      </button>
    </nav>

    <div class="hero-command-bar__right">
      <!-- Day Type Cycle Button (Office Calendar Aware) -->
      <button
        v-if="isAshish"
        type="button"
        class="hero-travel-btn"
        :class="{ 'hero-travel-btn--active': travelMode, 'hero-travel-btn--half': dayType === 'half-day', 'hero-travel-btn--holiday': dayType === 'holiday' }"
        @click="emit('toggle-travel')"
        :title="`Current: ${dayTypeLabel} • Tap to cycle day type`"
      >
        <Plane v-if="travelMode" class="icon-xs icon-plane" />
        <Calendar v-else-if="dayType === 'half-day' || dayType === 'holiday'" class="icon-xs" />
        <MapPin v-else class="icon-xs" />
        <span class="hero-travel-text">{{ dayType === 'home' ? 'Home' : dayType === 'half-day' ? '½ Day' : dayType === 'holiday' ? 'Holiday' : 'Office' }}</span>
      </button>

      <!-- Month Controls -->
      <div class="hero-month-group">
        <button
          type="button"
          class="hero-icon-btn"
          :disabled="!canNavigatePrevMonth || isNavigatingMonth"
          @click="emit('prev-month')"
          title="Previous Month"
          aria-label="Previous Month"
        >
          <ChevronLeft class="icon-sm" />
        </button>
        <div class="hero-month-chip">
          <Calendar class="icon-xs" />
          <span>{{ monthLabel.slice(0, 3) }} '{{ String(year).slice(-2) }}</span>
        </div>
        <button
          type="button"
          class="hero-icon-btn"
          :disabled="!canNavigateNextMonth || isNavigatingMonth"
          @click="emit('next-month')"
          title="Next Month"
          aria-label="Next Month"
        >
          <ChevronRight class="icon-sm" />
        </button>
      </div>

      <!-- App & Alerts Hub Button (Desktop PWA & Notifications) -->
      <button
        type="button"
        class="hero-app-install-btn"
        @click="emit('open-install-modal')"
        title="Install Windows Desktop App & Enable Notifications"
      >
        <Download class="icon-xs" />
        <span class="hero-app-install-text">App / Alerts</span>
      </button>

      <!-- Theme Switcher -->
      <button
        type="button"
        class="hero-icon-btn hero-icon-btn--theme"
        @click="emit('toggle-theme')"
        :title="darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        aria-label="Toggle Theme"
      >
        <Sun v-if="darkMode" class="icon-sm icon-sun" />
        <Moon v-else class="icon-sm icon-moon" />
      </button>
    </div>

    <!-- Level & XP Popover Modal – Teleported to body to escape stacking context -->
    <Teleport to="body">
      <Transition name="popover-fade">
        <div v-if="showLevelInfo" class="hero-level-popover-overlay" @click.self="showLevelInfo = false">
          <div class="hero-level-popover" role="dialog" aria-modal="true" aria-labelledby="xp-dialog-title">
            <div class="hero-level-popover__head">
              <div class="hero-level-popover__title" id="xp-dialog-title">
                <Zap class="icon-sm icon-zap" />
                <span>Habuilt XP Progression System</span>
              </div>
              <button type="button" class="hero-level-popover__close" @click="showLevelInfo = false" aria-label="Close dialog">
                <X class="icon-xs" />
              </button>
            </div>
            <div class="hero-level-popover__body">
              <p class="hero-level-popover__desc">
                You earn <strong>10 XP</strong> for every point completed. Your current rank is
                <strong>Level {{ levelData.level }} {{ levelTitle }}</strong> ({{ totalXP }} total XP).
              </p>
              <div class="hero-level-tiers-list">
                <div class="hero-level-tier-item" :class="{ 'hero-level-tier-item--current': levelData.level === 1 || levelData.level === 2 }">
                  <span class="tier-badge">Lv 1–2</span>
                  <span class="tier-title">Initiate</span>
                  <span class="tier-xp">0–999 XP</span>
                </div>
                <div class="hero-level-tier-item" :class="{ 'hero-level-tier-item--current': levelData.level === 3 || levelData.level === 4 }">
                  <span class="tier-badge">Lv 3–4</span>
                  <span class="tier-title">Practitioner</span>
                  <span class="tier-xp">1,000–1,999 XP</span>
                </div>
                <div class="hero-level-tier-item" :class="{ 'hero-level-tier-item--current': levelData.level === 5 || levelData.level === 6 }">
                  <span class="tier-badge">Lv 5–6</span>
                  <span class="tier-title">Architect</span>
                  <span class="tier-xp">2,000–2,999 XP</span>
                </div>
                <div class="hero-level-tier-item" :class="{ 'hero-level-tier-item--current': levelData.level >= 7 && levelData.level <= 9 }">
                  <span class="tier-badge">Lv 7–9</span>
                  <span class="tier-title">Titan</span>
                  <span class="tier-xp">3,000–4,999 XP</span>
                </div>
                <div class="hero-level-tier-item" :class="{ 'hero-level-tier-item--current': levelData.level >= 10 }">
                  <span class="tier-badge">Lv 10+</span>
                  <span class="tier-title">Ascendant</span>
                  <span class="tier-xp">5,000+ XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
