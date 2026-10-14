<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  Activity,
  Flame,
  Award,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Droplets,
  Heart,
  Clock,
  Sparkles,
  Zap,
  Radio,
  Layers,
  Wifi,
  WifiOff,
  AlertCircle,
  Brain,
  Compass,
  Moon,
} from 'lucide-vue-next';
import { fetchZoetiCoachAdherence, isZoetiCoachConnected } from '@/lib/zoetiCoachBridge';

const props = defineProps({
  isAshish: { type: Boolean, default: false },
  isJyoti: { type: Boolean, default: false },
  userId: { type: String, default: 'ashish' },
  displayName: { type: String, default: 'Warrior' },
  currentDay: { type: Number, default: 1 },
  consistencyScore: { type: Number, default: 0 },
  systemStreak: { type: Object, default: () => ({ current: 0, longest: 0 }) },
  todayCompletedCount: { type: Number, default: 0 },
  todayScheduledCount: { type: Number, default: 0 },
  todayHabits: { type: Array, default: () => [] },
});

const emit = defineEmits(['toast']);

// ── State ──
const rawTelemetry = ref(null);
const isLoading = ref(false);
const isRefreshing = ref(false);
const isExpanded = ref(true);
const lastSyncedAt = ref(null);
const activeTab = ref('overview'); // 'overview' | 'clinical' | 'milestones'
const currentTime = ref(new Date());

let clockTimer = null;

// ── Participant ID Resolution ──
const participantId = computed(() => {
  if (props.isAshish) return 'ashish';
  if (props.isJyoti) return 'jyoti';
  const id = String(props.userId || '').toLowerCase();
  if (id.includes('ashish') || id.includes('founder')) return 'ashish';
  if (id.includes('jyoti')) return 'jyoti';
  return 'ashish';
});

const participantName = computed(() => {
  if (rawTelemetry.value?.name) return rawTelemetry.value.name;
  if (props.isAshish) return 'Ashish Gupta';
  if (props.isJyoti) return 'Jyoti Gupta';
  return props.displayName || 'Warrior';
});

// ── Live Telemetry Metrics ──
const isLiveConnected = computed(() => Boolean(rawTelemetry.value && !rawTelemetry.value.isFallback));

const adherenceRate = computed(() => {
  if (rawTelemetry.value?.adherence_rate_pct != null) {
    return Math.round(Number(rawTelemetry.value.adherence_rate_pct));
  }
  return Math.round(Number(props.consistencyScore) || 0);
});

const adherenceStatusGrade = computed(() => {
  const rate = adherenceRate.value;
  if (rate >= 90) return { label: 'Elite Compliance', color: 'emerald', class: 'grade-emerald' };
  if (rate >= 80) return { label: 'High Adherence Club', color: 'gold', class: 'grade-gold' };
  if (rate >= 65) return { label: 'Solid Protocol Adherence', color: 'teal', class: 'grade-teal' };
  if (rate >= 50) return { label: 'Moderate Adherence', color: 'amber', class: 'grade-amber' };
  return { label: 'Building Momentum', color: 'slate', class: 'grade-slate' };
});

const currentStreak = computed(() => {
  if (rawTelemetry.value?.current_streak != null) {
    return Number(rawTelemetry.value.current_streak);
  }
  return Number(props.systemStreak?.current || 0);
});

const bestStreak = computed(() => {
  if (rawTelemetry.value?.best_streak != null) {
    return Number(rawTelemetry.value.best_streak);
  }
  return Number(props.systemStreak?.longest || props.systemStreak?.current || 0);
});

const totalEventsInWindow = computed(() => {
  if (rawTelemetry.value?.total_events_in_window != null) {
    return Number(rawTelemetry.value.total_events_in_window);
  }
  return Number(props.todayCompletedCount || 0);
});

const eventBreakdown = computed(() => {
  const breakdown = rawTelemetry.value?.breakdown_by_event;
  if (breakdown && typeof breakdown === 'object') {
    return {
      completed: breakdown.habit_completed || 0,
      unmarked: breakdown.habit_unmarked || 0,
    };
  }
  return {
    completed: props.todayCompletedCount || 0,
    unmarked: 0,
  };
});

const activeChannel = computed(() => {
  if (rawTelemetry.value?.channel) {
    return String(rawTelemetry.value.channel).toUpperCase();
  }
  return 'HABUILT CLOUD';
});

const regulatoryNotice = computed(() => {
  return (
    rawTelemetry.value?.regulatory_notice ||
    'Clinical habit accountability metrics. Does not constitute medical diagnosis or therapy.'
  );
});

