<script setup>
import { ref } from 'vue';
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
  FileSpreadsheet,
} from 'lucide-vue-next';
import { callLocalApi } from '@/lib/supabase';
import { biomarkerRowsToCsv, downloadCsv } from '@/lib/biomarkerExport';

const props = defineProps({
  consistencyScore: { type: Number, default: 0 },
  consistencyGrade: { type: Object, required: true },
  systemStreak: { type: Object, required: true },
  levelData: { type: Object, required: true },
  levelTitle: { type: String, default: 'Starter' },
  totalXP: { type: Number, default: 0 },
  availableWallet: { type: Number, default: 0 },
  monthlyTotalEarned: { type: Number, default: 0 },
  heatmapData: { type: Array, default: () => [] },
  hoveredHeatmapDay: { type: Number, default: null },
  hoveredHeatmapCell: { type: Object, default: null },
  habitStreaks: { type: Array, default: () => [] },
  milestoneBadges: { type: Array, default: () => [] },
  // Biomarkers & Recovery Props
  biomarkers: { type: Object, default: () => ({ stiffnessMin: 0, energyRating: 8, note: '' }) },
  hydrationMl: { type: Number, default: 0 },
  monthScope: { type: String, default: () => new Date().toISOString().slice(0, 7) },
  month: { type: Number, default: () => new Date().getMonth() + 1 },
  year: { type: Number, default: () => new Date().getFullYear() },
  currentDay: { type: Number, default: () => new Date().getDate() },
  habits: { type: Array, default: () => [] },
  displayName: { type: String, default: 'You' },
});

const emit = defineEmits([
  'update:hoveredHeatmapDay',
  'select-heatmap-day',
  'toast',
]);

const savedBiomarkers = ref([]);
const biomarkerLoadError = ref(false);

const exportSavedBiomarkers = () => {
  if (biomarkerLoadError.value) {
    emit('toast', 'Saved biomarkers could not be loaded.');
    return;
  }
  const filename = `habuilt_biomarkers_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsv(filename, biomarkerRowsToCsv(savedBiomarkers.value));
  emit('toast', savedBiomarkers.value.length
    ? `Saved biomarkers exported (${savedBiomarkers.value.length} rows)`
    : 'No saved biomarker rows to export');
};

import { onMounted, onUnmounted } from 'vue';
import { gsap } from 'gsap';

const analyticsRef = ref(null);
let gsapCtx = null;

onMounted(async () => {
  const data = await callLocalApi('/api/user-biomarkers', 'GET', null, { returnError: true });
  if (Array.isArray(data)) {
    savedBiomarkers.value = data;
  } else if (data && data.offline) {
    biomarkerLoadError.value = true;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('habuilt:read-failed'));
    }
  }

  if (analyticsRef.value) {
    gsapCtx = gsap.context(() => {
      gsap.from('.analytics-glass-card', {
        y: 16,
        opacity: 0,
        stagger: 0.07,
        duration: 0.5,
        ease: 'power3.out'
      });
      gsap.from('.heatmap-card', {
        y: 14,
        opacity: 0,
        duration: 0.45,
        ease: 'power2.out',
        delay: 0.15
      });
    }, analyticsRef.value);
  }
});

onUnmounted(() => {
  if (gsapCtx) {
    try { gsapCtx.revert(); } catch {}
  }
});
</script>

<template>
  <div class="analytics-dashboard calm-tool" ref="analyticsRef">
    <!-- 4 Luxury Glass KPI Cards -->
    <div class="analytics-kpi-grid">
      <!-- KPI 1: Consistency Score & Grade -->
      <div class="analytics-glass-card analytics-glass-card--score">
        <div class="analytics-card-header">
          <span class="analytics-card-label">Consistency Score</span>
          <span v-if="consistencyGrade.grade" class="grade-badge" :class="consistencyGrade.class">{{ consistencyGrade.grade }}</span>
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

    <div class="card card--clinical-rheumatology mt-6">
      <div class="clinical-head">
        <div class="clinical-head__title-wrap">
          <div class="clinical-head__icon-badge">
            <Activity class="icon-md icon-emerald" />
          </div>
          <div>
            <div class="clinical-head__pill">Saved biomarkers</div>
            <h3 class="clinical-head__title">Rows saved for this account</h3>
            <p class="clinical-head__sub">Only dates you logged. Nothing is filled in for the other days.</p>
          </div>
        </div>
        <div class="clinical-head__actions">
          <button type="button" class="btn btn--secondary btn-clinical-csv" @click="exportSavedBiomarkers">
            <FileSpreadsheet class="icon-xs" />
            <span>Export saved rows</span>
          </button>
        </div>
      </div>
      <p v-if="biomarkerLoadError" class="clinical-head__sub">Saved biomarkers could not be loaded.</p>
      <p v-else-if="savedBiomarkers.length === 0" class="clinical-head__sub">No saved biomarker rows yet.</p>
      <ul v-else class="clinical-kpi-grid">
        <li v-for="row in savedBiomarkers" :key="row.id || row.log_date" class="clinical-kpi-card">
          <span class="clinical-kpi-card__label">{{ row.log_date }}</span>
          <div class="clinical-kpi-card__value mono-num">{{ row.stiffness_minutes ?? 0 }} <span class="clinical-kpi-card__unit">min</span></div>
          <span class="clinical-kpi-card__subtext">Energy {{ row.energy_level ?? '—' }} · Water {{ row.hydration_ml ?? 0 }} ml</span>
          <span v-if="row.notes" class="clinical-kpi-card__subtext">{{ row.notes }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
