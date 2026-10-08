<script setup>
import {
  Clock,
  Check,
  Crown,
  Timer,
  Share2,
  RefreshCw,
  Shield,
  Zap,
  Trophy,
} from 'lucide-vue-next';

const props = defineProps({
  timeGreeting: { type: Object, required: true },
  performanceGrade: { type: Object, required: true },
  currentRoutineWindow: { type: Object, required: true },
  upNextHabitInfo: { type: Object, default: null },
  isCurrentMonth: { type: Boolean, default: true },
  currentDay: { type: Number, required: true },
  todayPoints: { type: Number, default: 0 },
  todayCompletedCount: { type: Number, default: 0 },
  todayScheduledCount: { type: Number, default: 0 },
  tierThresholds: { type: Object, required: true },
  timerState: { type: Object, default: null },
  isSyncingCloud: { type: Boolean, default: false },
  hasCompletedDay: { type: Function, required: true },
});

const emit = defineEmits([
  'toggle-up-next',
  'start-focus',
  'share-scorecard',
  'sync-app',
]);
</script>

<template>
  <div class="hero-executive-deck">
    <!-- Left Column: Greeting, Routine Phase, Live Up Next & Quick Actions -->
    <div class="hero-deck-left">
      <div class="hero-greeting-text">
        <div class="hero-greeting-title">
          <span class="hero-greeting-salute">{{ timeGreeting.salute }}, {{ timeGreeting.name }}</span>
          <span class="hero-greeting-wave">👋</span>
          <span class="grade-badge" :class="performanceGrade.class">{{ performanceGrade.grade }}</span>

          <!-- Live Routine Phase Window Pill -->
          <div class="hero-routine-pill" :title="`Active Routine Window: ${currentRoutineWindow.name} (${currentRoutineWindow.time})`">
            <span class="hero-routine-pill__icon">{{ currentRoutineWindow.icon }}</span>
            <span class="hero-routine-pill__name">{{ currentRoutineWindow.name }}</span>
            <span class="hero-routine-pill__time mono-num">{{ currentRoutineWindow.time }}</span>
          </div>
        </div>
        <p class="hero-greeting-quote">
          {{ timeGreeting.quote }}
        </p>
      </div>

      <!-- Live Up Next / Due Now Action Strip -->
      <div
        v-if="isCurrentMonth && upNextHabitInfo && !hasCompletedDay(upNextHabitInfo.habit, currentDay)"
        class="hero-upnext-strip"
      >
        <div class="hero-upnext-tag" :class="{ 'hero-upnext-tag--due': upNextHabitInfo.status === 'due' }">
          <Clock class="icon-xs" />
          <span>{{ upNextHabitInfo.shortBadge }}</span>
        </div>
        <div class="hero-upnext-info">
          <span class="hero-upnext-name">{{ upNextHabitInfo.habit.name }}</span>
          <span class="hero-upnext-time mono-num">{{ upNextHabitInfo.timeLabel }}</span>
        </div>
        <button
          type="button"
          class="hero-upnext-action-btn"
          @click="emit('toggle-up-next', upNextHabitInfo.habit, currentDay)"
          :title="`Mark '${upNextHabitInfo.habit.name}' as completed (+${upNextHabitInfo.habit.points} XP)`"
        >
          <Check class="icon-xs" />
          <span>Mark Done (+{{ upNextHabitInfo.habit.points }}pt)</span>
        </button>
      </div>

      <div
        v-else-if="isCurrentMonth && todayScheduledCount > 0 && todayCompletedCount >= todayScheduledCount"
        class="hero-upnext-strip hero-upnext-strip--all-done"
      >
        <div class="hero-upnext-tag hero-upnext-tag--done">
          <Crown class="icon-xs" />
          <span>ALL PROTOCOLS MET</span>
        </div>
        <span class="hero-upnext-done-msg">🏆 Elite execution! All {{ todayScheduledCount }} scheduled habits completed for today.</span>
      </div>

      <!-- Quick Productivity Launchers -->
      <div class="hero-quick-launchers">
        <button
          type="button"
          class="hero-launch-btn hero-launch-btn--focus"
          @click="emit('start-focus', 25)"
          title="Launch a 25-minute Pomodoro Deep Work Focus Session"
        >
          <Timer class="icon-xs" />
          <span>{{ timerState && timerState.running ? 'Focus Active' : 'Start 25m Focus' }}</span>
          <span v-if="timerState && timerState.running" class="hero-launch-btn__pulse"></span>
        </button>

        <button
          type="button"
          class="hero-launch-btn hero-launch-btn--share"
          @click="emit('share-scorecard')"
          title="Generate and Share your Daily Scorecard"
        >
          <Share2 class="icon-xs" />
          <span>Share Scorecard</span>
        </button>

        <button
          type="button"
          class="hero-launch-btn hero-launch-btn--sync"
          @click="emit('sync-app')"
          :title="isSyncingCloud ? 'Syncing with Supabase cloud database...' : 'Manual Sync Database'"
        >
          <RefreshCw class="icon-xs" :class="{ 'animate-spin': isSyncingCloud }" />
          <span>{{ isSyncingCloud ? 'Syncing...' : 'Sync' }}</span>
        </button>
      </div>
    </div>

    <!-- Right Column: Today's Protocol Command Card -->
    <div class="hero-deck-right">
      <div class="hero-protocol-card">
        <div class="hero-protocol-card__header">
          <div class="hero-protocol-card__title">
            <Shield class="icon-sm icon-gold" />
            <span>Today's Protocol</span>
          </div>
          <div class="hero-protocol-card__score-chip">
            <span class="hero-protocol-card__current mono-num">{{ todayPoints }}</span>
            <span class="hero-protocol-card__target mono-num">/ {{ tierThresholds.target }} pts</span>
          </div>
        </div>

        <!-- Segmented Milestone Gauge Bar -->
        <div class="hero-milestone-gauge">
          <div
            class="hero-milestone-gauge__fill"
            :style="{ width: `${Math.min(100, Math.round((todayPoints / (tierThresholds.target || 1)) * 100))}%` }"
          ></div>
        </div>

        <!-- 3 Milestone Tier Chips (Clean Horizontal Grid) -->
        <div class="hero-protocol-tiers-grid">
          <div
            class="hero-tier-card"
            :class="{ 'hero-tier-card--met': todayPoints >= tierThresholds.floor }"
            :title="todayPoints >= tierThresholds.floor ? 'Floor Safe (Streak & Baseline Protected)' : `Need ${tierThresholds.floor - todayPoints} more pts for Floor`"
          >
            <div class="hero-tier-card__head">
              <Shield class="icon-xs hero-tier-card__icon" />
              <span class="hero-tier-card__title">Floor</span>
            </div>
            <div class="hero-tier-card__status mono-num">
              {{ todayPoints >= tierThresholds.floor ? '✓ Safe' : `${todayPoints}/${tierThresholds.floor}p` }}
            </div>
          </div>

          <div
            class="hero-tier-card"
            :class="{ 'hero-tier-card--met': todayPoints >= tierThresholds.half }"
            :title="todayPoints >= tierThresholds.half ? 'Half Protocol Achieved (Solid Execution)' : `Need ${tierThresholds.half - todayPoints} more pts for Half`"
          >
            <div class="hero-tier-card__head">
              <Zap class="icon-xs hero-tier-card__icon" />
              <span class="hero-tier-card__title">Half</span>
            </div>
            <div class="hero-tier-card__status mono-num">
              {{ todayPoints >= tierThresholds.half ? '✓ Hit' : `${todayPoints}/${tierThresholds.half}p` }}
            </div>
          </div>

          <div
            class="hero-tier-card"
            :class="{ 'hero-tier-card--met': todayPoints >= tierThresholds.full }"
            :title="todayPoints >= tierThresholds.full ? 'Full Target Achieved (Elite Performance)' : `Need ${tierThresholds.full - todayPoints} more pts for Full`"
          >
            <div class="hero-tier-card__head">
              <Trophy class="icon-xs hero-tier-card__icon" />
              <span class="hero-tier-card__title">Full</span>
            </div>
            <div class="hero-tier-card__status mono-num">
              {{ todayPoints >= tierThresholds.full ? '👑 Peak' : `${todayPoints}/${tierThresholds.full}p` }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
