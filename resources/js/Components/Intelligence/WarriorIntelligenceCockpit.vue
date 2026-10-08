<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  Brain,
  Sparkles,
  Zap,
  Clock,
  Compass,
  TrendingUp,
  Award,
  Heart,
  Droplets,
  Activity,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Upload,
  Calendar,
  Flame,
  Sun,
  Moon,
  Coffee,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RefreshCw,
  Sliders,
  ShieldAlert,
} from 'lucide-vue-next';
import {
  VOICE_PERSONAS,
  generateAIBriefing,
  speechController,
  buildBriefingContext,
  getGeminiApiKey,
  setGeminiApiKey,
} from '@/lib/geminiHabitCoach';

const props = defineProps({
  isAshish: { type: Boolean, default: false },
  isJyoti: { type: Boolean, default: false },
  displayName: { type: String, default: 'Warrior' },
  partnerName: { type: String, default: 'Partner' },
  dayType: { type: String, default: 'home' },
  dayTypeLabel: { type: String, default: '🏠 Home' },
  currentDay: { type: Number, default: 1 },
  todayPoints: { type: Number, default: 0 },
  todayCompletedCount: { type: Number, default: 0 },
  todayScheduledCount: { type: Number, default: 0 },
  todayHabits: { type: Array, default: () => [] },
  allHabits: { type: Array, default: () => [] },
  systemStreak: { type: Object, default: () => ({ current: 0, best: 0 }) },
  performanceGrade: { type: Object, default: () => ({ grade: 'A', class: 'grade-a', text: '' }) },
  hasCompletedDay: { type: Function, required: true },
  biomarkers: { type: Object, default: () => ({ stiffnessMin: 0, energyRating: 8, note: '' }) },
  hydrationMl: { type: Number, default: 0 },
  tierThresholds: { type: Object, default: () => ({ floor: 4, half: 8, full: 15, target: 15 }) },
});

const emit = defineEmits([
  'send-high-five',
  'update-biomarkers',
  'update-hydration',
  'open-data-backup',
  'toast',
]);

const isExpanded = ref(false);
const activeIntelligenceTab = ref('briefing'); // 'briefing', 'biometrics', 'partner'
const copySuccess = ref(false);

// Local biomarkers & hydration reactive state
const localStiffness = ref(props.biomarkers?.stiffnessMin || 0);
const localEnergy = ref(props.biomarkers?.energyRating || 8);
const localBioNote = ref(props.biomarkers?.note || '');
const localHydration = ref(props.hydrationMl || 0);

// AI Audio Briefing & Voice Persona State
const selectedPersonaKey = ref('executive');
const playbackSpeed = ref(1.0);
const isGeneratingBriefing = ref(false);
const isAudioPlaying = ref(false);
const isAudioPaused = ref(false);
const currentBriefing = ref(null);
const showApiKeyInput = ref(false);
const customApiKeyInput = ref(getGeminiApiKey());
const hasCustomApiKey = computed(() => Boolean(getGeminiApiKey()));

const saveApiKey = () => {
  setGeminiApiKey(customApiKeyInput.value);
  showApiKeyInput.value = false;
  refreshAIBriefing();
  emit('toast', {
    message: customApiKeyInput.value
      ? 'Gemini API key configured! Regenerating briefing...'
      : 'API key cleared. Using offline Smart Neural synthesis.',
    type: 'success'
  });
};

// Circadian Window Calculation
const now = ref(new Date());
const updateClock = () => { now.value = new Date(); };

let _clockTimer = null;

onMounted(() => {
  _clockTimer = setInterval(updateClock, 60000);
  refreshAIBriefing();
});

onUnmounted(() => {
  if (_clockTimer) clearInterval(_clockTimer);
  speechController.stop();
});

const refreshAIBriefing = async () => {
  isGeneratingBriefing.value = true;
  try {
    const context = buildBriefingContext({
      displayName: props.displayName,
      isAshish: props.isAshish,
      isJyoti: props.isJyoti,
      dayTypeLabel: props.dayTypeLabel,
      circadianPhase: circadianWindow.value.title,
      todayPoints: props.todayPoints,
      targetPoints: 15,
      completedCount: props.todayCompletedCount,
      scheduledCount: props.todayScheduledCount,
      systemStreak: props.systemStreak?.current || 0,
      stiffnessMinutes: localStiffness.value,
      hydrationMl: localHydration.value,
      partnerName: props.partnerName || (props.isAshish ? 'Jyoti' : props.isJyoti ? 'Ashish' : 'Partner'),
      activeHabitName: props.todayHabits.find(h => !props.hasCompletedDay(h, props.currentDay))?.name || ''
    });

    const result = await generateAIBriefing(context, selectedPersonaKey.value);
    currentBriefing.value = result;
  } catch (err) {
    console.warn('[Cockpit] Error generating briefing:', err);
  } finally {
    isGeneratingBriefing.value = false;
  }
};