// ── Milestone Badges ──
const milestones = computed(() => {
  const achieved = rawTelemetry.value?.achieved_milestones || [];
  const list = [];

  const hasMilestone = (key) => achieved.includes(key);

  if (hasMilestone('high_adherence_club_80') || adherenceRate.value >= 80) {
    list.push({
      id: 'high_adherence_80',
      title: 'High Adherence Club (80%+)',
      desc: 'Achieved ≥80% clinical compliance within the evaluation window',
      icon: Award,
      unlocked: true,
      color: 'gold',
    });
  } else {
    list.push({
      id: 'high_adherence_80',
      title: 'High Adherence Club (80%+)',
      desc: `Target 80% compliance. Currently at ${adherenceRate.value}%`,
      icon: Award,
      unlocked: false,
      color: 'slate',
    });
  }

  if (currentStreak.value >= 7) {
    list.push({
      id: 'streak_7',
      title: '7-Day Streak Keeper',
      desc: 'Maintained consecutive protocol compliance for 7+ days',
      icon: Flame,
      unlocked: true,
      color: 'emerald',
    });
  } else {
    list.push({
      id: 'streak_7',
      title: '7-Day Streak Keeper',
      desc: `${currentStreak.value}/7 days consecutive streak progress`,
      icon: Flame,
      unlocked: false,
      color: 'slate',
    });
  }

  list.push({
    id: 'habit_cloud_verified',
    title: 'ZoetiCoach Cloud Verified',
    desc: 'Live telemetry bridge verified via ZoetiCoach WS18 API',
    icon: ShieldCheck,
    unlocked: isLiveConnected.value,
    color: isLiveConnected.value ? 'teal' : 'slate',
  });

  return list;
});

// ── Dynamic Clinical Insights & AI Directives ──
const clinicalPillars = computed(() => {
  if (props.isJyoti) {
    return [
      {
        id: 'thyroid',
        label: 'Endocrine & Thyroid Rhythm',
        status: 'Optimal Flow',
        badgeColor: 'gold',
        directive: 'Morning natural sunlight within 30m of waking to stabilize circadian thyroid pacing.',
        icon: Sparkles,
      },
      {
        id: 'mobility',
        label: 'Joint Lubrication & Flexibility',
        status: 'Active Protocol',
        badgeColor: 'emerald',
        directive: '15-20m gentle somatic yoga & joint circles. Focus on hip and thoracic decompression.',
        icon: Activity,
      },
      {
        id: 'parasympathetic',
        label: 'Parasympathetic Sleep Hygiene',
        status: 'Night Directive',
        badgeColor: 'teal',
        directive: 'Screen cut-off 45m prior to sleep with warm chamomile or golden turmeric infusion.',
        icon: Moon,
      },
    ];
  }

  // Ashish Master Clinical Assessment Pillars
  return [
    {
      id: 'hydration',
      label: 'Renal Defense & Electrolyte Hydration',
      status: 'P1 Clinical Target',
      badgeColor: 'gold',
      directive: 'Target 3.5L - 4.0L structured hydration today. Sip in 500ml blocks between meals with pink Himalayan salt to maintain optimal BUN & Creatinine balance.',
      icon: Droplets,
    },
    {
      id: 'spine',
      label: 'Spinal Decompression & Posture Hygiene',
      status: 'High Priority',
      badgeColor: 'emerald',
      directive: 'Hourly posture breaks: 3-min McKenzie lumbar extensions & dead hangs to offload L4-L5 compression from desk sprints.',
      icon: ShieldCheck,
    },
    {
      id: 'cardio',
      label: 'Zone 2 Base & Metabolic Health',
      status: 'Cardio Protocol',
      badgeColor: 'teal',
      directive: '35-45m continuous Zone 2 (130-140 bpm conversational pace) to accelerate mitochondrial density and lipid clearance.',
      icon: Heart,
    },
    {
      id: 'circadian',
      label: 'Circadian Anchoring & Sleep Architecture',
      status: 'Recovery Shield',
      badgeColor: 'violet',
      directive: 'Outdoor morning sunlight anchor before 8 AM. Night wind-down at 10:30 PM with blue-light blocking and magnesium bisglycinate.',
      icon: Clock,
    },
  ];
});

