<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { router, usePage } from '@inertiajs/vue3';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import AppLayout from '@/Layouts/AppLayout.vue';
import {
  loadUserMonthlyState,
  saveUserMonthlyState,
  loadAllUserMonthlyStates,
  recordHabitCheckIn,
  removeHabitCheckIn,
  loadMonthCheckIns,
  subscribeToHabitCheckIns,
  initCoupleBroadcastChannel,
  broadcastPartnerEvent,
  getPairChannelId,
  silentBackfillLegacyState,
  saveUserSettings,
  loadUserSettings,
  saveUserBiomarker,
  loadLatestBiomarker,
} from '@/lib/supabase';
import {
  computeLifetimeStats,
  getMonthlyHabits,
  getHabitCompletedDays,
} from '@/lib/lifetimeStats';
import {
  playSharedAnchorSync,
  playPartnerHighFive,
  playPartnerEmote,
  playPartnerNudge,
} from '@/lib/soundEffects';

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
import HabitEditorModal from '@/Components/Modals/HabitEditorModal.vue';
import HabitFormModal from '@/Components/Modals/HabitFormModal.vue';
import ShareScorecardModal from '@/Components/Modals/ShareScorecardModal.vue';
import AppInstallModal from '@/Components/Modals/AppInstallModal.vue';
import SpotlightCommandModal from '@/Components/Modals/SpotlightCommandModal.vue';
import WarriorIntelligenceCockpit from '@/Components/Intelligence/WarriorIntelligenceCockpit.vue';
import DataBackupModal from '@/Components/Modals/DataBackupModal.vue';
import CalendarSyncModal from '@/Components/Modals/CalendarSyncModal.vue';
import PartnerSyncModal from '@/Components/Modals/PartnerSyncModal.vue';
import ProtocolWizardModal from '@/Components/Modals/ProtocolWizardModal.vue';
import ProtocolSettingsModal from '@/Components/Modals/ProtocolSettingsModal.vue';
import UniversalPartnerPairModal from '@/Components/Modals/UniversalPartnerPairModal.vue';
import RheumatologyClinicalAnalytics from '@/Components/Analytics/RheumatologyClinicalAnalytics.vue';

// Composables & Data
import { useDynamicProtocols } from '@/Composables/useDynamicProtocols';
import {
  getPartnerConnection,
  pairWithInviteCode,
  subscribeToPartnerConnection,
  loadPartnerLiveMetrics,
  computeSharedAnchorsStatus,
} from '@/lib/partnerPairing';
import { useDeepWorkTimer } from '@/Composables/useDeepWorkTimer';
import { useConfetti } from '@/Composables/useConfetti';
import { useDueNowNotifications } from '@/Composables/useDueNowNotifications';
import { useNativeWidget } from '@/Composables/useNativeWidget';
import { useAppBadging } from '@/Composables/useAppBadging';
import { useCircadianAtmosphere } from '@/Composables/useCircadianAtmosphere';
import {
  ashishHabits,
  jyotiHabits,
  ashishTravelHabits,
  ashishOfficeMidHabits,
  ashishOfficeFriHabits,
  ashishHalfDayHabits,
  ashishHolidayHabits,
  genericStarterHabits,
  ashishTierDescriptions,
  jyotiTierDescriptions,
  ashishTravelTierDescriptions,
  timeSlotDefinitions,
  timeSlotOrder,
  getTimeSlotForHabit,
  getHabitCategory,
  getCurrentTimeBlock,
  getSharedHabitInfo,
} from '@/Composables/useHabitsState';
import {
  getDayType,
  getDayTypeLabel,
  getDayTypeShortLabel,
  getDayTypeEmoji,
  isOfficeDay,
  isFlatEvening,
  getNextDayType,
  getHolidayName,
  getHalfDayReason,
} from '@/Composables/useOfficeCalendar';

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

const emit = defineEmits(['sign-out', 'navigate-month']);

const page = usePage();
const authUser = computed(() => page?.props?.auth?.user ?? null);
const resolvedEmail = computed(() => (props.userEmail || authUser.value?.email || '').toLowerCase().trim());
const isJyoti = computed(() => {
  const email = resolvedEmail.value;
  const uid = (props.userId || '').toLowerCase();
  return email === 'goyaljyoti007@gmail.com' || uid === 'jyoti' || email.includes('jyoti');
});
const isAshish = computed(() => {
  if (isJyoti.value) return false;
  const email = resolvedEmail.value;
  const uid = (props.userId || '').toLowerCase();
  return email === 'ashishgupta1v@gmail.com' || uid === 'ashish';
});
const displayName = computed(() => {
  const metaName = authUser.value?.user_metadata?.full_name || authUser.value?.user_metadata?.name;
  if (metaName && metaName.trim()) return metaName.trim();
  if (isJyoti.value) return 'Jyoti';
  if (isAshish.value) return 'Ashish';
  if (resolvedEmail.value && resolvedEmail.value.includes('@') && !resolvedEmail.value.startsWith('guest')) {
    const local = resolvedEmail.value.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return props.userId && props.userId !== 'guest' ? props.userId : 'Champion';
});
const effectiveUserId = computed(() => props.userId || authUser.value?.id || resolvedEmail.value || 'guest');
const isGuestActive = computed(() => {
  return resolvedEmail.value === 'guest@habuilt.com' ||
         effectiveUserId.value === 'guest' ||
         (typeof localStorage !== 'undefined' && localStorage.getItem('habuilt_guest_mode') === 'true');
});

// Reactive real-time clock ticker
const currentClock = ref(new Date());
const updateCurrentClock = () => {
  currentClock.value = new Date();
};

// ── Day Type Engine (replaces binary travelMode) ──
// Values: 'home' | 'office-mon' | 'office-mid' | 'office-fri' | 'half-day' | 'holiday'
const dayType = ref('home');
// Backward-compatible alias for components that use travelMode
const travelMode = computed(() => isOfficeDay(dayType.value));
const localHabits = ref([]);
const allHistoricalHabits = ref([]);
const pendingCells = ref({});

// ── Dynamic Multi-Tenant Protocols & Universal Partner Pairing ──
const isProtocolWizardOpen = ref(false);
const isProtocolSettingsOpen = ref(false);
const isUniversalPartnerPairModalOpen = ref(false);
const activePartnerConnection = ref(null);

const {
  allProtocols,
  activeProtocol,
  activeProtocolId,
  dynamicTimeSlotDefinitions: protocolTimeSlotDefinitions,
  loadProtocols,
  switchProtocol,
  saveCustomProtocol,
} = useDynamicProtocols(effectiveUserId.value, isAshish.value, isJyoti.value);

const isPartnerPaired = computed(() => {
  if (isAshish.value || isJyoti.value) return true;
  return activePartnerConnection.value?.status === 'connected';
});

const partnerDisplayName = computed(() => {
  if (isJyoti.value) return 'Ashish';
  if (isAshish.value) return 'Jyoti';
  return activePartnerConnection.value?.alias || 'Partner';
});

const partnerUserId = computed(() => {
  if (isAshish.value) return 'jyoti';
  if (isJyoti.value) return 'ashish';
  return activePartnerConnection.value?.partner_user_id || null;
});

const pairChannelId = computed(() => {
  if (partnerUserId.value) {
    return getPairChannelId(effectiveUserId.value, partnerUserId.value);
  }
  return 'habuilt:couple_live_channel';
});

const partnerLiveMetrics = ref(null);
const partnerPointsToday = ref(0);
const partnerCompletedCountToday = ref(0);
const partnerTotalHabitsCount = ref(0);
const dynamicSharedAnchors = ref([]);
const partnerAlignmentScore = ref(0);
const partnerLiveOffline = ref(false);
const partnerPresence = ref({
  isOnline: false,
  lastSeen: null,
  currentWindow: '',
  statusLabel: 'Offline',
});

const sendPartnerHeartbeat = () => {
  if (!isPartnerPaired.value) return;
  broadcastPartnerEvent({
    type: 'partner_heartbeat',
    userId: effectiveUserId.value,
    userName: displayName.value,
    window: currentRoutineWindow.value?.name || 'Active Execution Block',
  }, pairChannelId.value);
};

const handleSendPartnerNudge = (nudge) => {
  if (!isPartnerPaired.value) return;
  broadcastPartnerEvent({
    type: 'partner_nudge',
    nudge,
    from: displayName.value,
    window: currentRoutineWindow.value?.name || 'Active',
  }, pairChannelId.value);
  showToast(`Sent ${nudge.label || 'nudge'} to ${partnerDisplayName.value}! ✨`);
};

const refreshPartnerLiveMetrics = async () => {
  const pId = partnerUserId.value;
  if (!pId) {
    partnerPointsToday.value = 0;
    partnerCompletedCountToday.value = 0;
    partnerTotalHabitsCount.value = 0;
    dynamicSharedAnchors.value = [];
    partnerAlignmentScore.value = 0;
    return;
  }

  try {
    const metrics = await loadPartnerLiveMetrics(pId, monthScope.value, props.currentDay);
    if (metrics) {
      partnerLiveMetrics.value = metrics;
      partnerPointsToday.value = metrics.todayPoints || 0;
      partnerCompletedCountToday.value = metrics.todayCompletedCount || 0;
      partnerLiveOffline.value = !!metrics.isOfflineCache;

      if (pId === 'ashish') partnerTotalHabitsCount.value = 68;
      else if (pId === 'jyoti') partnerTotalHabitsCount.value = 37;
      else partnerTotalHabitsCount.value = Math.max(metrics.todayCompletedCount, (localHabits.value || []).length);

      const anchorCalc = computeSharedAnchorsStatus(
        localHabits.value,
        metrics,
        isAshish.value,
        isJyoti.value,
        props.currentDay
      );

      dynamicSharedAnchors.value = anchorCalc.anchors || [];
      partnerAlignmentScore.value = anchorCalc.alignmentPercentage || 0;
    }
  } catch (err) {
    console.warn('[Dashboard] refreshPartnerLiveMetrics error:', err);
  }
};

// ── Throttled System / Push Notification Bridge for Partner Activity ──
let lastPartnerNotifTime = 0;
const PARTNER_NOTIF_COOLDOWN_MS = 3000;

const dispatchPartnerNotification = async ({ title, body }) => {
  const now = Date.now();
  if (now - lastPartnerNotifTime < PARTNER_NOTIF_COOLDOWN_MS) {
    return; // Suppress duplicate notification alert storms (e.g. rapid habit checking)
  }
  lastPartnerNotifTime = now;

  const isNativePlatform = typeof window !== 'undefined' && Capacitor.isNativePlatform();
  const isWebSupported = typeof window !== 'undefined' && 'Notification' in window;
  const isBackgrounded = typeof document !== 'undefined' && (document.hidden || !document.hasFocus());

  // Only trigger heads-up push if on native mobile OR backgrounded web tab
  if (!isNativePlatform && !isBackgrounded) {
    return;
  }

  if (isNativePlatform) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title || '⚡ Partner Update',
            body: body || 'Your partner completed an activity in Habuilt.',
            id: Math.floor(Math.random() * 900000) + 1000,
            channelId: 'habuilt_reminders',
            sound: 'default',
            actionTypeId: 'HABUILT_HABIT_ACTION',
          },
        ],
      });
    } catch (e) {
      console.debug('[PartnerNotification] Native dispatch note:', e);
    }
  } else if (isWebSupported && Notification.permission === 'granted') {
    try {
      new Notification(title || '⚡ Partner Update', {
        body: body || 'Your partner completed an activity in Habuilt.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
      });
    } catch (e) {
      console.debug('[PartnerNotification] Web dispatch note:', e);
    }
  }
};

const activeProtocolDisplayName = computed(() => {
  if (isAshish.value && (!activeProtocolId.value || activeProtocolId.value === 'archetype-ashish' || activeProtocolId.value === 'ashishMaster')) {
    return 'Ashish Master Protocol';
  }
  if (isJyoti.value && (!activeProtocolId.value || activeProtocolId.value === 'archetype-jyoti' || activeProtocolId.value === 'jyotiMaster')) {
    return 'Jyoti Master Protocol';
  }
  return activeProtocol.value?.name || 'Default Protocol';
});

const fallbackHabits = computed(() => {
  // If activeProtocol is a custom or switched protocol other than the hardcoded baseline, use it
  if (activeProtocolId.value && activeProtocol.value?.habits && activeProtocol.value.habits.length > 0) {
    if (activeProtocolId.value !== 'archetype-ashish' && activeProtocolId.value !== 'archetype-jyoti') {
      return activeProtocol.value.habits;
    }
  }

  if (isJyoti.value) return jyotiHabits;
  if (isAshish.value) {
    switch (dayType.value) {
      case 'office-mon': return ashishTravelHabits;     // Mon: Ludhiana→CHD (long drive + Panchkula stay)
      case 'office-mid': return ashishOfficeMidHabits;  // Tue–Thu: Panchkula flat→office (30m) + solo evening
      case 'office-fri': return ashishOfficeFriHabits;  // Fri: Panchkula flat→office→early return to Ludhiana
      case 'half-day':   return ashishHalfDayHabits;    // Half day: WFH + creative projects & errands
      case 'holiday':    return ashishHolidayHabits;    // Holiday: Spiritual / family / zero office work
      default:           return ashishHabits;           // Home: Full Ludhiana baseline
    }
  }
  if (activeProtocol.value?.habits && activeProtocol.value.habits.length > 0) {
    return activeProtocol.value.habits;
  }
  return genericStarterHabits;
});

const mobileViewMode = ref('daily');
const mobileSelectedDay = ref(props.currentDay);
const focusDay = ref(props.currentDay);
const focusTasksByDay = ref({});
const newFocusTask = ref('');
const rewardLedger = ref([]);
const claimedSynergyRewards = ref([]);
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

// Realtime subscriptions
let realtimeCheckInsChannel = null;
let coupleLiveChannel = null;
let realtimePartnerChannel = null;

// ── MOBILE PWA SPA 4-TAB ROUTING & DAY NAV ──
const activeMobileTab = ref('today'); // 'today' | 'focus' | 'stats' | 'rewards'

const mobilePrevDay = () => {
  if (mobileSelectedDay.value > 1) {
    mobileSelectedDay.value--;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
  }
};

const mobileNextDay = () => {
  if (mobileSelectedDay.value < props.monthDays && (!props.isCurrentMonth || mobileSelectedDay.value < props.currentDay)) {
    mobileSelectedDay.value++;
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
  }
};

const mobileGoToday = () => {
  mobileSelectedDay.value = props.currentDay || new Date().getDate();
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
};

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
// Confetti & Celebration Physics Engine
const {
  fireDualCannons,
  fireTierMilestone,
  firePartnerCelebration,
  fireFocusComplete,
} = useConfetti();

// Spotlight Command Palette State
const isSpotlightOpen = ref(false);
const openSpotlight = () => { isSpotlightOpen.value = true; };
const closeSpotlight = () => { isSpotlightOpen.value = false; };
const cockpitRef = ref(null);