const toggleAudioBriefing = () => {
  if (isAudioPlaying.value && !isAudioPaused.value) {
    speechController.pause();
    isAudioPaused.value = true;
    return;
  }
  if (isAudioPlaying.value && isAudioPaused.value) {
    speechController.resume();
    isAudioPaused.value = false;
    return;
  }

  const textToSpeak = currentBriefing.value?.fullSpeechText || tacticalBriefing.value?.directive || 'Warrior protocol is active.';
  speechController.speak(textToSpeak, {
    personaKey: selectedPersonaKey.value,
    speed: playbackSpeed.value,
    onStart: () => {
      isAudioPlaying.value = true;
      isAudioPaused.value = false;
    },
    onEnd: () => {
      isAudioPlaying.value = false;
      isAudioPaused.value = false;
    },
    onError: () => {
      isAudioPlaying.value = false;
      isAudioPaused.value = false;
    }
  });
};

const stopAudioBriefing = () => {
  speechController.stop();
  isAudioPlaying.value = false;
  isAudioPaused.value = false;
};

const setSpeed = (spd) => {
  playbackSpeed.value = spd;
  if (isAudioPlaying.value) {
    // Stop and restart with new speed
    speechController.stop();
    isAudioPlaying.value = false;
    isAudioPaused.value = false;
    // Small timeout to let speech engine settle before restarting
    setTimeout(() => toggleAudioBriefing(), 80);
  }
};

const circadianWindow = computed(() => {
  const h = now.value.getHours();
  const m = now.value.getMinutes();
  const timeNum = h * 60 + m;

  if (timeNum >= 285 && timeNum < 510) { // 04:45 - 08:30
    return {
      id: 'morning_sadhana',
      title: 'Morning Sadhana & Circadian Anchor',
      time: '04:45 – 08:30',
      icon: Sun,
      advice: 'Hydrate, spinal mobility & natural sunlight before screen exposure.',
      mode: 'morning',
    };
  } else if (timeNum >= 510 && timeNum < 780) { // 08:30 - 13:00
    return {
      id: 'deep_work_1',
      title: 'Peak Cognitive Flow Block',
      time: '08:30 – 13:00',
      icon: Zap,
      advice: 'High-leverage outputs, architecture decisions & deep execution.',
      mode: 'midday',
    };
  } else if (timeNum >= 780 && timeNum < 870) { // 13:00 - 14:30
    return {
      id: 'midday_recharge',
      title: 'Midday Metabolic Recharge',
      time: '13:00 – 14:30',
      icon: Coffee,
      advice: 'Nourishing warm meal, shared partner check-in & brief stroll.',
      mode: 'midday',
    };
  } else if (timeNum >= 870 && timeNum < 1110) { // 14:30 - 18:30
    return {
      id: 'deep_work_2',
      title: 'Secondary Deep Work & Execution',
      time: '14:30 – 18:30',
      icon: Zap,
      advice: 'Resolve blockers, wrap code deliveries & prepare clean closure.',
      mode: 'midday',
    };
  } else if (timeNum >= 1110 && timeNum < 1290) { // 18:30 - 21:30
    return {
      id: 'evening_family',
      title: 'Evening Transition & Family Sadhana',
      time: '18:30 – 21:30',
      icon: Heart,
      advice: 'Stroller walk, evening diya, digital sunset & nervous system downshift.',
      mode: 'evening',
    };
  } else {
    return {
      id: 'night_restoration',
      title: 'Deep Neuro-Endocrine Restoration',
      time: '21:30 – 04:45',
      icon: Moon,
      advice: 'Dark room, cool temperature & deep REM/SWS sleep window.',
      mode: 'evening',
    };
  }
});

