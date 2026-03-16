<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { router, usePage } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';

const props = defineProps({
  appName: {
    type: String,
    default: 'Warrior Tracker',
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
  habits: {
    type: Array,
    default: () => [],
  },
  legacyReferenceAvailable: {
    type: Boolean,
    default: false,
  },
});

const page = usePage();

const localHabits = ref([]);
const pendingCells = ref({});

const darkMode = ref(false);
const focusDay = ref(props.currentDay);
const focusTasksByDay = ref({});
const newFocusTask = ref('');
const rewardLedger = ref([]);
const newWeeklyCheck = ref('');

const rewards = ref([
  { type: 'Daily', item: '15 mins social media', cost: 6 },
  { type: 'Weekly', item: '2 Hour Podcast/Movie', cost: 8 },
  { type: 'Weekly', item: 'New gadget/supplement under 500', cost: 12 },
  { type: 'Weekly', item: 'Cheat Meal', cost: 15 },
  { type: 'Weekly', item: 'Social Meetup/Night Out/Movie', cost: 20 },
  { type: 'Month', item: 'New Tech/Clothing', cost: 30 },
  { type: 'Month', item: 'Purchase 1 Useful Subscription', cost: 40 },
  { type: 'Quarter', item: 'Major Purchase', cost: 100 },
  { type: 'Half-Yr', item: 'Vacation', cost: 500 },
]);

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
    localHabits.value = value.map(mapHabit);
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

const flashSuccess = computed(() => page.props.flash?.success ?? null);
const flashError = computed(() => page.props.flash?.error ?? null);

const totalHabits = computed(() => localHabits.value.length);
const completedCountToday = computed(
  () => localHabits.value.filter((habit) => habit.completedDays.includes(props.currentDay)).length,
);

const getDayTotal = (day) => localHabits.value.reduce(
  (sum, habit) => sum + (habit.completedDays.includes(day) ? habit.points : 0),
  0,
);

const todayPoints = computed(() => getDayTotal(props.currentDay));
const monthTotalPoints = computed(() => days.value.reduce((sum, day) => sum + getDayTotal(day), 0));
const maxDailyPoints = computed(() => localHabits.value.reduce((sum, habit) => sum + habit.points, 0));
const daysPassed = computed(() => Math.max(1, Math.min(props.currentDay, props.monthDays)));

const completionRate = computed(() => {
  const denominator = totalHabits.value * daysPassed.value;

  if (denominator === 0) {
    return 0;
  }

  let completedCells = 0;

  localHabits.value.forEach((habit) => {
    completedCells += habit.completedDays.filter((day) => day <= daysPassed.value).length;
  });

  return (completedCells / denominator) * 100;
});

const dailyAverage = computed(() => monthTotalPoints.value / daysPassed.value);

const personalBest = computed(() => {
  let bestDay = null;
  let bestPoints = 0;

  for (let day = 1; day <= daysPassed.value; day += 1) {
    const score = getDayTotal(day);

    if (bestDay === null || score > bestPoints) {
      bestDay = day;
      bestPoints = score;
    }
  }

  return { day: bestDay, points: bestPoints };
});

const pointsSpent = computed(() => rewardLedger.value.reduce((sum, item) => sum + item.cost, 0));
const availableWallet = computed(() => Math.max(0, props.wallet - pointsSpent.value));
const pointsToVacation = computed(() => Math.max(500 - availableWallet.value, 0));
const vacationProgress = computed(() => Math.max(0, Math.min((availableWallet.value / 500) * 100, 100)));

const chartData = computed(() => days.value.map((day) => getDayTotal(day)));

const chartWidth = 980;
const chartHeight = 220;
const chartPaddingX = 24;
const chartPaddingY = 16;

const chartPoints = computed(() => {
  const step = days.value.length > 1
    ? (chartWidth - (chartPaddingX * 2)) / (days.value.length - 1)
    : 0;

  const chartTop = chartPaddingY;
  const chartBottom = chartHeight - chartPaddingY;
  const drawableHeight = chartBottom - chartTop;
  const maxValue = Math.max(1, maxDailyPoints.value, ...chartData.value);

  return chartData.value.map((value, index) => ({
    day: days.value[index],
    value,
    x: chartPaddingX + (step * index),
    y: chartBottom - ((value / maxValue) * drawableHeight),
  }));
});

const chartLinePath = computed(() => {
  if (chartPoints.value.length === 0) {
    return '';
  }

  return chartPoints.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
});

const chartAreaPath = computed(() => {
  if (chartPoints.value.length === 0) {
    return '';
  }

  const first = chartPoints.value[0];
  const last = chartPoints.value[chartPoints.value.length - 1];
  const baseline = chartHeight - chartPaddingY;

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

const persistLocalState = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(localStateKey.value, JSON.stringify({
    darkMode: darkMode.value,
    focusTasksByDay: focusTasksByDay.value,
    rewardLedger: rewardLedger.value,
    weeklyReview: weeklyReview.value,
  }));
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

const loadLocalState = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const raw = window.localStorage.getItem(localStateKey.value);

  if (!raw) {
    weeklyReview.value = createDefaultWeeklyReview();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    darkMode.value = !!parsed.darkMode;
    focusTasksByDay.value = parsed.focusTasksByDay && typeof parsed.focusTasksByDay === 'object'
      ? parsed.focusTasksByDay
      : {};
    rewardLedger.value = Array.isArray(parsed.rewardLedger) ? parsed.rewardLedger : [];
    weeklyReview.value = normalizeWeeklyReview(parsed.weeklyReview);
  } catch {
    weeklyReview.value = createDefaultWeeklyReview();
  }
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
  const start = Math.max(1, daysPassed.value - 6);
  const result = [];

  for (let day = start; day <= daysPassed.value; day += 1) {
    result.push(day);
  }

  return result;
});

const weeklySummary = computed(() => createSummary(weeklyDays.value));
const monthlySummary = computed(() => createSummary(days.value.filter((day) => day <= daysPassed.value)));

const weeklySnapshotLabel = computed(
  () => `${weeklySummary.value.points} pts • ${weeklySummary.value.completedDays}/${weeklySummary.value.totalDays} days • ${weeklySummary.value.stickiness.toFixed(1)}%`,
);

const monthlySnapshotLabel = computed(
  () => `${monthlySummary.value.points} pts • ${monthlySummary.value.completedDays}/${monthlySummary.value.totalDays} days • ${monthlySummary.value.stickiness.toFixed(1)}%`,
);

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
  if (availableWallet.value < reward.cost) {
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
    cost: reward.cost,
    date: new Date().toLocaleString(),
    timestamp: Date.now(),
  });

  persistLocalState();
};