// Real-time AI Nudge based on current hour
const immediateCoachNudge = computed(() => {
  const hour = currentTime.value.getHours();

  if (hour >= 5 && hour < 9) {
    return {
      window: 'Morning Priming Window (05:00 - 09:00)',
      headline: 'Sunlight Anchor & Hydration Ignition',
      text: props.isJyoti
        ? 'Anchor your morning circadian rhythm with 10 minutes of direct outdoor natural light, followed by 500ml warm water.'
        : 'Get 10-15m morning sunlight exposure before screen time. Drink 750ml electrolyte water and complete your morning spine mobility routine.',
      priority: 'High Impact',
      icon: Zap,
    };
  }

  if (hour >= 9 && hour < 13) {
    return {
      window: 'Executive Deep Work Window (09:00 - 13:00)',
      headline: 'Posture Elevation & Cognitive Endurance',
      text: props.isJyoti
        ? 'Maintain calm mental focus. Take a 5-minute deep breathing break and drink fresh water between tasks.'
        : 'Ensure monitor is at eye level. Take a 2-minute posture decompression break every 60 minutes and hit your 1.5L hydration milestone.',
      priority: 'Focused Flow',
      icon: Brain,
    };
  }

  if (hour >= 13 && hour < 17) {
    return {
      window: 'Midday Metabolic Window (13:00 - 17:00)',
      headline: 'Post-Lunch Movement & Hydration Push',
      text: props.isJyoti
        ? 'Take a gentle 10-minute walk after lunch. Ensure adequate water intake throughout the afternoon.'
        : 'Post-lunch 10-minute brisk walk prevents glycemic dip. Reach 2.75L water intake and perform standing calf raises during calls.',
      priority: 'Metabolic Base',
      icon: Activity,
    };
  }

  if (hour >= 17 && hour < 21) {
    return {
      window: 'Physical Training & Transition (17:00 - 21:00)',
      headline: 'Zone 2 / Strength Session Execution',
      text: props.isJyoti
        ? 'Complete your evening movement session or gentle stretching. Transition gracefully away from daily responsibilities.'
        : 'Execute your 40-minute Zone 2 cardio or hypertrophy session. Hydrate with electrolyte replenishment immediately post-workout.',
      priority: 'High Performance',
      icon: Flame,
    };
  }

  return {
    window: 'Evening Circadian Wind-down (21:00 - 05:00)',
    headline: 'Blue Light Cutoff & Deep Sleep Architecture',
    text: props.isJyoti
      ? 'Dim ambient lighting, step away from screens, and prepare for restorative sleep by 10:30 PM.'
      : 'Activate blue-light filters, take magnesium bisglycinate, and cool the bedroom to 20°C for optimal deep delta wave recovery.',
    priority: 'Cellular Restoration',
    icon: Compass,
  };
});

// ── Sync Logic ──
const syncAdherence = async (notify = false) => {
  if (isRefreshing.value) return;
  isRefreshing.value = true;
  isLoading.value = true;

  try {
    const data = await fetchZoetiCoachAdherence(participantId.value, 30);
    if (data) {
      rawTelemetry.value = data;
      lastSyncedAt.value = new Date();
      if (notify) {
        emit('toast', {
          message: `⚡ ZoetiCoach Telemetry Live: ${data.adherence_rate_pct}% 30-Day Adherence!`,
          type: 'success',
        });
      }
    } else {
      // Graceful fallback to local Habuilt metrics
      rawTelemetry.value = {
        name: participantName.value,
        external_participant_id: participantId.value,
        channel: 'habuilt_local',
        evaluation_window_days: 30,
        adherence_rate_pct: props.consistencyScore,
        current_streak: props.systemStreak?.current || 0,
        best_streak: props.systemStreak?.longest || props.systemStreak?.current || 0,
        total_events_in_window: props.todayCompletedCount,
        breakdown_by_event: { habit_completed: props.todayCompletedCount, habit_unmarked: 0 },
        achieved_milestones: props.consistencyScore >= 80 ? ['high_adherence_club_80'] : [],
        regulatory_notice: 'Clinical habit accountability telemetry synced via Habuilt local engine.',
        isFallback: true,
      };
      lastSyncedAt.value = new Date();
      if (notify) {
        emit('toast', {
          message: `📊 Local telemetry active (${props.consistencyScore}% consistency). Ready to sync with Habit Cloud.`,
          type: 'info',
        });
      }
    }
  } catch (err) {
    console.debug('[ZoetiCoach HUD] Telemetry sync note:', err);
  } finally {
    isLoading.value = false;
    isRefreshing.value = false;
  }
};

const openZoetiCoachPortal = () => {
  window.open('https://zoeticoach.com', '_blank', 'noopener,noreferrer');
};

