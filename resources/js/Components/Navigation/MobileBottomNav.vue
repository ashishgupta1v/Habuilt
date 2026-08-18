<script setup>
import { Zap, Timer, BarChart3, Award } from 'lucide-vue-next';

const props = defineProps({
  activeTab: { type: String, default: 'today' },
  todayCompletedCount: { type: Number, default: 0 },
  totalHabits: { type: Number, default: 0 },
  timerRunning: { type: Boolean, default: false },
});

const emit = defineEmits(['update:activeTab']);

const setTab = (tab) => {
  emit('update:activeTab', tab);
  // Update browser URL query parameter without page reload
  try {
    const url = new URL(window.location.href);
    if (tab === 'today') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tab);
    }
    window.history.pushState({ tab }, '', url.toString());
  } catch { /* history pushState fallback */ }

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10);
  }
};
</script>

<template>
  <nav class="mobile-bottom-nav" aria-label="Mobile Navigation">
    <button
      type="button"
      class="mobile-bottom-nav__item"
      :class="{ 'mobile-bottom-nav__item--active': activeTab === 'today' }"
      @click="setTab('today')"
      aria-label="Today's Habits"
    >
      <div class="mobile-bottom-nav__icon-wrap">
        <Zap class="mobile-bottom-nav__icon" />
        <span v-if="todayCompletedCount < totalHabits" class="mobile-bottom-nav__badge-dot"></span>
      </div>
      <span class="mobile-bottom-nav__label">Today</span>
    </button>

    <button
      type="button"
      class="mobile-bottom-nav__item"
      :class="{ 'mobile-bottom-nav__item--active': activeTab === 'focus' }"
      @click="setTab('focus')"
      aria-label="Focus Workstation"
    >
      <div class="mobile-bottom-nav__icon-wrap">
        <Timer class="mobile-bottom-nav__icon" />
        <span v-if="timerRunning" class="mobile-bottom-nav__badge-pulse"></span>
      </div>
      <span class="mobile-bottom-nav__label">Focus</span>
    </button>

    <button
      type="button"
      class="mobile-bottom-nav__item"
      :class="{ 'mobile-bottom-nav__item--active': activeTab === 'stats' }"
      @click="setTab('stats')"
      aria-label="Stats and Analytics"
    >
      <div class="mobile-bottom-nav__icon-wrap">
        <BarChart3 class="mobile-bottom-nav__icon" />
      </div>
      <span class="mobile-bottom-nav__label">Stats</span>
    </button>

    <button
      type="button"
      class="mobile-bottom-nav__item"
      :class="{ 'mobile-bottom-nav__item--active': activeTab === 'rewards' }"
      @click="setTab('rewards')"
      aria-label="Reward Shop and Ledger"
    >
      <div class="mobile-bottom-nav__icon-wrap">
        <Award class="mobile-bottom-nav__icon" />
      </div>
      <span class="mobile-bottom-nav__label">Rewards</span>
    </button>
  </nav>
</template>
