<script setup>
import {
  BarChart3,
  Calendar,
  Flame,
  Trophy,
  Activity,
  Target,
  Award,
  TrendingUp,
  Zap,
} from 'lucide-vue-next';

const props = defineProps({
  consistencyScore: { type: Number, default: 0 },
  consistencyGrade: { type: Object, required: true },
  systemStreak: { type: Object, required: true },
  levelData: { type: Object, required: true },
  levelTitle: { type: String, default: 'Starter' },
  totalXP: { type: Number, default: 0 },
  availableWallet: { type: Number, default: 0 },
  monthlyTotalEarned: { type: Number, default: 0 },
  dailyAverage: { type: Number, default: 0 },
  targetDailyPoints: { type: Number, default: 15 },
  heatmapData: { type: Array, default: () => [] },
  hoveredHeatmapDay: { type: Number, default: null },
  hoveredHeatmapCell: { type: Object, default: null },
  habitStreaks: { type: Array, default: () => [] },
  milestoneBadges: { type: Array, default: () => [] },
});

const emit = defineEmits([
  'update:hoveredHeatmapDay',
  'select-heatmap-day',
]);
</script>

<template>
  <div class="analytics-tab-wrap">
    <!-- Stat Grid: XP, Consistency, Streaks, Daily Points -->
    <div class="enhanced-stat-grid">
      <!-- Consistency Score & Grade -->
      <div class="enhanced-stat-card enhanced-stat-card--score">
        <span class="enhanced-stat-label">Consistency Score</span>
        <div class="enhanced-score-row">
          <span class="enhanced-score-value mono-num">{{ consistencyScore }}</span>
          <span class="enhanced-score-total">/100</span>
          <span class="grade-badge" :class="consistencyGrade.class">{{ consistencyGrade.letter }}</span>
        </div>
        <span class="enhanced-stat-sub">{{ consistencyGrade.text }}</span>
      </div>

      <!-- Total XP & Level -->
      <div class="enhanced-stat-card enhanced-stat-card--xp">
        <span class="enhanced-stat-label">System Level</span>
        <div class="enhanced-score-row">
          <span class="enhanced-level-badge">Lv. {{ levelData.level }}</span>
          <span class="enhanced-level-title">{{ levelTitle }}</span>
        </div>
        <div class="xp-bar-wrap">
          <div class="xp-bar-fill" :style="{ width: levelData.levelPct + '%' }"></div>
        </div>
        <span class="enhanced-stat-sub mono-num">{{ levelData.xpInLevel }} / {{ levelData.xpForNext }} XP ({{ totalXP }} total)</span>
      </div>

      <!-- Current Streak -->
      <div class="enhanced-stat-card enhanced-stat-card--streak">
        <span class="enhanced-stat-label">Current Streak</span>
        <div class="enhanced-streak-row">
          <Flame class="icon-md icon-flame-stat" />
          <span class="enhanced-streak-val mono-num">{{ systemStreak.current }}</span>
          <span class="enhanced-streak-unit">days</span>
        </div>
        <span class="enhanced-stat-sub">Best: {{ systemStreak.best }} days</span>
      </div>

      <!-- Available Points Wallet -->
      <div class="enhanced-stat-card enhanced-stat-card--wallet">
        <span class="enhanced-stat-label">Point Wallet</span>
        <div class="enhanced-streak-row">
          <Award class="icon-md icon-wallet-stat" />
          <span class="enhanced-streak-val mono-num">{{ availableWallet }}</span>
          <span class="enhanced-streak-unit">pts</span>
        </div>
        <span class="enhanced-stat-sub">Earned this month: {{ monthlyTotalEarned }} pts</span>
      </div>
    </div>

    <!-- Monthly Activity Matrix Heatmap -->
    <div class="enhanced-heatmap-section">
      <div class="heatmap-header">
        <span class="heatmap-title"><Calendar class="icon-xs" /> Monthly Activity Matrix</span>
        <div class="heatmap-legend">
          <span class="legend-label">Less</span>
          <span class="legend-box hm-lvl-0"></span>
          <span class="legend-box hm-lvl-1"></span>
          <span class="legend-box hm-lvl-2"></span>
          <span class="legend-box hm-lvl-3"></span>
          <span class="legend-box hm-lvl-4"></span>
          <span class="legend-label">More</span>
        </div>
      </div>
      <div class="heatmap-grid">
        <div
          v-for="cell in heatmapData"
          :key="'hm-' + cell.day"
          class="heatmap-cell"
          :class="[
            `hm-lvl-${cell.level}`,
            cell.isToday ? 'heatmap-cell--today' : '',
            cell.isFuture ? 'heatmap-cell--future' : '',
            hoveredHeatmapDay === cell.day ? 'heatmap-cell--hovered' : '',
          ]"
          @mouseenter="emit('update:hoveredHeatmapDay', cell.day)"
          @mouseleave="emit('update:hoveredHeatmapDay', null)"
          @click="emit('select-heatmap-day', cell.day)"
          :title="cell.isFuture ? `Day ${cell.day} (Future)` : `Day ${cell.day}: ${cell.completed}/${cell.total} habits (${cell.pct}%) • ${cell.points} pts`"
        >
          <span class="heatmap-day-num mono-num">{{ cell.day }}</span>
        </div>
      </div>
      <div v-if="hoveredHeatmapCell" class="heatmap-tooltip">
        <strong>Day {{ hoveredHeatmapCell.day }}</strong>: {{ hoveredHeatmapCell.completed }}/{{ hoveredHeatmapCell.total }} habits completed ({{ hoveredHeatmapCell.pct }}%) • {{ hoveredHeatmapCell.points }} points
      </div>
    </div>

    <!-- Top Streaks Leaderboard -->
    <div class="top-streaks-section" v-if="habitStreaks.length > 0">
      <span class="top-streaks-title"><Flame class="icon-xs" /> Top Habit Streaks</span>
      <div class="top-streaks-list">
        <div
          v-for="s in habitStreaks.slice(0, 5)"
          :key="'streak-' + s.id"
          class="top-streak-item"
        >
          <span class="top-streak-name">{{ s.name }}</span>
          <span class="top-streak-badge mono-num" :class="{ 'top-streak-badge--hot': s.current >= 7 }">
            🔥 {{ s.current }}d
          </span>
        </div>
      </div>
    </div>

    <!-- Milestone Badges -->
    <div class="milestones-section">
      <span class="milestones-title"><Trophy class="icon-xs" /> Milestones</span>
      <div class="milestones-grid">
        <div
          v-for="m in milestoneBadges"
          :key="'badge-' + m.id"
          class="milestone-badge"
          :class="{ 'milestone-badge--unlocked': m.earned, 'milestone-badge--locked': !m.earned }"
          :title="m.desc + (m.earned ? ' (Unlocked!)' : ` (Requires ${m.threshold} XP)`)"
        >
          <span class="milestone-icon">{{ m.icon }}</span>
          <span class="milestone-label">{{ m.label }}</span>
          <span class="milestone-xp mono-num">{{ m.threshold }} XP</span>
        </div>
      </div>
    </div>
  </div>
</template>
