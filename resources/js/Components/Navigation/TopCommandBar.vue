<script setup>
import { ref, computed } from 'vue';
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
  Smartphone,
} from 'lucide-vue-next';

const props = defineProps({
  isJyoti: { type: Boolean, default: false },
  isAshish: { type: Boolean, default: false },
  displayName: { type: String, default: 'User' },
  levelData: { type: Object, required: true },
  levelTitle: { type: String, default: 'Starter' },
  totalXP: { type: Number, default: 0 },
  travelMode: { type: Boolean, default: false },
  canNavigatePrevMonth: { type: Boolean, default: true },
  canNavigateNextMonth: { type: Boolean, default: true },
  isNavigatingMonth: { type: Boolean, default: false },
  monthLabel: { type: String, default: '' },
  year: { type: Number, required: true },
  darkMode: { type: Boolean, default: false },
  activeTab: { type: String, default: 'today' },
  timerRunning: { type: Boolean, default: false },
});

const emit = defineEmits([
  'toggle-travel',
  'prev-month',
  'next-month',
  'toggle-theme',
  'set-tab',
  'open-apk-modal',
]);

const showLevelInfo = ref(false);
</script>

<template>
  <div class="hero-command-bar">
    <div class="hero-command-bar__left">
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
      <!-- Android App Install / Download Modal Button -->
      <button
        type="button"
        class="hero-apk-btn"
        @click="emit('open-apk-modal')"
        title="Download Native Android APK (with Due Now Home Screen Widget)"
      >
        <Smartphone class="icon-xs" />
        <span>Get Android App</span>
      </button>

      <!-- Travel Mode Button (Aligned Icon + Text) -->
      <button
        v-if="isAshish"
        type="button"
        class="hero-travel-btn"
        :class="{ 'hero-travel-btn--active': travelMode }"
        @click="emit('toggle-travel')"
        :title="travelMode ? 'Travel Mode Active (Chandigarh Routine: 33 habits) • Tap to switch to Home' : 'Switch to Travel Mode (Chandigarh Routine)'"
      >
        <Plane class="icon-xs icon-plane" />
        <span class="hero-travel-text">{{ travelMode ? 'Chandigarh' : 'Travel' }}</span>
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

    <!-- Level & XP Popover Modal -->
    <div v-if="showLevelInfo" class="hero-level-popover-overlay" @click.self="showLevelInfo = false">
      <div class="hero-level-popover">
        <div class="hero-level-popover__head">
          <div class="hero-level-popover__title">
            <Zap class="icon-sm icon-zap" />
            <span>Habuilt XP Progression System</span>
          </div>
          <button type="button" class="hero-level-popover__close" @click="showLevelInfo = false">
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
  </div>
</template>
