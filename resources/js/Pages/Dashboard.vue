<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { router, usePage } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { loadUserMonthlyState, saveUserMonthlyState, loadAllUserMonthlyStates } from '@/lib/supabase';

// Subcomponents
import TopCommandBar from '@/Components/Navigation/TopCommandBar.vue';
import MobileCompactBar from '@/Components/Navigation/MobileCompactBar.vue';
import MobileBottomNav from '@/Components/Navigation/MobileBottomNav.vue';
import TodayChecklist from '@/Components/Checklist/TodayChecklist.vue';
import DeepWorkStation from '@/Components/Focus/DeepWorkStation.vue';
import MonthGrid from '@/Components/Grid/MonthGrid.vue';
import PerformanceAnalytics from '@/Components/Analytics/PerformanceAnalytics.vue';
import RewardShop from '@/Components/Rewards/RewardShop.vue';
import SundayReview from '@/Components/Review/SundayReview.vue';
import MorningSetupModal from '@/Components/Modals/MorningSetupModal.vue';
import HabitEditorModal from '@/Components/Modals/HabitEditorModal.vue';

// Composables & Data
import { useDeepWorkTimer } from '@/Composables/useDeepWorkTimer';
import {
  ashishHabits,
  jyotiHabits,
  ashishTravelHabits,
  genericStarterHabits,
  ashishTierDescriptions,
  jyotiTierDescriptions,
  ashishTravelTierDescriptions,
  timeSlotDefinitions,
  timeSlotOrder,
  getTimeSlotForHabit,
  getHabitCategory,
  getCurrentTimeBlock,
} from '@/Composables/useHabitsState';

import {
  BarChart3,
  Gift,
  FileText,
  Compass,
  Edit3,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Check,
  ArrowUp,
  ArrowDown,
  Flame,
  Award,
  TrendingUp,
  Target,
  Sparkles,
  Zap,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  Layers,
  Star,
  RefreshCw,
  Sliders,
  DollarSign,
  AlertCircle,
  X,
  Heart,
  Briefcase,
  Trophy,
  CheckSquare,
  Settings,
  ChevronUp,
  ChevronDown,
  Shield,
  Crown,
  Gauge,
  Play,
  Eye,
  EyeOff,
  Download,
  Upload,
  MessageSquare,
  Smile,
  Battery,
  Activity,
  Share2,
  Users,
  BookOpen,
  Hash,
  Sparkle,
  Bell,
  Plane,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Archive,
  RotateCcw,
  Timer,
  Coffee,
  Pause,
  History,
  Link2,
  Volume2,
  VolumeX,
} from 'lucide-vue-next';

const props = defineProps({
  appName: { type: String, default: 'Habuilt Tracker' },
  today: { type: String, default: '' },
  userId: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  wallet: { type: Number, default: 0 },
  month: { type: Number, default: 1 },
  year: { type: Number, default: 2000 },
  monthDays: { type: Number, default: 31 },
  currentDay: { type: Number, default: 1 },
  isCurrentMonth: { type: Boolean, default: true },
  isFutureMonth: { type: Boolean, default: false },
  canNavigatePrevMonth: { type: Boolean, default: false },
  canNavigateNextMonth: { type: Boolean, default: false },
  previousMonth: { type: Object, default: () => ({ month: 1, year: 2000 }) },
  nextMonth: { type: Object, default: () => ({ month: 1, year: 2000 }) },
  habits: { type: Array, default: () => [] },
  staticPreview: { type: Boolean, default: false },
});

const page = usePage();
const authUser = computed(() => page.props.auth?.user ?? null);
const resolvedEmail = computed(() => (props.userEmail || authUser.value?.email || '').toLowerCase().trim());
const isAshish = computed(() => resolvedEmail.value === 'ashishgupta1v@gmail.com');
const isJyoti = computed(() => resolvedEmail.value === 'goyaljyoti007@gmail.com');
const displayName = computed(() => isJyoti.value ? 'Jyoti' : isAshish.value ? 'Ashish' : (props.userId || 'User'));
const effectiveUserId = computed(() => props.userId || authUser.value?.id || resolvedEmail.value || 'guest');

// Reactive real-time clock ticker
const currentClock = ref(new Date());
const updateCurrentClock = () => {
  currentClock.value = new Date();
};

const travelMode = ref(false);
const localHabits = ref([]);
const pendingCells = ref({});

const fallbackHabits = computed(() => {
  if (isJyoti.value) return jyotiHabits;
  if (isAshish.value) {
    return travelMode.value ? ashishTravelHabits : ashishHabits;
  }
  return genericStarterHabits;
});

const mobileViewMode = ref('daily');
const mobileSelectedDay = ref(props.currentDay);
const focusDay = ref(props.currentDay);
const focusTasksByDay = ref({});
const newFocusTask = ref('');
const rewardLedger = ref([]);
const newWeeklyCheck = ref('');
const walletBalance = ref(0);
const isNavigatingMonth = ref(false);
const redeemedBeforeCurrentMonth = ref(0);
const earnedBeforeCurrentMonth = ref(0);

const defaultTierLabels = ['Floor (30%)', 'Target (60%)', 'Stretch (100%)', 'Mastery (120%)'];
const defaultPhases = [
  { id: 'assets', name: 'Phase 1: Foundation (W1-4)', goal: 'Build non-negotiable daily morning & sleep baseline', weeks: [1, 2, 3, 4] },
  { id: 'leverage', name: 'Phase 2: Deep Work Rhythm (W5-10)', goal: 'Anchor uninterrupted morning focus blocks', weeks: [5, 6, 7, 8, 9, 10] },
  { id: 'scale', name: 'Phase 3: High Leverage (W11-18)', goal: 'Scale pipeline, client impact & family connection', weeks: [11, 12, 13, 14, 15, 16, 17, 18] },
  { id: 'mastery', name: 'Phase 4: Mastery (W19-26)', goal: 'Sustained peak consistency across all 4 quadrants', weeks: [19, 20, 21, 22, 23, 24, 25, 26] },
];

const progressiveSettings = ref({
  startDate: '',
  currentPhaseId: 'assets',
  dayType: 'full',
  tierLabels: [...defaultTierLabels],
  phases: defaultPhases.map(p => ({ ...p, weeks: [...p.weeks] })),
  habitTiers: {},
  pointMultipliers: { full: 1.0, half: 0.6, floor: 0.3 },
});
const progressivePanelOpen = ref(false);
const tierDetailHabitId = ref(null);

const analyticsOpen = ref(false);
const focusModeOn = ref(false);
const habitNotesOpen = ref(null);
const partnerViewOpen = ref(false);
const partnerData = ref(null);
const partnerLoading = ref(false);

// ── MOBILE PWA SPA 4-TAB ROUTING ──
const activeMobileTab = ref('today'); // 'today' | 'focus' | 'stats' | 'rewards'

// ── SMART AUTO-ACCORDION SLOTS ──
const userToggledSlots = ref({});
const isSlotCollapsed = (slotKey, slotHabits, dayNum) => {
  if (userToggledSlots.value[slotKey] !== undefined) {
    return userToggledSlots.value[slotKey];
  }
  if (!slotHabits || slotHabits.length === 0) return false;
  const completedCount = slotHabits.filter(h => hasCompletedDay(h, dayNum)).length;
  const isFullyDone = completedCount === slotHabits.length;
  const currentBlock = getCurrentTimeBlock(currentClock.value);
  const slotOrder = timeSlotOrder[slotKey] ?? 99;
  const currentOrder = timeSlotOrder[currentBlock] ?? 99;
  if (isFullyDone && slotOrder < currentOrder) {
    return true;
  }
  return false;
};
const toggleSlotCollapse = (slotKey, slotHabits, dayNum) => {
  const current = isSlotCollapsed(slotKey, slotHabits, dayNum);
  userToggledSlots.value[slotKey] = !current;
};

// ── SWIPE GESTURE ENGINE (Day Switching) ──
let touchStartX = 0;
let touchStartY = 0;
const onTouchStart = (e) => {
  if (e.touches && e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }
};
const onTouchEnd = (e) => {
  if (e.changedTouches && e.changedTouches.length === 1) {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 45) {
      if (deltaX < 0) {
        if (mobileDay.value < props.monthDays && !mobileDayIsFuture.value) {
          mobileNextDay();
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12);
        }
      } else {
        if (mobileDay.value > 1) {
          mobilePrevDay();
          if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(12);
        }
      }
    }
  }
};

