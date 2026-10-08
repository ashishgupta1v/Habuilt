<script setup>
import { ref, computed } from 'vue';
import {
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
  User,
  Target,
  Sun,
  Moon,
  Clock,
  Shield,
  Activity,
  Briefcase,
  Heart,
  Crown,
  ArrowRight,
  Zap,
  Sliders,
  CheckCircle2,
  Compass,
  Flame
} from 'lucide-vue-next';
import { PROTOCOL_ARCHETYPES } from '@/Composables/useDynamicProtocols';

const props = defineProps({
  initialName: { type: String, default: '' },
  userEmail: { type: String, default: '' },
  userId: { type: String, default: 'guest' }
});

const emit = defineEmits(['complete', 'skip']);

const currentStep = ref(1);

// Step 1: Identity & Aspiration
const displayName = ref(props.initialName || (props.userEmail ? props.userEmail.split('@')[0] : 'Champion'));
const selectedGoal = ref('cognitive');

const goals = [
  {
    id: 'cognitive',
    title: 'Peak Cognitive Output & Deep Work',
    subtitle: 'Crush high-leverage flow blocks, eliminate distractions, strict evening shutdown',
    icon: Zap,
    color: 'from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-400'
  },
  {
    id: 'vitality',
    title: 'Physical Vitality & Joint Mobility',
    subtitle: 'Spinal alignment, consistent metabolic movement, hydration & restorative sleep',
    icon: Activity,
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400'
  },
  {
    id: 'harmony',
    title: 'Family Harmony & Restorative Balance',
    subtitle: 'Postpartum recovery, shared couple walking anchors, mindful evenings without screens',
    icon: Heart,
    color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400'
  },
  {
    id: 'discipline',
    title: 'Sovereign All-Round Protocol',
    subtitle: 'Full-spectrum execution across physical, clinical, family, and professional domains',
    icon: Crown,
    color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-indigo-400'
  }
];

// Step 2: Routine Archetype Selection
const selectedArchetypeId = ref('archetype-founder');

const archetypeOptions = [
  {
    id: 'archetype-founder',
    key: 'founder',
    name: 'Founder / Deep Work Executive',
    tagline: 'High-output entrepreneurs & knowledge workers',
    badge: '16 Habits • 24 Pts',
    icon: Briefcase,
    colorClass: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    description: 'Structured deep work sprints, daily physical foundation, zero-friction evening shutdown.'
  },
  {
    id: 'archetype-longevity',
    key: 'longevity',
    name: 'Mind-Body & Longevity Architecture',
    tagline: 'Circadian health, spine alignment & clean fuel',
    badge: '18 Habits • 24 Pts',
    icon: Activity,
    colorClass: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    description: 'NOAA solar sunrise exposure, spinal mobility, parasympathetic breathing, nutrition windows.'
  },
  {
    id: 'archetype-postpartum',
    key: 'postpartum',
    name: 'Postpartum & Maternal Harmony',
    tagline: 'Maternal healing, infant milestones & energy',
    badge: '15 Habits • 20 Pts',
    icon: Heart,
    colorClass: 'text-pink-400 border-pink-500/40 bg-pink-500/10',
    description: 'Pelvic health, hydration, balanced maternal nutrition, milestone tracking, gentle recovery.'
  },
  {
    id: 'archetype-ashish',
    key: 'ashishMaster',
    name: 'Ashish Master Protocol',
    tagline: 'Flagship clinical rheumatology & office transit',
    badge: '68 Habits • Master',
    icon: Crown,
    colorClass: 'text-gold border-gold/40 bg-gold/10',
    description: 'Comprehensive 68-step clinical routine, MOVERS morning sadhana, dynamic 4-day office transit engine.'
  },
  {
    id: 'archetype-jyoti',
    key: 'jyotiMaster',
    name: 'Jyoti Master Protocol',
    tagline: 'Maternal nutrition, parenting & professional focus',
    badge: '37 Habits • Master',
    icon: Sparkles,
    colorClass: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
    description: 'Postpartum nourishment, baby motor development, evening couple walks, calm bedtime routine.'
  }
];

// Step 3: Circadian Rhythm Tuning
const wakeTime = ref('05:30');
const workStart = ref('08:30');
const workEnd = ref('18:00');
const sleepTime = ref('22:30');

const morningWindow = computed(() => `${wakeTime.value} – ${workStart.value}`);
const workWindow = computed(() => `${workStart.value} – ${workEnd.value}`);
const eveningWindow = computed(() => `${workEnd.value} – ${sleepTime.value}`);