const handlePlayTacticalBriefingFromSpotlight = () => {
  isSpotlightOpen.value = false;
  activeMobileTab.value = 'today';
  nextTick(() => {
    if (cockpitRef.value && typeof cockpitRef.value.toggleAudioBriefing === 'function') {
      cockpitRef.value.toggleAudioBriefing();
    }
    const cockpitEl = document.querySelector('.warrior-audio-briefing-card') || document.querySelector('.card--warrior-intelligence');
    if (cockpitEl) {
      cockpitEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
};

// Sticky Mini HUD — appears on desktop after scrolling past the hero
const showStickyHud = ref(false);

const hudTimeLabel = computed(() => {
  const h = currentClock.value.getHours();
  const m = currentClock.value.getMinutes();
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
});

let _heroObserver = null;

onMounted(() => {
  // Watch hero section visibility to show/hide HUD on desktop viewports
  nextTick(() => {
    const heroEl = document.getElementById('overview');
    if (heroEl && typeof IntersectionObserver !== 'undefined') {
      _heroObserver = new IntersectionObserver(
        ([entry]) => {
          const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768;
          showStickyHud.value = isDesktop && !entry.isIntersecting;
        },
        { threshold: 0.05 }
      );
      _heroObserver.observe(heroEl);
    }
  });
});

onBeforeUnmount(() => {
  if (_heroObserver) _heroObserver.disconnect();
});

// Data Portability & Backup Modal State
const isDataBackupModalOpen = ref(false);
const openDataBackupModal = () => { isDataBackupModalOpen.value = true; };
const closeDataBackupModal = () => { isDataBackupModalOpen.value = false; };

// Biometrics & Metabolic Daily Tracking State
const biomarkersState = ref({
  stiffnessMin: 0,
  energyRating: 8,
  note: '',
});
const hydrationMlState = ref(0);

// Milestone 4: Calendar Sync Modal State
const isCalendarSyncModalOpen = ref(false);

// Dynamic Protocol Builder & Universal Partner Pairing Open/Close Helpers
const openProtocolWizard = () => { isProtocolWizardOpen.value = true; };
const closeProtocolWizard = () => { isProtocolWizardOpen.value = false; };
const openPartnerPairModal = () => { isUniversalPartnerPairModalOpen.value = true; };
const closePartnerPairModal = () => { isUniversalPartnerPairModalOpen.value = false; };

const handleActivateCustomProtocol = async (customProtocol) => {
  if (!customProtocol) return;
  try {
    const saved = await saveCustomProtocol(customProtocol);
    if (saved && Array.isArray(saved.habits) && saved.habits.length > 0) {
      // Preserve completed days for matching habits
      const existingCompletions = new Map();
      (localHabits.value || []).forEach(h => {
        const canon = getCanonicalHabitKey(h.name);
        if (Array.isArray(h.completed_days) && h.completed_days.length > 0) {
          if (canon) existingCompletions.set(canon, h.completed_days);
          existingCompletions.set(String(h.id), h.completed_days);
        }
      });

      localHabits.value = saved.habits.map(h => {
        const canon = getCanonicalHabitKey(h.name);
        const days = existingCompletions.get(canon) || existingCompletions.get(String(h.id)) || [];
        return {
          ...h,
          completed_days: days,
        };
      });

      await saveState();
      showToast(`⚡ Protocol "${saved.name}" Activated!`);
      fireDualCannons();
    }
  } catch (err) {
    console.error('Failed to activate protocol:', err);
    showToast('⚠️ Could not activate protocol');
  }
};

const handleQuickSwitchProtocol = async (protoId) => {
  if (!protoId) return;
  try {
    await switchProtocol(protoId);
    const targetProto = (allProtocols.value || []).find(p => p.id === protoId || p.key === protoId);
    if (targetProto && Array.isArray(targetProto.habits) && targetProto.habits.length > 0) {
      const existingCompletions = new Map();
      (localHabits.value || []).forEach(h => {
        const canon = getCanonicalHabitKey(h.name);
        if (Array.isArray(h.completed_days) && h.completed_days.length > 0) {
          if (canon) existingCompletions.set(canon, h.completed_days);
          existingCompletions.set(String(h.id), h.completed_days);
        }
      });

      localHabits.value = targetProto.habits.map(h => {
        const canon = getCanonicalHabitKey(h.name);
        const days = existingCompletions.get(canon) || existingCompletions.get(String(h.id)) || [];
        return {
          ...h,
          completed_days: days,
        };
      });

      await saveState();
      showToast(`⚡ Protocol "${targetProto.name}" Activated!`);
      fireTierMilestone('full');
    }
  } catch (err) {
    console.error('Failed to switch protocol:', err);
    showToast('⚠️ Could not switch protocol');
  }
};

const handleSaveProtocolSettings = async (newSettings) => {
  if (!newSettings) return;
  progressiveSettings.value = {
    ...progressiveSettings.value,
    ...newSettings,
  };
  await saveState();
  showToast('⚡ Protocol settings & scoring tiers saved!');
};

const handlePartnerPaired = (connection) => {
  activePartnerConnection.value = connection;
  showToast(`🌸 Connected with ${connection.alias || 'Partner'}!`);
  firePartnerCelebration();
  refreshPartnerLiveMetrics();
};

const handlePartnerUnpaired = () => {
  activePartnerConnection.value = null;
  refreshPartnerLiveMetrics();
  showToast('Partner connection disconnected');
};


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
  soundscapeType,
  soundscapeVolume,
  isSoundscapePlaying,
  setSoundscapeType,
  updateSoundscapeVolume,
  toggleSoundscapeManual,
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
  onSessionComplete: ({ isBreak, habitName }) => {
    if (isBreak) {
      showToast('☕ Break completed! Ready to resume flow.');
    } else if (habitName) {
      showToast(`🎉 Focus session complete! "${habitName}" auto-logged.`);
      fireFocusComplete();
    } else {
      showToast('🎉 Focus session complete! Great work.');
      fireFocusComplete();
    }
  },
});

// Habit Editor State
const habitsEditing = ref(false);
const habitsDraft = ref([]);
const habitSaveStatus = ref('idle');
const hasCustomHabits = ref(false);

const rewardsEditing = ref(false);
const rewardsDraft = ref([]);
const rewardSaveStatus = ref('idle');

const defaultRewards = [
  { id: 'rew-daily-social', type: 'Daily', item: '1 Hour+ social media', cost: 8 },
  { id: 'rew-weekly-gadget', type: 'Weekly', item: 'New gadget/supplement under 500', cost: 12 },
  { id: 'rew-weekly-cheat', type: 'Weekly', item: 'Cheat Meal', cost: 15 },
  { id: 'rew-weekly-meetup', type: 'Weekly', item: 'Social Meetup/Night Out/Movie', cost: 20 },
  { id: 'rew-month-tech', type: 'Month', item: 'New Tech/Clothing', cost: 30 },
  { id: 'rew-month-sub', type: 'Month', item: 'Purchase 1 Useful Subscription/Plan', cost: 40 },
  { id: 'rew-quarter-major', type: 'Quarter', item: 'Major Purchase', cost: 100 },
  { id: 'rew-halfyr-vacation', type: 'Half-Yr', item: 'Vacation', cost: 500 },
  { id: 'rew-yr-intl-vacation', type: 'Yearly', item: 'International Vacation', cost: 2000 },
];
const rewards = ref(defaultRewards.map(r => ({ ...r })));

const defaultCoupleSynergyRewards = [
  {
    id: 'couple-candlelight-dinner',
    item: '🥂 Candlelight Date Night & Dinner',
    type: 'Couple Synergy',
    cost: 0,
    description: 'Celebrate weekly alignment with uninterrupted conversation and wholesome dining.',
    icon: '🥂',
  },
  {
    id: 'couple-sunday-nature',
    item: '🌲 Sunday Nature Trail & Artisanal Coffee',
    type: 'Couple Synergy',
    cost: 0,
    description: 'Screen-free morning walk, crisp fresh air, and deep reflection together.',
    icon: '🌲',
  },
  {
    id: 'couple-recovery-spa',
    item: '💆 Joint Rest, Foot Soak & Recovery Evening',
    type: 'Couple Synergy',
    cost: 0,
    description: 'Joint physical recovery, soothing herbal tea, and complete offline relaxation.',
    icon: '💆',
  },
];
const coupleSynergyRewards = ref(defaultCoupleSynergyRewards.map(r => ({ ...r })));
const coupleSynergyRewardsDraft = ref([]);

const createDefaultWeeklyReview = () => ({
  reviewDate: '',
  metrics: { weeklyPoints: '', weeklyStickiness: '', monthlyPoints: '', monthlyStickiness: '' },
  checks: [
    { text: 'I reviewed missed days and found one clear trigger.', done: false },
    { text: 'I declared tier (Full/Half/Floor) at breakfast every day.', done: false },
    { text: 'Family & non-negotiable personal blocks happened first.', done: false },
    { text: '18:30 hard stop held — phones out of room.', done: false },
    { text: 'Sleep stayed above 7h floor (or next day was Floor tier).', done: false },
    { text: 'I graduated max one habit this week (1% rule).', done: false },
  ],
  reflections: { wins: '', misses: '', triggerPlan: '', rewardTune: '', habitScale: '', healthCheck: '', nextWeekFocus: '' },
  coupleChecks: [
    { text: 'We synchronized at least one shared anchor daily without friction.', done: false },
    { text: 'Encouraged partner during intense focus windows without projecting pressure.', done: false },
    { text: 'Held our evening wind-down ritual together with zero late phone interruptions.', done: false },
    { text: 'Celebrated our weekly joint consistency and validated each other\'s progress.', done: false },
  ],
  coupleReflections: { wins: '', friction: '', commitments: '' },
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
  const floorThreshold = tierThresholds.value?.floor || 4;
  for (let d = startD; d <= currentD; d++) {
    if (getDayTotal(d) >= floorThreshold) metDays++;
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
  showToast('✨ Weekly metrics auto-filled & saved!');
};

// ── Couple Synergy Milestone Rewards Handlers & Status ──
const combinedWeeklyPoints = computed(() => {
  return (calculatePastWeekPoints() || 0) + ((partnerPointsToday.value || 0) * 7);
});

const isCoupleSynergyUnlocked = computed(() => {
  if (!isPartnerPaired.value) return false;
  return (partnerAlignmentScore.value >= 80) || (combinedWeeklyPoints.value >= 200);
});

const handleRedeemSynergyReward = (reward) => {
  if (!reward || claimedSynergyRewards.value.includes(reward.id)) return;
  claimedSynergyRewards.value.push(reward.id);
  saveState();

  // Broadcast celebration to partner
  broadcastPartnerEvent({
    type: 'partner_synergy_claim',
    reward: reward.item,
    by: displayName.value,
  }, pairChannelId.value);

  playSharedAnchorSync();
  fireDualCannons();
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([40, 80, 40, 80]);
  }
  showToast(`🎉 Claimed Couple Synergy Reward: "${reward.item}"! Enjoy together with ${partnerDisplayName.value}! ❤️`, 5000);
};

const handleOpenRewardVault = () => {
  activeMobileTab.value = 'rewards';
  setTimeout(() => {
    const el = document.getElementById('rewards');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
  showToast('🎁 Navigated to Reward Vault!');
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
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', isDark ? '#040911' : '#f8fafc');
  }
};

const toggleTheme = () => {
  darkMode.value = !darkMode.value;
  saveState();
};

watch(darkMode, (newVal) => {
  applyTheme(newVal);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('habuilt_theme', newVal ? 'dark' : 'light');
  }
}, { immediate: true });

// ── Circadian Auto-Ambient Glow Engine ──
const {
  CIRCADIAN_PHASES,
  activeCircadianMode,
  currentPhaseKey: circadianPhaseKey,
  currentPhase: circadianPhase,
  setCircadianMode,
  cycleNextPhase: cycleCircadianPhase,
} = useCircadianAtmosphere(computed(() => darkMode.value));

const handleCycleCircadianAtmosphere = () => {
  const next = cycleCircadianPhase();
  showToast(`✨ Atmosphere: ${next.name} (${activeCircadianMode.value})`);
};

// ── Service Worker Periodic Background Sync Listener ──
const handleSwPeriodicSync = (event) => {
  if (event.data?.type === 'HABUILT_PERIODIC_SYNC') {
    refreshPartnerLiveMetrics();
    syncCloudState(false);
  }
};

// Distraction-Free Zen Focus Mode (Apple / Linear Grade Flow)
const zenMode = ref(
  typeof window !== 'undefined'
    ? localStorage.getItem('habuilt.zen_mode') === 'true'
    : false
);

const toggleZenMode = () => {
  zenMode.value = !zenMode.value;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('habuilt.zen_mode', zenMode.value ? 'true' : 'false');
  }
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(zenMode.value ? [20, 40, 20] : 15);
  }
  showToast(zenMode.value ? '🧘 Zen Focus Mode Activated: Distraction-free flow' : '✨ Zen Focus Mode Deactivated');
};

const handleZenKeyDown = (e) => {
  // Only trigger on 'z' or 'Z' without ctrl/meta/alt
  if (e.key && e.key.toLowerCase() === 'z' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const activeEl = document.activeElement;
    if (activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.isContentEditable)) {
      return;
    }
    if (isSpotlightOpen.value) return;

    e.preventDefault();
    toggleZenMode();
  }
};

watch(zenMode, (newVal) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('habuilt.zen_mode', newVal ? 'true' : 'false');
  }
});

watch(partnerViewOpen, (open) => {
  if (open) {
    refreshPartnerLiveMetrics();
  }
});

onMounted(async () => {
  applyTheme(darkMode.value);
  await loadProtocols();

  // Load partner connection
  try {
    const conn = await getPartnerConnection(effectiveUserId.value);
    if (conn) {
      activePartnerConnection.value = conn;
      refreshPartnerLiveMetrics();
    }
  } catch (e) {
    console.warn('[Dashboard] partner init error:', e);
  }

  // Handle instant pairing via URL hash (e.g. #pair=HAB-8942)
  if (typeof window !== 'undefined' && window.location.hash.startsWith('#pair=')) {
    const rawPairCode = window.location.hash.replace('#pair=', '').trim();
    if (rawPairCode) {
      try {
        const conn = await pairWithInviteCode(effectiveUserId.value, rawPairCode);
        activePartnerConnection.value = conn;
        refreshPartnerLiveMetrics();
        showToast(`❤️ Partner connection established via invite link (${rawPairCode})!`);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (err) {
        showToast(err.message || 'Could not pair via link');
      }
    }
  }

  // If first-time user / guest, trigger onboarding wizard
  if (!isAshish.value && !isJyoti.value && (!localHabits.value || localHabits.value.length === 0)) {
    const onboarded = localStorage.getItem(`habuilt_onboarded_${effectiveUserId.value}`);
    if (!onboarded) {
      setTimeout(() => {
        isProtocolWizardOpen.value = true;
        localStorage.setItem(`habuilt_onboarded_${effectiveUserId.value}`, 'true');
      }, 1000);
    }
  }
});

const weeklyReviewExpanded = ref(false);
const isNative = computed(() => typeof window !== 'undefined' && Capacitor.isNativePlatform());
const toastMessage = ref('');
let toastTimeoutId = null;

const showToast = (message, duration = 2800) => {
  toastMessage.value = message;
  if (toastTimeoutId) clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    toastMessage.value = '';
  }, duration);
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
  const dow = getDayOfWeek(dayNum);
  if (Array.isArray(habit.daysOfWeek) && habit.daysOfWeek.length > 0) {
    return habit.daysOfWeek.includes(dow);
  }
  if (habit.scheduleType === 'weekdays') {
    return dow >= 1 && dow <= 5;
  }
  if (habit.scheduleType === 'weekends') {
    return dow === 0 || dow === 6;
  }
  if (habit.scheduleType === 'custom' && Array.isArray(habit.customDays)) {
    const customDow = dow === 0 ? 7 : dow;
    return habit.customDays.includes(customDow) || habit.customDays.includes(dow);
  }
  return true;
};

// Habits actually scheduled for TODAY (props.currentDay) — independent of the mobile checklist's
// navigated day and independent of the all/scheduled view toggle. This is what "today's" stat
// badges (top bar, bottom nav, share card) should always divide by, not the full master list.
const todayScheduledHabits = computed(() => visibleHabits.value.filter(h => isHabitScheduledForDay(h, props.currentDay)));
const todayScheduledCount = computed(() => todayScheduledHabits.value.length);
const todayPossibleDailyPoints = computed(() => {
  const sum = (todayScheduledHabits.value || []).reduce((acc, h) => acc + (Number(h.points) || 1), 0);
  return sum > 0 ? sum : 15;
});

// Dynamic Percentage-Based Tiers Engine (Floor: 25%, Half: 50%, Full: 100% of daily scheduled points, or custom overrides)
const tierThresholds = computed(() => {
  const target = todayPossibleDailyPoints.value || 15;
  const custom = progressiveSettings.value?.customTiers || {};

  let floorPts, halfPts, fullPts;
  if (custom.isFixed) {
    floorPts = Math.max(1, Number(custom.floor) || 4);
    halfPts = Math.max(floorPts + 1, Number(custom.half) || 8);
    fullPts = Math.max(halfPts + 1, Number(custom.full) || 15);
  } else {
    const fPct = custom.floorPct !== undefined ? Number(custom.floorPct) : 25;
    const hPct = custom.halfPct !== undefined ? Number(custom.halfPct) : 50;
    const uPct = custom.fullPct !== undefined ? Number(custom.fullPct) : 100;
    floorPts = custom.floor !== undefined && custom.floor > 0
      ? Number(custom.floor)
      : Math.max(1, Math.round(target * (fPct / 100)));
    halfPts = custom.half !== undefined && custom.half > 0
      ? Number(custom.half)
      : Math.max(floorPts + 1, Math.round(target * (hPct / 100)));
    fullPts = custom.full !== undefined && custom.full > 0
      ? Number(custom.full)
      : Math.max(halfPts + 1, Math.round(target * (uPct / 100)));
  }

  return {
    floor: floorPts,
    half: halfPts,
    full: fullPts,
    target: target
  };
});

const scheduleFilterMode = ref('scheduled'); // 'scheduled' (active for this day) | 'all' (all master habits)

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
  return source.filter(h => getTimeSlotForHabit(h.id, h) === activeTimeFilter.value);
});

const isMobileDayWeekend = computed(() => {
  const dow = getDayOfWeek(mobileDay.value);
  return dow === 0 || dow === 6;
});

const dynamicTimeSlotDefinitions = computed(() => {
  const customSlots = progressiveSettings.value?.customTimeSlots;
  const baseSlots = (customSlots && Object.keys(customSlots).length > 0)
    ? customSlots
    : (protocolTimeSlotDefinitions.value || timeSlotDefinitions);

  if (isMobileDayWeekend.value && baseSlots.work) {
    return {
      ...baseSlots,
      work: { label: 'Weekend Focus & Family', time: baseSlots.work?.time || '08:30–18:30', emoji: '✨', color: '#D4B36A' },
    };
  }
  return baseSlots;
});

const timeSlotCounts = computed(() => {
  const source = activeHabitsForMobileDay.value;
  const defs = dynamicTimeSlotDefinitions.value || {};
  const counts = { all: source.length };
  Object.keys(defs).forEach(k => { counts[k] = 0; });
  source.forEach(h => {
    const slot = getTimeSlotForHabit(h.id, h);
    if (counts[slot] === undefined) counts[slot] = 0;
    counts[slot]++;
  });
  return counts;
});

const timeSlotCompleted = computed(() => {
  const day = mobileDay.value;
  const source = activeHabitsForMobileDay.value;
  const defs = dynamicTimeSlotDefinitions.value || {};
  const comp = { all: 0 };
  Object.keys(defs).forEach(k => { comp[k] = 0; });
  source.forEach(h => {
    if (hasCompletedDay(h, day)) {
      comp.all++;
      const slot = getTimeSlotForHabit(h.id, h);
      if (comp[slot] === undefined) comp[slot] = 0;
      comp[slot]++;
    }
  });
  return comp;
});