const enhancedState = ref({
  moodEnergy: {},
  habitNotes: {},
  achievements: {},
  notificationsEnabled: false,
  quoteSeenDate: '',
  morningSetupDate: '',
  dailyFocus: {},
  deepWorkTimer: null,
  archivedHabitIds: [],
});

// Deep Work Timer Composable Integration
const {
  timerState,
  timerLauncherDuration,
  customTimerMin,
  timerLauncherHabitId,
  timerSoundEnabled,
  timerProgressPct,
  timerElapsedFormatted,
  timerRemainingFormatted,
  timerLinkedHabit,
  timerHabitOptions,
  startDeepWorkTimer,
  pauseDeepWorkTimer,
  resumeDeepWorkTimer,
  stopDeepWorkTimer,
  startBreakTimer,
  onCustomTimerInput,
} = useDeepWorkTimer({
  allHabits: () => (localHabits.value || []).filter(h => !enhancedState.value.archivedHabitIds?.includes(h.id) && !h.archived),
  onHabitAutoComplete: (habitId) => {
    const targetHabit = (localHabits.value || []).find(h => String(h.id) === String(habitId));
    if (targetHabit && !hasCompletedDay(targetHabit, props.currentDay)) {
      toggleHabitForDay(targetHabit, props.currentDay);
    }
  },
});

// Habit Editor State
const habitsEditing = ref(false);
const habitsDraft = ref([]);
const habitSaveStatus = ref('idle');
const hasCustomHabits = ref(false);
const habitSwipeStart = ref({});

const rewardsEditing = ref(false);
const rewardsDraft = ref([]);
const rewardSaveStatus = ref('idle');

const defaultRewards = [
  { type: 'Daily', item: '1 Hour+ social media', cost: 8 },
  { type: 'Weekly', item: 'New gadget/supplement under 500', cost: 12 },
  { type: 'Weekly', item: 'Cheat Meal', cost: 15 },
  { type: 'Weekly', item: 'Social Meetup/Night Out/Movie', cost: 20 },
  { type: 'Month', item: 'New Tech/Clothing', cost: 30 },
  { type: 'Month', item: 'Purchase 1 Useful Subscription/Plan', cost: 40 },
  { type: 'Quarter', item: 'Major Purchase', cost: 100 },
  { type: 'Half-Yr', item: 'Vacation', cost: 500 },
  { type: 'Yearly', item: 'International Vacation', cost: 2000 },
];
const rewards = ref(defaultRewards.map(r => ({ ...r })));

const createDefaultWeeklyReview = () => ({
  reviewDate: '',
  metrics: { weeklyPoints: '', weeklyStickiness: '', monthlyPoints: '', monthlyStickiness: '' },
  checks: [
    { text: 'I reviewed missed days and found one clear trigger.', done: false },
    { text: 'I declared tier (Full/Half/Floor) at breakfast every day.', done: false },
    { text: 'Shaarvi blocks never shrank — they happened first.', done: false },
    { text: '18:30 hard stop held — phones out of room.', done: false },
    { text: 'Sleep stayed above 7h floor (or next day was Floor tier).', done: false },
    { text: 'I graduated max one habit this week (1% rule).', done: false },
  ],
  reflections: { wins: '', misses: '', triggerPlan: '', rewardTune: '', habitScale: '', healthCheck: '', nextWeekFocus: '' },
});
const weeklyReview = ref(createDefaultWeeklyReview());

const calculatePastWeekPoints = () => {
  const currentD = props.isCurrentMonth ? props.currentDay : props.monthDays;
  const startD = Math.max(1, currentD - 6);
  let pts = 0;
  for (let d = startD; d <= currentD; d++) {
    pts += getDayTotal(d);
  }
  return pts;
};

const calculatePastWeekStickiness = () => {
  const currentD = props.isCurrentMonth ? props.currentDay : props.monthDays;
  const startD = Math.max(1, currentD - 6);
  const totalDays = (currentD - startD) + 1;
  if (totalDays === 0) return '0%';
  let metDays = 0;
  for (let d = startD; d <= currentD; d++) {
    if (getDayTotal(d) >= 4) metDays++;
  }
  return `${Math.round((metDays / totalDays) * 100)}%`;
};

const fillSundayMetrics = () => {
  const weeklyPoints = calculatePastWeekPoints();
  const weeklyStickiness = calculatePastWeekStickiness();
  const monthlyPoints = monthlyTotalEarned.value;
  const monthlyStickiness = `${consistencyScore.value}%`;
  weeklyReview.value.metrics = {
    weeklyPoints,
    weeklyStickiness,
    monthlyPoints,
    monthlyStickiness,
  };
  weeklyReview.value.reviewDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  saveState();
};

// Theme Management (Dark / Light Mode)
const darkMode = ref(
  typeof window !== 'undefined'
    ? (localStorage.getItem('habuilt_theme') ? localStorage.getItem('habuilt_theme') === 'dark' : true)
    : true
);

const applyTheme = (isDark) => {
  if (typeof document === 'undefined') return;
  if (isDark) {
    document.documentElement.classList.add('dark-mode', 'theme-dark');
    document.body.classList.add('dark-mode', 'theme-dark');
  } else {
    document.documentElement.classList.remove('dark-mode', 'theme-dark');
    document.body.classList.remove('dark-mode', 'theme-dark');
  }
};

const toggleTheme = () => {
  darkMode.value = !darkMode.value;
};

watch(darkMode, (newVal) => {
  applyTheme(newVal);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('habuilt_theme', newVal ? 'dark' : 'light');
  }
}, { immediate: true });

onMounted(() => {
  applyTheme(darkMode.value);
});

const weeklyReviewExpanded = ref(false);
const toastMessage = ref('');
let toastTimeoutId = null;

const showToast = (message, duration = 2800) => {
  toastMessage.value = message;
  if (toastTimeoutId) clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    toastMessage.value = '';
  }, duration);
};

const shareDailyScorecard = async () => {
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const tierName = autoProtocolTier.value?.title || 'Daily Protocol';
  const text = `⚡ Habuilt Daily Protocol — ${dateStr}\n👤 ${displayName.value} (${levelTitle.value} Lv. ${levelData.value?.level || 1})\n🔥 Streak: ${systemStreak.value?.current || 0} Days | 🏆 Wallet: ${availableWallet.value} pts\n🎯 Protocol: ${tierName} (${todayPoints.value}/15 pts)\n✅ ${todayCompletedCount.value}/${todayScheduledCount.value} Habits Done\n#Habuilt #HabitMastery\nhttps://www.habuilt.com`;

  // 1. Native Web Share API (Mobile Safari, Chrome Android)
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'My Habuilt Daily Scorecard',
        text: text,
      });
      showToast('🎉 Scorecard shared!');
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') {
        return; // User cancelled share sheet
      }
    }
  }

  // 2. Clipboard API Fallback
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      showToast('📋 Scorecard copied to clipboard!');
      return;
    } catch (e) {
      console.warn('Clipboard write failed, using fallback:', e);
    }
  }

  // 3. Document execCommand fallback
  try {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'fixed';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showToast('📋 Scorecard copied to clipboard!');
  } catch (err) {
    showToast('⚡ Daily scorecard ready!');
  }
};

const handleAppReload = async () => {
  try {
    isSyncingCloud.value = true;
    showToast('🔄 Syncing & Refreshing...');

    // 1. Re-read local storage
    loadState();

    // 2. Pull remote cloud state if user is logged in
    if (effectiveUserId.value && effectiveUserId.value !== 'guest') {
      const remoteData = await loadUserMonthlyState(effectiveUserId.value, monthScope.value);
      if (remoteData) {
        applyLoadedState(remoteData, true);
        lastSyncTimestamp = Date.now();
      }
    }

    showToast('✅ App Synced & Refreshed!');
  } catch (err) {
    console.warn('Reload sync error:', err);
    showToast('⚡ Refreshed');
  } finally {
    isSyncingCloud.value = false;
  }
};

const monthScope = computed(() => `${props.year}-${String(props.month).padStart(2, '0')}`);
const localStateKey = computed(() => `habuilt.dashboard.${effectiveUserId.value}.${monthScope.value}`);
const localStatePrefix = computed(() => `habuilt.dashboard.${effectiveUserId.value}.`);
const monthLabel = computed(() => new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(props.year, props.month - 1, 1)));
const days = computed(() => Array.from({ length: props.monthDays }, (_, index) => index + 1));
const targetDailyPoints = computed(() => 15);

