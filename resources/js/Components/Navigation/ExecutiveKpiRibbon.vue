<script setup>
import {
  Flame,
  Award,
  TrendingUp,
  CheckCircle2,
} from 'lucide-vue-next';

const props = defineProps({
  systemStreak: { type: Object, required: true },
  availableWallet: { type: Number, default: 0 },
  monthlyTotalEarned: { type: Number, default: 0 },
  consistencyScore: { type: Number, default: 0 },
  performanceGrade: { type: Object, required: true },
  todayCompletedCount: { type: Number, default: 0 },
  todayScheduledCount: { type: Number, default: 0 },
});

const emit = defineEmits([
  'navigate-tab',
]);
</script>

<template>
  <div class="hero-kpi-ribbon">
    <!-- Card 1: System Streak -->
    <div
      class="hero-kpi-card hero-kpi-card--streak"
      :title="`Current Streak: ${systemStreak?.current || 0} Days | Longest: ${systemStreak?.longest || systemStreak?.current || 0} Days`"
    >
      <div class="hero-kpi-card__icon-wrap">
        <Flame class="hero-kpi-card__icon icon-flame" />
      </div>
      <div class="hero-kpi-card__body">
        <span class="hero-kpi-card__label">System Streak</span>
        <div class="hero-kpi-card__value-row">
          <span class="hero-kpi-card__value mono-num">{{ systemStreak?.current || 0 }}</span>
          <span class="hero-kpi-card__unit">Days</span>
        </div>
        <span class="hero-kpi-card__subtext">
          <span class="hero-kpi-card__sub-highlight mono-num">Best {{ systemStreak?.longest || systemStreak?.current || 0 }}d</span> • Protected
        </span>
      </div>
    </div>

    <!-- Card 2: Reward Vault / Available Wallet -->
    <div
      class="hero-kpi-card hero-kpi-card--wallet cursor-pointer"
      :title="`${availableWallet} Points Available in Reward Vault • Click to open Vault`"
      @click="emit('navigate-tab', 'rewards')"
    >
      <div class="hero-kpi-card__icon-wrap">
        <Award class="hero-kpi-card__icon icon-vault-gold" />
      </div>
      <div class="hero-kpi-card__body">
        <span class="hero-kpi-card__label">Reward Vault</span>
        <div class="hero-kpi-card__value-row">
          <span class="hero-kpi-card__value mono-num">{{ availableWallet }}</span>
          <span class="hero-kpi-card__unit">pts</span>
        </div>
        <span class="hero-kpi-card__subtext">
          <span class="hero-kpi-card__sub-highlight mono-num">+{{ monthlyTotalEarned }}</span> this month
        </span>
      </div>
    </div>

    <!-- Card 3: Monthly Stickiness -->
    <div
      class="hero-kpi-card hero-kpi-card--consistency cursor-pointer"
      :title="`Monthly Stickiness: ${consistencyScore}% (Grade: ${performanceGrade?.grade || 'D'}) • Click for Analytics`"
      @click="emit('navigate-tab', 'stats')"
    >
      <div class="hero-kpi-card__icon-wrap">
        <TrendingUp class="hero-kpi-card__icon icon-teal" />
      </div>
      <div class="hero-kpi-card__body">
        <span class="hero-kpi-card__label">Monthly Consistency</span>
        <div class="hero-kpi-card__value-row">
          <span class="hero-kpi-card__value mono-num">{{ consistencyScore }}%</span>
          <span class="hero-kpi-card__badge mono-num" :class="performanceGrade?.class">{{ performanceGrade?.grade }}</span>
        </div>
        <span class="hero-kpi-card__subtext">{{ performanceGrade?.text || 'Target: 85%+ Consistency' }}</span>
      </div>
    </div>

    <!-- Card 4: Daily Execution -->
    <div
      class="hero-kpi-card hero-kpi-card--today cursor-pointer"
      :title="`${todayCompletedCount} of ${todayScheduledCount} habits completed today`"
      @click="emit('navigate-tab', 'today')"
    >
      <div class="hero-kpi-card__icon-wrap">
        <CheckCircle2 class="hero-kpi-card__icon icon-emerald" />
      </div>
      <div class="hero-kpi-card__body">
        <span class="hero-kpi-card__label">Today's Habits</span>
        <div class="hero-kpi-card__value-row">
          <span class="hero-kpi-card__value mono-num">{{ todayCompletedCount }}/{{ todayScheduledCount }}</span>
          <span class="hero-kpi-card__unit mono-num">({{ todayScheduledCount > 0 ? Math.round((todayCompletedCount / todayScheduledCount) * 100) : 0 }}%)</span>
        </div>
        <span class="hero-kpi-card__subtext">
          <span v-if="todayScheduledCount - todayCompletedCount > 0" class="hero-kpi-card__sub-highlight">{{ todayScheduledCount - todayCompletedCount }} pending</span>
          <span v-else class="hero-kpi-card__sub-done">🎉 All Done Today!</span>
        </span>
      </div>
    </div>
  </div>
</template>