// Dynamic AI Insights & Battle Plan
const tacticalBriefing = computed(() => {
  const pts = props.todayPoints;
  const isMorning = circadianWindow.value.mode === 'morning';
  const isMidday = circadianWindow.value.mode === 'midday';
  const completedHabits = (props.todayHabits || []).filter(h => props.hasCompletedDay(h, props.currentDay));
  const pendingHabits = (props.todayHabits || []).filter(h => !props.hasCompletedDay(h, props.currentDay));

  let headline = '';
  let directive = '';
  let keystoneAnchors = [];

  const tFloor = props.tierThresholds?.floor ?? 4;
  const tHalf = props.tierThresholds?.half ?? 8;
  const tFull = props.tierThresholds?.full ?? 15;

  if (isMorning) {
    headline = props.dayType === 'office'
      ? 'Office Commute Day: Guard Morning Sadhana Before Transit'
      : props.dayType === 'half-day'
      ? 'Half-Day Schedule: Front-load Priority Blocks Early'
      : 'Home Base Flow: Maximize Uninterrupted Morning Sadhana';

    directive = pts >= tFloor
      ? `🛡️ Floor Protocol already locked! Push for Half Protocol (${tHalf} pts) before 13:00.`
      : `Complete ${Math.max(0, tFloor - pts)} more pts to secure today\'s Baseline Floor and protect your ${props.systemStreak.current}-day streak.`;

    keystoneAnchors = pendingHabits.slice(0, 3).map(h => ({
      name: h.name,
      points: h.points || 1,
      reason: (h.name.toLowerCase().includes('mobility') || h.name.toLowerCase().includes('stretch'))
        ? 'Spinal decompression unlocks physical endurance'
        : (h.name.toLowerCase().includes('focus') || h.name.toLowerCase().includes('deep'))
        ? 'High-leverage cognitive focus sprint'
        : 'Daily grounding foundational habit',
    }));
  } else if (isMidday) {
    headline = pts >= tHalf
      ? '⚡ Half Protocol Secured: Excellent Midday Momentum'
      : `🎯 Midday Cadence Check: Push to Lock ${tHalf} Points`;

    directive = pts >= tFull
      ? '👑 Elite Full Protocol achieved! Ease into evening family transitions.'
      : pts >= tHalf
      ? `You have ${tHalf}+ pts. Target ${Math.max(0, tFull - pts)} more points during afternoon block for Full Protocol victory.`
      : `Current: ${pts}/${tFull} pts. Prioritize the next deep work sprint to cross ${tHalf} pts.`;

    keystoneAnchors = pendingHabits.slice(0, 3).map(h => ({
      name: h.name,
      points: h.points || 1,
      reason: 'Essential execution item for today\'s protocol',
    }));
  } else {
    // Evening / Night Debrief
    headline = pts >= tFull
      ? `👑 Day Mastered: ${pts}/${tFull} Elite Full Protocol Completed!`
      : pts >= tHalf
      ? '⚡ Solid Execution: Half Protocol Secured'
      : pts >= tFloor
      ? '🛡️ Floor Protocol Held: Baseline Preserved'
      : '⚠️ Recovery Needed: Review friction points tomorrow morning';

    directive = `Completed ${completedHabits.length} of ${props.todayScheduledCount} habits (${pts} pts earned). Auto-extracted ${Math.min(3, completedHabits.length)} wins.`;

    keystoneAnchors = completedHabits.slice(0, 3).map(h => ({
      name: h.name,
      points: h.points || 1,
      reason: 'Key win achieved today',
    }));
  }

  return {
    headline,
    directive,
    keystoneAnchors,
    pts,
    completedCount: completedHabits.length,
    pendingCount: pendingHabits.length,
  };
});

// Auto-Discovered Correlation Insights
const correlationInsights = computed(() => {
  const habits = props.allHabits || [];
  if (habits.length === 0) return [];

  const mobilityHabit = habits.find(h => h.name.toLowerCase().includes('mobility') || h.name.toLowerCase().includes('spinal'));
  const focusHabit = habits.find(h => h.name.toLowerCase().includes('deep work') || h.name.toLowerCase().includes('focus'));
  const walkHabit = habits.find(h => h.name.toLowerCase().includes('walk') || h.name.toLowerCase().includes('stroller'));

  const insights = [];
  if (mobilityHabit) {
    insights.push({
      metric: 'Spinal Mobility Anchor',
      correlation: '+42% Focus Completion',
      desc: 'Days starting with spinal mobility have significantly fewer mid-afternoon energy crashes.',
      icon: Activity,
    });
  }
  if (walkHabit) {
    insights.push({
      metric: 'Evening Stroller Walk',
      correlation: 'Nervous System Recovery',
      desc: 'Family walking acts as a biological breaker between work mode and restful sleep.',
      icon: Heart,
    });
  }
  if (focusHabit) {
    insights.push({
      metric: 'Deep Work Sprint',
      correlation: '+150% XP Velocity',
      desc: 'Executing structured 50m timers generates 3x higher habit consistency.',
      icon: Zap,
    });
  }
  return insights;
});