const isHabitArchived = (habit) => enhancedState.value.archivedHabitIds?.includes(habit.id) || !!habit.archived;
const visibleHabits = computed(() => (localHabits.value || []).filter(h => !isHabitArchived(h)));
const totalHabits = computed(() => visibleHabits.value.length); // MASTER count — every habit the user has, used for the "Master Checklist" toggle only
const totalPossiblePoints = computed(() => visibleHabits.value.reduce((total, habit) => total + (habit.points * props.monthDays), 0));

// Schedule Filtering Engine
const getDayOfWeek = (dayNum) => {
  return new Date(props.year, props.month - 1, dayNum).getDay();
};

const isHabitScheduledForDay = (habit, dayNum) => {
  if (!habit) return true;
  if (Array.isArray(habit.daysOfWeek) && habit.daysOfWeek.length > 0) {
    const dow = getDayOfWeek(dayNum);
    return habit.daysOfWeek.includes(dow);
  }
  return true;
};

// Habits actually scheduled for TODAY (props.currentDay) — independent of the mobile checklist's
// navigated day and independent of the all/scheduled view toggle. This is what "today's" stat
// badges (top bar, bottom nav, share card) should always divide by, not the full master list.
const todayScheduledHabits = computed(() => visibleHabits.value.filter(h => isHabitScheduledForDay(h, props.currentDay)));
const todayScheduledCount = computed(() => todayScheduledHabits.value.length);

const scheduleFilterMode = ref('scheduled'); // 'scheduled' (active for this day) | 'all' (all 52 master habits)

// Mobile Day
const mobileDay = computed(() => Math.min(Math.max(1, mobileSelectedDay.value), props.monthDays));
const mobileDayIsToday = computed(() => props.isCurrentMonth && mobileDay.value === props.currentDay);
const mobileDayIsFuture = computed(() => props.isFutureMonth || (props.isCurrentMonth && mobileDay.value > props.currentDay));
const mobileDayLabel = computed(() => {
  try {
    const d = new Date(props.year, props.month - 1, mobileDay.value);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return `Day ${mobileDay.value}`;
  }
});

const scheduledHabitsForMobileDay = computed(() => {
  return visibleHabits.value.filter(h => isHabitScheduledForDay(h, mobileDay.value));
});

const scheduledHabitsCount = computed(() => scheduledHabitsForMobileDay.value.length);

const activeHabitsForMobileDay = computed(() => {
  if (scheduleFilterMode.value === 'all') {
    return visibleHabits.value;
  }
  return scheduledHabitsForMobileDay.value;
});

const activeTimeFilter = ref('all');
const filteredHabits = computed(() => {
  const source = activeHabitsForMobileDay.value;
  if (activeTimeFilter.value === 'all') return source;
  return source.filter(h => getTimeSlotForHabit(h.id) === activeTimeFilter.value);
});

const timeSlotCounts = computed(() => {
  const source = activeHabitsForMobileDay.value;
  const counts = { all: source.length, morning: 0, work: 0, evening: 0, anytime: 0, weekly: 0 };
  source.forEach(h => {
    const slot = getTimeSlotForHabit(h.id);
    if (counts[slot] !== undefined) counts[slot]++;
  });
  return counts;
});

const timeSlotCompleted = computed(() => {
  const day = mobileDay.value;
  const source = activeHabitsForMobileDay.value;
  const comp = { all: 0, morning: 0, work: 0, evening: 0, anytime: 0, weekly: 0 };
  source.forEach(h => {
    if (hasCompletedDay(h, day)) {
      comp.all++;
      const slot = getTimeSlotForHabit(h.id);
      if (comp[slot] !== undefined) comp[slot]++;
    }
  });
  return comp;
});

const timelineGroupedHabits = computed(() => {
  const source = filteredHabits.value;
  const groups = [
    { slot: 'morning', meta: timeSlotDefinitions.morning, habits: [] },
    { slot: 'work',    meta: timeSlotDefinitions.work,    habits: [] },
    { slot: 'evening', meta: timeSlotDefinitions.evening, habits: [] },
    { slot: 'anytime', meta: timeSlotDefinitions.anytime, habits: [] },
    { slot: 'weekly',  meta: timeSlotDefinitions.weekly,  habits: [] },
  ];
  const groupMap = Object.fromEntries(groups.map(g => [g.slot, g.habits]));
  source.forEach(h => {
    const slot = getTimeSlotForHabit(h.id);
    if (groupMap[slot]) groupMap[slot].push(h);
    else groupMap.anytime.push(h);
  });
  return groups.filter(g => g.habits.length > 0);
});

const missingDefaultHabits = computed(() => {
  const currentIds = new Set((localHabits.value || []).map(h => h.id));
  return fallbackHabits.value.filter(dh => !currentIds.has(dh.id));
});

const mobileDayCompleted = computed(() => activeHabitsForMobileDay.value.filter(h => hasCompletedDay(h, mobileDay.value)).length);
const mobileDayPoints = computed(() => activeHabitsForMobileDay.value.filter(h => hasCompletedDay(h, mobileDay.value)).reduce((s, h) => s + h.points, 0));
// Denominators for the checklist's own progress bar — scoped to whatever day is being viewed
// (mobileDay) and respecting the scheduled/all toggle, so a Sunday never gets judged against
// a weekday's habit count.
const mobileDayTotalHabits = computed(() => activeHabitsForMobileDay.value.length);
const maxDailyPoints = computed(() => activeHabitsForMobileDay.value.reduce((sum, h) => sum + h.points, 0));

const mobilePrevDay = () => { if (mobileDay.value > 1) mobileSelectedDay.value = mobileDay.value - 1; };
const mobileNextDay = () => { if (mobileDay.value < props.monthDays) mobileSelectedDay.value = mobileDay.value + 1; };
const mobileGoToday = () => { mobileSelectedDay.value = props.currentDay; };