const timelineGroupedHabits = computed(() => {
  const source = filteredHabits.value;
  const defs = dynamicTimeSlotDefinitions.value || {};
  const slotKeys = Object.keys(defs);
  const groups = slotKeys.map(key => ({
    slot: key,
    meta: defs[key],
    habits: []
  }));
  const groupMap = Object.fromEntries(groups.map(g => [g.slot, g.habits]));
  source.forEach(h => {
    const slot = getTimeSlotForHabit(h.id, h);
    if (groupMap[slot]) groupMap[slot].push(h);
    else if (groupMap.anytime) groupMap.anytime.push(h);
    else if (groups.length > 0) groups[0].habits.push(h);
  });

  // Strict chronological sorting inside timed routine slots
  groups.forEach(g => {
    g.habits.sort((a, b) => {
      const timeA = a.startTime || habitTimeSchedule[a.id]?.start || (a.name || '').match(/^(\d{2}:\d{2})/)?.[1] || '99:99';
      const timeB = b.startTime || habitTimeSchedule[b.id]?.start || (b.name || '').match(/^(\d{2}:\d{2})/)?.[1] || '99:99';
      return timeA.localeCompare(timeB);
    });
  });

  return groups.filter(g => g.habits.length > 0);
});

const missingDefaultHabits = computed(() => {
  const currentIds = new Set((localHabits.value || []).map(h => h.id));
  return fallbackHabits.value.filter(dh => !currentIds.has(dh.id));
});

const mobileDayCompleted = computed(() => activeHabitsForMobileDay.value.filter(h => hasCompletedDay(h, mobileDay.value)).length);
const mobileDayPoints = computed(() => getDayTotal(mobileDay.value));
// Denominators for the checklist's own progress bar — scoped to whatever day is being viewed
// (mobileDay) and respecting the scheduled/all toggle, so a Sunday never gets judged against
// a weekday's habit count.
const mobileDayTotalHabits = computed(() => activeHabitsForMobileDay.value.length);
const maxDailyPoints = computed(() => activeHabitsForMobileDay.value.reduce((sum, h) => sum + h.points, 0));

// Up Next Engine
const habitTimeSchedule = {
  // ── Ashish home mode (04:45 wake-up + integrated MOVERS Sadhana protocol) ──
  'a-64': { start: '04:45', end: '04:55' },
  'a-1': { start: '04:55', end: '05:00' }, 'a-2': { start: '04:55', end: '05:00' },
  'a-5': { start: '05:00', end: '05:20' },
  'a-55': { start: '05:20', end: '05:35' },
  'a-54': { start: '05:35', end: '05:45' },
  'a-56': { start: '05:45', end: '05:50' }, 'a-57': { start: '05:50', end: '05:55' },
  'a-58': { start: '05:55', end: '06:00' }, 'a-3': { start: '06:00', end: '06:05' },
  'a-4': { start: '06:05', end: '06:35' },
  'a-72': { start: '06:05', end: '06:25' },
  'a-6': { start: '06:05', end: '06:40' },
  'a-60': { start: '06:00', end: '06:40' },
  'a-7': { start: '06:35', end: '06:45' },
  'a-66': { start: '06:45', end: '06:55' },
  'a-9': { start: '06:55', end: '07:05' },
  'a-8': { start: '07:05', end: '07:20' },
  'a-67': { start: '07:20', end: '07:30' },
  'a-61': { start: '07:30', end: '07:35' },
  'a-10': { start: '07:35', end: '08:30' },
  'a-77': { start: '07:35', end: '07:50' },
  'a-78': { start: '08:00', end: '08:05' },
  'a-11': { start: '08:30', end: '08:45' }, 'a-12': { start: '08:45', end: '10:15' },
  'a-13': { start: '10:30', end: '10:40' },
  'a-28': { start: '10:30', end: '11:00' }, 'a-31': { start: '10:30', end: '11:00' },
  'a-14': { start: '11:00', end: '12:30' },
  'a-15': { start: '12:30', end: '12:45' }, 'a-16': { start: '12:45', end: '14:00' },
  'a-70': { start: '13:45', end: '14:00' },
  'a-29': { start: '14:00', end: '14:45' }, 'a-51': { start: '14:45', end: '14:50' },
  'a-68': { start: '14:50', end: '15:00' },
  'a-17': { start: '15:00', end: '15:15' },
  'a-62': { start: '09:00', end: '18:00' },
  'a-18': { start: '15:15', end: '16:45' },
  'a-79': { start: '16:00', end: '19:00' },
  'a-59': { start: '15:00', end: '16:30' },
  'a-53': { start: '17:00', end: '18:00' },
  'a-19': { start: '18:30', end: '18:35' }, 'a-20': { start: '18:35', end: '19:05' },
  'a-43': { start: '19:05', end: '19:25' }, 'a-21': { start: '19:25', end: '20:15' },
  'a-71': { start: '19:45', end: '20:00' },
  'a-30': { start: '19:25', end: '20:15' },
  'a-22': { start: '20:15', end: '20:30' },
  'a-76': { start: '20:35', end: '20:45' },
  'a-23': { start: '20:45', end: '21:00' },
  'a-24': { start: '21:00', end: '21:05' }, 'a-25': { start: '21:05', end: '21:15' },
  'a-52': { start: '21:15', end: '21:20' },
  'a-69': { start: '21:20', end: '21:30' },
  'a-26': { start: '21:35', end: '21:40' }, 'a-63': { start: '21:40', end: '21:50' },
  'a-27': { start: '22:00', end: '23:59' },
  'a-37': { start: '09:30', end: '10:15' },
  'a-74': { start: '13:30', end: '14:00' },
  'a-75': { start: '17:00', end: '17:30' },
  'a-38': { start: '11:00', end: '13:00' },
  'a-39': { start: '13:00', end: '14:00' },
  'a-40': { start: '16:00', end: '16:30' },
  'a-42': { start: '16:30', end: '16:45' },
  'a-49': { start: '11:00', end: '13:00' },
  'a-50': { start: '11:00', end: '12:00' },

  // ── Jyoti ──
  'j-1': { start: '05:00', end: '08:00' }, 'j-2': { start: '08:00', end: '08:05' },
  'j-37': { start: '08:00', end: '08:05' },
  'j-4': { start: '08:05', end: '09:05' }, 'j-9': { start: '09:05', end: '09:45' },
  'j-41': { start: '09:05', end: '09:45' },
  'j-10': { start: '09:45', end: '10:15' }, 'j-38': { start: '09:45', end: '10:15' },
  'j-36': { start: '10:15', end: '11:00' },
  'j-11': { start: '11:00', end: '11:15' }, 'j-12': { start: '11:15', end: '13:00' },
  'j-42': { start: '12:00', end: '12:10' },
  'j-14': { start: '13:00', end: '14:00' }, 'j-6': { start: '14:00', end: '14:45' },
  'j-15': { start: '16:00', end: '17:00' },
  'j-16': { start: '17:00', end: '17:20' }, 'j-17': { start: '17:30', end: '18:35' },
  'j-18': { start: '18:35', end: '19:05' }, 'j-19': { start: '19:25', end: '20:15' },
  'j-20': { start: '20:15', end: '20:30' }, 'j-21': { start: '20:45', end: '21:30' },
  'j-40': { start: '21:15', end: '21:30' },
  'j-22': { start: '21:30', end: '23:59' },
  'j-29': { start: '09:30', end: '10:15' },
  'j-39': { start: '13:30', end: '14:00' },
  'j-31': { start: '16:30', end: '17:30' },
  'j-32': { start: '15:00', end: '15:30' },
  'j-33': { start: '16:00', end: '19:00' },
  'j-34': { start: '11:00', end: '12:00' },
  'j-35': { start: '15:00', end: '16:30' },

  // ── Ashish travel mode (Chandigarh — confirmed 06:30-09:15 out, 13:30-16:30 return) ──
  'at-1': { start: '04:45', end: '04:55' }, 'at-2': { start: '04:55', end: '05:00' },
  'at-3': { start: '05:00', end: '05:20' }, 'at-4': { start: '05:20', end: '05:40' },
  'at-5': { start: '05:40', end: '05:50' }, 'at-6': { start: '05:50', end: '06:05' },
  'at-7': { start: '06:05', end: '06:20' }, 'at-8': { start: '06:20', end: '06:30' },
  'at-9': { start: '06:30', end: '09:15' }, 'at-10': { start: '09:15', end: '09:30' },
  'at-11': { start: '09:30', end: '13:00' }, 'at-12': { start: '13:00', end: '13:30' },
  'at-13': { start: '13:30', end: '16:30' }, 'at-14': { start: '16:30', end: '17:00' },
  'at-15': { start: '17:00', end: '18:00' }, 'at-16': { start: '18:00', end: '18:30' },
  'at-17': { start: '18:35', end: '19:05' }, 'at-18': { start: '19:25', end: '20:15' },
  'at-19': { start: '20:15', end: '20:30' }, 'at-20': { start: '20:45', end: '21:00' },
  'at-21': { start: '21:00', end: '21:05' }, 'at-22': { start: '21:05', end: '21:15' },
  'at-23': { start: '21:15', end: '21:25' }, 'at-24': { start: '21:30', end: '23:59' },
  'at-29': { start: '13:00', end: '13:30' }, 'at-30': { start: '04:55', end: '05:00' },

  // ── Ashish office mid-week (Tue–Thu flat→office, 30min commute) ──
  'ao-1': { start: '05:15', end: '05:25' }, 'ao-2': { start: '05:25', end: '05:30' },
  'ao-3': { start: '05:30', end: '05:50' }, 'ao-4': { start: '05:50', end: '06:00' },
  'ao-5': { start: '06:00', end: '06:10' }, 'ao-6': { start: '06:10', end: '06:25' },
  'ao-7': { start: '06:25', end: '06:45' }, 'ao-8': { start: '06:45', end: '07:00' },
  'ao-9': { start: '07:00', end: '07:30' }, 'ao-10': { start: '07:30', end: '11:00' },
  'ao-11': { start: '10:30', end: '11:00' }, 'ao-12': { start: '11:00', end: '11:30' },
  'ao-13': { start: '11:30', end: '11:45' }, 'ao-14': { start: '11:45', end: '13:15' },
  'ao-15': { start: '13:15', end: '13:45' }, 'ao-16': { start: '13:45', end: '14:00' },
  'ao-17': { start: '14:00', end: '15:30' }, 'ao-18': { start: '15:30', end: '15:45' },
  'ao-19': { start: '15:45', end: '17:15' }, 'ao-20': { start: '17:15', end: '18:00' },
  'ao-21': { start: '18:00', end: '18:10' }, 'ao-22': { start: '18:10', end: '18:30' },
  'ao-23': { start: '18:30', end: '19:00' }, 'ao-24': { start: '19:00', end: '19:30' },
  'ao-25': { start: '19:30', end: '19:45' }, 'ao-26': { start: '20:00', end: '20:30' },
  'ao-27': { start: '20:30', end: '20:45' }, 'ao-28': { start: '20:45', end: '21:15' },
  'ao-29': { start: '21:15', end: '23:59' },

  // ── Ashish office Friday (flat→office→return to Ludhiana) ──
  'af-1': { start: '05:15', end: '05:25' }, 'af-2': { start: '05:25', end: '05:30' },
  'af-3': { start: '05:30', end: '05:50' }, 'af-4': { start: '05:50', end: '06:00' },
  'af-5': { start: '06:00', end: '06:10' }, 'af-6': { start: '06:10', end: '06:25' },
  'af-7': { start: '06:25', end: '06:45' }, 'af-8': { start: '06:45', end: '07:00' },
  'af-9': { start: '07:00', end: '07:30' }, 'af-10': { start: '07:30', end: '11:00' },
  'af-11': { start: '10:30', end: '11:00' },
  'af-12': { start: '11:00', end: '14:00' },
  'af-13': { start: '14:00', end: '14:15' }, 'af-14': { start: '14:15', end: '14:45' },
  'af-15': { start: '14:45', end: '15:00' }, 'af-16': { start: '15:00', end: '16:30' },
  'af-17': { start: '16:30', end: '16:45' }, 'af-18': { start: '16:45', end: '17:30' },
  'af-19': { start: '17:30', end: '18:15' }, 'af-20': { start: '18:15', end: '18:35' },
  'af-21': { start: '18:35', end: '19:05' }, 'af-22': { start: '19:05', end: '19:25' },
  'af-23': { start: '19:25', end: '20:15' }, 'af-24': { start: '20:15', end: '20:30' },
  'af-25': { start: '20:45', end: '21:00' }, 'af-26': { start: '21:00', end: '21:05' },
  'af-27': { start: '21:05', end: '21:15' }, 'af-28': { start: '21:15', end: '21:25' },
  'af-29': { start: '21:30', end: '23:59' },

  // ── Ashish half-day & holiday creative / errand blocks ──
  'ah-1': { start: '15:15', end: '16:45' },
  'ah-2': { start: '16:45', end: '17:30' },
  'ah-3': { start: '17:30', end: '18:30' },
};

const getScheduleForHabit = (habit) => {
  if (!habit) return null;
  if (habitTimeSchedule[habit.id]) return habitTimeSchedule[habit.id];
  if (habit.startTime && habit.endTime) return { start: habit.startTime, end: habit.endTime };
  const match = (habit.name || '').match(/^(\d{2}:\d{2})/);
  if (match) {
    const start = match[1];
    const [h, m] = start.split(':').map(Number);
    const endMins = ((h * 60 + m + 30) % 1440);
    const eh = String(Math.floor(endMins / 60)).padStart(2, '0');
    const em = String(endMins % 60).padStart(2, '0');
    return { start, end: `${eh}:${em}` };
  }
  return null;
};