// Navigation
const handleNext = () => {
  if (currentStep.value < 3) {
    currentStep.value++;
  } else {
    handleFinish();
  }
};

const handleBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const handleFinish = () => {
  const chosenArchetype = archetypeOptions.find(a => a.id === selectedArchetypeId.value) || archetypeOptions[0];
  
  emit('complete', {
    displayName: displayName.value.trim() || 'Champion',
    goal: selectedGoal.value,
    archetypeId: selectedArchetypeId.value,
    archetypeKey: chosenArchetype.key,
    circadian: {
      wakeTime: wakeTime.value,
      workStart: workStart.value,
      workEnd: workEnd.value,
      sleepTime: sleepTime.value,
    }
  });
};

const handleSkip = () => {
  emit('skip');
};
</script>

<template>
  <div class="first-run-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#07090e] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(217,119,6,0.15),rgba(255,255,255,0))] text-slate-100 overflow-y-auto">
    <div class="relative w-full max-w-2xl my-auto bg-[#0e1118]/95 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col first-run-modal">
      
      <!-- Top Ambient Bar & Step Tracker -->
      <div class="px-6 sm:px-8 pt-6 pb-4 border-b border-white/10 bg-white/[0.02]">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-gold/15 border border-gold/40 flex items-center justify-center text-gold">
              <Sparkles class="w-4 h-4" />
            </div>
            <div>
              <span class="text-xs uppercase tracking-widest text-gold font-mono font-semibold">Habuilt Onboarding</span>
              <h1 class="text-base sm:text-lg font-bold text-white tracking-tight">Personalize Your Workspace</h1>
            </div>
          </div>
          <button
            type="button"
            id="onboarding-skip-btn"
            @click="handleSkip"
            class="text-xs font-semibold text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
          >
            Skip to Default
          </button>
        </div>

        <!-- Progress Pills -->
        <div class="flex items-center gap-2">
          <div
            v-for="s in [1, 2, 3]"
            :key="s"
            class="flex-1 h-1.5 rounded-full transition-all duration-300"
            :class="s <= currentStep ? 'bg-gradient-to-r from-gold to-amber-400 shadow-glow-gold' : 'bg-white/10'"
          ></div>
        </div>
      </div>

      <!-- Step Content Area -->
      <div class="p-6 sm:p-8 flex-1 overflow-y-auto max-h-[70vh]">
        
        <!-- ══ STEP 1: IDENTITY & CORE GOAL ══ -->
        <div v-if="currentStep === 1" class="space-y-6 animate-fadeIn onboarding-step-1">
          <div>
            <span class="text-xs uppercase tracking-wider text-amber-400/90 font-mono font-medium">Step 1 of 3</span>
            <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">What should we call you?</h2>
            <p class="text-xs sm:text-sm text-gray-400 mt-1">Set your display name and primary focus aspiration for your habit tracking.</p>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-1.5">
              Display Name
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <User class="w-4 h-4" />
              </div>
              <input
                type="text"
                v-model="displayName"
                id="onboarding-display-name"
                placeholder="e.g. Elena Rostova"
                class="w-full bg-black/40 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white font-medium focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
              Primary Focus Aspiration
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                v-for="g in goals"
                :key="g.id"
                type="button"
                @click="selectedGoal = g.id"
                class="text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 relative group"
                :class="selectedGoal === g.id ? `${g.color} ring-1 ring-gold shadow-lg` : 'bg-white/[0.02] border-white/10 hover:border-white/20 text-gray-300'"
              >
                <div class="p-2 rounded-lg bg-black/30 border border-white/10 shrink-0">
                  <component :is="g.icon" class="w-4 h-4" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-xs font-bold text-white truncate">{{ g.title }}</div>
                  <div class="text-[11px] text-gray-400 line-clamp-2 mt-0.5 leading-snug">{{ g.subtitle }}</div>
                </div>
                <div v-if="selectedGoal === g.id" class="w-4 h-4 rounded-full bg-gold text-black flex items-center justify-center shrink-0">
                  <Check class="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- ══ STEP 2: ROUTINE ARCHETYPE ══ -->
        <div v-else-if="currentStep === 2" class="space-y-6 animate-fadeIn onboarding-step-2">
          <div>
            <span class="text-xs uppercase tracking-wider text-amber-400/90 font-mono font-medium">Step 2 of 3</span>
            <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">Select Your Routine Archetype</h2>
            <p class="text-xs sm:text-sm text-gray-400 mt-1">Pick a curated blueprint designed for your lifestyle. You can customize habits anytime.</p>
          </div>

          <div class="space-y-3">
            <button
              v-for="arch in archetypeOptions"
              :key="arch.id"
              type="button"
              @click="selectedArchetypeId = arch.id"
              :id="`onboarding-archetype-${arch.key}`"
              class="w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 relative group onboarding-archetype-card"
              :class="selectedArchetypeId === arch.id ? 'bg-gold/10 border-gold shadow-glow-gold' : 'bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]'"
            >
              <div class="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0" :class="arch.colorClass">
                <component :is="arch.icon" class="w-5 h-5" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="text-sm font-bold text-white tracking-wide truncate">{{ arch.name }}</h3>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-semibold shrink-0">
                    {{ arch.badge }}
                  </span>
                </div>
                <p class="text-xs text-amber-300/80 font-medium mt-0.5">{{ arch.tagline }}</p>
                <p class="text-[11px] text-gray-400 mt-1 leading-relaxed">{{ arch.description }}</p>
              </div>
              <div
                class="w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5"
                :class="selectedArchetypeId === arch.id ? 'bg-gold border-gold text-black' : 'border-white/20 text-transparent'"
              >
                <Check class="w-3 h-3 stroke-[3]" />
              </div>
            </button>
          </div>
        </div>

        <!-- ══ STEP 3: CIRCADIAN SCHEDULE & LAUNCH ══ -->
        <div v-else-if="currentStep === 3" class="space-y-6 animate-fadeIn onboarding-step-3">
          <div>
            <span class="text-xs uppercase tracking-wider text-amber-400/90 font-mono font-medium">Step 3 of 3</span>
            <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">Circadian Rhythm & Time Blocks</h2>
            <p class="text-xs sm:text-sm text-gray-400 mt-1">Set your waking and sleeping targets to align your daily task matrix with natural energy curves.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div class="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Sun class="w-4 h-4" /> Wake & Morning Window
              </div>
              <div>
                <label class="block text-[11px] text-gray-400 mb-1">Target Wake Up Time</label>
                <input
                  type="time"
                  v-model="wakeTime"
                  id="onboarding-wake-time"
                  class="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-gold"
                />
              </div>
              <div class="text-[11px] text-gray-400 flex items-center justify-between pt-1">
                <span>Morning Energy Window:</span>
                <strong class="text-white font-mono">{{ morningWindow }}</strong>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
              <div class="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                <Moon class="w-4 h-4" /> Sleep & Wind-Down Window
              </div>
              <div>
                <label class="block text-[11px] text-gray-400 mb-1">Target Sleep Time</label>
                <input
                  type="time"
                  v-model="sleepTime"
                  id="onboarding-sleep-time"
                  class="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-gold"
                />
              </div>
              <div class="text-[11px] text-gray-400 flex items-center justify-between pt-1">
                <span>Evening Calm Window:</span>
                <strong class="text-white font-mono">{{ eveningWindow }}</strong>
              </div>
            </div>
          </div>

          <!-- Summary Matrix Launch Box -->
          <div class="p-4 rounded-2xl bg-gradient-to-r from-gold/10 via-amber-500/5 to-transparent border border-gold/30 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold shrink-0">
              <Compass class="w-6 h-6" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-xs uppercase tracking-wider text-gold font-mono font-bold">Ready to Launch</div>
              <div class="text-sm font-bold text-white truncate">
                {{ displayName }}'s System • {{ archetypeOptions.find(a => a.id === selectedArchetypeId)?.name }}
              </div>
              <div class="text-xs text-gray-400">Offline Web Audio & IndexedDB storage initialized automatically.</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Bottom Navigation Footer -->
      <div class="px-6 sm:px-8 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
        <button
          v-if="currentStep > 1"
          type="button"
          @click="handleBack"
          class="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
        >
          <ChevronLeft class="w-4 h-4" /> Back
        </button>
        <div v-else></div>

        <button
          type="button"
          @click="handleNext"
          id="onboarding-next-btn"
          class="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-500 hover:from-gold-light hover:to-amber-400 text-black text-xs font-bold transition-all shadow-glow-gold"
        >
          <span>{{ currentStep === 3 ? '🚀 Launch My Workspace' : 'Continue' }}</span>
          <ChevronRight v-if="currentStep < 3" class="w-4 h-4" />
          <ArrowRight v-else class="w-4 h-4" />
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fadeIn {
  animation: fadeIn 0.25s ease-out forwards;
}
.shadow-glow-gold {
  box-shadow: 0 0 25px rgba(217, 119, 6, 0.2);
}
</style>
