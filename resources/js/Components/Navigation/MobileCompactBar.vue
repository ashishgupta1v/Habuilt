<script setup>
import { computed } from 'vue';
import {
  Flame,
  Award,
  Clock,
  Check,
  Sparkles,
  Sun,
  Moon,
  Plane,
  Share2,
  RefreshCw,
} from 'lucide-vue-next';

const props = defineProps({
  timeGreeting: { type: Object, required: true },
  performanceGrade: { type: Object, required: true },
  systemStreak: { type: Object, required: true },
  availableWallet: { type: Number, default: 0 },
  todayPoints: { type: Number, default: 0 },
  todayCompletedCount: { type: Number, default: 0 },
  totalHabits: { type: Number, default: 0 },
  isCurrentMonth: { type: Boolean, default: true },
  currentDay: { type: Number, default: 1 },
  upNextHabitInfo: { type: Object, default: null },
  hasCompletedDay: { type: Function, required: true },
  isAshish: { type: Boolean, default: false },
  travelMode: { type: Boolean, default: false },
  darkMode: { type: Boolean, default: true },
  isSyncing: { type: Boolean, default: false },
});

const emit = defineEmits([
  'toggle-up-next',
  'toggle-theme',
  'toggle-travel',
  'share-scorecard',
  'reload-app',
]);

const autoProtocolBadge = computed(() => {
  const pts = props.todayPoints;
  if (pts >= 15) return { label: '🏆 Full Target', class: 'mcb-auto-badge--full' };
  if (pts >= 8)  return { label: '⚡ Half Hit', class: 'mcb-auto-badge--half' };
  if (pts >= 4)  return { label: '🛡️ Floor Safe', class: 'mcb-auto-badge--floor' };
  return { label: `${pts}/15 pts`, class: 'mcb-auto-badge--base' };
});
</script>

<template>
  <div class="mobile-compact-bar">
    <!-- Top Row: Greeting, Status & Action Icons -->
    <div class="mcb-row mcb-row--top">
      <div class="mcb-user-group">
        <span class="mcb-greeting">{{ timeGreeting.salute }}, {{ timeGreeting.name }}</span>
        <span class="grade-badge mcb-grade" :class="performanceGrade.class">{{ performanceGrade.grade }}</span>
      </div>

      <div class="mcb-actions-group">
        <!-- Manual Sync / Reload Button -->
        <button
          id="mcb-btn-reload"
          type="button"
          class="mcb-icon-btn"
          @click="emit('reload-app')"
          :title="isSyncing ? 'Syncing...' : 'Reload & Sync Database'"
          aria-label="Reload and Sync"
        >
          <RefreshCw class="icon-xs" :class="{ 'animate-spin': isSyncing }" />
        </button>

        <!-- Travel Mode Toggle (Ashish only) -->
        <button
          v-if="isAshish"
          id="mcb-btn-travel"
          type="button"
          class="mcb-icon-btn mcb-icon-btn--travel"
          :class="{ 'mcb-icon-btn--travel-active': travelMode }"
          @click="emit('toggle-travel')"
          :title="travelMode ? 'Chandigarh Routine Active • Tap to return to Home' : 'Switch to Chandigarh Routine'"
        >
          <Plane class="icon-xs" />
          <span class="mcb-travel-label">{{ travelMode ? 'CHD' : 'Travel' }}</span>
        </button>

        <!-- Share Scorecard Button -->
        <button
          id="mcb-btn-share"
          type="button"
          class="mcb-icon-btn"
          @click="emit('share-scorecard')"
          title="Share Daily Scorecard"
          aria-label="Share Daily Scorecard"
        >
          <Share2 class="icon-xs" />
        </button>

        <!-- Dark / Light Mode Switcher -->
        <button
          id="mcb-btn-theme"
          type="button"
          class="mcb-icon-btn mcb-icon-btn--theme"
          @click="emit('toggle-theme')"
          :title="darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          aria-label="Toggle Theme"
        >
          <Sun v-if="darkMode" class="icon-xs icon-sun" />
          <Moon v-else class="icon-xs icon-moon" />
        </button>
      </div>
    </div>

    <!-- Middle Row: Streak, Wallet & Progress Bar -->
    <div class="mcb-row mcb-row--stats">
      <div class="mcb-stats-pills">
        <span class="mcb-streak"><Flame class="icon-xs icon-flame" /> {{ systemStreak.current }}d streak</span>
        <span class="mcb-wallet"><Award class="icon-xs icon-vault-gold" /> {{ availableWallet }} pts</span>
      </div>

      <div class="mcb-progress-group">
        <span class="mcb-auto-badge" :class="autoProtocolBadge.class">
          {{ autoProtocolBadge.label }}
        </span>
        <div class="mcb-progress-track">
          <div
            class="mcb-progress-fill"
            :style="{ width: `${totalHabits > 0 ? Math.min(100, Math.round((todayCompletedCount / totalHabits) * 100)) : 0}%` }"
          ></div>
        </div>
        <span class="mcb-progress-label mono-num">{{ todayCompletedCount }}/{{ totalHabits }}</span>
      </div>
    </div>

    <!-- Live Up Next Activity Strip on Mobile -->
    <div
      v-if="isCurrentMonth && upNextHabitInfo && !hasCompletedDay(upNextHabitInfo.habit, currentDay)"
      id="mcb-btn-upnext"
      class="mcb-up-next-row"
      @click="emit('toggle-up-next', upNextHabitInfo.habit, currentDay)"
      title="Tap to mark done"
    >
      <div class="mcb-up-next-tag" :class="{ 'mcb-up-next-tag--due': upNextHabitInfo.status === 'due' }">
        <Clock class="icon-xs" />
        <span>{{ upNextHabitInfo.shortBadge }}</span>
      </div>
      <span class="mcb-up-next-title">{{ upNextHabitInfo.habit.name }}</span>
      <span class="mcb-up-next-action">
        <Check class="icon-xs" />
        <span>+{{ upNextHabitInfo.habit.points }}pt</span>
      </span>
    </div>
  </div>
</template>