const clearLocalProgress = () => {
  if (!window.confirm('Clear local dashboard data (focus tasks, reward ledger, and weekly review)? Habit check-ins are preserved.')) {
    return;
  }

  focusTasksByDay.value = {};
  rewardLedger.value = [];
  weeklyReview.value = createDefaultWeeklyReview();

  persistLocalState();
};

const csvEscape = (value) => {
  const normalized = value === null || value === undefined ? '' : String(value);

  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  return normalized;
};

const exportCsv = () => {
  const rows = [];

  rows.push('Habit Grid');
  rows.push(['Habit', 'Pts', ...days.value.map((day) => `Day ${day}`)].map(csvEscape).join(','));

  localHabits.value.forEach((habit) => {
    rows.push([
      habit.name,
      habit.points,
      ...days.value.map((day) => (habit.completedDays.includes(day) ? '✓' : '')),
    ].map(csvEscape).join(','));
  });

  rows.push(['Daily Total Points', '', ...days.value.map((day) => getDayTotal(day))].map(csvEscape).join(','));
  rows.push('');

  rows.push('Reward Ledger');
  rows.push(['Reward Item', 'Description', 'Date', 'Cost'].map(csvEscape).join(','));

  if (rewardLedger.value.length === 0) {
    rows.push(['No redemptions', '', '', ''].map(csvEscape).join(','));
  } else {
    rewardLedger.value.forEach((entry) => {
      rows.push([entry.item, entry.description, entry.date, entry.cost].map(csvEscape).join(','));
    });
  }

  rows.push('');
  rows.push('Daily Focus Tasks');
  rows.push(['Day', 'Tasks', 'Day Score'].map(csvEscape).join(','));

  const focusEntries = Object.entries(focusTasksByDay.value)
    .map(([key, items]) => ({
      day: Number(String(key).replace('day-', '')),
      tasks: Array.isArray(items)
        ? items
          .filter((task) => task?.text && String(task.text).trim() !== '')
          .map((task) => `${task.done ? '[x]' : '[ ]'} ${String(task.text).trim()}`)
        : [],
    }))
    .filter((entry) => Number.isFinite(entry.day) && entry.tasks.length > 0)
    .sort((a, b) => a.day - b.day);

  if (focusEntries.length === 0) {
    rows.push(['No focus tasks', '', ''].map(csvEscape).join(','));
  } else {
    focusEntries.forEach((entry) => {
      rows.push([`Day ${entry.day}`, entry.tasks.join(' | '), getDayTotal(entry.day)].map(csvEscape).join(','));
    });
  }

  rows.push('');
  rows.push('Weekly Review');
  rows.push(['Review Date', 'Weekly Points', 'Weekly Stickiness %', 'Monthly Points', 'Monthly Stickiness %'].map(csvEscape).join(','));
  rows.push([
    weeklyReview.value.reviewDate,
    weeklyReview.value.metrics.weeklyPoints,
    weeklyReview.value.metrics.weeklyStickiness,
    weeklyReview.value.metrics.monthlyPoints,
    weeklyReview.value.metrics.monthlyStickiness,
  ].map(csvEscape).join(','));

  rows.push('');
  rows.push('Weekly Checks');
  rows.push(['Done', 'Checkpoint'].map(csvEscape).join(','));

  weeklyReview.value.checks.forEach((check) => {
    rows.push([check.done ? 'Yes' : 'No', check.text].map(csvEscape).join(','));
  });

  rows.push('');
  rows.push('Reflections');
  rows.push(['Prompt', 'Response'].map(csvEscape).join(','));

  [
    ['Biggest Wins Worth Repeating', weeklyReview.value.reflections.wins],
    ['Missed Days & Friction Pattern', weeklyReview.value.reflections.misses],
    ['Trigger + If-Then Plan', weeklyReview.value.reflections.triggerPlan],
    ['Reward Motivation Check', weeklyReview.value.reflections.rewardTune],
    ['Scale-Down Rule for Hard Days', weeklyReview.value.reflections.habitScale],
    ['Health Check (Sleep/Reflux/Stress)', weeklyReview.value.reflections.healthCheck],
    ['Next Week Focus Commitments', weeklyReview.value.reflections.nextWeekFocus],
  ].forEach(([prompt, response]) => {
    rows.push([prompt, response].map(csvEscape).join(','));
  });

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `habuilt_export_${props.today || 'data'}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const hasCompletedDay = (habit, day) => habit.completedDays.includes(day);
const keyFor = (habitId, day) => `${habitId}:${day}`;

const completeHabitForDay = (habit, day) => {
  if (hasCompletedDay(habit, day)) {
    return;
  }

  const pendingKey = keyFor(habit.id, day);

  if (pendingCells.value[pendingKey]) {
    return;
  }

  habit.completedDays.push(day);
  habit.completedDays = [...new Set(habit.completedDays)].sort((a, b) => a - b);
  habit.completedToday = habit.completedDays.includes(props.currentDay);

  pendingCells.value[pendingKey] = true;

  router.post(
    `/habits/${habit.id}/check-ins`,
    {
      habit_id: habit.id,
      day,
      month: props.month,
      year: props.year,
      source: 'habit-grid',
      user_id: props.userId,
    },
    {
      preserveScroll: true,
      preserveState: true,
      onError: () => {
        habit.completedDays = habit.completedDays.filter((value) => value !== day);
        habit.completedToday = habit.completedDays.includes(props.currentDay);
      },
      onFinish: () => {
        delete pendingCells.value[pendingKey];
        pendingCells.value = { ...pendingCells.value };
      },
    },
  );
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
    <section class="dashboard-wrap dashboard-wrap--wide">
      <section class="card card--hero" id="overview">
        <header class="hero-head">
          <div>
            <p class="eyebrow">Habuilt Tracker</p>
            <h1>{{ appName }}</h1>
            <p class="meta">{{ year }}-{{ String(month).padStart(2, '0') }} • Today: {{ today }}</p>
            <p class="hero-sub">Discipline equals freedom — close your day with clear proof.</p>
          </div>

          <div class="hero-actions">
            <button class="btn btn--secondary" @click="exportCsv">Export Data</button>
            <button class="btn" @click="darkMode = !darkMode">{{ darkMode ? '☀ Light Mode' : '🌙 Stealth Mode' }}</button>
          </div>
        </header>

        <div class="focus-card">
          <div class="focus-head">
            <strong>Today's Focus</strong>
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

        <div class="kpis">
          <article class="kpi">
            <p>Earned Today</p>
            <strong>{{ todayPoints }} pts</strong>
          </article>
          <article class="kpi">
            <p>Completed Today</p>
            <strong>{{ completedCountToday }} / {{ totalHabits }}</strong>
          </article>
          <article class="kpi kpi--wallet">
            <p>Total Point Balance</p>
            <strong>{{ availableWallet }} pts</strong>
          </article>
        </div>

        <p v-if="flashSuccess" class="banner banner--success">{{ flashSuccess }}</p>
        <p v-if="flashError" class="banner banner--error">{{ flashError }}</p>
      </section>

      <section class="card" id="analytics">
        <div class="section-head">
          <h2>Monthly Performance</h2>
          <small>Target: {{ Math.max(1, Math.ceil(maxDailyPoints * 0.6)) }}+ points/day</small>
        </div>

        <div class="chart-wrap">
          <svg class="chart" :viewBox="`0 0 ${chartWidth} ${chartHeight}`" preserveAspectRatio="none">
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
          </svg>
        </div>

        <div class="progress-block">
          <div class="progress-head">
            <p>Vacation Milestone (500 pts)</p>
            <strong>{{ vacationProgress.toFixed(1) }}%</strong>
          </div>
          <div class="progress-track">
            <div class="progress-fill" :style="`width: ${vacationProgress}%`" />
          </div>
          <p class="progress-note">
            {{ pointsToVacation > 0 ? `${pointsToVacation} points left to hit Vacation` : 'Vacation unlocked. Time to redeem!' }}
          </p>
        </div>

        <div class="stats-grid">
          <article class="stat-card">
            <p>Monthly Personal Best</p>
            <strong>{{ personalBest.day ? `Day ${personalBest.day} • ${personalBest.points} pts` : 'No data yet' }}</strong>
          </article>
          <article class="stat-card">
            <p>Daily Average</p>
            <strong>{{ dailyAverage.toFixed(1) }} pts/day</strong>
          </article>
          <article class="stat-card">
            <p>Completion Rate</p>
            <strong>{{ completionRate.toFixed(1) }}%</strong>
          </article>
        </div>
      </section>

      <section class="card" id="habits">
        <div class="section-head">
          <h2>Habit Checklist</h2>
          <small>Day-based completion matrix</small>
        </div>

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
                  :class="day === currentDay ? 'habit-grid__day--current' : ''"
                >
                  {{ day }}
                </th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="habit in localHabits" :key="habit.id" class="habit-grid__row">
                <td class="habit-grid__sticky habit-grid__name">{{ habit.name }}</td>
                <td class="habit-grid__pts">{{ habit.points }}</td>

                <td v-for="day in days" :key="`${habit.id}-${day}`" class="habit-grid__cell">
                  <button
                    class="habit-grid__check"
                    :class="hasCompletedDay(habit, day) ? 'habit-grid__check--done' : ''"
                    :disabled="hasCompletedDay(habit, day) || !!pendingCells[keyFor(habit.id, day)]"
                    @click="completeHabitForDay(habit, day)"
                  >
                    <span v-if="pendingCells[keyFor(habit.id, day)]">…</span>
                    <span v-else-if="hasCompletedDay(habit, day)">✓</span>
                    <span v-else>•</span>
                  </button>
                </td>
              </tr>

              <tr class="habit-grid__totals">
                <td class="habit-grid__sticky">Daily Total Points</td>
                <td class="habit-grid__pts">—</td>
                <td v-for="day in days" :key="`tot-${day}`">{{ getDayTotal(day) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p v-if="legacyReferenceAvailable" class="legacy-hint">
          Legacy single-file tracker detected in root index.html; this dashboard now mirrors that experience in Vue + Inertia.
        </p>
      </section>

      <section class="dashboard-columns" id="rewards">
        <article class="card column-card">
          <h2>💰 Reward Shop</h2>

          <div class="rewards-grid">
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
          <h2>📜 Point Ledger</h2>

          <div class="ledger-wrap">
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
                  <td colspan="4" class="ledger-table__empty">No redemptions yet. Build your bank first.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="ledger-actions">
            <button class="btn btn--ghost" @click="clearLocalProgress">Clear Local Progress</button>
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
              </label>
              <label>
                Monthly Points
                <input v-model="weeklyReview.metrics.monthlyPoints" type="text" placeholder="e.g. 298" @change="saveWeeklyReview">
              </label>
              <label>
                Monthly Stickiness %
                <input v-model="weeklyReview.metrics.monthlyStickiness" type="text" placeholder="e.g. 64.5" @change="saveWeeklyReview">
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