const upNextHabitInfo = computed(() => {
  if (!props.isCurrentMonth) return null;
  const now = currentClock.value;
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const uncompleted = visibleHabits.value.filter(h => isHabitScheduledForDay(h, props.currentDay) && !hasCompletedDay(h, props.currentDay));
  if (uncompleted.length === 0) return null;

  for (const habit of uncompleted) {
    const sched = getScheduleForHabit(habit);
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
    const sched = getScheduleForHabit(habit);
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
  debouncedSaveState(400);
};
const toggleHabitNote = (habitId, day) => {
  const key = `${habitId}:${day}`;
  habitNotesOpen.value = habitNotesOpen.value === key ? null : key;
};

// ── Canonical Habit Mapping & Historical Completion Preservation ──
const getCanonicalHabitKey = (name) => {
  if (!name || typeof name !== 'string') return '';
  const lower = name.toLowerCase()
    .replace(/^\d{2}:\d{2}\s*/, '')
    .replace(/[★•·\(\)\[\]\—\-–:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (lower.includes('spinal mobility')) return 'canonical:spinal-mobility';
  if (lower.includes('warm water') || lower.includes('b12') || lower.includes('lemon')) return 'canonical:warm-water-b12';
  if (lower.includes('padma sadhana') || lower.includes('surya namaskar')) return 'canonical:padma-sadhana-surya';
  if (lower.includes('sudarshan kriya') || lower.includes('kriya') || lower.includes('pranayama')) return 'canonical:sudarshan-kriya';
  if (lower.includes('meditation')) return 'canonical:meditation';
  if (lower.includes('visualization') || lower.includes('sankalpa')) return 'canonical:visualization';
  if (lower.includes('reading')) return 'canonical:reading';
  if (lower.includes('scribing') || lower.includes('stiffness log')) return 'canonical:scribing-stiffness';
  if (lower.includes('sunlight') || lower.includes('fresh air')) return 'canonical:sunlight';
  if (lower.includes('workout') || lower.includes('strength') || lower.includes('cardio')) return 'canonical:workout';
  if (lower.includes('abhyanga') || lower.includes('sesame oil')) return 'canonical:abhyanga';
  if (lower.includes('shower') || lower.includes('grooming')) return 'canonical:shower-grooming';
  if (lower.includes('breakfast') || lower.includes('soaked nuts') || lower.includes('papaya')) return 'canonical:breakfast';
  if (lower.includes('mineral bottle') || lower.includes('water protocol') || lower.includes('water intake') || lower.includes('3 litres daily water') || lower.includes('3.5l daily water')) return 'canonical:water-protocol';
  if (lower.includes('baby duty') || (lower.includes('shaarvi') && (lower.includes('take') || lower.includes('play') || lower.includes('bath') || lower.includes('time') || lower.includes('wind-down')))) return 'canonical:shaarvi-duty';
  if (lower.includes('1-3-5') || lower.includes('top priority')) return 'canonical:1-3-5-priorities';
  if (lower.includes('block 1') || lower.includes('deep architecture') || lower.includes('office focus') || lower.includes('chandigarh office')) return 'canonical:deep-work-block-1';
  if (lower.includes('block 2') || lower.includes('high-leverage') || lower.includes('pipeline')) return 'canonical:deep-work-block-2';
  if (lower.includes('block 3') || lower.includes('technical execution')) return 'canonical:deep-work-block-3';
  if (lower.includes('block 4') || lower.includes('ops / client')) return 'canonical:deep-work-block-4';
  if (lower.includes('lunch')) return 'canonical:lunch';
  if (lower.includes('post-lunch walk') || (lower.includes('walk') && lower.includes('lunch'))) return 'canonical:post-lunch-walk';
  if (lower.includes('eye drops')) return 'canonical:eye-drops';
  if (lower.includes('shutdown') || lower.includes('work day shutdown') || lower.includes('work shutdown')) return 'canonical:shutdown-ritual';
  if (lower.includes('stroller walk') || lower.includes('family stroller walk') || (lower.includes('walk') && lower.includes('jyoti') && lower.includes('shaarvi'))) return 'canonical:family-walk';
  if (lower.includes('dinner preparation') || lower.includes('family dinner') || lower.includes('dinner')) return 'canonical:dinner';
  if (lower.includes('post-dinner stroll') || lower.includes('post-dinner walk') || (lower.includes('stroll') && lower.includes('dinner'))) return 'canonical:post-dinner-stroll';
  if (lower.includes('kitchen reset') || lower.includes('counter clean')) return 'canonical:kitchen-reset';
  if (lower.includes('journaling') || lower.includes('3 wins')) return 'canonical:journaling-3-wins';
  if (lower.includes('magnesium') || lower.includes('night supplement')) return 'canonical:magnesium';
  if (lower.includes('spinal wind-down') || lower.includes('decompression')) return 'canonical:spinal-wind-down';
  if (lower.includes('lights out') || lower.includes('sleep') || lower.includes('in bed')) return 'canonical:lights-out';
  if (lower.includes('movement break') || lower.includes('45 minutes')) return 'canonical:movement-break-45m';
  if (lower.includes('scalp care') || lower.includes('hair protocol')) return 'canonical:scalp-care';
  if (lower.includes('zero screen time') || lower.includes('screen blackout') || lower.includes('screen off')) return 'canonical:zero-screen-family';
  if (lower.includes('no refined sugar') || lower.includes('clean whole foods') || lower.includes('junk food')) return 'canonical:no-refined-sugar';
  if (lower.includes('d3') || lower.includes('omega-3')) return 'canonical:d3-omega3';

  return `custom:${lower}`;
};

// Global reactive completion map across all active and historical habits
const canonicalCompletionsMap = computed(() => {
  const map = {};
  const allHabitSources = [...(localHabits.value || []), ...(allHistoricalHabits.value || [])];
  for (const h of allHabitSources) {
    if (!h || !Array.isArray(h.completed_days)) continue;
    const canonKey = getCanonicalHabitKey(h.name);
    if (!canonKey) continue;
    if (!map[canonKey]) map[canonKey] = new Set();
    for (const d of h.completed_days) {
      map[canonKey].add(Number(d));
    }
  }
  return map;
});

// Points & Check-in Logic
const keyFor = (habitId, day) => `${habitId}-${day}`;
const hasCompletedDay = (habit, day) => {
  if (!habit) return false;
  const numDay = Number(day);
  const cellKey = keyFor(habit.id, numDay);
  if (pendingCells.value[cellKey] !== undefined) return pendingCells.value[cellKey];

  // 1. Direct check on habit's completed_days
  if (Array.isArray(habit.completed_days) && habit.completed_days.some(d => Number(d) === numDay)) {
    return true;
  }

  // 2. Canonical check: if another equivalent habit in our state was completed on that day
  const canonKey = getCanonicalHabitKey(habit.name);
  if (canonKey && canonicalCompletionsMap.value[canonKey]?.has(numDay)) {
    return true;
  }

  return false;
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

const getDayTotal = (day) => {
  const numDay = Number(day);
  let total = 0;
  const countedCanonicalKeys = new Set();
  const countedHabitIds = new Set();

  // 1. Sum completions from visible active habits
  for (const h of (visibleHabits.value || [])) {
    if (hasCompletedDay(h, numDay)) {
      total += Number(h.points) || 1;
      const canonKey = getCanonicalHabitKey(h.name);
      if (canonKey) countedCanonicalKeys.add(canonKey);
      countedHabitIds.add(String(h.id));
    }
  }

  // 2. Also include any historical / preset-specific completions from that day not currently visible
  for (const h of (allHistoricalHabits.value || [])) {
    if (countedHabitIds.has(String(h.id))) continue;
    const canonKey = getCanonicalHabitKey(h.name);
    if (canonKey && countedCanonicalKeys.has(canonKey)) continue;

    if (Array.isArray(h.completed_days) && h.completed_days.some(d => Number(d) === numDay)) {
      total += Number(h.points) || 1;
      if (canonKey) countedCanonicalKeys.add(canonKey);
      countedHabitIds.add(String(h.id));
    }
  }

  return total;
};

const todayPoints = computed(() => getDayTotal(props.currentDay));
const todayCompletedCount = computed(() => todayScheduledHabits.value.filter(h => hasCompletedDay(h, props.currentDay)).length);

// Milestone 4: Dynamic PWA Badging Integration
const remainingTodayHabitsCount = computed(() => {
  const sched = todayScheduledCount.value || 0;
  const comp = todayCompletedCount.value || 0;
  return Math.max(0, sched - comp);
});
useAppBadging({
  remainingCount: remainingTodayHabitsCount,
});

// ── Celebration Milestones Watcher (Dynamic Floor, Half, Full) ──
const celebratedMilestones = ref(new Set());
watch(todayPoints, (newPts, oldPts) => {
  if (props.isCurrentMonth && newPts > (oldPts || 0)) {
    const t = tierThresholds.value;
    if (newPts >= t.full && !celebratedMilestones.value.has('full')) {
      celebratedMilestones.value.add('full');
      celebratedMilestones.value.add('half');
      celebratedMilestones.value.add('floor');
      fireTierMilestone('full');
    } else if (newPts >= t.half && !celebratedMilestones.value.has('half')) {
      celebratedMilestones.value.add('half');
      celebratedMilestones.value.add('floor');
      fireTierMilestone('half');
    } else if (newPts >= t.floor && !celebratedMilestones.value.has('floor')) {
      celebratedMilestones.value.add('floor');
      fireTierMilestone('floor');
    }
  }
});

const autoProtocolTier = computed(() => {
  const pts = todayPoints.value;
  const t = tierThresholds.value;
  if (pts >= t.full) return { title: '🏆 Full Target', tier: 'Full' };
  if (pts >= t.half)  return { title: '⚡ Half Hit', tier: 'Half' };
  if (pts >= t.floor)  return { title: '🛡️ Floor Safe', tier: 'Floor' };
  return { title: '🌱 Building Momentum', tier: 'Base' };
});

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
  const todayDone = getDayTotal(maxDay) > 0;
  const startDay = (props.isCurrentMonth && !todayDone) ? maxDay - 1 : maxDay;
  for (let d = startDay; d >= 1; d--) {
    if (getDayTotal(d) > 0) current++;
    else break;
  }
  return { current, best: Math.max(best, current) };
});

const consistencyScore = computed(() => {
  const daysEvaluated = props.isCurrentMonth ? props.currentDay : props.monthDays;
  if (daysEvaluated === 0) return 0;
  let totalScore = 0;
  const t = tierThresholds.value;
  for (let d = 1; d <= daysEvaluated; d++) {
    const pts = getDayTotal(d);
    if (pts >= t.full) totalScore += 100;      // Full Protocol
    else if (pts >= t.half) totalScore += 75;   // Half Protocol
    else if (pts >= t.floor) totalScore += 50;  // Floor Protocol (protected)
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

// XP & Level (Total Lifetime XP across all historical and current months)
const totalXP = computed(() => (earnedBeforeCurrentMonth.value + monthlyTotalEarned.value) * 10);
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
  if (lv >= 10) return 'Sovereign Peak';
  if (lv >= 7) return 'Strategic Mastery';
  if (lv >= 5) return 'Executive Leverage';
  if (lv >= 3) return 'Consistent Focus';
  return 'Baseline Discipline';
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
    const todayDone = hasCompletedDay(h, maxDay);
    const startDay = (props.isCurrentMonth && !todayDone) ? maxDay - 1 : maxDay;
    for (let d = startDay; d >= 1; d--) {
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
  if (!habit) return;
  const numDay = Number(day || mobileDay.value || props.currentDay || new Date().getDate());

  // If user tapped on a future day, smoothly jump to Today and show Toast
  if (isFutureDay(numDay)) {
    mobileGoToday();
    showToast(`📅 Switched to Today (${mobileDayLabel.value})! Tap to mark "${habit.name}" done.`, 3000);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
    return;
  }

  if (!localHabits.value || localHabits.value.length === 0) {
    localHabits.value = fallbackHabits.value.map(h => ({ ...h, completed_days: [] }));
  }

  const canonKey = getCanonicalHabitKey(habit.name);
  const isCurrentlyDone = hasCompletedDay(habit, numDay);
  const nextDone = !isCurrentlyDone;

  // 1. Update localHabits (both matching ID and canonical equivalents)
  localHabits.value = localHabits.value.map(h => {
    const matchId = String(h.id) === String(habit.id);
    const matchCanon = canonKey && getCanonicalHabitKey(h.name) === canonKey;
    if (matchId || matchCanon) {
      const cd = Array.isArray(h.completed_days) ? h.completed_days.map(Number) : [];
      let newCd = cd.filter(d => d !== numDay);
      if (nextDone) newCd.push(numDay);
      return { ...h, completed_days: newCd };
    }
    return h;
  });

  // 2. Synchronize allHistoricalHabits
  let histFound = false;
  allHistoricalHabits.value = (allHistoricalHabits.value || []).map(h => {
    const matchId = String(h.id) === String(habit.id);
    const matchCanon = canonKey && getCanonicalHabitKey(h.name) === canonKey;
    if (matchId || matchCanon) {
      histFound = true;
      const cd = Array.isArray(h.completed_days) ? h.completed_days.map(Number) : [];
      let newCd = cd.filter(d => d !== numDay);
      if (nextDone) newCd.push(numDay);
      return { ...h, completed_days: newCd };
    }
    return h;
  });

  if (!histFound && nextDone) {
    allHistoricalHabits.value.push({
      id: habit.id,
      name: habit.name,
      points: Number(habit.points) || 1,
      completed_days: [numDay],
      canonicalKey: canonKey,
    });
  }

  saveState();
  syncDueNowNotification?.();

  // Normalized Real-Time Ledger Persistence & Partner Broadcast
  if (effectiveUserId.value && effectiveUserId.value !== 'guest') {
    const checkInDate = `${props.year}-${String(props.month).padStart(2, '0')}-${String(numDay).padStart(2, '0')}`;
    if (nextDone) {
      recordHabitCheckIn({
        userId: effectiveUserId.value,
        habitId: habit.id,
        habitName: habit.name,
        monthKey: monthScope.value,
        day: numDay,
        completedOn: checkInDate,
        points: habit.points || 1,
        canonicalKey: canonKey,
        source: 'web',
      });

      const sharedInfo = getSharedHabitInfo(habit.id);
      if (sharedInfo || isPartnerPaired.value) {
        broadcastPartnerEvent({
          type: sharedInfo ? 'shared_habit_done' : 'habit_completed',
          partner: isAshish.value ? 'Ashish' : (isJyoti.value ? 'Jyoti' : displayName.value),
          userId: effectiveUserId.value,
          habitId: habit.id,
          habitName: habit.name,
          points: habit.points || 1,
          day: numDay,
        }, pairChannelId.value);
      }
    } else {
      removeHabitCheckIn({
        userId: effectiveUserId.value,
        habitId: habit.id,
        monthKey: monthScope.value,
        day: numDay,
      });
    }
  } else {
    // Guest or offline/local pairing mode: broadcast to local tab channel if paired
    if (nextDone && isPartnerPaired.value) {
      const sharedInfo = getSharedHabitInfo(habit.id);
      broadcastPartnerEvent({
        type: sharedInfo ? 'shared_habit_done' : 'habit_completed',
        partner: displayName.value,
        userId: effectiveUserId.value,
        habitId: habit.id,
        habitName: habit.name,
        points: habit.points || 1,
        day: numDay,
      }, pairChannelId.value);
    }
  }

  // Optional non-blocking Laravel Backend Sync when running in Inertia environment
  if (typeof window !== 'undefined' && window.__inertia_app && habit.id) {
    const checkInDate = `${props.year}-${String(props.month).padStart(2, '0')}-${String(numDay).padStart(2, '0')}`;
    try {
      if (nextDone) {
        fetch(`/habits/${habit.id}/check-ins`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ completed_on: checkInDate }),
        }).catch(() => {});
      } else {
        fetch(`/habits/${habit.id}/check-ins`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ completed_on: checkInDate }),
        }).catch(() => {});
      }
    } catch {}
  }

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([12]);
    } catch (_) {}
  }
};

// Direct complete habit handler from background notification action
const markHabitCompletedDirectly = (habitId, day) => {
  const numDay = Number(day);
  const key = keyFor(habitId, numDay);
  delete pendingCells.value[key];

  const targetHabit = (localHabits.value || []).find(h => String(h.id) === String(habitId))
    || (allHistoricalHabits.value || []).find(h => String(h.id) === String(habitId));
  const canonKey = targetHabit ? getCanonicalHabitKey(targetHabit.name) : '';

  localHabits.value = (localHabits.value || []).map(h => {
    const matchId = String(h.id) === String(habitId);
    const matchCanon = canonKey && getCanonicalHabitKey(h.name) === canonKey;
    if (matchId || matchCanon) {
      const cd = Array.isArray(h.completed_days) ? h.completed_days.map(Number) : [];
      if (!cd.includes(numDay)) {
        return { ...h, completed_days: [...cd, numDay] };
      }
    }
    return h;
  });

  let histFound = false;
  allHistoricalHabits.value = (allHistoricalHabits.value || []).map(h => {
    const matchId = String(h.id) === String(habitId);
    const matchCanon = canonKey && getCanonicalHabitKey(h.name) === canonKey;
    if (matchId || matchCanon) {
      histFound = true;
      const cd = Array.isArray(h.completed_days) ? h.completed_days.map(Number) : [];
      if (!cd.includes(numDay)) {
        return { ...h, completed_days: [...cd, numDay] };
      }
    }
    return h;
  });

  if (!histFound && targetHabit) {
    allHistoricalHabits.value.push({
      id: targetHabit.id,
      name: targetHabit.name,
      points: Number(targetHabit.points) || 1,
      completed_days: [numDay],
      canonicalKey: canonKey,
    });
  }

  // Direct fallback patch to localStorage for offline persistence
  try {
    const raw = localStorage.getItem(localStateKey.value);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.habits)) {
        parsed.habits = parsed.habits.map(h => {
          const matchId = String(h.id) === String(habitId);
          const matchCanon = canonKey && getCanonicalHabitKey(h.name) === canonKey;
          if (matchId || matchCanon) {
            const cd = Array.isArray(h.completed_days) ? h.completed_days.map(Number) : [];
            if (!cd.includes(numDay)) {
              return { ...h, completed_days: [...cd, numDay] };
            }
          }
          return h;
        });
        parsed.allHistoricalHabits = allHistoricalHabits.value;
        localStorage.setItem(localStateKey.value, JSON.stringify(parsed));
      }
    }
  } catch { /* ignore */ }

  saveState();
  syncDueNowNotification?.();

  // Normalized Real-Time Ledger Persistence
  if (effectiveUserId.value && effectiveUserId.value !== 'guest') {
    const checkInDate = `${props.year}-${String(props.month).padStart(2, '0')}-${String(numDay).padStart(2, '0')}`;
    recordHabitCheckIn({
      userId: effectiveUserId.value,
      habitId: habitId,
      habitName: targetHabit ? targetHabit.name : '',
      monthKey: monthScope.value,
      day: numDay,
      completedOn: checkInDate,
      points: targetHabit ? (Number(targetHabit.points) || 1) : 1,
      canonicalKey: canonKey,
      source: 'notification_or_widget',
    });
  }

  const habitName = targetHabit ? targetHabit.name : 'Habit';
  showToast(`✅ "${habitName}" marked done!`);
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate([12]);
    } catch (_) {}
  }
};

// ── Milestone 3: 1-Tap Batch Routine Quick Action ──
const handleBatchCompleteSlot = (group) => {
  if (!group || !group.habits || group.habits.length === 0) return;
  const targetDay = Number(mobileDay.value || props.currentDay || new Date().getDate());
  const pendingInSlot = group.habits.filter(h => !hasCompletedDay(h, targetDay));

  if (pendingInSlot.length === 0) {
    showToast(`⚡ All habits in ${group.label} are already completed!`);
    return;
  }

  // Iterate and complete all pending habits in this slot
  pendingInSlot.forEach(habit => {
    toggleHabitForDay(habit, targetDay);
  });

  fireDualCannons();
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([40, 80, 40, 80]);
  }
  const totalPts = pendingInSlot.reduce((s, h) => s + (Number(h.points) || 1), 0);
  showToast(`⚡ Blitz! Completed all ${pendingInSlot.length} habits in ${group.label}! (+${totalPts} pts) 🚀`, 4000);
};

// ── Milestone 3: Live Partner High-Five Broadcaster ──
const sendWarriorHighFive = async () => {
  const sender = isAshish.value ? 'Ashish' : (isJyoti.value ? 'Jyoti' : displayName.value);
  await broadcastPartnerEvent({
    type: 'warrior_high_five',
    partner: sender,
  }, pairChannelId.value);
  fireDualCannons();
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([30, 60, 30]);
  }
  showToast(`🙌 High-Five broadcast to your partner live! Keep crushing it! 🔥`);
};

// ── Milestone 3: Biometric & Metabolic Journaling Handlers ──
const handleUpdateBiomarkers = (updatedBio) => {
  biomarkersState.value = { ...biomarkersState.value, ...updatedBio };
  debouncedSaveState();
  showToast('🧬 Biometrics & morning stiffness updated!');

  if (effectiveUserId.value && effectiveUserId.value !== 'guest') {
    const todayDate = new Date();
    const todayIso = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
    saveUserBiomarker({
      userId: effectiveUserId.value,
      logDate: todayIso,
      stiffnessMinutes: updatedBio.stiffnessMin !== undefined ? updatedBio.stiffnessMin : biomarkersState.value.stiffnessMin,
      hydrationMl: hydrationMlState.value,
      energyLevel: updatedBio.energyRating !== undefined ? updatedBio.energyRating : biomarkersState.value.energyRating,
      notes: updatedBio.note !== undefined ? updatedBio.note : biomarkersState.value.note,
    });
  }
};