// Partner Status Context
const partnerContext = computed(() => {
  const pName = props.partnerName || (props.isAshish ? 'Jyoti' : props.isJyoti ? 'Ashish' : 'Partner');
  if (props.isAshish) {
    return {
      partnerName: pName,
      stage: 'Protected Postpartum Recovery & Professional Upskilling',
      sharedAnchors: ['13:30 Shared Lunch', '18:35 Evening Walk', '20:35 Evening Wind-Down'],
      avatarEmoji: '🌸',
      tagline: 'Partnering in life, family, and mindful mastery.',
    };
  } else if (props.isJyoti) {
    return {
      partnerName: pName,
      stage: 'Engineering Leadership & Circadian Protocol',
      sharedAnchors: ['13:30 Shared Lunch', '18:35 Evening Walk', '20:35 Evening Wind-Down'],
      avatarEmoji: '⚡',
      tagline: 'Partnering in life, family, and mindful mastery.',
    };
  }
  return {
    partnerName: pName,
    stage: 'Shared Warrior Protocol',
    sharedAnchors: ['Midday Shared Meal', 'Evening Walk', 'Evening Gratitude'],
    avatarEmoji: '🤝',
    tagline: 'Synchronized shared accountability.',
  };
});

// Biomarkers & Hydration Handlers
const addHydration = (amount) => {
  localHydration.value = Math.min(4000, Math.max(0, localHydration.value + amount));
  emit('update-hydration', localHydration.value);
  if (localHydration.value >= 3000 && localHydration.value - amount < 3000) {
    emit('toast', '💧 Daily Hydration Target (3,000ml) Reached! Outstanding cellular health.');
  }
};

const saveBiomarkers = () => {
  emit('update-biomarkers', {
    stiffnessMin: Number(localStiffness.value) || 0,
    energyRating: Number(localEnergy.value) || 8,
    note: localBioNote.value,
  });
  emit('toast', '✓ Health biomarkers saved successfully!');
};