// Up Next Engine
const habitTimeSchedule = {
  // ── Ashish home mode ──
  'a-1': { start: '05:00', end: '05:05' }, 'a-2': { start: '05:05', end: '05:15' },
  'a-3': { start: '05:15', end: '05:30' }, 'a-4': { start: '05:30', end: '06:15' },
  'a-5': { start: '05:30', end: '06:15' }, 'a-6': { start: '05:30', end: '06:15' },
  'a-7': { start: '06:15', end: '06:20' }, 'a-8': { start: '06:20', end: '06:30' },
  'a-9': { start: '06:30', end: '07:00' }, 'a-10': { start: '07:00', end: '08:30' },
  'a-11': { start: '08:30', end: '08:45' }, 'a-12': { start: '08:45', end: '10:15' },
  'a-13': { start: '10:15', end: '10:30' }, 'a-14': { start: '10:30', end: '12:00' },
  'a-15': { start: '12:00', end: '12:15' }, 'a-16': { start: '14:00', end: '15:30' },
  'a-17': { start: '15:30', end: '15:45' }, 'a-18': { start: '16:00', end: '17:30' },
  'a-53': { start: '17:30', end: '18:15' },
  'a-19': { start: '18:30', end: '18:35' }, 'a-20': { start: '18:35', end: '19:05' },
  'a-43': { start: '19:05', end: '19:25' }, 'a-21': { start: '19:25', end: '20:15' },
  'a-22': { start: '20:15', end: '20:30' }, 'a-23': { start: '20:45', end: '21:00' },
  'a-24': { start: '21:00', end: '21:05' }, 'a-25': { start: '21:05', end: '21:30' },
  'a-26': { start: '21:30', end: '22:00' }, 'a-27': { start: '22:00', end: '23:59' },
  'a-28': { start: '08:00', end: '09:00' }, 'a-29': { start: '12:30', end: '13:30' },
  'a-30': { start: '19:30', end: '20:30' }, 'a-31': { start: '08:15', end: '09:15' },
  'a-51': { start: '12:45', end: '13:45' }, 'a-52': { start: '21:00', end: '22:00' },

  // ── Jyoti ──
  'j-1': { start: '05:00', end: '08:00' }, 'j-2': { start: '08:00', end: '08:15' },
  'j-3': { start: '08:15', end: '08:30' }, 'j-4': { start: '08:30', end: '09:30' },
  'j-5': { start: '09:30', end: '10:30' }, 'j-6': { start: '10:30', end: '10:50' },
  'j-7': { start: '10:50', end: '11:00' }, 'j-8': { start: '11:00', end: '11:05' },
  'j-35': { start: '11:05', end: '11:25' }, 'j-9': { start: '11:30', end: '12:30' },
  'j-10': { start: '12:30', end: '13:15' }, 'j-11': { start: '13:15', end: '13:30' },
  'j-12': { start: '13:30', end: '13:45' }, 'j-13': { start: '13:45', end: '14:30' },
  'j-14': { start: '14:30', end: '15:15' }, 'j-15': { start: '16:00', end: '17:00' },
  'j-16': { start: '17:00', end: '17:20' }, 'j-17': { start: '17:30', end: '18:35' },
  'j-18': { start: '18:35', end: '19:25' }, 'j-19': { start: '19:25', end: '20:15' },
  'j-20': { start: '20:15', end: '20:30' }, 'j-21': { start: '20:45', end: '21:30' },
  'j-22': { start: '21:30', end: '23:59' },

  // ── Ashish travel mode (Chandigarh) ──
  'at-1': { start: '05:00', end: '05:05' }, 'at-2': { start: '05:05', end: '05:15' },
  'at-3': { start: '05:15', end: '05:40' }, 'at-4': { start: '05:40', end: '06:00' },
  'at-5': { start: '06:00', end: '06:15' }, 'at-6': { start: '06:15', end: '06:30' },
  'at-7': { start: '06:30', end: '07:30' }, 'at-8': { start: '07:30', end: '09:30' },
  'at-9': { start: '09:30', end: '09:45' }, 'at-10': { start: '09:45', end: '11:15' },
  'at-11': { start: '11:15', end: '11:30' }, 'at-12': { start: '11:30', end: '13:00' },
  'at-13': { start: '13:00', end: '14:30' }, 'at-14': { start: '14:30', end: '16:00' },
  'at-15': { start: '16:00', end: '16:30' }, 'at-16': { start: '16:30', end: '17:00' },
  'at-17': { start: '17:00', end: '18:00' }, 'at-18': { start: '18:00', end: '18:35' },
  'at-19': { start: '18:35', end: '19:25' }, 'at-20': { start: '19:25', end: '20:15' },
  'at-21': { start: '20:15', end: '21:00' }, 'at-22': { start: '21:00', end: '21:30' },
  'at-23': { start: '21:30', end: '23:59' },
  'at-24': { start: '05:00', end: '06:30' }, 'at-25': { start: '12:00', end: '13:00' },
  'at-26': { start: '19:25', end: '20:15' }, 'at-27': { start: '05:00', end: '06:30' },
  'at-32': { start: '12:00', end: '13:00' }, 'at-33': { start: '21:00', end: '21:30' },
};

const upNextHabitInfo = computed(() => {
  if (!props.isCurrentMonth) return null;
  const now = currentClock.value;
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const uncompleted = visibleHabits.value.filter(h => isHabitScheduledForDay(h, props.currentDay) && !hasCompletedDay(h, props.currentDay));
  if (uncompleted.length === 0) return null;

  for (const habit of uncompleted) {
    const sched = habitTimeSchedule[habit.id];
    if (sched) {
      const [sh, sm] = sched.start.split(':').map(Number);
      const [eh, em] = sched.end.split(':').map(Number);
      const startMins = sh * 60 + sm;
      const endMins = eh * 60 + em;
      if (currentMins >= startMins && currentMins <= endMins) {
        return { habit, status: 'due', badgeText: `DUE NOW (${sched.start})`, shortBadge: 'DUE NOW', timeLabel: `${sched.start}–${sched.end}` };
      }
    }
  }
  for (const habit of uncompleted) {
    const sched = habitTimeSchedule[habit.id];
    if (sched) {
      const [sh, sm] = sched.start.split(':').map(Number);
      const startMins = sh * 60 + sm;
      if (startMins > currentMins) {
        return { habit, status: 'upcoming', badgeText: `UP NEXT: ${sched.start}`, shortBadge: sched.start, timeLabel: `${sched.start}–${sched.end}` };
      }
    }
  }
  const first = uncompleted[0];
  return { habit: first, status: 'next', badgeText: 'UP NEXT', shortBadge: 'UP NEXT', timeLabel: 'Next pending' };
});

const isHabitUpNext = (habit) => upNextHabitInfo.value && upNextHabitInfo.value.habit.id === habit.id;

// Tier Helpers
const getHabitTier = (habitId) => progressiveSettings.value.habitTiers?.[habitId] ?? 1;
const getTierDescriptions = (habitId) => {
  if (isJyoti.value && jyotiTierDescriptions[habitId]) return jyotiTierDescriptions[habitId];
  if (isAshish.value) {
    if (travelMode.value && ashishTravelTierDescriptions[habitId]) return ashishTravelTierDescriptions[habitId];
    if (ashishTierDescriptions[habitId]) return ashishTierDescriptions[habitId];
  }
  return defaultTierLabels;
};
const tierColorClass = (tier) => ['tier-pill--t1', 'tier-pill--t2', 'tier-pill--t3', 'tier-pill--t4'][tier - 1] || 'tier-pill--t1';
const setHabitTier = (habitId, tier) => {
  if (!progressiveSettings.value.habitTiers) progressiveSettings.value.habitTiers = {};
  progressiveSettings.value.habitTiers[habitId] = tier;
  tierDetailHabitId.value = null;
  saveState();
};
const toggleTierDetail = (habitId) => {
  tierDetailHabitId.value = tierDetailHabitId.value === habitId ? null : habitId;
};

// Quick Note Helpers
const getHabitNote = (habitId, day) => enhancedState.value.habitNotes?.[`${habitId}:${day}`] || '';
const setHabitNote = (habitId, day, note) => {
  if (!enhancedState.value.habitNotes) enhancedState.value.habitNotes = {};
  enhancedState.value.habitNotes[`${habitId}:${day}`] = note;
  saveState();
};
const toggleHabitNote = (habitId, day) => {
  const key = `${habitId}:${day}`;
  habitNotesOpen.value = habitNotesOpen.value === key ? null : key;
};

// Points & Check-in Logic
const keyFor = (habitId, day) => `${habitId}-${day}`;
const hasCompletedDay = (habit, day) => {
  const cellKey = keyFor(habit.id, day);
  if (pendingCells.value[cellKey] !== undefined) return pendingCells.value[cellKey];
  return Array.isArray(habit.completed_days) && habit.completed_days.includes(day);
};
const isPending = (habitId, day) => !!pendingCells.value[keyFor(habitId, day)];
const isFutureDay = (day) => props.isFutureMonth || (props.isCurrentMonth && day > props.currentDay);
const isWeekendDay = (day) => {
  try {
    const d = new Date(props.year, props.month - 1, day);
    return d.getDay() === 0 || d.getDay() === 6;
  } catch {
    return false;
  }
};
const cellTooltip = (habit, day) => {
  const state = hasCompletedDay(habit, day) ? 'Completed' : 'Pending';
  return `${habit.name} - Day ${day}: ${state}`;
};
const cellAriaLabel = (habit, day) => {
  const status = hasCompletedDay(habit, day) ? 'completed' : 'incomplete';
  return `${habit.name}, day ${day}, ${status}`;
};

const getDayTotal = (day) => visibleHabits.value.reduce((sum, h) => hasCompletedDay(h, day) ? sum + h.points : sum, 0);

const todayPoints = computed(() => getDayTotal(props.currentDay));
const todayCompletedCount = computed(() => todayScheduledHabits.value.filter(h => hasCompletedDay(h, props.currentDay)).length);

const monthlyTotalEarned = computed(() => {
  let total = 0;
  for (let d = 1; d <= props.monthDays; d++) {
    total += getDayTotal(d);
  }
  return total;
});

const availableWallet = computed(() => {
  const totalEarned = earnedBeforeCurrentMonth.value + monthlyTotalEarned.value;
  const currentMonthRedeemed = (rewardLedger.value || []).reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
  const totalRedeemed = redeemedBeforeCurrentMonth.value + currentMonthRedeemed;
  return Math.max(0, totalEarned - totalRedeemed);
});

// Streaks & Grade
const systemStreak = computed(() => {
  let current = 0;
  let best = 0;
  let temp = 0;
  const maxDay = props.isCurrentMonth ? props.currentDay : props.monthDays;
  for (let d = 1; d <= maxDay; d++) {
    const pts = getDayTotal(d);
    if (pts > 0) {
      temp++;
      if (temp > best) best = temp;
    } else {
      temp = 0;
    }
  }
  for (let d = maxDay; d >= 1; d--) {
    if (getDayTotal(d) > 0) current++;
    else break;
  }
  return { current, best: Math.max(best, current) };
});