const handleUpdateHydration = (amountMl) => {
  hydrationMlState.value = amountMl;
  debouncedSaveState();

  if (effectiveUserId.value && effectiveUserId.value !== 'guest') {
    const todayDate = new Date();
    const todayIso = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
    saveUserBiomarker({
      userId: effectiveUserId.value,
      logDate: todayIso,
      stiffnessMinutes: biomarkersState.value.stiffnessMin,
      hydrationMl: amountMl,
      energyLevel: biomarkersState.value.energyRating,
      notes: biomarkersState.value.note,
    });
  }
};

// ── Milestone 3: Data Portability & Backup Restore Handler ──
const handleRestoreData = (restoredData) => {
  if (!restoredData) return;
  try {
    if (restoredData.habits && Array.isArray(restoredData.habits)) {
      localHabits.value = restoredData.habits;
    }
    if (restoredData.historicalHabits && Array.isArray(restoredData.historicalHabits)) {
      allHistoricalHabits.value = restoredData.historicalHabits;
    }
    if (restoredData.biometrics) {
      biomarkersState.value = {
        stiffnessMin: restoredData.biometrics.stiffnessMin || 0,
        energyRating: restoredData.biometrics.energyRating || 8,
        note: restoredData.biometrics.note || '',
      };
      if (restoredData.biometrics.hydrationMl !== undefined) {
        hydrationMlState.value = restoredData.biometrics.hydrationMl;
      }
    }
    if (restoredData.weeklyReview) {
      weeklyReview.value = { ...weeklyReview.value, ...restoredData.weeklyReview };
    }
    saveState();
    calculateHistoricalTotals();
    showToast('✨ Backup restored and synced successfully!');
  } catch (err) {
    console.error('Failed to apply restored data:', err);
    showToast('⚠️ Error applying restored backup data');
  }
};

// ── Milestone 4: Shared Partner Emote Broadcaster ──
const handleSendPartnerEmote = async (emote) => {
  if (!emote) return;
  const sender = isAshish.value ? 'Ashish' : (isJyoti.value ? 'Jyoti' : displayName.value);
  await broadcastPartnerEvent({
    type: 'partner_emote',
    partner: sender,
    emoteId: emote.id,
    label: emote.label,
    message: emote.message,
  }, pairChannelId.value);
  fireDualCannons();
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([25, 50, 25]);
  }
};

// Day Type Cycle Toggle (replaces binary travel mode) — Never drops completed days!
const toggleTravelMode = () => {
  const nextType = getNextDayType(dayType.value);
  dayType.value = nextType;
  // Re-apply state seamlessly with new fallback preset while PRESERVING all completed_days and historical data
  applyLoadedState({
    habits: localHabits.value,
    allHistoricalHabits: allHistoricalHabits.value,
    dayType: nextType,
  }, false);
  saveState();
  syncDueNowNotification?.();
  const label = getDayTypeLabel(nextType);
  const detail = isOfficeDay(nextType)
    ? (isFlatEvening(nextType) ? ' (Evening at Panchkula flat)' : ' (Return to Ludhiana)')
    : '';
  showToast(`${label}${detail} Routine Activated`);
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(20);
  }
};

// ── PWA Due Now Notification & Background 1-Tap Action Hook ──
const {
  isSupported: notificationsSupported,
  permissionState: notificationPermission,
  notificationsEnabled: dueNowNotificationsEnabled,
  requestPermission: requestDueNowNotifications,
  toggleNotifications: toggleDueNowNotifications,
  sendTestNotification,
  syncDueNowNotification,
  dismissDueNowNotification,
  drainQueuedCompletions,
} = useDueNowNotifications({
  upNextHabitInfo,
  habits: visibleHabits,
  currentDay: computed(() => props.currentDay),
  isCurrentMonth: computed(() => props.isCurrentMonth),
  hasCompletedDay,
  onCompleteHabit: markHabitCompletedDirectly,
  habitTimeSchedule,
});

const handleToggleDueNowNotifications = async () => {
  const enabled = await toggleDueNowNotifications();
  if (enabled) {
    showToast('🔔 Live Desktop/Mobile Alerts Active!');
  } else {
    showToast('🔕 Live alerts paused');
  }
};

// ── App & Notifications Hub Modal & Desktop PWA Installer ──
const isAppInstallModalOpen = ref(false);
const deferredInstallPrompt = ref(null);
const canInstallPwa = ref(false);

const handleTriggerInstallPwa = async () => {
  if (deferredInstallPrompt.value) {
    try {
      deferredInstallPrompt.value.prompt();
      const choiceResult = await deferredInstallPrompt.value.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showToast('🎉 Habuilt App installed on your desktop!');
        canInstallPwa.value = false;
        deferredInstallPrompt.value = null;
      }
    } catch (e) {
      console.warn('Install prompt error:', e);
    }
  } else {
    showToast('💡 Click the Install icon (⊕) in your browser address bar');
  }
};

const handleSendTestNotification = async () => {
  const sent = await sendTestNotification();
  if (sent) {
    showToast('⚡ Test toast notification sent! Look for the action banner.');
  } else {
    showToast('⚠️ Please allow notification permission in your browser/Windows');
  }
};

// ── Native Android Home Screen Widget Sync Hook ──
const { syncNativeWidget, getNativeWidgetData } = useNativeWidget();
const pushToNativeWidget = () => {
  try {
    syncNativeWidget({
      userId: effectiveUserId.value,
      habits: localHabits.value || [],
      schedule: habitTimeSchedule || {},
      streak: systemStreak.value?.currentStreak || systemStreak.value?.current || 0,
      todayPoints: todayPoints.value ?? 0,
    });
  } catch (e) {
    console.warn('Widget sync error:', e);
  }
};

watch([localHabits, todayPoints, systemStreak], () => {
  pushToNativeWidget();
}, { deep: true });

const isShareModalOpen = ref(false);

const todayCompletedHabitsList = computed(() => {
  const targetDay = mobileDayIsToday.value ? props.currentDay : mobileDay.value;
  return (visibleHabits.value || [])
    .filter(h => hasCompletedDay(h, targetDay))
    .map(h => h.name);
});

const shareDailyScorecard = () => {
  isShareModalOpen.value = true;
};

// ── Real-Time Routine Phase Window Helper ──
const currentRoutineWindow = computed(() => {
  const now = currentClock.value;
  const mins = now.getHours() * 60 + now.getMinutes();
  if (mins < 9 * 60) {
    return { name: 'Morning Protocol', time: '04:45 – 09:00', icon: '🌅' };
  } else if (mins < 14 * 60) {
    return { name: 'Deep Execution Block', time: '09:00 – 14:00', icon: '⚡' };
  } else if (mins < 18 * 60 + 30) {
    return { name: 'Midday & Operations Block', time: '14:00 – 18:30', icon: '☀️' };
  } else if (mins < 21 * 60 + 30) {
    return { name: 'Evening Routine & Shutdown', time: '18:30 – 21:30', icon: '🌙' };
  } else {
    return { name: 'Night Wind-down & Rest', time: '21:30+', icon: '✨' };
  }
});

// ── Quick Productivity Launchers ──
const startQuickFocus = (minutes = 25) => {
  activeMobileTab.value = 'focus';
  startDeepWorkTimer(minutes);
  showToast(`⚡ Started ${minutes}m Focus Session`);
};

const handleAppReload = async () => {
  try {
    isSyncingCloud.value = true;
    showToast('🔄 Syncing & Refreshing...');

    // 1. Re-read and reconcile local storage
    loadLocalState();

    // 2. Pull remote cloud state if user is logged in
    if (effectiveUserId.value && effectiveUserId.value !== 'guest') {
      const remoteData = await loadUserMonthlyState(effectiveUserId.value, monthScope.value);
      if (remoteData) {
        applyLoadedState(remoteData, true);
        lastSyncTimestamp = Date.now();
      }
    }

    // 3. Save reconciled state to ensure latest presets are synced
    await saveState();

    showToast('✅ App Synced & Refreshed!');
  } catch (err) {
    console.warn('Reload sync error:', err);
    showToast('⚡ Refreshed');
  } finally {
    isSyncingCloud.value = false;
  }
};

// ── State Persistence & Automatic Real-Time Cloud Sync ──
const isSyncingCloud = ref(false);
let lastSyncTimestamp = 0;

const applyLoadedState = (data, isRemote = false) => {
  if (!data) return;

  const currentFallbacks = fallbackHabits.value || [];
  const systemHabitIds = new Set(currentFallbacks.map(h => String(h.id)));

  // Aggregate all known habits from incoming data, historical store, and current memory
  const incomingHabits = Array.isArray(data.habits) ? data.habits : [];
  const incomingHistorical = Array.isArray(data.allHistoricalHabits) ? data.allHistoricalHabits : [];
  const currentMemoryHabits = Array.isArray(localHabits.value) ? localHabits.value : [];
  const currentMemoryHistorical = Array.isArray(allHistoricalHabits.value) ? allHistoricalHabits.value : [];

  const masterList = [...incomingHabits, ...incomingHistorical, ...currentMemoryHabits, ...currentMemoryHistorical];

  // Build ID completion map and Canonical completion map
  const idCompletedMap = new Map();
  const canonicalCompletedMap = new Map();
  const savedHabitMap = new Map();

  for (const h of masterList) {
    if (!h || !h.id) continue;
    const idStr = String(h.id);
    if (!savedHabitMap.has(idStr)) {
      savedHabitMap.set(idStr, h);
    }
    const days = Array.isArray(h.completed_days) ? h.completed_days.map(Number) : [];

    if (!idCompletedMap.has(idStr)) idCompletedMap.set(idStr, new Set());
    days.forEach(d => idCompletedMap.get(idStr).add(d));

    const canonKey = getCanonicalHabitKey(h.name);
    if (canonKey) {
      if (!canonicalCompletedMap.has(canonKey)) canonicalCompletedMap.set(canonKey, new Set());
      days.forEach(d => canonicalCompletedMap.get(canonKey).add(d));
    }
  }

  // 1. Reconcile active preset system habits
  const mergedSystemHabits = currentFallbacks.map(fallback => {
    const idStr = String(fallback.id);
    const canonKey = getCanonicalHabitKey(fallback.name);
    const daysSet = new Set();

    if (idCompletedMap.has(idStr)) {
      idCompletedMap.get(idStr).forEach(d => daysSet.add(d));
    }
    if (canonKey && canonicalCompletedMap.has(canonKey)) {
      canonicalCompletedMap.get(canonKey).forEach(d => daysSet.add(d));
    }

    const saved = savedHabitMap.get(idStr);
    return {
      ...fallback,
      completed_days: Array.from(daysSet).sort((a, b) => a - b),
      archived: saved ? (saved.archived || false) : false,
      notes: saved ? (saved.notes || '') : '',
    };
  });

  // 2. Preserve custom user-added habits (e.g. starting with 'c-' or unique custom habits)
  const customHabits = masterList
    .filter(h => h && h.id && String(h.id).startsWith('c-') && !systemHabitIds.has(String(h.id)))
    .filter((h, idx, self) => self.findIndex(x => String(x.id) === String(h.id)) === idx)
    .map(h => {
      const idStr = String(h.id);
      const days = idCompletedMap.has(idStr) ? Array.from(idCompletedMap.get(idStr)).sort((a, b) => a - b) : [];
      return { ...h, completed_days: days };
    });

  localHabits.value = [...mergedSystemHabits, ...customHabits];

  // 3. Keep master historical archive of all unique completed habits
  const historicalUniqueMap = new Map();
  for (const h of masterList) {
    if (!h || !h.id) continue;
    const idStr = String(h.id);
    const days = idCompletedMap.has(idStr) ? Array.from(idCompletedMap.get(idStr)).sort((a, b) => a - b) : [];
    if (days.length > 0) {
      historicalUniqueMap.set(idStr, {
        id: h.id,
        name: h.name,
        points: Number(h.points) || 1,
        completed_days: days,
        canonicalKey: getCanonicalHabitKey(h.name),
      });
    }
  }
  allHistoricalHabits.value = Array.from(historicalUniqueMap.values());

  if (Array.isArray(data.rewards)) {
    rewards.value = data.rewards.map((r, idx) => ({
      id: r.id || `rew-saved-${idx}-${Date.now()}`,
      type: r.type || 'Weekly',
      item: r.item || '',
      cost: Number(r.cost) || 10,
    }));
  }
  if (Array.isArray(data.coupleSynergyRewards)) {
    coupleSynergyRewards.value = data.coupleSynergyRewards.map((r, idx) => ({
      id: r.id || `couple-reward-${idx}-${Date.now()}`,
      item: r.item || '',
      type: r.type || 'Couple Synergy',
      cost: Number(r.cost) || 0,
      description: r.description || '',
      icon: r.icon || '🎁',
    }));
  }
  if (Array.isArray(data.rewardLedger)) rewardLedger.value = data.rewardLedger;
  if (data.progressiveSettings) progressiveSettings.value = { ...progressiveSettings.value, ...data.progressiveSettings };
  if (data.enhancedState) enhancedState.value = { ...enhancedState.value, ...data.enhancedState };
  if (data.weeklyReview && typeof data.weeklyReview === 'object') {
    const defaultRev = createDefaultWeeklyReview();
    weeklyReview.value = {
      ...defaultRev,
      ...data.weeklyReview,
      metrics: {
        ...defaultRev.metrics,
        ...(data.weeklyReview.metrics || {}),
      },
      reflections: {
        ...defaultRev.reflections,
        ...(data.weeklyReview.reflections || {}),
      },
      checks: Array.isArray(data.weeklyReview.checks) ? data.weeklyReview.checks : defaultRev.checks,
      coupleChecks: Array.isArray(data.weeklyReview.coupleChecks) ? data.weeklyReview.coupleChecks : defaultRev.coupleChecks,
      coupleReflections: {
        ...defaultRev.coupleReflections,
        ...(data.weeklyReview.coupleReflections || {}),
      },
    };
  }
  if (data.dayType !== undefined) dayType.value = data.dayType;
  else if (data.travelMode !== undefined) dayType.value = data.travelMode ? 'office-mon' : 'home'; // Migrate legacy
  const explicitTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('habuilt_theme') : null;
  if (explicitTheme) {
    darkMode.value = explicitTheme === 'dark';
  } else if (data.darkMode !== undefined) {
    darkMode.value = data.darkMode;
  }
  if (data.biomarkers && typeof data.biomarkers === 'object') {
    biomarkersState.value = { ...biomarkersState.value, ...data.biomarkers };
  }
  if (data.hydration_ml !== undefined) {
    hydrationMlState.value = Number(data.hydration_ml) || 0;
  } else if (data.hydrationMl !== undefined) {
    hydrationMlState.value = Number(data.hydrationMl) || 0;
  }
  if (Array.isArray(data.claimedSynergyRewards)) {
    claimedSynergyRewards.value = data.claimedSynergyRewards;
  }

  try {
    const payload = {
      habits: localHabits.value,
      allHistoricalHabits: allHistoricalHabits.value,
      rewards: rewards.value,
      coupleSynergyRewards: coupleSynergyRewards.value,
      rewardLedger: rewardLedger.value,
      claimedSynergyRewards: claimedSynergyRewards.value,
      progressiveSettings: progressiveSettings.value,
      enhancedState: enhancedState.value,
      weeklyReview: weeklyReview.value,
      dayType: dayType.value,
      darkMode: darkMode.value,
      biomarkers: biomarkersState.value,
      hydration_ml: hydrationMlState.value,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(localStateKey.value, JSON.stringify(payload));
  } catch { /* offline fallback */ }

  // Drain any queued background actions from notifications once habits are loaded
  setTimeout(() => {
    drainQueuedCompletions?.();
    pushToNativeWidget();
  }, 50);
};

let debouncedSaveTimeout = null;
const debouncedSaveState = (delayMs = 400) => {
  try {
    const payload = {
      habits: localHabits.value,
      allHistoricalHabits: allHistoricalHabits.value,
      rewards: rewards.value,
      coupleSynergyRewards: coupleSynergyRewards.value,
      rewardLedger: rewardLedger.value,
      claimedSynergyRewards: claimedSynergyRewards.value,
      progressiveSettings: progressiveSettings.value,
      enhancedState: enhancedState.value,
      weeklyReview: weeklyReview.value,
      dayType: dayType.value,
      darkMode: darkMode.value,
      biomarkers: biomarkersState.value,
      hydration_ml: hydrationMlState.value,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(localStateKey.value, JSON.stringify(payload));
  } catch { /* offline fallback */ }

  if (debouncedSaveTimeout) clearTimeout(debouncedSaveTimeout);
  debouncedSaveTimeout = setTimeout(() => {
    saveState();
  }, delayMs);
};

const saveState = async () => {
  try {
    const payload = {
      habits: localHabits.value,
      allHistoricalHabits: allHistoricalHabits.value,
      rewards: rewards.value,
      coupleSynergyRewards: coupleSynergyRewards.value,
      rewardLedger: rewardLedger.value,
      claimedSynergyRewards: claimedSynergyRewards.value,
      progressiveSettings: progressiveSettings.value,
      enhancedState: enhancedState.value,
      weeklyReview: weeklyReview.value,
      dayType: dayType.value,
      darkMode: darkMode.value,
      biomarkers: biomarkersState.value,
      hydration_ml: hydrationMlState.value,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(localStateKey.value, JSON.stringify(payload));
    pushToNativeWidget();
    if (effectiveUserId.value && effectiveUserId.value !== 'guest') {
      await saveUserMonthlyState(effectiveUserId.value, monthScope.value, payload);
      await saveUserSettings(effectiveUserId.value, payload);
    }
  } catch (err) {
    console.warn('Failed to save dashboard state:', err);
  }
};

const lifetimeData = ref(null);

// ── Cross-Month Points, Wallet & Lifetime History Calculator ──
const calculateHistoricalTotals = async () => {
  let earnedBefore = 0;
  let redeemedBefore = 0;
  const currentKey = monthScope.value;
  const allMonthlyRows = [];

  // 1. Scan LocalStorage for all months saved for this user
  try {
    const prefix = `habuilt.dashboard.${effectiveUserId.value}.`;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        const monthKey = k.replace(prefix, '');
        if (/^\d{4}-\d{2}$/.test(monthKey)) {
          const raw = localStorage.getItem(k);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              allMonthlyRows.push({ month_key: monthKey, state_data: parsed });
            } catch {}
          }
        }
      }
    }
  } catch (e) {
    console.warn('LocalStorage historical scan warning:', e);
  }

  // 2. Fetch remote months from Supabase if logged in
  if (effectiveUserId.value && effectiveUserId.value !== 'guest') {
    try {
      const remoteMonths = await loadAllUserMonthlyStates(effectiveUserId.value);
      if (Array.isArray(remoteMonths)) {
        remoteMonths.forEach(rm => {
          if (rm && rm.month_key && rm.state_data) {
            const existingIdx = allMonthlyRows.findIndex(r => r.month_key === rm.month_key);
            if (existingIdx > -1) {
              allMonthlyRows[existingIdx] = rm;
            } else {
              allMonthlyRows.push(rm);
            }
          }
        });
      }
    } catch (e) {
      console.warn('Remote historical months fetch warning:', e);
    }
  }

  // 3. Aggregate prior months (month_key < currentKey)
  allMonthlyRows.forEach(row => {
    if (!row || !row.month_key || row.month_key >= currentKey) return;
    const data = row.state_data;
    if (!data) return;

    const habits = getMonthlyHabits(data);
    habits.forEach(h => {
      const pts = Number(h.points) || 1;
      const cd = getHabitCompletedDays(h);
      earnedBefore += pts * cd.length;
    });

    const ledger = Array.isArray(data.rewardLedger) ? data.rewardLedger : [];
    redeemedBefore += ledger.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);
  });

  earnedBeforeCurrentMonth.value = earnedBefore;
  redeemedBeforeCurrentMonth.value = redeemedBefore;

  // 4. Compute comprehensive lifetime stats across all months
  try {
    lifetimeData.value = computeLifetimeStats(allMonthlyRows, {
      year: props.year,
      month: props.month,
      day: props.currentDay,
      habits: localHabits.value,
    });
  } catch (e) {
    console.warn('Lifetime stats computation warning:', e);
  }
};

