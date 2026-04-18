<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { router, usePage } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { loadUserMonthlyState, saveUserMonthlyState, loadAllUserMonthlyStates } from '@/lib/supabase';

const props = defineProps({
  appName: {
    type: String,
    default: 'Habuilt Tracker',
  },
  today: {
    type: String,
    default: '',
  },
  userId: {
    type: String,
    default: '',
  },
  wallet: {
    type: Number,
    default: 0,
  },
  month: {
    type: Number,
    default: 1,
  },
  year: {
    type: Number,
    default: 2000,
  },
  monthDays: {
    type: Number,
    default: 31,
  },
  currentDay: {
    type: Number,
    default: 1,
  },
  isCurrentMonth: {
    type: Boolean,
    default: true,
  },
  isFutureMonth: {
    type: Boolean,
    default: false,
  },
  canNavigatePrevMonth: {
    type: Boolean,
    default: false,
  },
  canNavigateNextMonth: {
    type: Boolean,
    default: false,
  },
  previousMonth: {
    type: Object,
    default: () => ({ month: 1, year: 2000 }),
  },
  nextMonth: {
    type: Object,
    default: () => ({ month: 1, year: 2000 }),
  },
  habits: {
    type: Array,
    default: () => [],
  },
  staticPreview: {
    type: Boolean,
    default: false,
  },
});

const page = usePage();

const localHabits = ref([]);
const pendingCells = ref({});

const fallbackHabits = [
  { id: 'fallback-1', name: '4:00 AM Wake Up & Hydrate', points: 3 },
  { id: 'fallback-2', name: 'Exercise (HIIT)', points: 2 },
  { id: 'fallback-3', name: 'Deep Work Marathon', points: 3 },
  { id: 'fallback-4', name: 'Care Protocol + Juice/Tea', points: 1 },
  { id: 'fallback-5', name: 'Office Work', points: 1 },
  { id: 'fallback-6', name: '20-20-20 Eye Breaks (Health)', points: 1 },
  { id: 'fallback-7', name: 'Exercise & DHT Rinse (Stress/Hair)', points: 3 },
  { id: 'fallback-8', name: 'Dinner Stop by 7:00 PM (Cure)', points: 2 },
  { id: 'fallback-9', name: 'Limit Phone usage', points: 2 },
  { id: 'fallback-10', name: 'Read 1 page of any book', points: 1 },
  { id: 'fallback-11', name: 'Left-Side Sleep Rule (9:00 PM)', points: 1 },
];

const darkMode = ref(false);
const focusDay = ref(props.currentDay);
const focusTasksByDay = ref({});
const newFocusTask = ref('');
const rewardLedger = ref([]);
const newWeeklyCheck = ref('');
const walletBalance = ref(0);
const isNavigatingMonth = ref(false);
const redeemedBeforeCurrentMonth = ref(0);
const earnedBeforeCurrentMonth = ref(0);

// — Habit editor —
const habitsEditing = ref(false);
const habitsDraft = ref([]);
const habitSaveStatus = ref('idle'); // 'idle' | 'saving' | 'saved' | 'error'
const hasCustomHabits = ref(false);

const rewardsEditing = ref(false);
const rewardsDraft = ref([]);
const rewardSaveStatus = ref('idle'); // 'idle' | 'saving' | 'saved' | 'error'

const ledgerEditing = ref(false);
const ledgerDraft = ref([]);
const ledgerSaveStatus = ref('idle'); // 'idle' | 'saving' | 'saved' | 'error'

const defaultRewards = [
  { type: 'Daily', item: '15 mins social media', cost: 6 },
  { type: 'Weekly', item: '2 Hour Podcast/Movie', cost: 8 },
  { type: 'Weekly', item: 'New gadget/supplement under 500', cost: 12 },
  { type: 'Weekly', item: 'Cheat Meal', cost: 15 },
  { type: 'Weekly', item: 'Social Meetup/Night Out/Movie', cost: 20 },
  { type: 'Month', item: 'New Tech/Clothing', cost: 30 },
  { type: 'Month', item: 'Purchase 1 Useful Subscription', cost: 40 },
  { type: 'Quarter', item: 'Major Purchase', cost: 100 },
  { type: 'Half-Yr', item: 'Vacation', cost: 500 },
  { type: 'Yearly', item: 'International Vacation', cost: 2000 },
];

const rewards = ref(defaultRewards.map((reward) => ({ ...reward })));

const createDefaultWeeklyReview = () => ({
  reviewDate: '',
  metrics: {
    weeklyPoints: '',
    weeklyStickiness: '',
    monthlyPoints: '',
    monthlyStickiness: '',
  },
  checks: [
    { text: 'I reviewed missed days and found one clear trigger.', done: false },
    { text: 'My rewards were motivating enough to drive consistency.', done: false },
    { text: 'I kept a minimum version of hard habits on busy days.', done: false },
    { text: 'I removed at least one friction point for next week.', done: false },
    { text: 'Sleep, reflux, and stress stayed manageable this week.', done: false },
  ],
  reflections: {
    wins: '',
    misses: '',
    triggerPlan: '',
    rewardTune: '',
    habitScale: '',
    healthCheck: '',
    nextWeekFocus: '',
  },
});

const weeklyReview = ref(createDefaultWeeklyReview());

const monthScope = computed(() => `${props.year}-${String(props.month).padStart(2, '0')}`);
const localStateKey = computed(() => `habuilt.dashboard.${props.userId || 'guest'}.${monthScope.value}`);
const localStatePrefix = computed(() => `habuilt.dashboard.${props.userId || 'guest'}.`);
const monthLabel = computed(
  () => new Date(props.year, Math.max(0, props.month - 1), 1).toLocaleString('en-US', { month: 'long' }).toUpperCase(),
);
const selectedMonthIndex = computed(() => (props.year * 100) + props.month);

const mapHabit = (habit) => ({
  id: habit.id,
  name: habit.name,
  points: habit.points,
  completedToday: !!habit.completedToday,
  completedDays: Array.isArray(habit.completedDays)
    ? [...habit.completedDays]
    : (habit.completedToday ? [props.currentDay] : []),
});

watch(
  () => props.habits,
  (value) => {
    if (Array.isArray(value) && value.length > 0) {
      localHabits.value = value.map(mapHabit);
      return;
    }

    localHabits.value = fallbackHabits.map(mapHabit);
  },
  { immediate: true },
);

watch(
  () => props.currentDay,
  (value) => {
    if (focusDay.value > props.monthDays || focusDay.value < 1) {
      focusDay.value = value;
    }
  },
);

watch(
  () => props.monthDays,
  (value) => {
    if (focusDay.value > value) {
      focusDay.value = value;
    }
  },
);