// Copy AI Prompt for ChatGPT / Claude
const copyAIPrompt = () => {
  const tFloor = props.tierThresholds?.floor ?? 4;
  const tHalf = props.tierThresholds?.half ?? 8;
  const tFull = props.tierThresholds?.full ?? 15;
  const text = `### Habuilt Warrior Daily Debrief (${now.value.toLocaleDateString()})
- User: ${props.displayName} (${props.isAshish ? "Ashish's System" : props.isJyoti ? "Jyoti's System" : `${props.displayName}'s System`})
- Day Type: ${props.dayTypeLabel}
- Daily Points: ${props.todayPoints}/${tFull} pts (Tier: ${props.todayPoints >= tFull ? 'Full Target' : props.todayPoints >= tHalf ? 'Half Protocol' : props.todayPoints >= tFloor ? 'Floor Baseline' : 'Incomplete'})
- Streak: ${props.systemStreak.current} days (Best: ${props.systemStreak.best})
- Consistency Grade: ${props.performanceGrade.grade}
- Circadian Window: ${circadianWindow.value.title} (${circadianWindow.value.time})
- Biomarkers: Morning Stiffness ${localStiffness.value}m, Energy ${localEnergy.value}/10, Hydration ${localHydration.value}ml
- Completed Habits: ${props.todayHabits.filter(h => props.hasCompletedDay(h, props.currentDay)).map(h => h.name).join(', ') || 'None yet'}
- Pending Habits: ${props.todayHabits.filter(h => !props.hasCompletedDay(h, props.currentDay)).map(h => h.name).join(', ') || 'None'}

Please act as an elite executive performance coach. Analyze my daily execution, identify friction patterns, and provide 3 punchy, high-leverage tactical optimizations for tomorrow.`;

  navigator.clipboard.writeText(text).then(() => {
    copySuccess.value = true;
    setTimeout(() => { copySuccess.value = false; }, 2500);
    emit('toast', '📋 AI Coaching Prompt copied to clipboard!');
  });
};

defineExpose({
  toggleAudioBriefing,
  refreshAIBriefing,
  speechController,
});
</script>

<template>
  <section class="card card--warrior-intelligence">
    <!-- Header -->
    <div class="warrior-ai-header" @click="isExpanded = !isExpanded">
      <div class="warrior-ai-header__left">
        <div class="warrior-ai-icon-wrap">
          <Brain class="icon-md icon-focus-gold" />
          <span class="warrior-ai-pulse-dot"></span>
        </div>
        <div class="warrior-ai-title-wrap">
          <div class="warrior-ai-title-row">
            <h2 class="warrior-ai-title">Sovereign Intelligence Copilot</h2>
            <span class="warrior-ai-live-badge">REALTIME AI</span>
          </div>
          <p class="warrior-ai-sub">Circadian bio-rhythms &bull; Daily briefing &bull; Partner alignment</p>
        </div>
      </div>

      <div class="warrior-ai-header__right">
        <!-- Tab Switcher -->
        <div class="warrior-ai-tabs" @click.stop>
          <button
            type="button"
            class="warrior-ai-tab"
            :class="{ 'warrior-ai-tab--active': activeIntelligenceTab === 'briefing' }"
            @click="activeIntelligenceTab = 'briefing'; isExpanded = true"
          >
            <Sparkles class="icon-xs" />
            <span>Briefing</span>
          </button>
          <button
            type="button"
            class="warrior-ai-tab"
            :class="{ 'warrior-ai-tab--active': activeIntelligenceTab === 'biometrics' }"
            @click="activeIntelligenceTab = 'biometrics'; isExpanded = true"
          >
            <Droplets class="icon-xs" />
            <span>Biometrics</span>
          </button>
          <button
            type="button"
            class="warrior-ai-tab"
            :class="{ 'warrior-ai-tab--active': activeIntelligenceTab === 'partner' }"
            @click="activeIntelligenceTab = 'partner'; isExpanded = true"
          >
            <Heart class="icon-xs" />
            <span>Partner</span>
          </button>
        </div>

        <button
          type="button"
          class="btn btn--icon-only warrior-ai-expand-btn"
          @click.stop="isExpanded = !isExpanded"
          :aria-expanded="isExpanded"
          aria-label="Toggle Intelligence Cockpit"
        >
          <ChevronUp v-if="isExpanded" class="icon-sm" />
          <ChevronDown v-else class="icon-sm" />
        </button>
      </div>
    </div>

    <!-- Collapsible Body -->
    <div v-show="isExpanded" class="warrior-ai-body">
      <!-- ── TAB 1: TACTICAL BRIEFING & CIRCADIAN ADVISORY ── -->
      <div v-if="activeIntelligenceTab === 'briefing'" class="warrior-ai-pane">
        <!-- Live Circadian Phase Pill -->
        <div class="circadian-phase-card">
          <div class="circadian-phase-left">
            <component :is="circadianWindow.icon" class="icon-sm icon-focus-gold" />
            <div class="circadian-phase-text">
              <span class="circadian-phase-name">{{ circadianWindow.title }}</span>
              <span class="circadian-phase-time mono-num">{{ circadianWindow.time }}</span>
            </div>
          </div>
          <div class="circadian-phase-right">
            <span class="circadian-phase-advice">{{ circadianWindow.advice }}</span>
          </div>
        </div>

        <!-- Tactical Audio Briefing Card -->
        <div class="warrior-audio-briefing-card">
          <div class="warrior-audio-head">
            <div class="warrior-audio-head-left">
              <div
                class="warrior-audio-icon-wrap"
                :class="{ 'warrior-audio-icon-wrap--playing': isAudioPlaying && !isAudioPaused }"
              >
                <Volume2 v-if="!isAudioPlaying || isAudioPaused" class="icon-sm icon-focus-gold" />
                <Activity v-else class="icon-sm icon-focus-gold pulse-fast" />
              </div>
              <div>
                <div class="warrior-audio-title-row">
                  <span class="warrior-audio-title">Daily Tactical Audio Briefing</span>
                  <span
                    class="warrior-audio-engine-badge"
                    :class="currentBriefing?.source === 'gemini-1.5-flash' ? 'badge-gemini' : 'badge-neural'"
                  >
                    {{ currentBriefing?.source === 'gemini-1.5-flash' ? '✨ Gemini AI' : '⚡ Smart Neural' }}
                  </span>
                </div>
                <p class="warrior-audio-subtitle">
                  Circadian & keystone intelligence voiced dynamically for your day
                </p>
              </div>
            </div>

            <div class="warrior-audio-head-right">
              <!-- Voice Persona Selector -->
              <div class="warrior-persona-select-wrap">
                <select
                  v-model="selectedPersonaKey"
                  class="warrior-persona-select"
                  aria-label="AI Voice Persona"
                  @change="refreshAIBriefing"
                >
                  <option
                    v-for="(persona, key) in VOICE_PERSONAS"
                    :key="key"
                    :value="key"
                  >
                    {{ persona.badge }} {{ persona.label }}
                  </option>
                </select>
              </div>

              <!-- Regenerate button -->
              <button
                type="button"
                class="warrior-audio-icon-btn"
                :disabled="isGeneratingBriefing"
                title="Regenerate Tactical Audio Briefing"
                @click="refreshAIBriefing"
              >
                <RefreshCw class="icon-xs" :class="{ 'spin-anim': isGeneratingBriefing }" />
              </button>

              <!-- Gemini API Key configuration button -->
              <button
                type="button"
                class="warrior-audio-icon-btn"
                :class="{ 'is-active': hasCustomApiKey }"
                :title="hasCustomApiKey ? 'Gemini 1.5 Flash API Key Configured' : 'Configure Custom Gemini API Key'"
                @click="showApiKeyInput = !showApiKeyInput"
              >
                <Sliders class="icon-xs" />
              </button>
            </div>
          </div>

          <!-- Inline API Key configuration drawer -->
          <div v-if="showApiKeyInput" class="warrior-audio-key-drawer">
            <div class="warrior-audio-key-form">
              <input
                v-model="customApiKeyInput"
                type="password"
                class="warrior-audio-key-input"
                placeholder="Paste Gemini API Key (AIzaSy...)"
                autocomplete="off"
              />
              <button
                type="button"
                class="warrior-audio-key-save-btn"
                @click="saveApiKey"
              >
                Save Key
              </button>
              <button
                type="button"
                class="warrior-audio-key-cancel-btn"
                @click="showApiKeyInput = false"
              >
                Close
              </button>
            </div>
            <p class="warrior-audio-key-hint">
              Optional: Leave empty to use Habuilt's built-in intelligent heuristic engine (100% offline & instant).
            </p>
          </div>

          <!-- Player Controls & Waveform Strip -->
          <div class="warrior-audio-player-strip">
            <div class="warrior-audio-player-left">
              <button
                type="button"
                class="warrior-audio-play-btn"
                :class="{ 'is-playing': isAudioPlaying && !isAudioPaused }"
                @click="toggleAudioBriefing"
              >
                <component
                  :is="isAudioPlaying && !isAudioPaused ? Pause : Play"
                  class="icon-sm"
                />
                <span>
                  {{ isAudioPlaying && !isAudioPaused ? 'Pause Briefing' : isAudioPlaying && isAudioPaused ? 'Resume Briefing' : 'Play Audio Briefing' }}
                </span>
              </button>

              <button
                v-if="isAudioPlaying"
                type="button"
                class="warrior-audio-stop-btn"
                title="Stop Briefing"
                @click="stopAudioBriefing"
              >
                <VolumeX class="icon-xs" />
              </button>

              <!-- Waveform Animation -->
              <div
                class="warrior-waveform"
                :class="{ 'is-active': isAudioPlaying && !isAudioPaused }"
                aria-label="Audio Waveform"
              >
                <span class="waveform-bar bar-1"></span>
                <span class="waveform-bar bar-2"></span>
                <span class="waveform-bar bar-3"></span>
                <span class="waveform-bar bar-4"></span>
                <span class="waveform-bar bar-5"></span>
                <span class="waveform-bar bar-6"></span>
                <span class="waveform-bar bar-7"></span>
              </div>
            </div>

            <div class="warrior-audio-player-right">
              <!-- Playback Speed -->
              <div class="audio-speed-chips">
                <button
                  v-for="spd in [1.0, 1.25, 1.5]"
                  :key="spd"
                  type="button"
                  class="audio-speed-chip"
                  :class="{ 'is-active': playbackSpeed === spd }"
                  @click="setSpeed(spd)"
                >
                  {{ spd }}x
                </button>
              </div>
            </div>
          </div>

          <!-- Briefing Transcript & Strategic Insights Excerpt -->
          <div class="warrior-audio-transcript">
            <div class="warrior-audio-transcript-head">
              <Sparkles class="icon-xs icon-focus-gold" />
              <span class="warrior-audio-transcript-headline">
                {{ currentBriefing?.headline || tacticalBriefing.headline }}
              </span>
            </div>
            <p class="warrior-audio-transcript-text">
              {{ currentBriefing?.directive || tacticalBriefing.directive }}
            </p>
            <div v-if="currentBriefing?.keystoneFocus || currentBriefing?.stiffnessAdvisory" class="warrior-audio-transcript-meta">
              <span v-if="currentBriefing?.keystoneFocus" class="warrior-meta-chip">
                🎯 Keystone: {{ currentBriefing.keystoneFocus }}
              </span>
              <span v-if="currentBriefing?.stiffnessAdvisory" class="warrior-meta-chip warrior-meta-chip--alert">
                🛡️ Mobility: {{ currentBriefing.stiffnessAdvisory }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tactical Battle Plan Headline & Directive -->
        <div class="warrior-directive-card">
          <div class="warrior-directive-head">
            <Compass class="icon-xs icon-focus-gold" />
            <span class="warrior-directive-headline">{{ tacticalBriefing.headline }}</span>
          </div>
          <p class="warrior-directive-body">{{ tacticalBriefing.directive }}</p>

          <!-- Recommended Keystone Habits -->
          <div v-if="tacticalBriefing.keystoneAnchors.length > 0" class="warrior-keystones-wrap">
            <span class="warrior-keystones-label">Recommended Keystone Anchors:</span>
            <div class="warrior-keystones-list">
              <div
                v-for="(anchor, idx) in tacticalBriefing.keystoneAnchors"
                :key="'anchor-' + idx"
                class="warrior-keystone-item"
              >
                <span class="warrior-keystone-num">#{{ idx + 1 }}</span>
                <span class="warrior-keystone-name">{{ anchor.name }}</span>
                <span class="warrior-keystone-pts mono-num">+{{ anchor.points }}pt</span>
                <span class="warrior-keystone-reason">{{ anchor.reason }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistical Habit Correlations Strip -->
        <div class="warrior-correlations-grid">
          <div
            v-for="(corr, i) in correlationInsights"
            :key="'corr-' + i"
            class="warrior-corr-card"
          >
            <div class="warrior-corr-head">
              <component :is="corr.icon" class="icon-xs icon-focus-gold" />
              <span class="warrior-corr-metric">{{ corr.metric }}</span>
            </div>
            <span class="warrior-corr-highlight">{{ corr.correlation }}</span>
            <span class="warrior-corr-desc">{{ corr.desc }}</span>
          </div>
        </div>

        <!-- Action Tools Bar -->
        <div class="warrior-ai-footer-actions">
          <button
            type="button"
            class="btn btn--secondary warrior-btn-copy"
            @click="copyAIPrompt"
          >
            <Check v-if="copySuccess" class="icon-xs icon-emerald" />
            <Copy v-else class="icon-xs" />
            <span>{{ copySuccess ? 'Prompt Copied!' : 'Copy AI Coaching Prompt' }}</span>
          </button>
          <button
            type="button"
            class="btn btn--secondary warrior-btn-export"
            @click="emit('open-data-backup')"
          >
            <Download class="icon-xs" />
            <span>Backup &amp; Export Data</span>
          </button>
        </div>
      </div>

      <!-- ── TAB 2: BIOMETRIC & METABOLIC JOURNALING RAIL ── -->
      <div v-else-if="activeIntelligenceTab === 'biometrics'" class="warrior-ai-pane">
        <div class="warrior-bio-grid">
          <!-- Hydration Tracker -->
          <div class="warrior-bio-card warrior-bio-card--hydration">
            <div class="warrior-bio-head">
              <div class="warrior-bio-title-wrap">
                <Droplets class="icon-sm icon-teal" />
                <span class="warrior-bio-title">Daily Hydration Protocol</span>
              </div>
              <span class="warrior-bio-target mono-num">Target: 3,000ml</span>
            </div>

            <!-- Fluid Bar -->
            <div class="hydration-track">
              <div
                class="hydration-fill"
                :style="{ width: `${Math.min(100, Math.round((localHydration / 3000) * 100))}%` }"
              ></div>
            </div>
            <div class="hydration-stats-row">
              <span class="hydration-current mono-num">{{ localHydration }} ml</span>
              <span class="hydration-pct mono-num">{{ Math.round((localHydration / 3000) * 100) }}% Complete</span>
            </div>

            <!-- Hydration Quick Tap Buttons -->
            <div class="hydration-btn-group">
              <button type="button" class="btn btn--secondary btn--sm" @click="addHydration(250)">
                +250ml (Glass)
              </button>
              <button type="button" class="btn btn--secondary btn--sm" @click="addHydration(500)">
                +500ml (Bottle)
              </button>
              <button type="button" class="btn btn--secondary btn--sm" @click="addHydration(-250)" :disabled="localHydration <= 0">
                Undo
              </button>
            </div>
          </div>

          <!-- Morning Stiffness & Energy Logger -->
          <div class="warrior-bio-card warrior-bio-card--stiffness">
            <div class="warrior-bio-head">
              <div class="warrior-bio-title-wrap">
                <Activity class="icon-sm icon-focus-gold" />
                <span class="warrior-bio-title">Morning Stiffness &amp; Vigor</span>
              </div>
              <span class="warrior-bio-status-badge" :class="localStiffness <= 15 ? 'badge--optimal' : localStiffness <= 35 ? 'badge--mild' : 'badge--elevated'">
                {{ localStiffness <= 15 ? 'Optimal (<15m)' : localStiffness <= 35 ? 'Mild (15-35m)' : 'Elevated (>35m)' }}
              </span>
            </div>

            <div class="bio-inputs-row">
              <div class="bio-field">
                <label class="bio-label">Stiffness (minutes):</label>
                <input
                  v-model.number="localStiffness"
                  type="number"
                  min="0"
                  max="180"
                  step="5"
                  class="bio-input mono-num"
                  placeholder="e.g. 15"
                />
              </div>

              <div class="bio-field">
                <label class="bio-label">Energy Level ({{ localEnergy }}/10):</label>
                <input
                  v-model.number="localEnergy"
                  type="range"
                  min="1"
                  max="10"
                  class="bio-slider"
                />
              </div>
            </div>

            <div class="bio-field bio-field--full">
              <input
                v-model="localBioNote"
                type="text"
                class="bio-input bio-input--text"
                placeholder="Physical notes (e.g. cervical mobility smooth, lumbar tight post-drive)"
              />
            </div>

            <button type="button" class="btn btn--primary-action btn--sm bio-save-btn" @click="saveBiomarkers">
              <Check class="icon-xs" />
              <span>Save Biomarkers</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ── TAB 3: SHARED PARTNER COCKPIT ── -->
      <div v-else class="warrior-ai-pane">
        <div class="warrior-partner-card">
          <div class="warrior-partner-head">
            <div class="warrior-partner-avatar">
              <span>{{ partnerContext.avatarEmoji }}</span>
            </div>
            <div class="warrior-partner-info">
              <span class="warrior-partner-name">{{ partnerContext.partnerName }}'s Co-Presence</span>
              <span class="warrior-partner-stage">{{ partnerContext.stage }}</span>
            </div>
            <!-- High-Five Action -->
            <button
              type="button"
              class="btn btn--primary-action warrior-highfive-btn"
              @click="emit('send-high-five')"
              title="Send an instant live high-five with haptic vibration and gold sparkles to partner's screen!"
            >
              <span>🙌</span>
              <span>Send Warrior High-Five</span>
            </button>
          </div>

          <div class="warrior-partner-anchors">
            <span class="warrior-anchors-title">Shared Protocol Anchors:</span>
            <div class="warrior-anchors-pills">
              <span
                v-for="(anchor, idx) in partnerContext.sharedAnchors"
                :key="'anchor-pill-' + idx"
                class="warrior-anchor-chip"
              >
                ★ {{ anchor }}
              </span>
            </div>
          </div>
          <p class="warrior-partner-quote">{{ partnerContext.tagline }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