const PRESET_VERSION = '2026-08-29-v12-routine-sync-aligned';

const loadLocalState = () => {
  try {
    const raw = localStorage.getItem(localStateKey.value);
    const lastVersion = localStorage.getItem(`habuilt.preset_version.${effectiveUserId.value}.${monthScope.value}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Auto-detect day type from office calendar if not explicitly saved
      if (parsed.dayType === undefined && isAshish.value) {
        parsed.dayType = getDayType(new Date());
      }
      applyLoadedState(parsed, false);
      if (lastVersion !== PRESET_VERSION) {
        localStorage.setItem(`habuilt.preset_version.${effectiveUserId.value}.${monthScope.value}`, PRESET_VERSION);
        saveState();
      }
    } else {
      if (isAshish.value) {
        dayType.value = getDayType(new Date());
      }
      localHabits.value = fallbackHabits.value.map(h => ({ ...h, completed_days: [] }));
      localStorage.setItem(`habuilt.preset_version.${effectiveUserId.value}.${monthScope.value}`, PRESET_VERSION);
      saveState();
    }
  } catch {
    if (isAshish.value) {
      dayType.value = getDayType(new Date());
    }
    localHabits.value = fallbackHabits.value.map(h => ({ ...h, completed_days: [] }));
  }
  calculateHistoricalTotals();
  drainQueuedCompletions?.();
};

watch(fallbackHabits, (newFallbacks) => {
  if (Array.isArray(newFallbacks) && newFallbacks.length > 0) {
    applyLoadedState({ habits: localHabits.value, allHistoricalHabits: allHistoricalHabits.value }, false);
  }
}, { deep: true });

watch(monthScope, async (newScope, oldScope) => {
  if (newScope && newScope !== oldScope) {
    loadLocalState();
    await calculateHistoricalTotals();
    await syncCloudState(true);
  }
});

const syncCloudState = async (force = false) => {
  const now = Date.now();
  if (!force && now - lastSyncTimestamp < 10000) return;
  if (!effectiveUserId.value || effectiveUserId.value === 'guest') return;

  try {
    isSyncingCloud.value = true;

    // 1. First, attempt to load from normalized habit_check_ins ledger
    const ledgerRows = await loadMonthCheckIns(effectiveUserId.value, monthScope.value);
    if (Array.isArray(ledgerRows) && ledgerRows.length > 0) {
      const habitDayMap = new Map();
      ledgerRows.forEach(row => {
        const hid = String(row.habit_id);
        if (!habitDayMap.has(hid)) habitDayMap.set(hid, new Set());
        habitDayMap.get(hid).add(Number(row.day));
      });

      localHabits.value = (localHabits.value || []).map(h => {
        const hid = String(h.id);
        const canonKey = getCanonicalHabitKey(h.name);
        const set = habitDayMap.get(hid) || new Set();
        return {
          ...h,
          completed_days: Array.from(set).sort((a, b) => a - b),
        };
      });
    } else {
      // Fallback to legacy monthly state document
      const remoteData = await loadUserMonthlyState(effectiveUserId.value, monthScope.value);
      if (remoteData) {
        applyLoadedState(remoteData, true);
        // Silently backfill to the new normalized ledger
        silentBackfillLegacyState(effectiveUserId.value, monthScope.value, localHabits.value);
      }
    }

    // 2. Load user settings & reviews
    const settingsData = await loadUserSettings(effectiveUserId.value);
    if (settingsData) {
      if (settingsData.day_type) dayType.value = settingsData.day_type;
      if (settingsData.dark_mode !== undefined) {
        const explicitTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('habuilt_theme') : null;
        if (explicitTheme) {
          darkMode.value = explicitTheme === 'dark';
        } else {
          darkMode.value = settingsData.dark_mode;
        }
      }
      if (settingsData.progressive_settings) progressiveSettings.value = { ...progressiveSettings.value, ...settingsData.progressive_settings };
      if (Array.isArray(settingsData.rewards)) rewards.value = settingsData.rewards;
      if (Array.isArray(settingsData.reward_ledger)) rewardLedger.value = settingsData.reward_ledger;
      if (settingsData.weekly_reviews) weeklyReview.value = { ...weeklyReview.value, ...settingsData.weekly_reviews };
      if (settingsData.enhanced_state) enhancedState.value = { ...enhancedState.value, ...settingsData.enhanced_state };
      if (settingsData.biomarkers && typeof settingsData.biomarkers === 'object') biomarkersState.value = { ...biomarkersState.value, ...settingsData.biomarkers };
      if (settingsData.hydration_ml !== undefined) hydrationMlState.value = Number(settingsData.hydration_ml) || 0;
    }

    // 3. Load latest daily biomarker from user_biomarkers
    const todayDate = new Date();
    const todayIso = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
    const latestBio = await loadLatestBiomarker(effectiveUserId.value, todayIso);
    if (latestBio) {
      if (latestBio.stiffness_minutes !== undefined) biomarkersState.value.stiffnessMin = Number(latestBio.stiffness_minutes);
      if (latestBio.hydration_ml !== undefined) hydrationMlState.value = Number(latestBio.hydration_ml);
      if (latestBio.energy_level !== undefined) biomarkersState.value.energyRating = Number(latestBio.energy_level);
      if (latestBio.notes) biomarkersState.value.note = latestBio.notes;
    }

    lastSyncTimestamp = Date.now();
    await calculateHistoricalTotals();
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
  applyLoadedState({ habits: localHabits.value, allHistoricalHabits: allHistoricalHabits.value }, false);
  habitsEditing.value = false;
  saveState();
  showToast('✨ Updated to latest routine preset!');
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

// ── Single Habit Form Modal Handlers (Quick Add & Edit) ──
const isHabitFormModalOpen = ref(false);
const editingHabitTarget = ref(null);
const defaultSlotForNewHabit = ref('morning');

const openAddHabitModal = (slot = 'morning') => {
  editingHabitTarget.value = null;
  defaultSlotForNewHabit.value = slot || 'morning';
  isHabitFormModalOpen.value = true;
};

const openEditHabitModal = (habit) => {
  editingHabitTarget.value = habit;
  isHabitFormModalOpen.value = true;
};

const closeHabitFormModal = () => {
  isHabitFormModalOpen.value = false;
  editingHabitTarget.value = null;
};

const handleSaveHabitForm = (habitData) => {
  if (!habitData || !habitData.name) return;

  const existingIdx = (localHabits.value || []).findIndex(h => String(h.id) === String(habitData.id));
  if (existingIdx > -1) {
    // Update existing habit
    localHabits.value[existingIdx] = {
      ...localHabits.value[existingIdx],
      ...habitData,
    };
    // Also update allHistoricalHabits
    allHistoricalHabits.value = (allHistoricalHabits.value || []).map(h => {
      if (String(h.id) === String(habitData.id)) {
        return { ...h, ...habitData };
      }
      return h;
    });
    showToast(`✨ Updated "${habitData.name}"`);
  } else {
    // Add new custom habit
    const newHabit = {
      id: habitData.id || `c-${Date.now()}`,
      name: habitData.name,
      points: Number(habitData.points) || 1,
      category: habitData.category || 'fitness',
      isTimed: habitData.isTimed !== undefined ? habitData.isTimed : true,
      startTime: habitData.startTime || null,
      endTime: habitData.endTime || null,
      timeSlot: habitData.timeSlot || 'morning',
      scheduleType: habitData.scheduleType || 'all',
      customDays: habitData.customDays || null,
      hint: habitData.hint || '',
      completed_days: [],
    };
    localHabits.value.push(newHabit);
    showToast(`✨ Added "${newHabit.name}" (+${newHabit.points} pts)`);
  }

  saveState();
  syncDueNowNotification?.();
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([15, 30, 15]);
};

const handleDeleteHabitFromForm = (habitId) => {
  if (!habitId) return;
  localHabits.value = (localHabits.value || []).filter(h => String(h.id) !== String(habitId));
  allHistoricalHabits.value = (allHistoricalHabits.value || []).filter(h => String(h.id) !== String(habitId));
  saveState();
  syncDueNowNotification?.();
  showToast('🗑️ Habit removed');
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
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

  const coupleSource = (coupleSynergyRewards.value && coupleSynergyRewards.value.length > 0)
    ? coupleSynergyRewards.value
    : defaultCoupleSynergyRewards;
  coupleSynergyRewardsDraft.value = coupleSource.map((r, idx) => ({
    id: r.id || `couple-reward-${Date.now()}-${idx}`,
    type: r.type || 'Couple Synergy',
    item: r.item || '',
    cost: 0,
    description: r.description || '',
    icon: r.icon || '🎁',
  }));

  rewardsEditing.value = true;
};

const cancelEditingRewards = () => {
  rewardsEditing.value = false;
  coupleSynergyRewardsDraft.value = [];
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

  const sanitizedCouple = (coupleSynergyRewardsDraft.value || [])
    .filter(r => r.item && r.item.trim().length > 0)
    .map(r => ({
      id: r.id || `couple-reward-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'Couple Synergy',
      item: r.item.trim(),
      cost: 0,
      description: r.description ? r.description.trim() : '',
      icon: r.icon && r.icon.trim().length > 0 ? r.icon.trim() : '🎁',
    }));

  let coupleUpdated = false;
  if (sanitizedCouple.length > 0) {
    coupleSynergyRewards.value = sanitizedCouple;
    coupleUpdated = true;
  }

  rewardsEditing.value = false;
  saveState();

  if (coupleUpdated && isPartnerPaired.value) {
    broadcastPartnerEvent({
      type: 'partner_couple_rewards_update',
      rewards: coupleSynergyRewards.value,
      by: displayName.value,
    }, pairChannelId.value);
  }

  showToast('✅ Rewards catalog updated successfully!');
};

const restoreDefaultRewards = () => {
  rewards.value = defaultRewards.map((r, i) => ({
    id: `default-reward-${i}`,
    ...r,
  }));
  rewardsEditing.value = false;
  saveState();
  showToast('🔄 Restored default personal rewards!');
};