const formatRelativeTime = (date) => {
  if (!date) return 'Syncing...';
  const diffSec = Math.floor((new Date() - date) / 1000);
  if (diffSec < 15) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ── Event Listeners & Watchers ──
const handleEventSynced = (event) => {
  // When an event is dispatched from Habuilt to ZoetiCoach, immediately refresh
  syncAdherence(false);
};

watch(
  () => participantId.value,
  () => {
    syncAdherence(false);
  }
);

watch(
  () => props.todayCompletedCount,
  () => {
    // Light debounce refresh when habits are toggled
    syncAdherence(false);
  }
);

onMounted(() => {
  clockTimer = setInterval(() => {
    currentTime.value = new Date();
  }, 60000);

  if (typeof window !== 'undefined') {
    window.addEventListener('zoeticoach:event-synced', handleEventSynced);
  }

  syncAdherence(false);
});

onUnmounted(() => {
  if (clockTimer) clearInterval(clockTimer);
  if (typeof window !== 'undefined') {
    window.removeEventListener('zoeticoach:event-synced', handleEventSynced);
  }
});
</script>

<template>
  <section class="zoeticoach-hud" aria-label="ZoetiCoach Live Adherence & AI Insights HUD">
    <!-- ── HUD Header Bar ── -->
    <header class="hud-header">
      <div class="hud-brand-group">
        <div class="hud-beacon" :class="{ 'hud-beacon--live': isLiveConnected, 'hud-beacon--standby': !isLiveConnected }">
          <span class="beacon-dot"></span>
          <span class="beacon-ring"></span>
        </div>
        <div class="hud-title-col">
          <div class="hud-headline-row">
            <h2 class="hud-title">ZoetiCoach Live Telemetry</h2>
            <span class="hud-badge hud-badge--channel" :title="`Channel: ${activeChannel}`">
              <Radio class="w-3 h-3 text-emerald-400" />
              <span>{{ isLiveConnected ? 'Habit Cloud WS18' : 'Local Standby' }}</span>
            </span>
          </div>
          <div class="hud-submeta">
            <span class="hud-participant mono-num">{{ participantName }}</span>
            <span class="hud-sep">•</span>
            <span class="hud-time">Last synced {{ formatRelativeTime(lastSyncedAt) }}</span>
          </div>
        </div>
      </div>

      <div class="hud-actions-group">
        <button
          type="button"
          class="hud-btn hud-btn--sync"
          :class="{ 'hud-btn--loading': isRefreshing }"
          :disabled="isRefreshing"
          title="Refresh live adherence telemetry from ZoetiCoach Habit Cloud"
          @click="syncAdherence(true)"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" />
          <span class="hud-btn-text">Sync Live</span>
        </button>

        <button
          type="button"
          class="hud-btn hud-btn--portal"
          title="Open ZoetiCoach Coach Portal (zoeticoach.com)"
          @click="openZoetiCoachPortal"
        >
          <ExternalLink class="w-3.5 h-3.5 text-amber-400" />
          <span class="hud-btn-text">ZoetiCoach Hub</span>
        </button>

        <button
          type="button"
          class="hud-btn hud-btn--toggle"
          :title="isExpanded ? 'Collapse Telemetry Deck' : 'Expand Telemetry Deck'"
          @click="isExpanded = !isExpanded"
        >
          <ChevronUp v-if="isExpanded" class="w-4 h-4 text-slate-400" />
          <ChevronDown v-else class="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </header>

    <!-- ── HUD Body ── -->
    <div v-show="isExpanded" class="hud-content">
      <!-- ── Subnav Tabs ── -->
      <nav class="hud-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          class="hud-tab"
          :class="{ 'hud-tab--active': activeTab === 'overview' }"
          :aria-selected="activeTab === 'overview'"
          @click="activeTab = 'overview'"
        >
          <Activity class="w-3.5 h-3.5" />
          <span>Compliance Telemetry</span>
          <span class="hud-tab-pill mono-num">{{ adherenceRate }}%</span>
        </button>

        <button
          type="button"
          role="tab"
          class="hud-tab"
          :class="{ 'hud-tab--active': activeTab === 'clinical' }"
          :aria-selected="activeTab === 'clinical'"
          @click="activeTab = 'clinical'"
        >
          <Brain class="w-3.5 h-3.5 text-violet-400" />
          <span>AI Clinical Directives</span>
          <span class="hud-tab-badge">Active</span>
        </button>

        <button
          type="button"
          role="tab"
          class="hud-tab"
          :class="{ 'hud-tab--active': activeTab === 'milestones' }"
          :aria-selected="activeTab === 'milestones'"
          @click="activeTab = 'milestones'"
        >
          <Award class="w-3.5 h-3.5 text-amber-400" />
          <span>Milestones</span>
          <span class="hud-tab-pill mono-num">{{ milestones.filter(m => m.unlocked).length }}/{{ milestones.length }}</span>
        </button>
      </nav>

      <!-- ── TAB 1: Compliance Telemetry Deck ── -->
      <div v-if="activeTab === 'overview'" class="hud-pane hud-pane--overview">
        <div class="hud-metric-grid">
          <!-- Card 1: 30-Day Adherence Rate -->
          <div class="metric-card metric-card--adherence">
            <div class="metric-header">
              <span class="metric-label">30-Day Adherence</span>
              <span class="metric-pill" :class="adherenceStatusGrade.class">
                {{ adherenceStatusGrade.label }}
              </span>
            </div>
            <div class="metric-body">
              <div class="metric-val-wrap">
                <span class="metric-val mono-num">{{ adherenceRate }}</span>
                <span class="metric-unit">%</span>
              </div>
              <div class="metric-bar-track">
                <div
                  class="metric-bar-fill"
                  :style="{ width: `${Math.min(100, Math.max(0, adherenceRate))}%` }"
                  :class="adherenceStatusGrade.class"
                ></div>
              </div>
              <div class="metric-footer">
                <span>Clinical Target: ≥80% Compliance</span>
                <span class="metric-benchmark mono-num">{{ adherenceRate >= 80 ? 'Target Met ✓' : `${80 - adherenceRate}% to Goal` }}</span>
              </div>
            </div>
          </div>

          <!-- Card 2: Streak Velocity -->
          <div class="metric-card metric-card--streak">
            <div class="metric-header">
              <span class="metric-label">Streak Velocity</span>
              <Flame class="w-4 h-4 text-amber-400" />
            </div>
            <div class="metric-body">
              <div class="metric-val-wrap">
                <span class="metric-val mono-num">{{ currentStreak }}</span>
                <span class="metric-unit">Days</span>
              </div>
              <p class="metric-subtext">
                Consecutive protocol adherence. All-time verified record:
                <strong class="text-amber-300 mono-num">{{ bestStreak }} days</strong>.
              </p>
              <div class="metric-tag-row">
                <span class="metric-micro-tag">
                  <ShieldCheck class="w-3 h-3 text-emerald-400 inline mr-1" />
                  Chain Protected
                </span>
              </div>
            </div>
          </div>

          <!-- Card 3: Habit Cloud Events -->
          <div class="metric-card metric-card--events">
            <div class="metric-header">
              <span class="metric-label">Habit Cloud Ledger</span>
              <Layers class="w-4 h-4 text-sky-400" />
            </div>
            <div class="metric-body">
              <div class="metric-val-wrap">
                <span class="metric-val mono-num">{{ totalEventsInWindow }}</span>
                <span class="metric-unit">Events</span>
              </div>
              <div class="metric-events-breakdown">
                <span class="breakdown-tag breakdown-tag--completed mono-num">
                  +{{ eventBreakdown.completed }} Completed
                </span>
                <span v-if="eventBreakdown.unmarked > 0" class="breakdown-tag breakdown-tag--unmarked mono-num">
                  -{{ eventBreakdown.unmarked }} Unmarked
                </span>
              </div>
              <p class="metric-subtext">
                Evaluated across the 30-day clinical verification cycle.
              </p>
            </div>
          </div>

          <!-- Card 4: Channel & Sync Status -->
          <div class="metric-card metric-card--sync">
            <div class="metric-header">
              <span class="metric-label">Integration Gateway</span>
              <Wifi v-if="isLiveConnected" class="w-4 h-4 text-emerald-400" />
              <WifiOff v-else class="w-4 h-4 text-slate-400" />
            </div>
            <div class="metric-body">
              <div class="sync-status-row">
                <span class="status-indicator" :class="{ 'status-indicator--live': isLiveConnected }"></span>
                <span class="status-text mono-num">{{ isLiveConnected ? 'ZoetiCoach Cloud Active' : 'Standby Local Mode' }}</span>
              </div>
              <div class="sync-details">
                <div class="sync-row">
                  <span class="sync-row-key">Channel:</span>
                  <span class="sync-row-val mono-num">{{ activeChannel }}</span>
                </div>
                <div class="sync-row">
                  <span class="sync-row-key">Participant:</span>
                  <span class="sync-row-val mono-num">@{{ participantId }}</span>
                </div>
              </div>
              <p class="metric-subtext mt-1">
                {{ isLiveConnected ? 'Events bi-directionally verified with ZoetiCoach WS18 API.' : 'Habits logged locally; auto-syncing to ZoetiCoach on check-in.' }}
              </p>
            </div>
          </div>
        </div>

        <!-- ── Real-time Immediate Coach Nudge Banner ── -->
        <aside class="hud-nudge-banner">
          <div class="nudge-icon-wrap">
            <component :is="immediateCoachNudge.icon" class="w-5 h-5 text-amber-300" />
          </div>
          <div class="nudge-body">
            <div class="nudge-header-row">
              <span class="nudge-window">{{ immediateCoachNudge.window }}</span>
              <span class="nudge-badge">{{ immediateCoachNudge.priority }}</span>
            </div>
            <h4 class="nudge-headline">{{ immediateCoachNudge.headline }}</h4>
            <p class="nudge-text">{{ immediateCoachNudge.text }}</p>
          </div>
        </aside>
      </div>

      <!-- ── TAB 2: AI Clinical Directives ── -->
      <div v-else-if="activeTab === 'clinical'" class="hud-pane hud-pane--clinical">
        <div class="clinical-intro">
          <div class="clinical-intro-title">
            <Brain class="w-4 h-4 text-violet-400" />
            <span>Master Clinical Assessment & Protocol Directives</span>
          </div>
          <p class="clinical-intro-desc">
            Algorithmic directives calibrated to your individualized biomarkers, daily routine windows, and recovery thresholds.
          </p>
        </div>

        <div class="clinical-cards-grid">
          <article
            v-for="pillar in clinicalPillars"
            :key="pillar.id"
            class="clinical-card"
            :class="`clinical-card--${pillar.badgeColor}`"
          >
            <div class="clinical-card-header">
              <div class="clinical-card-icon">
                <component :is="pillar.icon" class="w-4 h-4" />
              </div>
              <div class="clinical-card-meta">
                <h4 class="clinical-card-title">{{ pillar.label }}</h4>
                <span class="clinical-status-pill mono-num">{{ pillar.status }}</span>
              </div>
            </div>
            <p class="clinical-card-directive">{{ pillar.directive }}</p>
          </article>
        </div>
      </div>

      <!-- ── TAB 3: Milestones & Badges ── -->
      <div v-else-if="activeTab === 'milestones'" class="hud-pane hud-pane--milestones">
        <div class="milestones-grid">
          <article
            v-for="milestone in milestones"
            :key="milestone.id"
            class="milestone-card"
            :class="{ 'milestone-card--unlocked': milestone.unlocked, 'milestone-card--locked': !milestone.unlocked }"
          >
            <div class="milestone-icon-wrap" :class="`icon-wrap--${milestone.color}`">
              <component :is="milestone.icon" class="w-5 h-5" />
            </div>
            <div class="milestone-content">
              <div class="milestone-title-row">
                <h4 class="milestone-title">{{ milestone.title }}</h4>
                <span v-if="milestone.unlocked" class="milestone-status-badge unlocked">
                  <CheckCircle2 class="w-3 h-3 inline mr-1" />
                  Unlocked
                </span>
                <span v-else class="milestone-status-badge locked">In Progress</span>
              </div>
              <p class="milestone-desc">{{ milestone.desc }}</p>
            </div>
          </article>
        </div>
      </div>

      <!-- ── HUD Footer: Regulatory Accountability Disclaimer ── -->
      <footer class="hud-footer">
        <div class="regulatory-content">
          <AlertCircle class="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span class="regulatory-text">{{ regulatoryNotice }}</span>
        </div>
      </footer>
    </div>
  </section>
</template>

<style scoped>
/* ── Container ── */
.zoeticoach-hud {
  margin-top: 1rem;
  margin-bottom: 1.25rem;
  background: linear-gradient(135deg, rgba(14, 20, 36, 0.95) 0%, rgba(10, 14, 26, 0.98) 100%);
  border: 1px solid rgba(45, 140, 78, 0.28);
  border-radius: 14px;
  box-shadow:
    0 10px 30px -10px rgba(0, 0, 0, 0.5),
    0 0 20px -5px rgba(45, 140, 78, 0.15);
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  color: #f1f5f9;
}

.zoeticoach-hud:hover {
  border-color: rgba(45, 140, 78, 0.45);
  box-shadow:
    0 12px 35px -8px rgba(0, 0, 0, 0.6),
    0 0 24px -4px rgba(45, 140, 78, 0.22);
}

/* ── Header ── */
.hud-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1.15rem;
  background: rgba(18, 26, 46, 0.65);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-wrap: wrap;
}

