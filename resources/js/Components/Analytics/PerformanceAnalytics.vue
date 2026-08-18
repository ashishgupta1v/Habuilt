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
  CheckCircle2,
  Sparkles,
  Shield,
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
  <div class="analytics-dashboard">
    <!-- 4 Luxury Glass KPI Cards -->
    <div class="analytics-kpi-grid">
      <!-- KPI 1: Consistency Score & Grade -->
      <div class="analytics-glass-card analytics-glass-card--score">
        <div class="analytics-card-header">
          <span class="analytics-card-label">Consistency Score</span>
          <span class="grade-badge" :class="consistencyGrade.class">{{ consistencyGrade.grade }}</span>
        </div>
        <div class="analytics-card-main">
          <span class="analytics-card-number mono-num">{{ consistencyScore }}</span>
          <span class="analytics-card-denom">/100</span>
        </div>
        <div class="analytics-card-footer">
          <span class="analytics-card-subtext">{{ consistencyGrade.text }}</span>
        </div>
      </div>

      <!-- KPI 2: System Rank & XP Progress -->
      <div class="analytics-glass-card analytics-glass-card--xp">
        <div class="analytics-card-header">
          <span class="analytics-card-label">System Rank</span>
          <span class="analytics-level-tag">Lv. {{ levelData.level }}</span>
        </div>
        <div class="analytics-card-main">
          <span class="analytics-rank-title">{{ levelTitle }}</span>
        </div>
        <div class="analytics-card-footer">
          <div class="analytics-xp-bar-wrap">
            <div class="analytics-xp-bar-fill" :style="{ width: levelData.levelPct + '%' }"></div>
          </div>
          <span class="analytics-xp-label mono-num">{{ levelData.xpInLevel }} / {{ levelData.xpForNext }} XP ({{ totalXP }} total)</span>
        </div>
      </div>

      <!-- KPI 3: System Streak -->
      <div class="analytics-glass-card analytics-glass-card--streak">
        <div class="analytics-card-header">
          <span class="analytics-card-label">System Streak</span>
          <Flame class="icon-sm icon-flame-gold" />
        </div>
        <div class="analytics-card-main">
          <span class="analytics-card-number mono-num">{{ systemStreak.current }}</span>
          <span class="analytics-card-unit">days</span>
        </div>
        <div class="analytics-card-footer">
          <span class="analytics-card-subtext">All-Time Best: {{ systemStreak.best }} days</span>
        </div>
      </div>

      <!-- KPI 4: Point Wallet -->
      <div class="analytics-glass-card analytics-glass-card--wallet">
        <div class="analytics-card-header">
          <span class="analytics-card-label">Reward Wallet</span>
          <Award class="icon-sm icon-award-gold" />
        </div>
        <div class="analytics-card-main">
          <span class="analytics-card-number mono-num">{{ availableWallet }}</span>
          <span class="analytics-card-unit">pts</span>
        </div>
        <div class="analytics-card-footer">
          <span class="analytics-card-subtext">Earned this month: {{ monthlyTotalEarned }} pts</span>
        </div>
      </div>
    </div>

    <!-- 31-Day Activity Matrix Heatmap -->
    <div class="analytics-panel analytics-panel--heatmap">
      <div class="analytics-panel-head">
        <div class="analytics-panel-title">
          <Calendar class="icon-sm icon-panel-gold" />
          <span>Monthly Activity Matrix</span>
        </div>
        <div class="analytics-heatmap-legend">
          <span class="legend-text">0%</span>
          <span class="heatmap-legend-box hm-lvl-0"></span>
          <span class="heatmap-legend-box hm-lvl-1"></span>
          <span class="heatmap-legend-box hm-lvl-2"></span>
          <span class="heatmap-legend-box hm-lvl-3"></span>
          <span class="heatmap-legend-box hm-lvl-4"></span>
          <span class="legend-text">100%</span>
        </div>
      </div>

      <div class="analytics-heatmap-grid">
        <div
          v-for="cell in heatmapData"
          :key="'hm-cell-' + cell.day"
          class="analytics-heatmap-square"
          :class="[
            `hm-lvl-${cell.level}`,
            cell.isToday ? 'analytics-heatmap-square--today' : '',
            cell.isFuture ? 'analytics-heatmap-square--future' : '',
            hoveredHeatmapDay === cell.day ? 'analytics-heatmap-square--hovered' : '',
          ]"
          @mouseenter="emit('update:hoveredHeatmapDay', cell.day)"
          @mouseleave="emit('update:hoveredHeatmapDay', null)"
          @click="emit('select-heatmap-day', cell.day)"
          :title="cell.isFuture ? `Day ${cell.day} (Future)` : `Day ${cell.day}: ${cell.completed}/${cell.total} habits (${cell.pct}%) • ${cell.points} pts`"
        >
          <span class="analytics-heatmap-day-num mono-num">{{ cell.day }}</span>
        </div>
      </div>

      <!-- Live Hover / Tap Tooltip Details -->
      <div v-if="hoveredHeatmapCell" class="analytics-heatmap-detail-card">
        <Sparkles class="icon-xs" />
        <span><strong>Day {{ hoveredHeatmapCell.day }}</strong>: {{ hoveredHeatmapCell.completed }}/{{ hoveredHeatmapCell.total }} habits completed ({{ hoveredHeatmapCell.pct }}%) • <strong>{{ hoveredHeatmapCell.points }} points</strong></span>
      </div>
    </div>

    <!-- 2-Column Row: Top Streaks & Milestones -->
    <div class="analytics-two-col">
      <!-- Top Streaks Leaderboard -->
      <div class="analytics-panel analytics-panel--streaks">
        <div class="analytics-panel-head">
          <div class="analytics-panel-title">
            <Flame class="icon-sm icon-flame-gold" />
            <span>Top Habit Streaks</span>
          </div>
        </div>
        <div class="analytics-streaks-list">
          <div
            v-for="(s, idx) in habitStreaks.slice(0, 5)"
            :key="'streak-' + s.id"
            class="analytics-streak-row"
          >
            <span class="analytics-streak-rank">{{ idx + 1 }}</span>
            <span class="analytics-streak-name">{{ s.name }}</span>
            <span class="analytics-streak-pill mono-num" :class="{ 'analytics-streak-pill--hot': s.current >= 7 }">
              🔥 {{ s.current }}d
            </span>
          </div>
        </div>
      </div>

      <!-- Milestone Badges -->
      <div class="analytics-panel analytics-panel--milestones">
        <div class="analytics-panel-head">
          <div class="analytics-panel-title">
            <Trophy class="icon-sm icon-trophy-gold" />
            <span>XP Milestone Badges</span>
          </div>
        </div>
        <div class="analytics-milestones-grid">
          <div
            v-for="m in milestoneBadges"
            :key="'badge-' + m.id"
            class="analytics-milestone-card"
            :class="{ 'analytics-milestone-card--unlocked': m.earned, 'analytics-milestone-card--locked': !m.earned }"
            :title="m.desc + (m.earned ? ' (Unlocked!)' : ` (Requires ${m.threshold} XP)`)"
          >
            <span class="analytics-milestone-icon">{{ m.icon }}</span>
            <div class="analytics-milestone-info">
              <span class="analytics-milestone-label">{{ m.label }}</span>
              <span class="analytics-milestone-xp mono-num">{{ m.threshold }} XP</span>
            </div>
            <CheckCircle2 v-if="m.earned" class="icon-xs icon-milestone-check" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