const restoreDefaultSynergyRewards = () => {
  coupleSynergyRewards.value = defaultCoupleSynergyRewards.map((r, i) => ({
    id: `default-couple-reward-${i}`,
    ...r,
  }));
  coupleSynergyRewardsDraft.value = defaultCoupleSynergyRewards.map((r, i) => ({
    id: `default-couple-reward-${i}`,
    ...r,
  }));
  saveState();
  if (isPartnerPaired.value) {
    broadcastPartnerEvent({
      type: 'partner_couple_rewards_update',
      rewards: coupleSynergyRewards.value,
      by: displayName.value,
    }, pairChannelId.value);
  }
  showToast('🔄 Restored default couple synergy rewards!');
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

const addDraftSynergyReward = () => {
  coupleSynergyRewardsDraft.value.push({
    id: `couple-reward-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'Couple Synergy',
    item: '',
    cost: 0,
    description: '',
    icon: '🎁',
  });
};

const removeDraftSynergyReward = (index) => {
  coupleSynergyRewardsDraft.value.splice(index, 1);
};

const isRewardClaimedThisMonth = (rewardId) => {
  if (!rewardId) return false;
  const targetReward = (rewards.value || []).find(r => r.id === rewardId);
  const isOneTimeType = targetReward && ['Month', 'Monthly', 'Quarter', 'Quarterly', 'Half-Yr', 'Half-Year', 'Yearly'].includes(targetReward.type);
  if (!isOneTimeType) return false; // Daily and Weekly rewards are repeatable
  return (rewardLedger.value || []).some(entry => entry.reward_id === rewardId || (targetReward && entry.item === targetReward.item));
};

const handleRedeemReward = (r) => {
  if (!r) return;
  if (availableWallet.value < r.cost) {
    showToast('❌ Not enough points in wallet to redeem this reward.');
    return;
  }
  const isOneTimeType = ['Month', 'Monthly', 'Quarter', 'Quarterly', 'Half-Yr', 'Half-Year', 'Yearly'].includes(r.type);
  if (isOneTimeType && isRewardClaimedThisMonth(r.id)) {
    showToast('⚠️ This reward has already been claimed for this month.');
    return;
  }
  const rewardId = r.id || `reward-${Date.now()}`;
  rewardLedger.value.unshift({
    id: Date.now(),
    reward_id: rewardId,
    item: r.item,
    cost: Number(r.cost) || 0,
    type: r.type || 'Weekly',
    month_scope: monthScope.value,
    claimed_at: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  });
  saveState();
  showToast(`🎉 Claimed: ${r.item} (-${r.cost} pts)`);
};

// Month Navigation
const goToPreviousMonth = () => {
  if (!props.canNavigatePrevMonth) return;
  const target = props.previousMonth;
  try {
    if (typeof window !== 'undefined' && window.__inertia_app) {
      router.visit(`/?month=${target.month}&year=${target.year}`);
      return;
    }
  } catch (e) {
    console.warn('Inertia navigation skipped, using SPA event navigation:', e);
  }
  emit('navigate-month', target);
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.set('month', target.month);
    url.searchParams.set('year', target.year);
    window.history.replaceState({}, '', url.toString());
  }
};
const goToNextMonth = () => {
  if (!props.canNavigateNextMonth) return;
  const target = props.nextMonth;
  try {
    if (typeof window !== 'undefined' && window.__inertia_app) {
      router.visit(`/?month=${target.month}&year=${target.year}`);
      return;
    }
  } catch (e) {
    console.warn('Inertia navigation skipped, using SPA event navigation:', e);
  }
  emit('navigate-month', target);
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.set('month', target.month);
    url.searchParams.set('year', target.year);
    window.history.replaceState({}, '', url.toString());
  }
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
let partnerHeartbeatInterval = null;

const handleAppResume = async () => {
  // 1. Immediately update clock time and partner heartbeat
  updateCurrentClock();
  sendPartnerHeartbeat();

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

  // 3. Sync completions from Home Screen Widget if marked while app was in background
  try {
    const widgetData = await getNativeWidgetData();
    if (widgetData?.habitsJson) {
      const widgetHabits = JSON.parse(widgetData.habitsJson);
      if (Array.isArray(widgetHabits) && widgetHabits.length > 0) {
        let changed = false;
        const currentMap = new Map((localHabits.value || []).map(h => [h.id, h]));
        widgetHabits.forEach(wh => {
          const lh = currentMap.get(wh.id);
          if (lh && Array.isArray(wh.completed_days)) {
            const currentCds = new Set(lh.completed_days || []);
            wh.completed_days.forEach(d => {
              if (!currentCds.has(d)) {
                lh.completed_days.push(d);
                changed = true;
              }
            });
          }
        });
        if (changed) {
          saveState();
        }
      }
    }
  } catch (e) {
    console.warn('Widget sync resume warning:', e);
  }

  // 4. Immediately pull latest synced database updates
  syncCloudState(false);
};

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    handleAppResume();
  }
};

onMounted(() => {
  if (props.isCurrentMonth) {
    mobileSelectedDay.value = props.currentDay;
  }
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
  window.addEventListener('keydown', handleZenKeyDown);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleSwPeriodicSync);
  }

  // ── Desktop PWA Install Prompt Capture (Chrome / Edge / Windows) ──
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt.value = e;
    canInstallPwa.value = true;
  });
  window.addEventListener('appinstalled', () => {
    canInstallPwa.value = false;
    deferredInstallPrompt.value = null;
    showToast('🎉 Habuilt Desktop App ready!');
  });

  // ── Realtime Multi-Device Check-In Subscription ──
  if (effectiveUserId.value && effectiveUserId.value !== 'guest') {
    realtimeCheckInsChannel = subscribeToHabitCheckIns(effectiveUserId.value, ({ eventType, new: newRec, old: oldRec }) => {
      if (eventType === 'INSERT' && newRec && newRec.month_key === monthScope.value) {
        const targetHabitId = String(newRec.habit_id);
        const targetDay = Number(newRec.day);
        let updated = false;
        localHabits.value = (localHabits.value || []).map(h => {
          if (String(h.id) === targetHabitId) {
            const cds = Array.isArray(h.completed_days) ? h.completed_days.map(Number) : [];
            if (!cds.includes(targetDay)) {
              updated = true;
              return { ...h, completed_days: [...cds, targetDay].sort((a, b) => a - b) };
            }
          }
          return h;
        });
        if (updated) {
          calculateHistoricalTotals();
        }
      } else if (eventType === 'DELETE' && oldRec && oldRec.month_key === monthScope.value) {
        const targetHabitId = String(oldRec.habit_id);
        const targetDay = Number(oldRec.day);
        let updated = false;
        localHabits.value = (localHabits.value || []).map(h => {
          if (String(h.id) === targetHabitId) {
            const cds = Array.isArray(h.completed_days) ? h.completed_days.map(Number) : [];
            if (cds.includes(targetDay)) {
              updated = true;
              return { ...h, completed_days: cds.filter(d => d !== targetDay) };
            }
          }
          return h;
        });
        if (updated) {
          calculateHistoricalTotals();
        }
      }
    });

    // ── Realtime Partner Connection Sync Listener ──
    realtimePartnerChannel = subscribeToPartnerConnection(effectiveUserId.value, async (payload) => {
      if (payload?.new && payload.new.status === 'connected') {
        const partnerName = payload.new.alias || (payload.new.partner_user_id === 'ashish' ? 'Ashish' : (payload.new.partner_user_id === 'jyoti' ? 'Jyoti' : 'Partner'));
        showToast(`🤝 Connected with ${partnerName}! Real-time synchronization active. ✨`, 4500);
        firePartnerCelebration();
        const updated = await getPartnerConnection(effectiveUserId.value);
        if (updated) {
          activePartnerConnection.value = updated;
          refreshPartnerLiveMetrics();
        }
      } else if (payload?.new && payload.new.status === 'revoked') {
        activePartnerConnection.value = null;
        refreshPartnerLiveMetrics();
        showToast('Partner connection unlinked. Switched to Standalone mode.');
      }
    });

    // ── Realtime Couple Broadcast Listener ──
    const handlePartnerBroadcastMessage = (msg) => {
      if (msg && (msg.type === 'shared_habit_done' || msg.type === 'habit_completed')) {
        const sender = msg.partner || 'Partner';
        const currentIsAshish = isAshish.value;
        const currentIsJyoti = isJyoti.value;
        if ((currentIsAshish && sender !== 'Ashish') || (currentIsJyoti && sender !== 'Jyoti') || (!currentIsAshish && !currentIsJyoti)) {
          showToast(`🌸 ${sender} completed "${msg.habitName}"! (+${msg.points} pts) ✨`, 4500);
          firePartnerCelebration();
          playSharedAnchorSync();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([25, 50, 25]);
          }
          dispatchPartnerNotification({
            title: `🌸 ${sender} crushed "${msg.habitName}"! (+${msg.points || 1} pts)`,
            body: 'Keep your warrior momentum synced! Tap to open your protocol.',
          });
          refreshPartnerLiveMetrics();
        }
      } else if (msg && msg.type === 'partner_unpair') {
        const sender = msg.partner || 'Partner';
        showToast(`Partner (${sender}) unlinked. Switched to Standalone mode.`);
        activePartnerConnection.value = null;
        refreshPartnerLiveMetrics();
      } else if (msg && msg.type === 'warrior_high_five') {
        const sender = msg.partner || 'Partner';
        const currentIsAshish = isAshish.value;
        const currentIsJyoti = isJyoti.value;
        if ((currentIsAshish && sender !== 'Ashish') || (currentIsJyoti && sender !== 'Jyoti') || (!currentIsAshish && !currentIsJyoti)) {
          showToast(`🙌 ${sender} just sent you a Warrior High-Five! Keep conquering! ⚡`, 5000);
          fireDualCannons();
          playPartnerHighFive();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([50, 100, 50, 100]);
          }
          dispatchPartnerNotification({
            title: `🙌 High-Five from ${sender}!`,
            body: `${sender} sent you warrior energy! Keep conquering today's habits.`,
          });
        }
      } else if (msg && msg.type === 'partner_emote') {
        const sender = msg.partner || 'Partner';
        const currentIsAshish = isAshish.value;
        const currentIsJyoti = isJyoti.value;
        if ((currentIsAshish && sender !== 'Ashish') || (currentIsJyoti && sender !== 'Jyoti') || (!currentIsAshish && !currentIsJyoti)) {
          showToast(`${msg.label || '💌'} ${sender} ${msg.message || 'sent you encouragement!'}`, 5500);
          fireDualCannons();
          playPartnerEmote();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([35, 70, 35, 70]);
          }
          dispatchPartnerNotification({
            title: `${msg.label || '💌'} ${sender}`,
            body: `${sender} ${msg.message || 'sent you encouragement!'}`,
          });
        }
      } else if (msg && msg.type === 'partner_heartbeat') {
        const isOwn = (msg.userId === effectiveUserId.value) ||
          (isAshish.value && msg.userId === 'ashish') ||
          (isJyoti.value && msg.userId === 'jyoti');
        if (!isOwn) {
          const windowName = msg.window || 'Active Protocol';
          partnerPresence.value = {
            isOnline: true,
            lastSeen: Date.now(),
            currentWindow: windowName,
            statusLabel: `Active in ${windowName}`,
          };
        }
      } else if (msg && msg.type === 'partner_nudge') {
        const sender = msg.from || 'Partner';
        const isOwn = (isAshish.value && sender === 'Ashish') || (isJyoti.value && sender === 'Jyoti');
        if (!isOwn) {
          const nudge = msg.nudge || {};
          showToast(`${nudge.icon || '🔔'} ${sender}: ${nudge.label || 'Gentle Nudge'} — ${nudge.message || 'Stay focused!'}`, 5500);
          playPartnerNudge();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([40, 80, 40]);
          }
          dispatchPartnerNotification({
            title: `${nudge.icon || '🔔'} ${nudge.label || 'Partner Nudge'} from ${sender}`,
            body: nudge.message || 'Stay focused and conquer your protocol!',
          });
          const windowName = msg.window || 'Active Protocol';
          partnerPresence.value = {
            isOnline: true,
            lastSeen: Date.now(),
            currentWindow: windowName,
            statusLabel: `Active in ${windowName}`,
          };
        }
      } else if (msg && msg.type === 'partner_synergy_claim') {
        const sender = msg.by || 'Partner';
        const isOwn = (isAshish.value && sender === 'Ashish') || (isJyoti.value && sender === 'Jyoti');
        if (!isOwn) {
          showToast(`🎉 ${sender} claimed Couple Synergy Reward: "${msg.reward}"! Celebrated together! ❤️`, 6000);
          playSharedAnchorSync();
          fireDualCannons();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([50, 100, 50, 100]);
          }
        }
      } else if (msg && msg.type === 'partner_couple_rewards_update') {
        const sender = msg.by || 'Partner';
        const isOwn = (isAshish.value && sender === 'Ashish') || (isJyoti.value && sender === 'Jyoti');
        if (!isOwn && Array.isArray(msg.rewards)) {
          coupleSynergyRewards.value = msg.rewards;
          saveState();
          showToast(`🎁 ${sender} updated the Couple Synergy Rewards catalog!`, 4000);
        }
      }
    };

    coupleLiveChannel = initCoupleBroadcastChannel(handlePartnerBroadcastMessage, pairChannelId.value);

    // Initial heartbeat pulse and 25s recurring presence cycle
    sendPartnerHeartbeat();
    partnerHeartbeatInterval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      sendPartnerHeartbeat();
      if (partnerPresence.value.isOnline && partnerPresence.value.lastSeen && (Date.now() - partnerPresence.value.lastSeen > 45000)) {
        partnerPresence.value.isOnline = false;
        partnerPresence.value.statusLabel = 'Offline';
      }
    }, 25000);
  }

  // ── Native Android Hardware / Gesture Back Button Handler ──
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    let lastBackPressTime = 0;
    try {
      App.addListener('backButton', () => {
        // 1. Close any open modal dialogs or drawers
        if (isSpotlightOpen.value) {
          isSpotlightOpen.value = false;
          return;
        }
        if (isDataBackupModalOpen.value) {
          isDataBackupModalOpen.value = false;
          return;
        }
        if (isCalendarSyncModalOpen.value) {
          isCalendarSyncModalOpen.value = false;
          return;
        }
        if (isHabitFormModalOpen.value) {
          closeHabitFormModal();
          return;
        }
        if (habitsEditing.value) {
          habitsEditing.value = false;
          return;
        }
        if (rewardsEditing.value) {
          rewardsEditing.value = false;
          return;
        }
        if (isAppInstallModalOpen.value) {
          isAppInstallModalOpen.value = false;
          return;
        }
        if (isShareModalOpen.value) {
          isShareModalOpen.value = false;
          return;
        }
        if (progressivePanelOpen.value) {
          progressivePanelOpen.value = false;
          return;
        }
        if (analyticsOpen.value) {
          analyticsOpen.value = false;
          return;
        }
        if (partnerViewOpen.value) {
          partnerViewOpen.value = false;
          return;
        }
        if (weeklyReviewExpanded.value) {
          weeklyReviewExpanded.value = false;
          return;
        }
        if (tierDetailHabitId.value) {
          tierDetailHabitId.value = null;
          return;
        }
        if (habitNotesOpen.value) {
          habitNotesOpen.value = null;
          return;
        }
        if (mobileHeroExpanded.value) {
          mobileHeroExpanded.value = false;
          return;
        }

        // 2. If viewing another mobile tab (Focus, Stats, Rewards), return to Today tab
        if (activeMobileTab.value !== 'today') {
          activeMobileTab.value = 'today';
          return;
        }

        // 3. If navigated to a past day in the checklist, return to Today
        if (props.isCurrentMonth && mobileSelectedDay.value !== props.currentDay) {
          mobileGoToday();
          return;
        }

        // 4. On root Today screen: Double-tap back button within 2 seconds to exit app
        const now = Date.now();
        if (now - lastBackPressTime < 2000) {
          App.exitApp();
        } else {
          lastBackPressTime = now;
          showToast('Press back again to exit Habuilt', 2000);
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(20);
          }
        }
      });
    } catch (e) {
      console.warn('Capacitor backButton listener error:', e);
    }
  }
});