const days = computed(() => Array.from({ length: props.monthDays }, (_, index) => index + 1));

const isWeekendDay = (day) => {
  const weekDay = new Date(props.year, props.month - 1, day).getDay();

  return weekDay === 0 || weekDay === 6;
};

const flashSuccess = computed(() => page?.props?.flash?.success ?? null);
const flashError = computed(() => page?.props?.flash?.error ?? null);

const totalHabits = computed(() => localHabits.value.length);
const draftHasErrors = computed(
  () => habitsDraft.value.length === 0 || habitsDraft.value.some((h) => !h.name.trim()),
);
const rewardDraftHasErrors = computed(
  () => rewardsDraft.value.length === 0
    || rewardsDraft.value.some((reward) => !reward.type.trim() || !reward.item.trim() || Number(reward.cost) < 1),
);
const ledgerDraftHasErrors = computed(
  () => ledgerDraft.value.some((entry) => !entry.item.trim() || !entry.description.trim() || Number(entry.cost) < 0),
);

const normalizeReward = (reward, index = 0) => ({
  type: String(reward?.type || 'Custom').trim() || 'Custom',
  item: String(reward?.item || `Reward ${index + 1}`).trim() || `Reward ${index + 1}`,
  cost: Math.max(1, Math.min(10000, Number(reward?.cost) || 1)),
});

const normalizeLedgerEntry = (entry, index = 0) => {
  const fallbackDate = new Date().toLocaleString();
  const normalizedTimestamp = Number(entry?.timestamp);

  return {
    item: String(entry?.item || `Reward ${index + 1}`).trim() || `Reward ${index + 1}`,
    description: String(entry?.description || '').trim() || String(entry?.item || `Reward ${index + 1}`),
    cost: Math.max(0, Math.min(10000, Number(entry?.cost) || 0)),
    date: String(entry?.date || fallbackDate),
    timestamp: Number.isFinite(normalizedTimestamp) ? normalizedTimestamp : Date.now() + index,
  };
};

const getDayTotal = (day) => localHabits.value.reduce(
  (sum, habit) => sum + (habit.completedDays.includes(day) ? habit.points : 0),
  0,
);

const getServerDayTotal = (day) => {
  if (!Array.isArray(props.habits) || props.habits.length === 0) {
    return 0;
  }

  return props.habits.reduce((sum, habit) => {
    const completedDays = Array.isArray(habit?.completedDays) ? habit.completedDays : [];
    const points = Number(habit?.points);

    return sum + (completedDays.includes(day) ? (Number.isFinite(points) ? points : 0) : 0);
  }, 0);
};

const todayPoints = computed(() => getDayTotal(props.currentDay));
const maxDailyPoints = computed(() => localHabits.value.reduce((sum, habit) => sum + habit.points, 0));
const evaluatedDays = computed(() => {
  if (props.isFutureMonth) {
    return 0;
  }

  return Math.max(0, Math.min(props.currentDay, props.monthDays));
});

const monthTotalPoints = computed(() => {
  if (evaluatedDays.value === 0) {
    return 0;
  }

  return days.value
    .filter((day) => day <= evaluatedDays.value)
    .reduce((sum, day) => sum + getDayTotal(day), 0);
});

const completionRate = computed(() => {
  const denominator = totalHabits.value * evaluatedDays.value;

  if (denominator === 0) {
    return 0;
  }

  let completedCells = 0;

  localHabits.value.forEach((habit) => {
    completedCells += habit.completedDays.filter((day) => day <= evaluatedDays.value).length;
  });

  return (completedCells / denominator) * 100;
});

const dailyAverage = computed(() => {
  if (evaluatedDays.value === 0) {
    return 0;
  }

  return monthTotalPoints.value / evaluatedDays.value;
});

const personalBest = computed(() => {
  let bestDay = null;
  let bestPoints = 0;

  for (let day = 1; day <= evaluatedDays.value; day += 1) {
    const score = getDayTotal(day);

    if (bestDay === null || score > bestPoints) {
      bestDay = day;
      bestPoints = score;
    }
  }

  return { day: bestDay, points: bestPoints };
});

const monthRedeemed = computed(() => rewardLedger.value.reduce((sum, item) => {
  const cost = Number(item?.cost);

  return sum + (Number.isFinite(cost) ? cost : 0);
}, 0));

const monthEarned = computed(() => Math.max(0, monthTotalPoints.value));
const openingBalance = computed(() => Math.max(
  0,
  earnedBeforeCurrentMonth.value - redeemedBeforeCurrentMonth.value
));

const availableWallet = computed(() => Math.max(
  0,
  openingBalance.value + monthEarned.value - monthRedeemed.value
));

const activeMilestoneTarget = computed(() => (availableWallet.value >= 500 ? 2000 : 500));
const activeMilestoneLabel = computed(() => (activeMilestoneTarget.value === 500 ? 'Vacation' : 'International Vacation'));
const pointsToVacation = computed(() => Math.max(activeMilestoneTarget.value - availableWallet.value, 0));
const vacationProgress = computed(
  () => Math.max(0, Math.min((availableWallet.value / activeMilestoneTarget.value) * 100, 100)),
);
const milestoneMessage = computed(() => {
  if (pointsToVacation.value > 0) {
    return `${pointsToVacation.value} points left to hit ${activeMilestoneLabel.value}`;
  }

  if (activeMilestoneTarget.value === 500) {
    return 'Vacation unlocked. Next milestone: International Vacation (2000 pts).';
  }

  return 'International Vacation unlocked. Time to redeem!';
});

watch(
  () => props.wallet,
  (value) => {
    walletBalance.value = Number.isFinite(value) ? value : 0;
  },
  { immediate: true },
);

const chartData = computed(() => days.value.map((day) => getDayTotal(day)));

const chartWidth = 980;
const chartHeight = 256;
const chartPaddingX = 50;
const chartPaddingTop = 18;
const chartPaddingBottom = 56;
const chartMaxValue = computed(() => {
  const rawMax = Math.max(1, maxDailyPoints.value, ...chartData.value);

  return Math.max(25, Math.ceil(rawMax / 5) * 5);
});

const getChartY = (value) => {
  const chartTop = chartPaddingTop;
  const chartBottom = chartHeight - chartPaddingBottom;
  const drawableHeight = chartBottom - chartTop;

  return chartBottom - ((value / chartMaxValue.value) * drawableHeight);
};

const chartGridLines = computed(() => {
  const lines = [];

  for (let value = chartMaxValue.value; value >= 0; value -= 5) {
    lines.push({ value, y: getChartY(value) });
  }

  if (lines[lines.length - 1]?.value !== 0) {
    lines.push({ value: 0, y: getChartY(0) });
  }

  return lines;
});

