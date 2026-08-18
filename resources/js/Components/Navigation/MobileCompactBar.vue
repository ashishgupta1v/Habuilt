<script setup>
import { computed } from 'vue';
import { Flame, Award, Clock, Check, ChevronUp, ChevronDown } from 'lucide-vue-next';

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
  mobileHeroExpanded: { type: Boolean, default: false },
  hasCompletedDay: { type: Function, required: true },
});

const emit = defineEmits([
  'toggle-up-next',
  'toggle-expand',
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
    <div class="mcb-row">
      <span class="mcb-greeting">{{ timeGreeting.salute }}, {{ timeGreeting.name }}</span>
      <span class="grade-badge mcb-grade" :class="performanceGrade.class">{{ performanceGrade.grade }}</span>
      <span class="mcb-streak"><Flame class="icon-xs" /> {{ systemStreak.current }}d</span>
      <span class="mcb-wallet"><Award class="icon-xs" /> {{ availableWallet }}pts</span>
    </div>

    <!-- Automatic Progress & Protocol Row -->
    <div class="mcb-row mcb-row--progress">
      <span class="mcb-auto-badge" :class="autoProtocolBadge.class">
        {{ autoProtocolBadge.label }}
      </span>
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