const consistencyScore = computed(() => {
  const daysEvaluated = props.isCurrentMonth ? props.currentDay : props.monthDays;
  if (daysEvaluated === 0) return 0;
  let totalScore = 0;
  for (let d = 1; d <= daysEvaluated; d++) {
    const pts = getDayTotal(d);
    if (pts >= 15) totalScore += 100;      // Full Protocol
    else if (pts >= 8) totalScore += 75;   // Half Protocol
    else if (pts >= 4) totalScore += 50;   // Floor Protocol (protected)
    else if (pts > 0) totalScore += 25;
  }
  return Math.min(100, Math.round(totalScore / daysEvaluated));
});

const consistencyGrade = computed(() => {
  const score = consistencyScore.value;
  if (score >= 90) return { grade: 'A+', letter: 'A+', class: 'grade--a-plus', text: 'Unstoppable Momentum' };
  if (score >= 80) return { grade: 'A', letter: 'A', class: 'grade--a', text: 'Elite Consistency' };
  if (score >= 70) return { grade: 'B', letter: 'B', class: 'grade--b', text: 'Solid Progress' };
  if (score >= 55) return { grade: 'C', letter: 'C', class: 'grade--c', text: 'Building Foundation' };
  return { grade: 'D', letter: 'D', class: 'grade--d', text: 'Needs Attention' };
});

const performanceGrade = computed(() => consistencyGrade.value);

// XP & Level
const totalXP = computed(() => monthlyTotalEarned.value * 10);
const levelData = computed(() => {
  const xp = totalXP.value;
  const level = Math.floor(xp / 500) + 1;
  const xpInLevel = xp % 500;
  const xpForNext = 500;
  const levelPct = Math.round((xpInLevel / xpForNext) * 100);
  return { level, xpInLevel, xpForNext, levelPct };
});
const levelTitle = computed(() => {
  const lv = levelData.value.level;
  if (lv >= 10) return 'Ascendant';
  if (lv >= 7) return 'Titan';
  if (lv >= 5) return 'Architect';
  if (lv >= 3) return 'Practitioner';
  return 'Initiate';
});

// Heatmap Data
const heatmapData = computed(() => {
  return days.value.map(day => {
    const scheduledForDay = visibleHabits.value.filter(h => isHabitScheduledForDay(h, day));
    const completed = scheduledForDay.filter(h => hasCompletedDay(h, day)).length;
    const total = scheduledForDay.length;
    const points = getDayTotal(day);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    let level = 0;
    if (pct > 75) level = 4;
    else if (pct > 50) level = 3;
    else if (pct > 25) level = 2;
    else if (pct > 0) level = 1;
    return {
      day,
      completed,
      total,
      points,
      pct,
      level,
      isToday: props.isCurrentMonth && day === props.currentDay,
      isFuture: isFutureDay(day),
    };
  });
});
const hoveredHeatmapDay = ref(null);
const hoveredHeatmapCell = computed(() => {
  if (!hoveredHeatmapDay.value) return null;
  return heatmapData.value.find(c => c.day === hoveredHeatmapDay.value) || null;
});

// Milestone Badges
const milestoneBadges = computed(() => [
  { id: 'first_step', icon: '🌱', label: 'First Step', desc: 'Earn 100 XP', threshold: 100, earned: totalXP.value >= 100 },
  { id: 'bronze_habits', icon: '🥉', label: 'Bronze Builder', desc: 'Earn 500 XP', threshold: 500, earned: totalXP.value >= 500 },
  { id: 'silver_master', icon: '🥈', label: 'Silver Habitier', desc: 'Earn 1500 XP', threshold: 1500, earned: totalXP.value >= 1500 },
  { id: 'gold_architect', icon: '🥇', label: 'Gold Architect', desc: 'Earn 3000 XP', threshold: 3000, earned: totalXP.value >= 3000 },
  { id: 'diamond_legend', icon: '💎', label: 'Diamond Legend', desc: 'Earn 5000 XP', threshold: 5000, earned: totalXP.value >= 5000 },
]);

// Top Streaks
const habitStreaks = computed(() => {
  return visibleHabits.value.map(h => {
    let current = 0;
    const maxDay = props.isCurrentMonth ? props.currentDay : props.monthDays;
    for (let d = maxDay; d >= 1; d--) {
      if (hasCompletedDay(h, d)) current++;
      else break;
    }
    return { id: h.id, name: h.name, current };
  }).sort((a, b) => b.current - a.current);
});

// Day Type & Greetings
const currentDayType = computed({
  get: () => progressiveSettings.value.dayType || 'full',
  set: (val) => {
    progressiveSettings.value.dayType = val;
    saveState();
  },
});
const setDayType = (type) => {
  currentDayType.value = type;
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
};

const timeGreeting = computed(() => {
  const now = currentClock.value;
  const h = now.getHours();
  let salute = 'Good morning';
  if (h >= 12 && h < 17) salute = 'Good afternoon';
  else if (h >= 17) salute = 'Good evening';
  const name = displayName.value;
  const quote = 'Win the morning, conquer the day.';
  return { salute, name, quote };
});

const mobileHeroExpanded = ref(false);

// Toggle Habit Check
const toggleHabitForDay = (habit, day) => {
  if (isFutureDay(day)) return;
  const key = keyFor(habit.id, day);
  const currentlyDone = hasCompletedDay(habit, day);
  const nextDone = !currentlyDone;
  pendingCells.value[key] = nextDone;

  const habitRef = (localHabits.value || []).find(h => h.id === habit.id);
  if (habitRef) {
    if (!Array.isArray(habitRef.completed_days)) habitRef.completed_days = [];
    if (nextDone && !habitRef.completed_days.includes(day)) {
      habitRef.completed_days.push(day);
    } else if (!nextDone) {
      habitRef.completed_days = habitRef.completed_days.filter(d => d !== day);
    }
  }

  delete pendingCells.value[key];
  saveState();

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(nextDone ? [15, 30, 15] : [20]);
  }
};

// Travel Mode Toggle
const toggleTravelMode = () => {
  travelMode.value = !travelMode.value;
  localHabits.value = (travelMode.value ? ashishTravelHabits : ashishHabits).map(h => ({ ...h, completed_days: [] }));
  saveState();
};

// ── State Persistence & Automatic Real-Time Cloud Sync ──
const isSyncingCloud = ref(false);
let lastSyncTimestamp = 0;

const applyLoadedState = (data, isRemote = false) => {
  if (!data) return;
  if (Array.isArray(data.habits) && data.habits.length > 0) {
    const fallbackMap = new Map(fallbackHabits.value.map(h => [h.id, h]));
    localHabits.value = data.habits.map(h => {
      const fallback = fallbackMap.get(h.id);
      if (fallback) {
        return {
          ...fallback,
          ...h,
          name: fallback.name,
          hint: fallback.hint,
          daysOfWeek: fallback.daysOfWeek,
          scheduleLabel: fallback.scheduleLabel,
          points: fallback.points,
          completed_days: Array.isArray(h.completed_days) ? h.completed_days : [],
        };
      }
      return h;
    });
  } else if (!isRemote) {
    localHabits.value = fallbackHabits.value.map(h => ({ ...h, completed_days: [] }));
  }

  if (Array.isArray(data.rewards)) rewards.value = data.rewards;
  if (Array.isArray(data.rewardLedger)) rewardLedger.value = data.rewardLedger;
  if (data.progressiveSettings) progressiveSettings.value = { ...progressiveSettings.value, ...data.progressiveSettings };
  if (data.enhancedState) enhancedState.value = { ...enhancedState.value, ...data.enhancedState };
  if (data.travelMode !== undefined) travelMode.value = data.travelMode;
  if (data.darkMode !== undefined) darkMode.value = data.darkMode;

  if (isRemote) {
    try {
      localStorage.setItem(localStateKey.value, JSON.stringify({
        habits: localHabits.value,
        rewards: rewards.value,
        rewardLedger: rewardLedger.value,
        progressiveSettings: progressiveSettings.value,
        enhancedState: enhancedState.value,
        travelMode: travelMode.value,
        darkMode: darkMode.value,
        updated_at: new Date().toISOString(),
      }));
    } catch { /* offline fallback */ }
  }
};