const chartPoints = computed(() => {
  const step = days.value.length > 1
    ? (chartWidth - (chartPaddingX * 2)) / (days.value.length - 1)
    : 0;

  return chartData.value.map((value, index) => ({
    day: days.value[index],
    value,
    x: chartPaddingX + (step * index),
    y: getChartY(value),
    isWeekend: [0, 6].includes(new Date(props.year, props.month - 1, days.value[index]).getDay()),
  }));
});

const chartLinePath = computed(() => {
  if (chartPoints.value.length === 0) {
    return '';
  }

  if (chartPoints.value.length === 1) {
    const point = chartPoints.value[0];

    return `M ${point.x} ${point.y}`;
  }

  let path = `M ${chartPoints.value[0].x} ${chartPoints.value[0].y}`;

  // Smooth the line using cubic Bezier segments for a softer visual curve.
  for (let index = 0; index < chartPoints.value.length - 1; index += 1) {
    const p0 = chartPoints.value[index - 1] ?? chartPoints.value[index];
    const p1 = chartPoints.value[index];
    const p2 = chartPoints.value[index + 1];
    const p3 = chartPoints.value[index + 2] ?? p2;

    const cp1x = p1.x + ((p2.x - p0.x) / 6);
    const cp1y = p1.y + ((p2.y - p0.y) / 6);
    const cp2x = p2.x - ((p3.x - p1.x) / 6);
    const cp2y = p2.y - ((p3.y - p1.y) / 6);

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
});

const chartAreaPath = computed(() => {
  if (chartPoints.value.length === 0) {
    return '';
  }

  const first = chartPoints.value[0];
  const last = chartPoints.value[chartPoints.value.length - 1];
  const baseline = chartHeight - chartPaddingBottom;

  return `${chartLinePath.value} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
});

const getFocusKey = () => `day-${focusDay.value}`;

const focusTasks = computed(() => {
  const raw = focusTasksByDay.value[getFocusKey()];

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw;
});

const persistLocalState = async () => {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = {
    darkMode: darkMode.value,
    focusTasksByDay: focusTasksByDay.value,
    rewardsCatalog: rewards.value,
    rewardLedger: rewardLedger.value,
    weeklyReview: weeklyReview.value,
    localHabits: localHabits.value,
    hasCustomHabits: hasCustomHabits.value,
  };

  if (props.userId) {
    saveUserMonthlyState(props.userId, monthScope.value, payload);
  }

  await recalculateGlobalTotals();
};

const monthIndexFromScope = (scope) => {
  const match = /^([0-9]{4})-([0-9]{2})$/.exec(String(scope));

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return (year * 100) + month;
};

const recalculateGlobalTotals = async () => {
  if (typeof window === 'undefined' || !props.userId) {
    redeemedBeforeCurrentMonth.value = 0;
    earnedBeforeCurrentMonth.value = 0;
    return;
  }

  let spentBeforeCurrent = 0;
  let earnedBeforeCurrent = 0;
  const states = await loadAllUserMonthlyStates(props.userId);

  states.forEach((row) => {
    const scopeIndex = monthIndexFromScope(row.month_key);
    if (scopeIndex === null) {
      return;
    }

    try {
      const parsed = row.state_data;
      
      // Points spent
      const entries = Array.isArray(parsed?.rewardLedger) ? parsed.rewardLedger : [];
      const monthSpent = entries.reduce((sum, entry) => {
        const cost = Number(entry?.cost);
        return sum + (Number.isFinite(cost) ? cost : 0);
      }, 0);

      // Points earned
      let monthEarnedIter = 0;
      if (Array.isArray(parsed?.localHabits)) {
        parsed.localHabits.forEach(habit => {
          if (Array.isArray(habit.completedDays) && habit.points) {
             monthEarnedIter += habit.completedDays.length * habit.points;
          }
        });
      }

      if (scopeIndex < selectedMonthIndex.value) {
        spentBeforeCurrent += monthSpent;
        earnedBeforeCurrent += monthEarnedIter;
      }

    } catch {
      // Ignored
    }
  });

  redeemedBeforeCurrentMonth.value = Math.max(0, spentBeforeCurrent);
  earnedBeforeCurrentMonth.value = Math.max(0, earnedBeforeCurrent);
};

const normalizeWeeklyReview = (raw) => {
  const fallback = createDefaultWeeklyReview();

  if (!raw || typeof raw !== 'object') {
    return fallback;
  }

  const text = (value) => {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value);
  };

  const checks = Array.isArray(raw.checks)
    ? raw.checks
      .map((check) => ({ text: text(check?.text).trim(), done: !!check?.done }))
      .filter((check) => check.text !== '')
    : [];

  return {
    reviewDate: text(raw.reviewDate),
    metrics: {
      weeklyPoints: text(raw.metrics?.weeklyPoints),
      weeklyStickiness: text(raw.metrics?.weeklyStickiness),
      monthlyPoints: text(raw.metrics?.monthlyPoints),
      monthlyStickiness: text(raw.metrics?.monthlyStickiness),
    },
    checks: checks.length > 0 ? checks : fallback.checks,
    reflections: {
      wins: text(raw.reflections?.wins),
      misses: text(raw.reflections?.misses),
      triggerPlan: text(raw.reflections?.triggerPlan),
      rewardTune: text(raw.reflections?.rewardTune),
      habitScale: text(raw.reflections?.habitScale),
      healthCheck: text(raw.reflections?.healthCheck),
      nextWeekFocus: text(raw.reflections?.nextWeekFocus),
    },
  };
};

const applyThemeClass = () => {
  if (typeof document === 'undefined') {
    return;
  }

  document.body.classList.toggle('theme-dark', darkMode.value);
};

const loadLocalState = async () => {
  if (typeof window === 'undefined' || !props.userId) {
    return;
  }

  const parsed = await loadUserMonthlyState(props.userId, monthScope.value);

  if (!parsed) {
    weeklyReview.value = createDefaultWeeklyReview();
    rewards.value = defaultRewards.map((reward) => ({ ...reward }));
    await recalculateGlobalTotals();
    return;
  }

  try {
    darkMode.value = !!parsed.darkMode;
    focusTasksByDay.value = parsed.focusTasksByDay && typeof parsed.focusTasksByDay === 'object'
      ? parsed.focusTasksByDay
      : {};
    rewards.value = Array.isArray(parsed.rewardsCatalog)
      ? parsed.rewardsCatalog.map((reward, index) => normalizeReward(reward, index))
      : defaultRewards.map((reward) => ({ ...reward }));
    rewardLedger.value = Array.isArray(parsed.rewardLedger)
      ? parsed.rewardLedger.map((entry, index) => normalizeLedgerEntry(entry, index))
      : [];
    weeklyReview.value = normalizeWeeklyReview(parsed.weeklyReview);
    
    // Restore custom habit definitions or merge completions onto defaults
    if (Array.isArray(parsed.localHabits)) {
      if (parsed.hasCustomHabits) {
        // Full restore: custom names, points, AND completion data
        localHabits.value = parsed.localHabits.map((h) => ({
          id: String(h.id || `custom-${Date.now()}-${Math.random()}`),
          name: String(h.name || ''),
          points: Math.max(1, Math.min(100, Number(h.points) || 1)),
          completedDays: Array.isArray(h.completedDays) ? [...h.completedDays] : [],
          completedToday: !!h.completedToday,
        }));
        hasCustomHabits.value = true;
      } else {
        // Legacy path: merge only completion state onto defaults
        localHabits.value = localHabits.value.map((current) => {
          const matchingStored = parsed.localHabits.find((h) => h.id === current.id);
          if (matchingStored) {
            current.completedDays = Array.isArray(matchingStored.completedDays)
              ? [...matchingStored.completedDays]
              : [];
            current.completedToday = !!matchingStored.completedToday;
          }
          return current;
        });
      }
    }
  } catch {
    weeklyReview.value = createDefaultWeeklyReview();
  }

  await recalculateGlobalTotals();
};

const updateFocusTasksForDay = (tasks) => {
  focusTasksByDay.value = {
    ...focusTasksByDay.value,
    [getFocusKey()]: tasks,
  };

  persistLocalState();
};

const addFocusTask = () => {
  const text = newFocusTask.value.trim();

  if (!text) {
    return;
  }

  updateFocusTasksForDay([
    ...focusTasks.value,
    { text, done: false },
  ]);

  newFocusTask.value = '';
};

const deleteFocusTask = (index) => {
  updateFocusTasksForDay(focusTasks.value.filter((_, taskIndex) => taskIndex !== index));
};

const toggleFocusTask = (index) => {
  updateFocusTasksForDay(
    focusTasks.value.map((task, taskIndex) => (
      taskIndex === index
        ? { ...task, done: !task.done }
        : task
    )),
  );
};

const createSummary = (dayList) => {
  const targetPerDay = Math.max(1, Math.ceil(maxDailyPoints.value * 0.6));
  const points = dayList.reduce((sum, day) => sum + getDayTotal(day), 0);
  const completedDays = dayList.filter((day) => getDayTotal(day) >= targetPerDay).length;

  return {
    points,
    completedDays,
    totalDays: dayList.length,
    stickiness: dayList.length > 0 ? (completedDays / dayList.length) * 100 : 0,
    targetPerDay,
  };
};

const weeklyDays = computed(() => {
  const start = Math.max(1, evaluatedDays.value - 6);
  const result = [];

  for (let day = start; day <= evaluatedDays.value; day += 1) {
    result.push(day);
  }

  return result;
});

const weeklySummary = computed(() => createSummary(weeklyDays.value));
const monthlySummary = computed(() => createSummary(days.value.filter((day) => day <= evaluatedDays.value)));

const weeklySnapshotLabel = computed(
  () => `${weeklySummary.value.points} pts • ${weeklySummary.value.completedDays}/${weeklySummary.value.totalDays} days • ${weeklySummary.value.stickiness.toFixed(1)}% (day complete ≥ ${weeklySummary.value.targetPerDay} pts)`,
);

const monthlySnapshotLabel = computed(
  () => `${monthlySummary.value.points} pts • ${monthlySummary.value.completedDays}/${monthlySummary.value.totalDays} days • ${monthlySummary.value.stickiness.toFixed(1)}% (day complete ≥ ${monthlySummary.value.targetPerDay} pts)`,
);

const weeklyStickinessGuide = computed(() => {
  const totalDays = Math.max(weeklySummary.value.totalDays, 1);
  const completedDays = weeklySummary.value.completedDays;
  const threshold = weeklySummary.value.targetPerDay;

  return `Purpose: shows how consistently you hit your daily minimum in the last ${totalDays} days. Formula: (${completedDays} / ${totalDays}) × 100, where a day counts only if points are ≥ ${threshold}. Manual: count qualifying days, divide by ${totalDays}, then multiply by 100.`;
});

const monthlyStickinessGuide = computed(() => {
  const totalDays = Math.max(monthlySummary.value.totalDays, 1);
  const completedDays = monthlySummary.value.completedDays;
  const threshold = monthlySummary.value.targetPerDay;

  return `Purpose: shows month-to-date consistency of hitting your daily minimum. Formula: (${completedDays} / ${totalDays}) × 100, where a day counts only if points are ≥ ${threshold}. Manual: count qualifying days from day 1 to today, divide by ${totalDays}, then multiply by 100.`;
});

const fillWeeklyReviewMetrics = () => {
  weeklyReview.value = {
    ...weeklyReview.value,
    reviewDate: weeklyReview.value.reviewDate || props.today,
    metrics: {
      weeklyPoints: String(weeklySummary.value.points),
      weeklyStickiness: weeklySummary.value.stickiness.toFixed(1),
      monthlyPoints: String(monthlySummary.value.points),
      monthlyStickiness: monthlySummary.value.stickiness.toFixed(1),
    },
  };

  persistLocalState();
};

const saveWeeklyReview = () => {
  weeklyReview.value = normalizeWeeklyReview(weeklyReview.value);
  persistLocalState();
};

const addWeeklyCheck = () => {
  const text = newWeeklyCheck.value.trim();

  if (!text) {
    return;
  }

  weeklyReview.value.checks.push({ text, done: false });
  newWeeklyCheck.value = '';
  persistLocalState();
};

const removeWeeklyCheck = (index) => {
  weeklyReview.value.checks.splice(index, 1);

  if (weeklyReview.value.checks.length === 0) {
    weeklyReview.value.checks = createDefaultWeeklyReview().checks;
  }

  persistLocalState();
};

const claimReward = (reward) => {
  const rewardCost = Math.max(1, Number(reward?.cost) || 0);

  if (availableWallet.value < rewardCost) {
    return;
  }

  const descriptionInput = window.prompt(`Add description for "${reward.item}" (optional):`, reward.item);

  if (descriptionInput === null) {
    return;
  }

  const description = descriptionInput.trim() || reward.item;

  rewardLedger.value.unshift({
    item: reward.item,
    description,
    cost: rewardCost,
    date: new Date().toLocaleString(),
    timestamp: Date.now(),
  });

  persistLocalState();
};

const startEditingRewards = () => {
  rewardsDraft.value = rewards.value.map((reward) => ({ ...normalizeReward(reward) }));
  rewardsEditing.value = true;
  rewardSaveStatus.value = 'idle';
};

const cancelEditingRewards = () => {
  rewardsEditing.value = false;
  rewardsDraft.value = [];
  rewardSaveStatus.value = 'idle';
};

const addDraftReward = () => {
  rewardsDraft.value.push({
    type: 'Custom',
    item: '',
    cost: 1,
  });
};

const removeDraftReward = (index) => {
  rewardsDraft.value.splice(index, 1);
};

const saveEditedRewards = async () => {
  if (rewardDraftHasErrors.value) {
    return;
  }

  rewardSaveStatus.value = 'saving';
  rewards.value = rewardsDraft.value.map((reward, index) => normalizeReward(reward, index));
  await persistLocalState();

  rewardSaveStatus.value = 'saved';
  rewardsEditing.value = false;

  setTimeout(() => {
    rewardSaveStatus.value = 'idle';
  }, 2500);
};

const startEditingLedger = () => {
  ledgerDraft.value = rewardLedger.value.map((entry, index) => ({ ...normalizeLedgerEntry(entry, index) }));
  ledgerEditing.value = true;
  ledgerSaveStatus.value = 'idle';
};

const cancelEditingLedger = () => {
  ledgerEditing.value = false;
  ledgerDraft.value = [];
  ledgerSaveStatus.value = 'idle';
};

const addDraftLedgerEntry = () => {
  ledgerDraft.value.unshift({
    item: 'Custom Reward',
    description: '',
    cost: 0,
    date: new Date().toLocaleString(),
    timestamp: Date.now(),
  });
};

const removeDraftLedgerEntry = (index) => {
  ledgerDraft.value.splice(index, 1);
};

const saveEditedLedger = async () => {
  if (ledgerDraftHasErrors.value) {
    return;
  }

  ledgerSaveStatus.value = 'saving';
  rewardLedger.value = ledgerDraft.value.map((entry, index) => normalizeLedgerEntry(entry, index));
  await persistLocalState();

  ledgerSaveStatus.value = 'saved';
  ledgerEditing.value = false;

  setTimeout(() => {
    ledgerSaveStatus.value = 'idle';
  }, 2500);
};

const clearHabitChecklistProgressLocally = () => {
  localHabits.value = localHabits.value.map((habit) => ({
    ...habit,
    completedDays: [],
    completedToday: false,
  }));
  pendingCells.value = {};
};

// ─── Habit Editor Functions ───────────────────────────────────────────────────

const startEditingHabits = () => {
  habitsDraft.value = localHabits.value.map((h) => ({
    id: h.id,
    name: h.name,
    points: h.points,
    completedDays: [...h.completedDays],
    completedToday: h.completedToday,
  }));
  habitsEditing.value = true;
  habitSaveStatus.value = 'idle';
};

const cancelEditingHabits = () => {
  habitsEditing.value = false;
  habitsDraft.value = [];
  habitSaveStatus.value = 'idle';
};

const addDraftHabit = () => {
  habitsDraft.value.push({
    id: `custom-${Date.now()}-${habitsDraft.value.length}`,
    name: '',
    points: 1,
    completedDays: [],
    completedToday: false,
  });
};

const removeDraftHabit = (index) => {
  habitsDraft.value.splice(index, 1);
};

const saveEditedHabits = async () => {
  if (draftHasErrors.value) return;

  habitSaveStatus.value = 'saving';

  localHabits.value = habitsDraft.value.map((h) => ({
    id: h.id,
    name: h.name.trim(),
    points: Math.max(1, Math.min(100, Number(h.points) || 1)),
    completedDays: [...h.completedDays],
    completedToday: h.completedToday,
  }));

  hasCustomHabits.value = true;
  await persistLocalState();

  habitSaveStatus.value = 'saved';
  habitsEditing.value = false;

  setTimeout(() => {
    habitSaveStatus.value = 'idle';
  }, 2500);
};

// ─────────────────────────────────────────────────────────────────────────────

const clearLocalProgress = async () => {
  if (!window.confirm('Clear all dashboard progress? Habit checklist grid, total point balance, vacation milestone, and Today\' Focus and Reward data will be reset.')) {
    return;
  }

  clearHabitChecklistProgressLocally();
  focusDay.value = props.currentDay;
  focusTasksByDay.value = {};
  newFocusTask.value = '';
  rewardLedger.value = [];
  weeklyReview.value = createDefaultWeeklyReview();
  newWeeklyCheck.value = '';
  await persistLocalState();
};

const goToMonth = (target) => {
  if (!target || isNavigatingMonth.value) {
    return;
  }

  isNavigatingMonth.value = true;
  window.location.search = `?month=${target.month}&year=${target.year}`;
};

const goToPreviousMonth = () => {
  if (!props.canNavigatePrevMonth) {
    return;
  }

  goToMonth(props.previousMonth);
};

const goToNextMonth = () => {
  if (!props.canNavigateNextMonth) {
    return;
  }

  goToMonth(props.nextMonth);
};

const hasCompletedDay = (habit, day) => habit.completedDays.includes(day);
const keyFor = (habitId, day) => `${habitId}:${day}`;

const setHabitDayCompletion = (habit, day, completed) => {
  if (completed) {
    habit.completedDays.push(day);
    habit.completedDays = [...new Set(habit.completedDays)].sort((a, b) => a - b);
  } else {
    habit.completedDays = habit.completedDays.filter((value) => value !== day);
  }

  habit.completedToday = habit.completedDays.includes(props.currentDay);
};

const toggleHabitForDay = async (habit, day) => {
  if (props.isFutureMonth) {
    return;
  }

  const pendingKey = keyFor(habit.id, day);

  if (pendingCells.value[pendingKey]) {
    return;
  }

  pendingCells.value[pendingKey] = true;
  pendingCells.value = { ...pendingCells.value };

  try {
    const wasCompleted = hasCompletedDay(habit, day);
    setHabitDayCompletion(habit, day, !wasCompleted);
    await persistLocalState();
  } finally {
    delete pendingCells.value[pendingKey];
    pendingCells.value = { ...pendingCells.value };
  }
};

onMounted(() => {
  loadLocalState();
  applyThemeClass();
});

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.remove('theme-dark');
  }
});

watch(darkMode, () => {
  applyThemeClass();
  persistLocalState();
});
</script>

<template>
  <AppLayout>
    <section :class="{ 'month-nav-loading': isNavigatingMonth }">
      <section class="card card--hero" id="overview">
        <header class="hero-head">
          <div class="hero-main">
            <div class="hero-brand-block">
              <p class="eyebrow">Habuilt Tracker</p>
              <p class="hero-sub">{{ monthLabel }} {{ year }} // DISCIPLINE EQUALS FREEDOM</p>
            </div>

            <div class="focus-card focus-card--hero">
              <div class="focus-head">
                <strong>TODAY'S FOCUS</strong>
                <div class="focus-day-select">
                  <label for="focus-day">Day</label>
                  <select id="focus-day" v-model.number="focusDay">
                    <option v-for="day in days" :key="`focus-${day}`" :value="day">{{ day }}</option>
                  </select>
                  <span>Score: {{ getDayTotal(focusDay) }}</span>
                </div>
              </div>

              <div v-if="focusTasks.length > 0" class="focus-list">
                <article v-for="(task, index) in focusTasks" :key="`task-${focusDay}-${index}`" class="focus-item">
                  <input
                    :id="`focus-check-${focusDay}-${index}`"
                    type="checkbox"
                    :checked="task.done"
                    @change="toggleFocusTask(index)"
                  >
                  <label :for="`focus-check-${focusDay}-${index}`" :class="task.done ? 'is-done' : ''">{{ task.text }}</label>
                  <button class="focus-delete" @click="deleteFocusTask(index)">✕</button>
                </article>
              </div>

              <p v-else class="focus-empty">No tasks yet — add your mission objectives below.</p>

              <div class="focus-input-row">
                <input
                  v-model="newFocusTask"
                  type="text"
                  maxlength="200"
                  placeholder="Type a task and press Enter..."
                  @keydown.enter.prevent="addFocusTask"
                >
                <button class="btn" :disabled="newFocusTask.trim() === ''" @click="addFocusTask">+ Add</button>
              </div>
            </div>
          </div>

          <div class="hero-side">
            <div class="hero-actions">
              <button
                class="btn btn--calendar"
                :disabled="!canNavigatePrevMonth || isNavigatingMonth"
                @click="goToPreviousMonth"
              >
                ← Prev Month
              </button>
              <button
                class="btn btn--calendar"
                :disabled="!canNavigateNextMonth || isNavigatingMonth"
                @click="goToNextMonth"
              >
                Next Month →
              </button>
              <button class="btn" @click="darkMode = !darkMode">{{ darkMode ? '☀' : '🌙' }}</button>
            </div>

            <div class="kpis kpis--compact">
              <article class="kpi">
                <p>Earned Today</p>
                <strong>{{ todayPoints }}</strong>
              </article>
              <article class="kpi kpi--wallet">
                <p>Total Point Balance</p>
                <strong>{{ availableWallet }}</strong>
              </article>
            </div>

            <article class="balance-math">
              <h3>Carry-Forward Balance Math</h3>
              <div class="balance-math__grid">
                <p><span>Opening Balance</span><strong>{{ openingBalance }}</strong></p>
                <p><span>Month Earned</span><strong>{{ monthEarned }}</strong></p>
                <p><span>Month Redeemed</span><strong>{{ monthRedeemed }}</strong></p>
                <p><span>Closing Balance</span><strong>{{ availableWallet }}</strong></p>
              </div>
            </article>
          </div>
        </header>

        <p v-if="flashSuccess" class="banner banner--success">{{ flashSuccess }}</p>
        <p v-if="flashError" class="banner banner--error">{{ flashError }}</p>
      </section>

      <section class="card" id="analytics">
        <div class="section-head">
          <h2 class="section-title">
            <span class="section-title__icon">📊</span>
            <span>Monthly Performance</span>
          </h2>
          <small>Target: {{ Math.max(25, Math.ceil(maxDailyPoints * 0.6)) }}+ points/day</small>
        </div>

        <div class="chart-wrap">
          <svg class="chart" :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="none">
            <defs>
              <linearGradient id="analyticsAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#10b981" stop-opacity="0.30" />
                <stop offset="100%" stop-color="#10b981" stop-opacity="0.03" />
              </linearGradient>
              <linearGradient id="analyticsLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#0fb981" />
                <stop offset="100%" stop-color="#12a476" />
              </linearGradient>
            </defs>
            <g class="chart__grid">
              <line
                v-for="line in chartGridLines"
                :key="`grid-${line.value}`"
                :x1="chartPaddingX"
                :x2="chartWidth - chartPaddingX"
                :y1="line.y"
                :y2="line.y"
              />
            </g>
            <g class="chart__y-labels">
              <text
                v-for="line in chartGridLines"
                :key="`ylabel-${line.value}`"
                class="chart__y-label"
                :x="chartPaddingX - 8"
                :y="line.y"
              >{{ line.value }}</text>
            </g>
            <path class="chart__area" :d="chartAreaPath" />
            <path class="chart__line" :d="chartLinePath" />
            <circle
              v-for="point in chartPoints"
              :key="`pt-${point.day}`"
              class="chart__dot"
              :cx="point.x"
              :cy="point.y"
              r="3"
            />
            <g class="chart__x-labels">
              <text
                v-for="point in chartPoints"
                :key="`xlabel-${point.day}`"
                :class="['chart__x-label', { 'chart__x-label--weekend': point.isWeekend }]"
                :x="point.x"
                :y="chartHeight - 20"
              >{{ point.day }}</text>
            </g>
          </svg>
        </div>
        <p class="chart-legend-note">
          <span class="chart-legend-note__dot" aria-hidden="true">●</span>
          Weekend labels highlighted (Sat/Sun)
        </p>

        <div class="progress-block">
          <div class="progress-head">
            <p>{{ activeMilestoneLabel }} Milestone ({{ activeMilestoneTarget }} pts)</p>
            <strong>{{ vacationProgress.toFixed(1) }}%</strong>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="`width: ${vacationProgress}%`" />
          </div>
          <p class="progress-note">
            {{ milestoneMessage }}
          </p>
        </div>

        <div class="stats-grid">
          <article class="stat-card">
            <p>MONTHLY PERSONAL BEST</p>
            <strong>{{ personalBest.day ? `Day ${personalBest.day} • ${personalBest.points} pts` : 'No data yet' }}</strong>
          </article>
          <article class="stat-card">
            <p>DAILY AVERAGE</p>
            <strong>{{ dailyAverage.toFixed(1) }} pts/day</strong>
          </article>
          <article class="stat-card">
            <p>COMPLETION RATE</p>
            <strong>{{ completionRate.toFixed(1) }}%</strong>
          </article>
        </div>
      </section>

      <section class="card" id="habits">
        <div class="section-head">
          <div>
            <h2>Habit Checklist</h2>
            <small>Core Habit (Leading Indicator) — day-based completion matrix</small>
          </div>
          <button v-if="!habitsEditing" class="btn btn--secondary" @click="startEditingHabits">✏ Edit Habits</button>
        </div>

        <!-- ── Habits Editor Panel ──────────────────────────────────── -->
        <div v-if="habitsEditing" class="habits-editor">
          <p class="habits-editor__hint">
            Edit habit names and assign point values. Changes are saved to your account and applied immediately.
          </p>

          <div class="habits-editor__list">
            <div
              v-for="(habit, index) in habitsDraft"
              :key="habit.id"
              class="habits-editor__row"
            >
              <span class="habits-editor__num">{{ index + 1 }}</span>
              <input
                v-model="habit.name"
                type="text"
                maxlength="80"
                placeholder="Habit name…"
                class="habits-editor__name"
                :class="{ 'habits-editor__name--error': !habit.name.trim() }"
              >
              <label class="habits-editor__pts-label">
                <span>pts</span>
                <input
                  v-model.number="habit.points"
                  type="number"
                  min="1"
                  max="100"
                  class="habits-editor__pts"
                >
              </label>
              <button class="habits-editor__delete" @click="removeDraftHabit(index)" title="Remove habit">✕</button>
            </div>
          </div>

          <button class="btn btn--secondary habits-editor__add" @click="addDraftHabit">+ Add Habit</button>

          <div class="habits-editor__actions">
            <button
              class="btn"
              :disabled="draftHasErrors || habitSaveStatus === 'saving'"
              @click="saveEditedHabits"
            >
              <span v-if="habitSaveStatus === 'saving'">Saving…</span>
              <span v-else-if="habitSaveStatus === 'saved'">✓ Saved</span>
              <span v-else>Save Habits</span>
            </button>
            <button class="btn btn--ghost" @click="cancelEditingHabits">Cancel</button>
            <span v-if="draftHasErrors && habitsDraft.length > 0" class="habits-editor__warn">
              All habits need a name before saving.
            </span>
          </div>
        </div>

        <!-- ── Normal Grid View ──────────────────────────────────────── -->
        <template v-else>
          <div v-if="localHabits.length === 0" class="empty-state">
            No habits found yet. Refresh once seeding is complete.
          </div>

          <div v-else class="habit-grid-wrap">
            <table class="habit-grid">
              <thead>
                <tr>
                  <th class="habit-grid__sticky">Core Habit (Leading Indicator)</th>
                  <th class="habit-grid__pts">Pts</th>
                  <th
                    v-for="day in days"
                    :key="`head-${day}`"
                    class="habit-grid__day"
                    :class="[
                      props.isCurrentMonth && day === props.currentDay ? 'habit-grid__day--current' : '',
                      isWeekendDay(day) ? 'habit-grid__day--weekend' : '',
                    ]"
                  >
                    {{ day }}
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="habit in localHabits" :key="habit.id" class="habit-grid__row">
                  <td class="habit-grid__sticky habit-grid__name">{{ habit.name }}</td>
                  <td class="habit-grid__pts">{{ habit.points }}</td>

                  <td
                    v-for="day in days"
                    :key="`${habit.id}-${day}`"
                    class="habit-grid__cell"
                    :class="isWeekendDay(day) ? 'habit-grid__cell--weekend' : ''"
                  >
                    <button
                      class="habit-grid__check"
                      :class="hasCompletedDay(habit, day) ? 'habit-grid__check--done' : ''"
                      :disabled="isFutureMonth || !!pendingCells[keyFor(habit.id, day)]"
                      @click="toggleHabitForDay(habit, day)"
                    >
                      <span v-if="hasCompletedDay(habit, day)">✓</span>
                      <span v-else-if="pendingCells[keyFor(habit.id, day)]">…</span>
                      <span v-else-if="isFutureMonth">–</span>
                    </button>
                  </td>
                </tr>

                <tr class="habit-grid__totals">
                  <td class="habit-grid__sticky">DAILY TOTAL POINTS</td>
                  <td class="habit-grid__pts">—</td>
                  <td
                    v-for="day in days"
                    :key="`tot-${day}`"
                    :class="isWeekendDay(day) ? 'habit-grid__cell--weekend' : ''"
                  >{{ getDayTotal(day) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

      </section>

      <section class="dashboard-columns" id="rewards">
        <article class="card column-card">
          <div class="section-head">
            <h2>💰 THE REWARD SHOP</h2>
            <button v-if="!rewardsEditing" class="btn btn--secondary" @click="startEditingRewards">✏ Edit Rewards</button>
          </div>

          <div v-if="rewardsEditing" class="rewards-editor">
            <p class="habits-editor__hint">Edit reward type, title and redeem points. Save to apply for this month.</p>

            <div class="rewards-editor__list">
              <div v-for="(reward, index) in rewardsDraft" :key="`reward-draft-${index}`" class="rewards-editor__row">
                <input v-model="reward.type" type="text" maxlength="24" placeholder="Type (Daily/Weekly...)" class="rewards-editor__type">
                <input v-model="reward.item" type="text" maxlength="100" placeholder="Reward name" class="rewards-editor__item">
                <label class="rewards-editor__cost-label">
                  <span>Pts</span>
                  <input v-model.number="reward.cost" type="number" min="1" max="10000" class="rewards-editor__cost">
                </label>
                <button class="habits-editor__delete" @click="removeDraftReward(index)">✕</button>
              </div>
            </div>

            <button class="btn btn--secondary rewards-editor__add" @click="addDraftReward">+ Add Reward</button>

            <div class="habits-editor__actions">
              <button class="btn" :disabled="rewardDraftHasErrors || rewardSaveStatus === 'saving'" @click="saveEditedRewards">
                <span v-if="rewardSaveStatus === 'saving'">Saving…</span>
                <span v-else-if="rewardSaveStatus === 'saved'">✓ Saved</span>
                <span v-else>Save Rewards</span>
              </button>
              <button class="btn btn--ghost" @click="cancelEditingRewards">Cancel</button>
            </div>
          </div>

          <div v-else class="rewards-grid">
            <article v-for="reward in rewards" :key="`${reward.type}-${reward.item}`" class="reward-item">
              <p>{{ reward.type }}</p>
              <h3>{{ reward.item }}</h3>
              <button
                class="reward-btn"
                :disabled="availableWallet < reward.cost"
                @click="claimReward(reward)"
              >
                <span>Redeem</span>
                <strong>{{ reward.cost }}</strong>
              </button>
            </article>
          </div>
        </article>

        <article class="card column-card">
          <div class="section-head">
            <h2>📜 POINT LEDGER</h2>
            <button v-if="!ledgerEditing" class="btn btn--secondary" @click="startEditingLedger">✏ Edit Ledger</button>
          </div>

          <div v-if="ledgerEditing" class="ledger-editor">
            <div class="ledger-editor__actions">
              <button class="btn btn--secondary" @click="addDraftLedgerEntry">+ Add Entry</button>
            </div>

            <div class="ledger-wrap">
              <table class="ledger-table">
                <thead>
                  <tr>
                    <th>Reward Item</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Redeem Cost</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(entry, index) in ledgerDraft" :key="`ledger-draft-${entry.timestamp}-${index}`">
                    <td><input v-model="entry.item" type="text" maxlength="80" class="ledger-editor__input"></td>
                    <td><input v-model="entry.description" type="text" maxlength="120" class="ledger-editor__input"></td>
                    <td><input v-model="entry.date" type="text" maxlength="40" class="ledger-editor__input"></td>
                    <td><input v-model.number="entry.cost" type="number" min="0" max="10000" class="ledger-editor__cost"></td>
                    <td><button class="habits-editor__delete" @click="removeDraftLedgerEntry(index)">✕</button></td>
                  </tr>
                  <tr v-if="ledgerDraft.length === 0">
                    <td colspan="5" class="ledger-table__empty">No redemptions found. Add one manually or redeem from Reward Shop.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="habits-editor__actions">
              <button class="btn" :disabled="ledgerDraftHasErrors || ledgerSaveStatus === 'saving'" @click="saveEditedLedger">
                <span v-if="ledgerSaveStatus === 'saving'">Saving…</span>
                <span v-else-if="ledgerSaveStatus === 'saved'">✓ Saved</span>
                <span v-else>Save Ledger</span>
              </button>
              <button class="btn btn--ghost" @click="cancelEditingLedger">Cancel</button>
            </div>
          </div>

          <div v-else class="ledger-wrap">
            <table class="ledger-table">
              <thead>
                <tr>
                  <th>Reward Item</th>
                  <th>Description</th>
                  <th>Date</th>
                  <th>Exact Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in rewardLedger" :key="entry.timestamp">
                  <td>{{ entry.item }}</td>
                  <td>{{ entry.description }}</td>
                  <td>{{ entry.date }}</td>
                  <td class="ledger-table__cost">-{{ entry.cost }} pts</td>
                </tr>
                <tr v-if="rewardLedger.length === 0">
                  <td colspan="4" class="ledger-table__empty">No redemptions found. Build your bank first.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="ledger-actions">
            <button class="btn btn--ghost" @click="clearLocalProgress">Clear All Progress</button>
          </div>
        </article>
      </section>

      <section class="card" id="weekly-review">
        <div class="section-head">
          <div>
            <h2>🧭 Weekly Review Protocol</h2>
            <small>Sunday check-in. Keep it short, honest, and actionable.</small>
          </div>
          <button class="btn btn--secondary" @click="fillWeeklyReviewMetrics">Use Auto Metrics</button>
        </div>

        <p class="review-snapshot">Auto weekly snapshot: {{ weeklySnapshotLabel }}</p>
        <p class="review-snapshot">Auto monthly snapshot: {{ monthlySnapshotLabel }}</p>

        <div class="review-grid">
          <article class="review-card">
            <h3>Consistency Metrics</h3>

            <div class="review-fields">
              <label>
                Review Date
                <input v-model="weeklyReview.reviewDate" type="date" @change="saveWeeklyReview">
              </label>
              <label>
                Weekly Points
                <input v-model="weeklyReview.metrics.weeklyPoints" type="text" placeholder="e.g. 104" @change="saveWeeklyReview">
              </label>
              <label>
                Weekly Stickiness %
                <input v-model="weeklyReview.metrics.weeklyStickiness" type="text" placeholder="e.g. 71.4" @change="saveWeeklyReview">
                <small class="metric-guide">{{ weeklyStickinessGuide }}</small>
              </label>
              <label>
                Monthly Points
                <input v-model="weeklyReview.metrics.monthlyPoints" type="text" placeholder="e.g. 298" @change="saveWeeklyReview">
              </label>
              <label>
                Monthly Stickiness %
                <input v-model="weeklyReview.metrics.monthlyStickiness" type="text" placeholder="e.g. 64.5" @change="saveWeeklyReview">
                <small class="metric-guide">{{ monthlyStickinessGuide }}</small>
              </label>
            </div>
          </article>

          <article class="review-card">
            <h3>Real-World Checkpoints</h3>

            <div class="check-list">
              <div v-for="(check, index) in weeklyReview.checks" :key="`check-${index}`" class="check-item">
                <input v-model="check.done" type="checkbox" @change="saveWeeklyReview">
                <input v-model="check.text" type="text" maxlength="160" @change="saveWeeklyReview">
                <button @click="removeWeeklyCheck(index)">✕</button>
              </div>
            </div>

            <div class="check-add-row">
              <input
                v-model="newWeeklyCheck"
                type="text"
                maxlength="160"
                placeholder="Add a practical weekly check..."
                @keydown.enter.prevent="addWeeklyCheck"
              >
              <button class="btn" :disabled="newWeeklyCheck.trim() === ''" @click="addWeeklyCheck">+ Add</button>
            </div>
          </article>
        </div>

        <div class="reflection-grid">
          <label>
            Biggest Wins Worth Repeating
            <textarea v-model="weeklyReview.reflections.wins" rows="2" @blur="saveWeeklyReview" />
          </label>
          <label>
            Missed Days & Friction Pattern
            <textarea v-model="weeklyReview.reflections.misses" rows="2" @blur="saveWeeklyReview" />
          </label>
          <label>
            Trigger + If-Then Plan
            <textarea v-model="weeklyReview.reflections.triggerPlan" rows="2" @blur="saveWeeklyReview" />
          </label>
          <label>
            Reward Motivation Check
            <textarea v-model="weeklyReview.reflections.rewardTune" rows="2" @blur="saveWeeklyReview" />
          </label>
          <label>
            Scale-Down Rule for Hard Days
            <textarea v-model="weeklyReview.reflections.habitScale" rows="2" @blur="saveWeeklyReview" />
          </label>
          <label>
            Health Check (Sleep/Reflux/Stress)
            <textarea v-model="weeklyReview.reflections.healthCheck" rows="2" @blur="saveWeeklyReview" />
          </label>
          <label class="reflection-grid__wide">
            Next Week Focus Commitments
            <textarea v-model="weeklyReview.reflections.nextWeekFocus" rows="2" @blur="saveWeeklyReview" />
          </label>
        </div>
      </section>
    </section>
  </AppLayout>
</template>