.hud-brand-group {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.hud-beacon {
  position: relative;
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.beacon-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.beacon-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid #10b981;
  animation: beacon-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.hud-beacon--standby .beacon-dot {
  background: #f59e0b;
}

.hud-beacon--standby .beacon-ring {
  border-color: #f59e0b;
}

@keyframes beacon-pulse {
  0% {
    transform: scale(0.9);
    opacity: 0.8;
  }
  70% {
    transform: scale(2.2);
    opacity: 0;
  }
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
}

.hud-title-col {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.hud-headline-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.hud-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #f8fafc;
  background: linear-gradient(90deg, #ffffff 0%, #d4b36a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hud-badge--channel {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.15rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.68rem;
  font-weight: 600;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
}

.hud-submeta {
  font-size: 0.72rem;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.hud-participant {
  font-weight: 600;
  color: #e2e8f0;
}

.hud-sep {
  opacity: 0.4;
}

.hud-actions-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.hud-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.38rem 0.7rem;
  font-size: 0.74rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(30, 41, 67, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
}

.hud-btn:hover {
  background: rgba(45, 59, 94, 0.85);
  color: #f8fafc;
  border-color: rgba(255, 255, 255, 0.2);
}

.hud-btn--sync:hover {
  border-color: rgba(16, 185, 129, 0.4);
  color: #34d399;
}

.hud-btn--portal:hover {
  border-color: rgba(212, 179, 106, 0.4);
  color: #f6e05e;
}

.hud-btn--toggle {
  padding: 0.38rem 0.5rem;
}

/* ── Content & Tabs ── */
.hud-content {
  padding: 0.95rem 1.15rem 1.15rem;
}

.hud-tabs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 0.65rem;
  margin-bottom: 1rem;
  overflow-x: auto;
}

.hud-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  font-size: 0.76rem;
  font-weight: 600;
  border-radius: 8px;
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.hud-tab:hover {
  color: #f1f5f9;
  background: rgba(255, 255, 255, 0.04);
}

.hud-tab--active {
  color: #f8fafc;
  background: rgba(45, 140, 78, 0.18);
  border-color: rgba(45, 140, 78, 0.35);
}

.hud-tab-pill {
  font-size: 0.68rem;
  padding: 0.1rem 0.4rem;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.08);
  color: #f1f5f9;
}

.hud-tab-badge {
  font-size: 0.62rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  background: rgba(139, 92, 246, 0.2);
  color: #c4b5fd;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* ── Metric Grid ── */
.hud-metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.85rem;
  margin-bottom: 1rem;
}

@media (max-width: 900px) {
  .hud-metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 540px) {
  .hud-metric-grid {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  background: rgba(20, 28, 48, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  padding: 0.85rem 0.95rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.5rem;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.15);
}

.metric-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}

.metric-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #94a3b8;
}

.metric-pill {
  font-size: 0.64rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.grade-emerald {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #34d399;
}

.grade-gold {
  background: rgba(212, 179, 106, 0.18);
  border: 1px solid rgba(212, 179, 106, 0.45);
  color: #f6e05e;
}

.grade-teal {
  background: rgba(14, 165, 233, 0.15);
  border: 1px solid rgba(14, 165, 233, 0.4);
  color: #38bdf8;
}

.grade-amber {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #fbbf24;
}

.grade-slate {
  background: rgba(148, 163, 184, 0.15);
  border: 1px solid rgba(148, 163, 184, 0.3);
  color: #cbd5e1;
}

.metric-body {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.metric-val-wrap {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.metric-val {
  font-size: 1.85rem;
  font-weight: 800;
  line-height: 1;
  color: #f8fafc;
}

.metric-unit {
  font-size: 0.85rem;
  font-weight: 600;
  color: #94a3b8;
}

.metric-bar-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  overflow: hidden;
  margin-top: 0.2rem;
}

.metric-bar-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.metric-bar-fill.grade-emerald {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.metric-bar-fill.grade-gold {
  background: linear-gradient(90deg, #d4b36a, #fbbf24);
}

.metric-bar-fill.grade-teal {
  background: linear-gradient(90deg, #0ea5e9, #38bdf8);
}

.metric-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.68rem;
  color: #64748b;
  margin-top: 0.2rem;
}

.metric-benchmark {
  font-weight: 600;
  color: #94a3b8;
}

.metric-subtext {
  font-size: 0.72rem;
  color: #94a3b8;
  line-height: 1.35;
  margin: 0;
}

.metric-tag-row {
  margin-top: 0.25rem;
}

.metric-micro-tag {
  display: inline-flex;
  align-items: center;
  font-size: 0.65rem;
  font-weight: 600;
  color: #34d399;
  background: rgba(16, 185, 129, 0.1);
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.metric-events-breakdown {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-top: 0.15rem;
}

.breakdown-tag {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
}

.breakdown-tag--completed {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.breakdown-tag--unmarked {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}

.sync-status-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.25rem;
}

.status-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f59e0b;
}

.status-indicator--live {
  background: #10b981;
}

.status-text {
  font-size: 0.78rem;
  font-weight: 700;
  color: #f1f5f9;
}

.sync-details {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  font-size: 0.7rem;
}

.sync-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sync-row-key {
  color: #64748b;
}

.sync-row-val {
  color: #cbd5e1;
  font-weight: 600;
}

/* ── Nudge Banner ── */
.hud-nudge-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  background: linear-gradient(135deg, rgba(212, 179, 106, 0.08) 0%, rgba(30, 41, 67, 0.5) 100%);
  border: 1px solid rgba(212, 179, 106, 0.25);
  border-radius: 10px;
  padding: 0.85rem 1rem;
}

.nudge-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(212, 179, 106, 0.15);
  border: 1px solid rgba(212, 179, 106, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.nudge-body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.nudge-header-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.nudge-window {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #fbbf24;
}

.nudge-badge {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 0.08rem 0.4rem;
  border-radius: 4px;
  background: rgba(251, 191, 36, 0.2);
  color: #fef3c7;
}

.nudge-headline {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  color: #f8fafc;
}

.nudge-text {
  margin: 0;
  font-size: 0.78rem;
  color: #cbd5e1;
  line-height: 1.45;
}

/* ── Clinical Tab ── */
.clinical-intro {
  margin-bottom: 0.85rem;
}

.clinical-intro-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.84rem;
  font-weight: 700;
  color: #e2e8f0;
}

.clinical-intro-desc {
  font-size: 0.74rem;
  color: #94a3b8;
  margin: 0.2rem 0 0;
}

.clinical-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.85rem;
}

@media (max-width: 680px) {
  .clinical-cards-grid {
    grid-template-columns: 1fr;
  }
}

.clinical-card {
  background: rgba(20, 28, 48, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  transition: border-color 0.2s ease;
}

.clinical-card:hover {
  border-color: rgba(255, 255, 255, 0.16);
}

.clinical-card--gold {
  border-left: 3px solid #d4b36a;
}

.clinical-card--emerald {
  border-left: 3px solid #10b981;
}

.clinical-card--teal {
  border-left: 3px solid #0ea5e9;
}

.clinical-card--violet {
  border-left: 3px solid #8b5cf6;
}

.clinical-card-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.clinical-card-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #cbd5e1;
}

.clinical-card-meta {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.clinical-card-title {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: #f1f5f9;
}

.clinical-status-pill {
  font-size: 0.62rem;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.clinical-card-directive {
  margin: 0;
  font-size: 0.74rem;
  color: #cbd5e1;
  line-height: 1.45;
}

/* ── Milestones Tab ── */
.milestones-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.85rem;
}

@media (max-width: 800px) {
  .milestones-grid {
    grid-template-columns: 1fr;
  }
}

.milestone-card {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(20, 28, 48, 0.55);
}

.milestone-card--unlocked {
  border-color: rgba(212, 179, 106, 0.35);
  background: linear-gradient(135deg, rgba(212, 179, 106, 0.08) 0%, rgba(20, 28, 48, 0.7) 100%);
}

.milestone-card--locked {
  opacity: 0.7;
}

.milestone-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-wrap--gold {
  background: rgba(212, 179, 106, 0.18);
  color: #f6e05e;
}

.icon-wrap--emerald {
  background: rgba(16, 185, 129, 0.18);
  color: #34d399;
}

.icon-wrap--teal {
  background: rgba(14, 165, 233, 0.18);
  color: #38bdf8;
}

.icon-wrap--slate {
  background: rgba(148, 163, 184, 0.12);
  color: #94a3b8;
}

.milestone-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.milestone-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.milestone-title {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  color: #f1f5f9;
}

.milestone-status-badge {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
}

.milestone-status-badge.unlocked {
  background: rgba(16, 185, 129, 0.18);
  color: #34d399;
}

.milestone-status-badge.locked {
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
}

.milestone-desc {
  margin: 0;
  font-size: 0.7rem;
  color: #94a3b8;
  line-height: 1.35;
}

/* ── Footer ── */
.hud-footer {
  margin-top: 0.95rem;
  padding-top: 0.65rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.regulatory-content {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.regulatory-text {
  font-size: 0.66rem;
  color: #64748b;
  line-height: 1.35;
}

.mono-num {
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