const saveState = async () => {
  try {
    const payload = {
      habits: localHabits.value,
      rewards: rewards.value,
      rewardLedger: rewardLedger.value,
      progressiveSettings: progressiveSettings.value,
      enhancedState: enhancedState.value,
      travelMode: travelMode.value,
      darkMode: darkMode.value,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(localStateKey.value, JSON.stringify(payload));
    if (effectiveUserId.value && effectiveUserId.value !== 'guest') {
      await saveUserMonthlyState(effectiveUserId.value, monthScope.value, payload);
    }
  } catch (err) {
    console.warn('Failed to save dashboard state:', err);
  }
};

const loadLocalState = () => {
  try {
    const raw = localStorage.getItem(localStateKey.value);
    if (raw) {
      applyLoadedState(JSON.parse(raw), false);
    } else {
      localHabits.value = fallbackHabits.value.map(h => ({ ...h, completed_days: [] }));
    }
  } catch {
    localHabits.value = fallbackHabits.value.map(h => ({ ...h, completed_days: [] }));
  }
};

const syncCloudState = async (force = false) => {
  const now = Date.now();
  if (!force && now - lastSyncTimestamp < 10000) return;
  if (!effectiveUserId.value || effectiveUserId.value === 'guest') return;

  try {
    isSyncingCloud.value = true;
    const remoteData = await loadUserMonthlyState(effectiveUserId.value, monthScope.value);
    if (remoteData) {
      applyLoadedState(remoteData, true);
      lastSyncTimestamp = Date.now();
    }
  } catch (err) {
    console.warn('Cloud sync on open failed:', err);
  } finally {
    isSyncingCloud.value = false;
  }
};

// Habit Editor Handlers
const startEditingHabits = () => {
  habitsDraft.value = (localHabits.value || []).map(h => ({ ...h }));
  habitsEditing.value = true;
};
const cancelEditingHabits = () => { habitsEditing.value = false; };
const addDraftHabit = () => {
  habitsDraft.value.push({ id: 'c-' + Date.now(), name: '', points: 1, hint: '', completed_days: [] });
};
const removeDraftHabit = (index) => { habitsDraft.value.splice(index, 1); };
const moveDraftHabit = (from, to) => {
  if (to < 0 || to >= habitsDraft.value.length) return;
  const item = habitsDraft.value.splice(from, 1)[0];
  habitsDraft.value.splice(to, 0, item);
};
const toggleArchiveHabit = (habit) => {
  if (!enhancedState.value.archivedHabitIds) enhancedState.value.archivedHabitIds = [];
  const idx = enhancedState.value.archivedHabitIds.indexOf(habit.id);
  if (idx > -1) enhancedState.value.archivedHabitIds.splice(idx, 1);
  else enhancedState.value.archivedHabitIds.push(habit.id);
  saveState();
};
const restoreDefaultHabits = () => {
  localHabits.value = fallbackHabits.value.map(h => ({ ...h, completed_days: [] }));
  habitsEditing.value = false;
  saveState();
};
const restoreSingleDefaultHabit = (dh) => {
  localHabits.value.push({ ...dh, completed_days: [] });
  saveState();
};
const saveHabits = () => {
  localHabits.value = habitsDraft.value.map(h => ({ ...h }));
  habitsEditing.value = false;
  saveState();
};

// Rewards Editor Handlers
const startEditingRewards = () => {
  const source = (rewards.value && rewards.value.length > 0) ? rewards.value : defaultRewards;
  rewardsDraft.value = source.map((r, idx) => ({
    id: r.id || `reward-${Date.now()}-${idx}`,
    type: r.type || 'Weekly',
    item: r.item || '',
    cost: Number(r.cost) !== undefined && !isNaN(Number(r.cost)) ? Number(r.cost) : 10,
  }));
  rewardsEditing.value = true;
};

const cancelEditingRewards = () => {
  rewardsEditing.value = false;
};

const saveRewardsCatalog = () => {
  const sanitized = (rewardsDraft.value || [])
    .filter(r => r.item && r.item.trim().length > 0)
    .map(r => ({
      id: r.id || `reward-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: r.type ? r.type.trim() : 'Weekly',
      item: r.item.trim(),
      cost: Math.max(1, Number(r.cost) || 10),
    }));

  if (sanitized.length > 0) {
    rewards.value = sanitized;
  }
  rewardsEditing.value = false;
  saveState();
};

const restoreDefaultRewards = () => {
  rewards.value = defaultRewards.map((r, i) => ({
    id: `default-reward-${i}`,
    ...r,
  }));
  rewardsEditing.value = false;
  saveState();
};

const addDraftReward = () => {
  rewardsDraft.value.push({
    id: `reward-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'Weekly',
    item: '',
    cost: 10,
  });
};

const removeDraftReward = (index) => {
  rewardsDraft.value.splice(index, 1);
};

// Month Navigation
const goToPreviousMonth = () => {
  if (!props.canNavigatePrevMonth) return;
  router.visit(`/?month=${props.previousMonth.month}&year=${props.previousMonth.year}`);
};
const goToNextMonth = () => {
  if (!props.canNavigateNextMonth) return;
  router.visit(`/?month=${props.nextMonth.month}&year=${props.nextMonth.year}`);
};

// SPA URL Tab Synchronization
const syncTabWithUrl = () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['today', 'focus', 'stats', 'rewards'].includes(tab)) {
      activeMobileTab.value = tab;
    }
  } catch { /* URL param fallback */ }
};

const handlePopState = (e) => {
  if (e.state?.tab) {
    activeMobileTab.value = e.state.tab;
  } else {
    syncTabWithUrl();
  }
};

let clockInterval = null;
let cloudSyncInterval = null;

const handleAppResume = () => {
  // 1. Immediately update clock time
  updateCurrentClock();

  // 2. Check if date rolled over midnight
  const now = new Date();
  const currentActualDay = now.getDate();
  const currentActualMonth = now.getMonth() + 1;
  const currentActualYear = now.getFullYear();

  if (props.isCurrentMonth && (props.month === currentActualMonth && props.year === currentActualYear)) {
    if (mobileDayIsToday.value || mobileSelectedDay.value === props.currentDay) {
      mobileSelectedDay.value = currentActualDay;
    }
  }

  // 3. Immediately pull latest synced database updates
  syncCloudState(false);
};

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    handleAppResume();
  }
};