onBeforeUnmount(() => {
  if (clockInterval) clearInterval(clockInterval);
  if (cloudSyncInterval) clearInterval(cloudSyncInterval);
  if (partnerHeartbeatInterval) clearInterval(partnerHeartbeatInterval);
  if (realtimeCheckInsChannel) {
    try { realtimeCheckInsChannel.unsubscribe(); } catch {}
  }
  if (realtimePartnerChannel) {
    try { realtimePartnerChannel.unsubscribe(); } catch {}
  }
  if (coupleLiveChannel) {
    try { coupleLiveChannel.unsubscribe(); } catch {}
  }
  window.removeEventListener('popstate', handlePopState);
  window.removeEventListener('focus', handleAppResume);
  window.removeEventListener('pageshow', handleAppResume);
  window.removeEventListener('keydown', handleZenKeyDown);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('message', handleSwPeriodicSync);
  }
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

    <!-- Mobile Compact Bar (Persistent across Today, Focus, Stats & Rewards tabs) -->
    <MobileCompactBar
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
      :display-name="displayName"
      :travel-mode="travelMode"
      :day-type="dayType"
      :day-type-label="getDayTypeLabel(dayType)"
      :dark-mode="darkMode"
      :zen-mode="zenMode"
      :is-syncing="isSyncingCloud"
      :notifications-supported="notificationsSupported"
      :due-now-notifications-enabled="dueNowNotificationsEnabled"
      :tier-thresholds="tierThresholds"
      :is-guest-active="isGuestActive"
      @toggle-up-next="toggleHabitForDay"
      @toggle-theme="toggleTheme"
      @toggle-zen="toggleZenMode"
      @toggle-travel="toggleTravelMode"
      @share-scorecard="shareDailyScorecard"
      @reload-app="handleAppReload"
      @toggle-notifications="handleToggleDueNowNotifications"
      @open-spotlight="openSpotlight"
      @open-calendar-sync="isCalendarSyncModalOpen = true"
      @open-partner-sync="partnerViewOpen = true"
      @open-partner-pair="isUniversalPartnerPairModalOpen = true"
      @open-protocol-wizard="isProtocolWizardOpen = true"
      @sign-out="emit('sign-out')"
    />

    <!-- ── STICKY MINI HUD — shows after scrolling past hero ── -->
    <div
      class="sticky-hud"
      :class="{ 'sticky-hud--hidden': !showStickyHud }"
      aria-hidden="true"
    >
      <span class="sticky-hud__chip sticky-hud__chip--pts">
        ⚡ {{ todayPoints }}/{{ todayPossibleDailyPoints }} pts
      </span>
      <span class="sticky-hud__chip sticky-hud__chip--streak">
        🔥 {{ systemStreak?.current || 0 }}d
      </span>
      <span class="sticky-hud__chip sticky-hud__chip--time">
        🕐 {{ hudTimeLabel }}
      </span>
      <span v-if="zenMode" class="sticky-hud__chip" style="color:#d4af37; font-weight:700;">
        🧘 ZEN FLOW
      </span>
      <span v-if="upNextHabitInfo && upNextHabitInfo.habit" class="sticky-hud__chip" style="color:#a78bfa; margin-left:auto;">
        ▶ {{ upNextHabitInfo.habit.name }}
      </span>
    </div>

    <!-- Main Dashboard Flow (Multi-view SPA Tab Coordinator) -->
    <div class="dashboard-flow" :class="{ 'dark-mode': darkMode, 'dashboard-flow--zen': zenMode }">
      <!-- ── SECTION: TOP HERO & COMMAND BAR (Desktop & Mobile Command Bar) ── -->
      <section
        class="card card--hero mobile-tab-hero"
        id="overview"
      >
        <TopCommandBar
          :is-jyoti="isJyoti"
          :is-ashish="isAshish"
          :display-name="displayName"
          :active-protocol-name="activeProtocolDisplayName"
          :all-protocols="allProtocols"
          :active-protocol-id="activeProtocolId"
          :is-partner-paired="isPartnerPaired"
          :level-data="levelData"
          :level-title="levelTitle"
          :total-x-p="totalXP"
          :travel-mode="travelMode"
          :day-type="dayType"
          :day-type-label="getDayTypeLabel(dayType)"
          :can-navigate-prev-month="props.canNavigatePrevMonth"
          :can-navigate-next-month="props.canNavigateNextMonth"
          :is-navigating-month="isNavigatingMonth"
          :month-label="monthLabel"
          :year="props.year"
          :dark-mode="darkMode"
          :zen-mode="zenMode"
          :active-tab="activeMobileTab"
          :timer-running="timerState && timerState.running"
          :notifications-enabled="dueNowNotificationsEnabled"
          :partner-presence="partnerPresence"
          :circadian-phase="circadianPhase"
          :active-circadian-mode="activeCircadianMode"
          @cycle-circadian="handleCycleCircadianAtmosphere"
          @set-tab="tab => activeMobileTab = tab"
          @toggle-travel="toggleTravelMode"
          @prev-month="goToPreviousMonth"
          @next-month="goToNextMonth"
          @toggle-theme="toggleTheme"
          @toggle-zen="toggleZenMode"
          @open-install-modal="isAppInstallModalOpen = true"
          @open-spotlight="openSpotlight"
          @open-calendar-sync="isCalendarSyncModalOpen = true"
          @open-partner-sync="partnerViewOpen = true"
          @open-partner-pair="isUniversalPartnerPairModalOpen = true"
          @open-protocol-wizard="isProtocolWizardOpen = true"
          @open-protocol-settings="isProtocolSettingsOpen = true"
          @switch-protocol="handleQuickSwitchProtocol"
        />

        <!-- ── Mission Control Main Executive Deck (2-Column Balanced Grid) ── -->
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
              v-if="props.isCurrentMonth && upNextHabitInfo && !hasCompletedDay(upNextHabitInfo.habit, props.currentDay)"
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
                @click="toggleHabitForDay(upNextHabitInfo.habit, props.currentDay)"
                :title="`Mark '${upNextHabitInfo.habit.name}' as completed (+${upNextHabitInfo.habit.points} XP)`"
              >
                <Check class="icon-xs" />
                <span>Mark Done (+{{ upNextHabitInfo.habit.points }}pt)</span>
              </button>
            </div>

            <div
              v-else-if="props.isCurrentMonth && todayScheduledCount > 0 && todayCompletedCount >= todayScheduledCount"
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
                @click="startQuickFocus(25)"
                title="Launch a 25-minute Pomodoro Deep Work Focus Session"
              >
                <Timer class="icon-xs" />
                <span>{{ timerState && timerState.running ? 'Focus Active' : 'Start 25m Focus' }}</span>
                <span v-if="timerState && timerState.running" class="hero-launch-btn__pulse"></span>
              </button>

              <button
                type="button"
                class="hero-launch-btn hero-launch-btn--share"
                @click="shareDailyScorecard"
                title="Generate and Share your Daily Scorecard"
              >
                <Share2 class="icon-xs" />
                <span>Share Scorecard</span>
              </button>

              <button
                type="button"
                class="hero-launch-btn hero-launch-btn--sync"
                @click="handleAppReload"
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
                  :style="{ width: `${Math.min(100, Math.round((todayPoints / tierThresholds.target) * 100))}%` }"
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

        <!-- ── Mission Control Row 2: Executive 4-Card KPI Ribbon ── -->
        <div class="hero-kpi-ribbon">
          <!-- Card 1: System Streak -->
          <div class="hero-kpi-card hero-kpi-card--streak" :title="`Current Streak: ${systemStreak.current} Days | Longest: ${systemStreak.longest || systemStreak.current} Days`">
            <div class="hero-kpi-card__icon-wrap">
              <Flame class="hero-kpi-card__icon icon-flame" />
            </div>
            <div class="hero-kpi-card__body">
              <span class="hero-kpi-card__label">System Streak</span>
              <div class="hero-kpi-card__value-row">
                <span class="hero-kpi-card__value mono-num">{{ systemStreak.current }}</span>
                <span class="hero-kpi-card__unit">Days</span>
              </div>
              <span class="hero-kpi-card__subtext">
                <span class="hero-kpi-card__sub-highlight mono-num">Best {{ systemStreak.longest || systemStreak.current }}d</span> • Protected
              </span>
            </div>
          </div>

          <!-- Card 2: Reward Vault / Available Wallet -->
          <div class="hero-kpi-card hero-kpi-card--wallet" :title="`${availableWallet} Points Available in Reward Vault • Click to open Vault`" @click="activeMobileTab = 'rewards'">
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
          <div class="hero-kpi-card hero-kpi-card--consistency" :title="`Monthly Stickiness: ${consistencyScore}% (Grade: ${consistencyGrade.grade || 'D'}) • Click for Analytics`" @click="activeMobileTab = 'stats'">
            <div class="hero-kpi-card__icon-wrap">
              <TrendingUp class="hero-kpi-card__icon icon-teal" />
            </div>
            <div class="hero-kpi-card__body">
              <span class="hero-kpi-card__label">Monthly Consistency</span>
              <div class="hero-kpi-card__value-row">
                <span class="hero-kpi-card__value mono-num">{{ consistencyScore }}%</span>
                <span class="hero-kpi-card__badge mono-num" :class="performanceGrade.class">{{ performanceGrade.grade }}</span>
              </div>
              <span class="hero-kpi-card__subtext">{{ performanceGrade.text || 'Target: 85%+ Consistency' }}</span>
            </div>
          </div>

          <!-- Card 4: Daily Execution -->
          <div class="hero-kpi-card hero-kpi-card--today" :title="`${todayCompletedCount} of ${todayScheduledCount} habits completed today`" @click="activeMobileTab = 'today'">
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
      </section>

      <!-- ── SECTION: WARRIOR INTELLIGENCE COCKPIT (Circadian Battle Plan, Keystone Analysis & Biometrics) ── -->
      <WarriorIntelligenceCockpit
        ref="cockpitRef"
        v-if="activeMobileTab === 'today' || activeMobileTab === 'stats'"
        :is-ashish="isAshish"
        :is-jyoti="isJyoti"
        :display-name="displayName"
        :day-type="dayType"
        :day-type-label="getDayTypeLabel(dayType)"
        :current-day="props.currentDay"
        :today-points="todayPoints"
        :today-completed-count="todayCompletedCount"
        :today-scheduled-count="todayScheduledCount"
        :today-habits="todayScheduledHabits"
        :all-habits="localHabits"
        :system-streak="systemStreak"
        :performance-grade="performanceGrade"
        :has-completed-day="hasCompletedDay"
        :biomarkers="biomarkersState"
        :hydration-ml="hydrationMlState"
        :tier-thresholds="tierThresholds"
        @send-high-five="sendWarriorHighFive"
        @update-biomarkers="handleUpdateBiomarkers"
        @update-hydration="handleUpdateHydration"
        @open-data-backup="isDataBackupModalOpen = true"
        @toast="msg => showToast(msg)"
      />

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
        :soundscape-type="soundscapeType"
        :soundscape-volume="soundscapeVolume"
        :is-soundscape-playing="isSoundscapePlaying"
        @update:custom-timer-min="val => customTimerMin = val"
        @update:timer-launcher-duration="val => timerLauncherDuration = val"
        @update:timer-launcher-habit-id="val => timerLauncherHabitId = val"
        @update:timer-sound-enabled="val => timerSoundEnabled = val"
        @set-soundscape-type="setSoundscapeType"
        @update-soundscape-volume="updateSoundscapeVolume"
        @toggle-soundscape-manual="toggleSoundscapeManual"
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
          <div class="section-actions-wrap">
            <button id="habits-btn-add" class="btn btn--primary-action" @click="openAddHabitModal('morning')">
              <Plus class="icon-sm" /> <span>Add Habit</span>
            </button>
            <button id="habits-btn-edit" v-if="!habitsEditing" class="btn btn--secondary" @click="startEditingHabits" title="Customize Habits">
              <Edit3 class="icon-sm" /> <span>Batch Edit</span>
            </button>
          </div>
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

        <!-- Zen Focus Mode Active Notice & Fast Exit Bar -->
        <div v-if="zenMode" class="dashboard-flow--zen-banner">
          <span>🧘 <strong>Zen Flow Mode Active</strong> — Secondary executive cards hidden. Focused on today's execution.</span>
          <button
            type="button"
            class="dashboard-flow--zen-banner__btn"
            @click="toggleZenMode"
            title="Exit Zen Mode (Press Z)"
          >
            Exit Zen Mode (Z)
          </button>
        </div>

        <!-- Mobile Daily Checklist View -->
        <TodayChecklist
          :mobile-day="mobileDay"
          :mobile-day-label="mobileDayLabel"
          :mobile-day-is-today="mobileDayIsToday"
          :mobile-day-is-future="mobileDayIsFuture"
          :is-weekend="isMobileDayWeekend"
          :month-days="props.monthDays"
          :active-time-filter="activeTimeFilter"
          :time-slot-counts="timeSlotCounts"
          :time-slot-completed="timeSlotCompleted"
          :time-slot-definitions="dynamicTimeSlotDefinitions"
          :get-current-time-block="getCurrentTimeBlock"
          :is-ashish="isAshish"
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
          @add-habit="openAddHabitModal"
          @edit-habit="openEditHabitModal"
          @batch-complete-slot="handleBatchCompleteSlot"
          @open-protocol-wizard="isProtocolWizardOpen = true"
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
          :heatmap-data="heatmapData"
          :hovered-heatmap-day="hoveredHeatmapDay"
          :hovered-heatmap-cell="hoveredHeatmapCell"
          :habit-streaks="habitStreaks"
          :milestone-badges="milestoneBadges"
          @update:hovered-heatmap-day="val => hoveredHeatmapDay = val"
          @select-heatmap-day="day => mobileSelectedDay = day"
        />

        <!-- Rheumatology & Autoimmune Clinical Longitudinal Analytics -->
        <RheumatologyClinicalAnalytics
          :biomarkers="biomarkersState"
          :hydration-ml="hydrationMlState"
          :month-scope="monthScope"
          :month="props.month"
          :year="props.year"
          :current-day="props.currentDay"
          :habits="localHabits"
          :display-name="displayName"
          @toast="msg => showToast(msg)"
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
          :is-claimed-this-month="isRewardClaimedThisMonth"
          :can-afford-reward="r => availableWallet >= r.cost"
          :is-partner-paired="isPartnerPaired"
          :partner-display-name="partnerDisplayName"
          :alignment-score="partnerAlignmentScore || 0"
          :combined-weekly-points="combinedWeeklyPoints"
          :is-synergy-unlocked="isCoupleSynergyUnlocked"
          :claimed-synergy-rewards="claimedSynergyRewards"
          :active-couple-synergy-rewards="coupleSynergyRewards"
          :couple-synergy-rewards-draft="coupleSynergyRewardsDraft"
          @toggle-expand="() => {}"
          @start-editing="startEditingRewards"
          @cancel-editing="cancelEditingRewards"
          @save-rewards="saveRewardsCatalog"
          @restore-default-rewards="restoreDefaultRewards"
          @add-draft-reward="addDraftReward"
          @remove-draft-reward="removeDraftReward"
          @redeem-reward="handleRedeemReward"
          @redeem-synergy-reward="handleRedeemSynergyReward"
          @add-draft-synergy-reward="addDraftSynergyReward"
          @remove-draft-synergy-reward="removeDraftSynergyReward"
          @restore-default-synergy-rewards="restoreDefaultSynergyRewards"
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
          :is-partner-paired="isPartnerPaired"
          :partner-display-name="partnerDisplayName"
          :partner-points="partnerPointsToday || 0"
          :shared-anchors="dynamicSharedAnchors"
          :alignment-score="partnerAlignmentScore || 0"
          @toggle-expand="weeklyReviewExpanded = !weeklyReviewExpanded"
          @fill-metrics="fillSundayMetrics"
          @save-review="saveState"
          @open-partner-pair="isUniversalPartnerPairModalOpen = true"
          @open-reward-vault="handleOpenRewardVault"
          @toast="msg => showToast(msg)"
        />
      </section>

      <!-- Global Floating Toast Notification -->
      <transition name="toast-fade">
        <div v-if="toastMessage" class="habuilt-floating-toast">
          <span>{{ toastMessage }}</span>
        </div>
      </transition>

      <!-- Share Daily Scorecard Modal (Energetic Creative Image Generator) -->
      <ShareScorecardModal
        :is-open="isShareModalOpen"
        :display-name="displayName"
        :level-title="levelTitle"
        :level="levelData?.level || 1"
        :streak="systemStreak?.current || 0"
        :wallet="availableWallet || 0"
        :today-points="todayPoints || 0"
        :today-target="15"
        :tier-title="autoProtocolTier?.title || 'Daily Protocol'"
        :completed-count="todayCompletedCount || 0"
        :total-habits="todayScheduledCount || 0"
        :performance-grade="performanceGrade"
        :completed-habits-list="todayCompletedHabitsList"
        :date-label="mobileDayIsToday ? '' : mobileDayLabel"
        :is-partner-paired="isPartnerPaired"
        :partner-display-name="partnerDisplayName"
        :partner-points="partnerPointsToday || 0"
        :shared-anchors="dynamicSharedAnchors"
        :alignment-score="partnerAlignmentScore || 0"
        @close="isShareModalOpen = false"
        @toast="msg => showToast(msg)"
        @open-partner-pair="isUniversalPartnerPairModalOpen = true"
      />

      <!-- Single Habit Add/Edit Modal (Time Pickers, Custom Schedule & Points) -->
      <HabitFormModal
        :is-open="isHabitFormModalOpen"
        :habit="editingHabitTarget"
        :default-slot="defaultSlotForNewHabit"
        @close="closeHabitFormModal"
        @save="handleSaveHabitForm"
        @delete="handleDeleteHabitFromForm"
      />

      <!-- App & Live Notifications Hub Modal (Windows Desktop PWA & Android APK) -->
      <AppInstallModal
        :is-open="isAppInstallModalOpen"
        :notifications-supported="notificationsSupported"
        :notifications-enabled="dueNowNotificationsEnabled"
        :permission-state="notificationPermission"
        :can-install-pwa="canInstallPwa"
        @close="isAppInstallModalOpen = false"
        @toast="msg => showToast(msg)"
        @trigger-install-pwa="handleTriggerInstallPwa"
        @toggle-notifications="handleToggleDueNowNotifications"
        @test-notification="handleSendTestNotification"
      />

      <!-- Spotlight Command Palette Modal (Cmd+K / Ctrl+K) -->
      <SpotlightCommandModal
        :is-open="isSpotlightOpen"
        :habits="todayScheduledHabits"
        :has-completed-day="hasCompletedDay"
        :current-day="props.currentDay"
        :is-ashish="isAshish"
        :day-type="dayType"
        :day-type-label="getDayTypeLabel(dayType)"
        :dark-mode="darkMode"
        :active-tab="activeMobileTab"
        :due-now-notifications-enabled="dueNowNotificationsEnabled"
        @close="isSpotlightOpen = false"
        @open="isSpotlightOpen = true"
        @toggle-habit="habit => toggleHabitForDay(habit, props.currentDay)"
        @start-timer="(min, hId) => { activeMobileTab = 'focus'; startDeepWorkTimer(min, hId); }"
        @set-tab="tab => activeMobileTab = tab"
        @toggle-theme="toggleTheme"
        @toggle-zen="toggleZenMode"
        @toggle-travel="toggleTravelMode"
        @open-add-habit="() => openAddHabitModal('morning')"
        @open-share-scorecard="() => isShareModalOpen = true"
        @toggle-notifications="handleToggleDueNowNotifications"
        @trigger-celebration="() => fireTierMilestone('full')"
        @open-backup="isDataBackupModalOpen = true"
        @open-calendar-sync="isCalendarSyncModalOpen = true"
        @open-partner-sync="partnerViewOpen = true"
        @open-partner-pair="isUniversalPartnerPairModalOpen = true"
        @open-protocol-wizard="isProtocolWizardOpen = true"
        @open-protocol-settings="isProtocolSettingsOpen = true"
        @switch-protocol="handleQuickSwitchProtocol"
        @open-clinical-report="activeMobileTab = 'stats'"
        @play-tactical-briefing="handlePlayTacticalBriefingFromSpotlight"
      />

      <!-- Data Portability & Backup Hub Modal (JSON snapshot & RFC 4180 CSV export) -->
      <DataBackupModal
        :is-open="isDataBackupModalOpen"
        :local-habits="localHabits"
        :all-historical-habits="allHistoricalHabits"
        :month-scope="monthScope"
        :year="props.year"
        :month="props.month"
        :available-wallet="availableWallet"
        :system-streak="systemStreak"
        :weekly-review="weeklyReview"
        :biomarkers="biomarkersState"
        :hydration-ml="hydrationMlState"
        @close="isDataBackupModalOpen = false"
        @toast="msg => showToast(msg)"
        @restore-data="handleRestoreData"
      />

      <!-- Calendar Focus Projection Modal (Google & Outlook / Apple .ics sync) -->
      <CalendarSyncModal
        :is-open="isCalendarSyncModalOpen"
        :day-type="dayType"
        :day-type-label="getDayTypeLabel(dayType)"
        :is-ashish="isAshish"
        :is-jyoti="isJyoti"
        :year="props.year"
        :month="props.month"
        :current-day="props.currentDay"
        @close="isCalendarSyncModalOpen = false"
        @toast="msg => showToast(msg)"
      />

      <!-- Shared Couple Cockpit Modal (Live Peer Visibility & Emote Cheers) -->
      <PartnerSyncModal
        :is-open="partnerViewOpen"
        :is-ashish="isAshish"
        :is-jyoti="isJyoti"
        :display-name="displayName"
        :partner-name="partnerDisplayName"
        :partner-completed-count="partnerCompletedCountToday"
        :partner-total-count="partnerTotalHabitsCount"
        :partner-points="partnerPointsToday"
        :current-day="props.currentDay"
        :shared-anchors="dynamicSharedAnchors"
        :alignment-score="partnerAlignmentScore"
        :is-offline="partnerLiveOffline"
        :partner-presence="partnerPresence"
        @close="partnerViewOpen = false"
        @send-emote="handleSendPartnerEmote"
        @send-nudge="handleSendPartnerNudge"
        @toast="msg => showToast(msg)"
      />

      <!-- Dynamic Protocol Builder & Onboarding Wizard Modal -->
      <ProtocolWizardModal
        :is-open="isProtocolWizardOpen"
        :current-protocol="activeProtocol"
        :is-ashish="isAshish"
        :is-jyoti="isJyoti"
        @close="isProtocolWizardOpen = false"
        @activate="handleActivateCustomProtocol"
        @toast="msg => showToast(msg)"
      />

      <!-- Protocol Settings & Dynamic Scoring Tiers Modal -->
      <ProtocolSettingsModal
        :is-open="isProtocolSettingsOpen"
        :progressive-settings="progressiveSettings"
        :tier-thresholds="tierThresholds"
        :today-possible-daily-points="todayPossibleDailyPoints"
        :time-slot-definitions="dynamicTimeSlotDefinitions"
        :all-protocols="allProtocols"
        :active-protocol="activeProtocol"
        :active-protocol-id="activeProtocolId"
        :is-ashish="isAshish"
        :is-jyoti="isJyoti"
        @close="isProtocolSettingsOpen = false"
        @save-settings="handleSaveProtocolSettings"
        @switch-protocol="handleQuickSwitchProtocol"
        @open-wizard="isProtocolWizardOpen = true"
        @toast="msg => showToast(msg)"
      />

      <!-- Universal Partner Pairing Modal (Invite Code, Link, QR & Peer Link) -->
      <UniversalPartnerPairModal
        :is-open="isUniversalPartnerPairModalOpen"
        :user-id="effectiveUserId"
        :display-name="displayName"
        :is-ashish="isAshish"
        :is-jyoti="isJyoti"
        @close="isUniversalPartnerPairModalOpen = false"
        @paired="handlePartnerPaired"
        @unpaired="handlePartnerUnpaired"
        @toast="msg => showToast(msg)"
      />

      <!-- Android Floating Action Button (FAB) for Quick Add Habit -->
      <button
        v-if="activeMobileTab === 'today'"
        id="mobile-habits-fab"
        type="button"
        class="mobile-fab"
        @click="openAddHabitModal('morning')"
        aria-label="Add Habit"
        title="Add Habit"
      >
        <Plus class="mobile-fab__icon" />
      </button>

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
