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
});

const emit = defineEmits([
  'toggle-travel',
  'prev-month',
  'next-month',
  'toggle-theme',
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