onMounted(() => {
  loadLocalState();
  syncTabWithUrl();
  syncCloudState(true);

  // High-efficiency reactive clock heartbeat (every 10s)
  clockInterval = setInterval(updateCurrentClock, 10000);
  // Periodic background cloud sync (every 60s)
  cloudSyncInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      syncCloudState(false);
    }
  }, 60000);

  window.addEventListener('popstate', handlePopState);
  window.addEventListener('focus', handleAppResume);
  window.addEventListener('pageshow', handleAppResume);
  window.addEventListener('online', () => syncCloudState(true));
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onBeforeUnmount(() => {
  if (clockInterval) clearInterval(clockInterval);
  if (cloudSyncInterval) clearInterval(cloudSyncInterval);
  window.removeEventListener('popstate', handlePopState);
  window.removeEventListener('focus', handleAppResume);
  window.removeEventListener('pageshow', handleAppResume);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<template>
  <AppLayout :title="appName">
    <!-- Global Floating Action Feedback Toast -->
    <transition name="toast-fade">
      <div v-if="toastMessage" class="global-toast-banner" role="status" aria-live="polite">
        <span class="global-toast-text">{{ toastMessage }}</span>
      </div>
    </transition>

    <!-- Pinned Top Deep Work Timer Bar -->
    <div v-if="timerState && activeMobileTab !== 'focus'" class="deep-timer" :class="{ 'deep-timer--running': timerState.running }">
      <div class="deep-timer__bar">
        <div class="deep-timer__left">
          <span class="deep-timer__pulse"></span>
          <span class="deep-timer__icon"><Timer class="icon-sm" /></span>
          <span class="deep-timer__time mono-num">{{ timerElapsedFormatted }}</span>
          <span class="deep-timer__target mono-num">/ {{ timerState.targetMin }}m</span>
          <span v-if="timerLinkedHabit" class="deep-timer__linked">
            🎯 {{ timerLinkedHabit.name }}
          </span>
          <span v-else-if="timerState.isBreak" class="deep-timer__linked deep-timer__linked--break">
            ☕ Break
          </span>
        </div>
        <div class="deep-timer__right">
          <div class="deep-timer__progress-bar">
            <div class="deep-timer__progress-fill" :style="{ width: timerProgressPct + '%' }"></div>
          </div>
          <button v-if="!timerState.running" class="deep-timer__btn" @click="resumeDeepWorkTimer">
            <Play class="icon-xs" />
          </button>
          <button v-if="timerState.running" class="deep-timer__btn" @click="pauseDeepWorkTimer">
            <Pause class="icon-xs" />
          </button>
          <button class="deep-timer__btn deep-timer__btn--danger" @click="stopDeepWorkTimer">
            <X class="icon-xs" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Compact Bar (Top Summary + Live UP NEXT for Today tab) -->
    <MobileCompactBar
      v-if="activeMobileTab === 'today'"
      :time-greeting="timeGreeting"
      :performance-grade="performanceGrade"
      :system-streak="systemStreak"
      :available-wallet="availableWallet"
      :today-points="todayPoints"
      :today-completed-count="todayCompletedCount"
      :total-habits="todayScheduledCount"
      :is-current-month="props.isCurrentMonth"
      :current-day="props.currentDay"
      :up-next-habit-info="upNextHabitInfo"
      :has-completed-day="hasCompletedDay"
      :is-ashish="isAshish"
      :travel-mode="travelMode"
      :dark-mode="darkMode"
      :is-syncing="isSyncingCloud"
      @toggle-up-next="toggleHabitForDay"
      @toggle-theme="toggleTheme"
      @toggle-travel="toggleTravelMode"
      @share-scorecard="shareDailyScorecard"
      @reload-app="handleAppReload"
    />

    <!-- Main Dashboard Flow (Multi-view SPA Tab Coordinator) -->
    <div class="dashboard-flow" :class="{ 'dark-mode': darkMode }">
      <!-- ── SECTION: TOP HERO & COMMAND BAR (Desktop & Mobile Command Bar) ── -->
      <section
        class="card card--hero mobile-tab-hero"
        id="overview"
      >
        <TopCommandBar
          :is-jyoti="isJyoti"
          :is-ashish="isAshish"
          :display-name="displayName"
          :level-data="levelData"
          :level-title="levelTitle"
          :total-x-p="totalXP"
          :travel-mode="travelMode"
          :can-navigate-prev-month="props.canNavigatePrevMonth"
          :can-navigate-next-month="props.canNavigateNextMonth"
          :is-navigating-month="isNavigatingMonth"
          :month-label="monthLabel"
          :year="props.year"
          :dark-mode="darkMode"
          :active-tab="activeMobileTab"
          :timer-running="timerState && timerState.running"
          @set-tab="tab => activeMobileTab = tab"
          @toggle-travel="toggleTravelMode"
          @prev-month="goToPreviousMonth"
          @next-month="goToNextMonth"
          @toggle-theme="toggleTheme"
        />

        <!-- Greeting & Automatic Protocol Status -->
        <div class="hero-greeting-bar">
          <div class="hero-greeting-text">
            <div class="hero-greeting-title">
              <span class="hero-greeting-salute">{{ timeGreeting.salute }}, {{ timeGreeting.name }}</span>
              <span class="hero-greeting-wave">👋</span>
              <span class="grade-badge" :class="performanceGrade.class">{{ performanceGrade.grade }}</span>
            </div>
            <p class="hero-greeting-quote">
              <span class="hero-greeting-quote__brand">Habuilt.</span> {{ timeGreeting.quote }}
            </p>
          </div>

          <!-- Automatic Milestone Protocol Gauge -->
          <div class="hero-auto-protocol-box">
            <div class="hero-auto-protocol-header">
              <div class="hero-auto-protocol-title-wrap">
                <Shield class="icon-xs icon-gold" />
                <span class="hero-auto-protocol-label">Today's Protocol</span>
              </div>
              <div class="hero-auto-protocol-pts-chip">
                <span class="hero-auto-protocol-pts mono-num">{{ todayPoints }}</span>
                <span class="hero-auto-protocol-target mono-num">/ 15 pts</span>
              </div>
            </div>

            <!-- Segmented Milestone Gauge Bar -->
            <div class="hero-milestone-gauge">
              <div
                class="hero-milestone-gauge__fill"
                :style="{ width: `${Math.min(100, Math.round((todayPoints / 15) * 100))}%` }"
              ></div>
            </div>

            <!-- 3 Dynamic Milestone Status Cards -->
            <div class="hero-auto-protocol-tiers">
              <div
                class="hero-auto-tier"
                :class="{ 'hero-auto-tier--met': todayPoints >= 4 }"
                :title="todayPoints >= 4 ? 'Floor Safe (Streak & Baseline Protected)' : `Need ${4 - todayPoints} more pts for Floor`"
              >
                <span class="hero-auto-tier__icon">🛡️</span>
                <span class="hero-auto-tier__name">Floor (4p)</span>
                <span class="hero-auto-tier__status mono-num">{{ todayPoints >= 4 ? '✓ Safe' : `${todayPoints}/4p` }}</span>
              </div>

              <div
                class="hero-auto-tier"
                :class="{ 'hero-auto-tier--met': todayPoints >= 8 }"
                :title="todayPoints >= 8 ? 'Half Protocol Achieved (Solid Execution)' : `Need ${8 - todayPoints} more pts for Half`"
              >
                <span class="hero-auto-tier__icon">⚡</span>
                <span class="hero-auto-tier__name">Half (8p)</span>
                <span class="hero-auto-tier__status mono-num">{{ todayPoints >= 8 ? '✓ Hit' : `${todayPoints}/8p` }}</span>
              </div>

              <div
                class="hero-auto-tier"
                :class="{ 'hero-auto-tier--met': todayPoints >= 15 }"
                :title="todayPoints >= 15 ? 'Full Target Achieved (Elite Performance)' : `Need ${15 - todayPoints} more pts for Full`"
              >
                <span class="hero-auto-tier__icon">🏆</span>
                <span class="hero-auto-tier__name">Full (15p)</span>
                <span class="hero-auto-tier__status mono-num">{{ todayPoints >= 15 ? '👑 Peak' : `${todayPoints}/15p` }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── SECTION: DEDICATED DEEP WORK FOCUS STATION (Focus Tab on Mobile) ── -->
      <DeepWorkStation
        v-if="activeMobileTab === 'focus'"
        :timer-state="timerState"
        :timer-launcher-duration="timerLauncherDuration"
        :custom-timer-min="customTimerMin"
        :timer-launcher-habit-id="timerLauncherHabitId"
        :timer-sound-enabled="timerSoundEnabled"
        :timer-progress-pct="timerProgressPct"
        :timer-elapsed-formatted="timerElapsedFormatted"
        :timer-remaining-formatted="timerRemainingFormatted"
        :timer-linked-habit="timerLinkedHabit"
        :timer-habit-options="timerHabitOptions"
        :current-day="props.currentDay"
        :has-completed-day="hasCompletedDay"
        @update:custom-timer-min="val => customTimerMin = val"
        @update:timer-launcher-duration="val => timerLauncherDuration = val"
        @update:timer-launcher-habit-id="val => timerLauncherHabitId = val"
        @update:timer-sound-enabled="val => timerSoundEnabled = val"
        @start-timer="startDeepWorkTimer"
        @pause-timer="pauseDeepWorkTimer"
        @resume-timer="resumeDeepWorkTimer"
        @stop-timer="stopDeepWorkTimer"
        @start-break="startBreakTimer"
      />

      <!-- ── SECTION: HABIT CHECKLIST (Today Tab on Mobile & Main Grid on Desktop) ── -->
      <section
        class="card mobile-tab-section"
        :class="[activeMobileTab === 'today' ? 'mobile-tab-section--active' : '']"
        id="habits"
      >
        <div class="section-head">
          <div class="section-title-wrap">
            <h2 class="section-title">
              <span class="section-title__icon"><CheckSquare class="icon-md" /></span>
              <span>Habit Checklist</span>
            </h2>
            <small>Core Leading Indicators — day-based completion matrix</small>
          </div>
          <button id="habits-btn-edit" v-if="!habitsEditing" class="btn btn--secondary" @click="startEditingHabits" title="Customize Habits">
            <Edit3 class="icon-sm" /> <span>Edit Habits</span>
          </button>
        </div>

        <!-- Habits Editor Modal / Panel -->
        <HabitEditorModal
          v-if="habitsEditing"
          :habits-draft="habitsDraft"
          :habit-save-status="habitSaveStatus"
          :missing-default-habits="missingDefaultHabits"
          @move-draft-habit="moveDraftHabit"
          @remove-draft-habit="removeDraftHabit"
          @toggle-archive="toggleArchiveHabit"
          @add-draft-habit="addDraftHabit"
          @restore-defaults="restoreDefaultHabits"
          @restore-single-default="restoreSingleDefaultHabit"
          @cancel="cancelEditingHabits"
          @save="saveHabits"
        />

        <!-- Mobile Daily Checklist View -->
        <TodayChecklist
          :mobile-day="mobileDay"
          :mobile-day-label="mobileDayLabel"
          :mobile-day-is-today="mobileDayIsToday"
          :mobile-day-is-future="mobileDayIsFuture"
          :month-days="props.monthDays"
          :active-time-filter="activeTimeFilter"
          :time-slot-counts="timeSlotCounts"
          :time-slot-completed="timeSlotCompleted"
          :get-current-time-block="getCurrentTimeBlock"
          :is-ashish="isAshish"
          :travel-mode="travelMode"
          :mobile-day-completed="mobileDayCompleted"
          :total-habits="mobileDayTotalHabits"
          :mobile-day-points="mobileDayPoints"
          :max-daily-points="maxDailyPoints"
          :visible-habits="visibleHabits"
          :missing-default-habits="missingDefaultHabits"
          :timeline-grouped-habits="timelineGroupedHabits"
          :schedule-filter-mode="scheduleFilterMode"
          :scheduled-habits-count="scheduledHabitsCount"
          :total-master-habits-count="totalHabits"
          :is-slot-collapsed="isSlotCollapsed"
          :is-habit-up-next="isHabitUpNext"
          :up-next-habit-info="upNextHabitInfo"
          :has-completed-day="hasCompletedDay"
          :pending-cells="pendingCells"
          :key-for="keyFor"
          :get-habit-tier="getHabitTier"
          :get-tier-descriptions="getTierDescriptions"
          :tier-color-class="tierColorClass"
          :get-habit-category="getHabitCategory"
          :tier-detail-habit-id="tierDetailHabitId"
          :habit-notes-open="habitNotesOpen"
          :get-habit-note="getHabitNote"
          :on-touch-start="onTouchStart"
          :on-touch-end="onTouchEnd"
          @prev-day="mobilePrevDay"
          @next-day="mobileNextDay"
          @go-today="mobileGoToday"
          @update:active-time-filter="val => activeTimeFilter = val"
          @toggle-schedule-filter="scheduleFilterMode = (scheduleFilterMode === 'scheduled' ? 'all' : 'scheduled')"
          @toggle-travel="toggleTravelMode"
          @start-editing="startEditingHabits"
          @restore-defaults="restoreDefaultHabits"
          @toggle-slot-collapse="toggleSlotCollapse"
          @toggle-habit="toggleHabitForDay"
          @toggle-tier-detail="toggleTierDetail"
          @set-tier="setHabitTier"
          @toggle-note="toggleHabitNote"
          @set-note="setHabitNote"
        />

        <!-- Desktop Month Grid Table -->
        <MonthGrid
          :visible-habits="visibleHabits"
          :days="days"
          :current-day="props.currentDay"
          :is-current-month="props.isCurrentMonth"
          :is-weekend-day="isWeekendDay"
          :is-habit-scheduled-for-day="isHabitScheduledForDay"
          :is-habit-up-next="isHabitUpNext"
          :up-next-habit-info="upNextHabitInfo"
          :get-habit-tier="getHabitTier"
          :get-tier-descriptions="getTierDescriptions"
          :tier-color-class="tierColorClass"
          :has-completed-day="hasCompletedDay"
          :is-future-day="isFutureDay"
          :is-pending="isPending"
          :cell-aria-label="cellAriaLabel"
          :cell-tooltip="cellTooltip"
          :get-day-total="getDayTotal"
          :mobile-view-mode="mobileViewMode"
          @toggle-cell="toggleHabitForDay"
        />
      </section>

      <!-- ── SECTION: PERFORMANCE ANALYTICS (Stats Tab on Mobile) ── -->
      <section
        class="card mobile-tab-section"
        :class="[activeMobileTab === 'stats' ? 'mobile-tab-section--active' : '']"
        id="analytics"
      >
        <div class="section-head">
          <div class="section-title-wrap">
            <h2 class="section-title">
              <span class="section-title__icon"><BarChart3 class="icon-md" /></span>
              <span>Performance Analytics</span>
            </h2>
            <small>Consistency grade, streak patterns, and monthly heatmap matrix</small>
          </div>
        </div>

        <PerformanceAnalytics
          :consistency-score="consistencyScore"
          :consistency-grade="consistencyGrade"
          :system-streak="systemStreak"
          :level-data="levelData"
          :level-title="levelTitle"
          :total-x-p="totalXP"
          :available-wallet="availableWallet"
          :monthly-total-earned="monthlyTotalEarned"
          :daily-average="todayPoints"
          :target-daily-points="targetDailyPoints"
          :heatmap-data="heatmapData"
          :hovered-heatmap-day="hoveredHeatmapDay"
          :hovered-heatmap-cell="hoveredHeatmapCell"
          :habit-streaks="habitStreaks"
          :milestone-badges="milestoneBadges"
          @update:hovered-heatmap-day="val => hoveredHeatmapDay = val"
          @select-heatmap-day="day => mobileSelectedDay = day"
        />
      </section>

      <!-- ── SECTION: REWARDS SHOP (Rewards Tab on Mobile) ── -->
      <section
        class="card mobile-tab-section"
        :class="[activeMobileTab === 'rewards' ? 'mobile-tab-section--active' : '']"
        id="rewards"
      >
        <div class="section-head">
          <div class="section-title-wrap">
            <h2 class="section-title">
              <span class="section-title__icon"><Gift class="icon-md" /></span>
              <span>Reward Shop & Wallet</span>
            </h2>
            <small>Reinvest earned habit points into real-world rewards</small>
          </div>
        </div>

        <RewardShop
          :available-wallet="availableWallet"
          :monthly-total-earned="monthlyTotalEarned"
          :rewards-expanded="true"
          :rewards-editing="rewardsEditing"
          :rewards-draft="rewardsDraft"
          :active-rewards="rewards"
          :reward-ledger="rewardLedger"
          :is-redeeming="false"
          :is-claimed-this-month="() => false"
          :can-afford-reward="r => availableWallet >= r.cost"
          @toggle-expand="() => {}"
          @start-editing="startEditingRewards"
          @cancel-editing="cancelEditingRewards"
          @save-rewards="saveRewardsCatalog"
          @restore-default-rewards="restoreDefaultRewards"
          @add-draft-reward="addDraftReward"
          @remove-draft-reward="removeDraftReward"
          @redeem-reward="r => { rewardLedger.push({ id: Date.now(), item: r.item, cost: r.cost, claimed_at: new Date().toLocaleDateString() }); saveState(); }"
        />
      </section>

      <!-- ── SECTION: SUNDAY REVIEW ── -->
      <section
        class="card mobile-tab-section"
        :class="[activeMobileTab === 'stats' ? 'mobile-tab-section--active' : '']"
        id="weekly-review"
      >
        <SundayReview
          :weekly-review-expanded="weeklyReviewExpanded"
          :weekly-snapshot-label="calculatePastWeekStickiness()"
          :monthly-snapshot-label="`${consistencyScore}%`"
          :weekly-points="calculatePastWeekPoints()"
          :monthly-points="monthlyTotalEarned"
          :weekly-review="weeklyReview"
          @toggle-expand="weeklyReviewExpanded = !weeklyReviewExpanded"
          @fill-metrics="fillSundayMetrics"
          @save-review="saveState"
        />
      </section>

      <!-- Global Floating Toast Notification -->
      <transition name="toast-fade">
        <div v-if="toastMessage" class="habuilt-floating-toast">
          <span>{{ toastMessage }}</span>
        </div>
      </transition>

      <!-- Fixed Mobile PWA Bottom Navigation Bar (Thumb Zone) -->
      <MobileBottomNav
        v-model:active-tab="activeMobileTab"
        :today-completed-count="todayCompletedCount"
        :total-habits="todayScheduledCount"
        :timer-running="timerState && timerState.running"
      />
    </div>
  </AppLayout>
</template>
