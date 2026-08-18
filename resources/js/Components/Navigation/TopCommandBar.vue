<script setup>
import { computed } from 'vue';
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
]);
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
      <!-- Level / XP Pill -->
      <div class="hero-level-chip" :title="`${levelData.xpInLevel} / ${levelData.xpForNext} XP to next level`">
        <Zap class="icon-xs icon-zap" />
        <span class="hero-level-chip__text">Lv. {{ levelData.level }} {{ levelTitle }}</span>
        <span class="hero-level-chip__xp">{{ totalXP }} XP</span>
      </div>
    </div>

    <!-- Desktop Navigation Tab Switcher -->
    <nav class="hero-desktop-nav" aria-label="Desktop Views">
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
      <!-- Travel Mode (Chandigarh Preset — Ashish only) -->
      <button
        v-if="isAshish"
        class="hero-nav-btn hero-nav-btn--travel"
        :class="{ 'hero-nav-btn--travel-active': travelMode }"
        @click="emit('toggle-travel')"
        :title="travelMode ? 'Travel Mode Active (Chandigarh - 33 habits) • Click to return to Home' : 'Switch to Travel Mode (Chandigarh)'"
      >
        <Plane class="icon-sm" />
        <span class="hero-travel-tag">{{ travelMode ? 'Chandigarh' : 'Travel' }}</span>
      </button>

      <button class="hero-nav-btn" :disabled="!canNavigatePrevMonth || isNavigatingMonth" @click="emit('prev-month')" title="Previous Month">
        <ChevronLeft class="icon-sm" />
      </button>
      <div class="hero-month-chip">
        <Calendar class="icon-xs" />
        <span>{{ monthLabel.slice(0, 3) }} '{{ String(year).slice(-2) }}</span>
      </div>
      <button class="hero-nav-btn" :disabled="!canNavigateNextMonth || isNavigatingMonth" @click="emit('next-month')" title="Next Month">
        <ChevronRight class="icon-sm" />
      </button>
      <button class="hero-nav-btn hero-nav-btn--theme" @click="emit('toggle-theme')" :title="darkMode ? 'Light Mode' : 'Dark Mode'" aria-label="Toggle Theme">
        <Sun v-if="darkMode" class="icon-sm icon-sun" />
        <Moon v-else class="icon-sm icon-moon" />
      </button>
    </div>
  </div>
</template>
