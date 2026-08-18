<script setup>
import { Flame, Award, Clock, Check, ChevronUp, ChevronDown } from 'lucide-vue-next';

const props = defineProps({
  timeGreeting: { type: Object, required: true },
  performanceGrade: { type: Object, required: true },
  systemStreak: { type: Object, required: true },
  availableWallet: { type: Number, default: 0 },
  currentDayType: { type: String, default: 'full' },
  todayCompletedCount: { type: Number, default: 0 },
  totalHabits: { type: Number, default: 0 },
  isCurrentMonth: { type: Boolean, default: true },
  currentDay: { type: Number, default: 1 },
  upNextHabitInfo: { type: Object, default: null },
  mobileHeroExpanded: { type: Boolean, default: false },
  hasCompletedDay: { type: Function, required: true },
});

const emit = defineEmits([
  'set-day-type',
  'toggle-up-next',
  'toggle-expand',
]);
</script>

<template>
  <div class="mobile-compact-bar">
    <div class="mcb-row">
      <span class="mcb-greeting">{{ timeGreeting.salute }}, {{ timeGreeting.name }}</span>
      <span class="grade-badge mcb-grade" :class="performanceGrade.class">{{ performanceGrade.grade }}</span>
      <span class="mcb-streak"><Flame class="icon-xs" /> {{ systemStreak.current }}d</span>
      <span class="mcb-wallet"><Award class="icon-xs" /> {{ availableWallet }}pts</span>
    </div>
    <div class="mcb-row mcb-row--progress">
      <div class="mcb-day-pills">
        <button class="mcb-pill" :class="{ 'mcb-pill--active': currentDayType === 'full' }" @click="emit('set-day-type', 'full')">Full</button>
        <button class="mcb-pill" :class="{ 'mcb-pill--active': currentDayType === 'half' }" @click="emit('set-day-type', 'half')">Half</button>
        <button class="mcb-pill" :class="{ 'mcb-pill--active': currentDayType === 'floor' }" @click="emit('set-day-type', 'floor')">Floor</button>
      </div>
      <div class="mcb-progress-track">
        <div class="mcb-progress-fill" :style="{ width: `${totalHabits > 0 ? Math.min(100, Math.round((todayCompletedCount / totalHabits) * 100)) : 0}%` }"></div>
      </div>
      <span class="mcb-progress-label">{{ todayCompletedCount }}/{{ totalHabits }}</span>
    </div>

    <!-- Live Up Next Activity Row on Mobile -->
    <div
      v-if="isCurrentMonth && upNextHabitInfo && !hasCompletedDay(upNextHabitInfo.habit, currentDay)"
      class="mcb-up-next-row"
      @click="emit('toggle-up-next', upNextHabitInfo.habit, currentDay)"
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

    <button class="mcb-expand-btn" @click="emit('toggle-expand')">
      {{ mobileHeroExpanded ? 'Hide Dashboard' : 'Show Dashboard' }}
      <ChevronUp v-if="mobileHeroExpanded" class="icon-xs" />
      <ChevronDown v-else class="icon-xs" />
    </button>
  </div>
</template>
