<script setup>
import { ref, computed, watch } from 'vue';
import {
  X,
  Sparkles,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Clock,
  Sun,
  Moon,
  Briefcase,
  Heart,
  Activity,
  Crown,
  Edit,
  Plus,
  Trash2,
  Zap,
  Sliders,
  ShieldCheck,
  Target
} from 'lucide-vue-next';
import { PROTOCOL_ARCHETYPES } from '@/Composables/useDynamicProtocols';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  currentProtocol: { type: Object, default: null },
  isAshish: { type: Boolean, default: false },
  isJyoti: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'activate', 'toast']);

// Wizard step state: 1 = Choose Archetype, 2 = Circadian Schedule, 3 = Habits Customizer, 4 = Confirmation
const currentStep = ref(1);

// Selected Archetype
const selectedArchetypeKey = ref('founder');

// Form state
const protocolName = ref('Founder / Deep Work Executive');
const protocolDescription = ref('');
const wakeTime = ref('05:30');
const workStart = ref('08:30');
const workEnd = ref('18:00');
const sleepTime = ref('22:30');
const habitsList = ref([]);

// New custom habit modal/input inside step 3
const isAddingCustomHabit = ref(false);
const newHabitName = ref('');
const newHabitPoints = ref(1);
const newHabitSlot = ref('morning');
const newHabitCategory = ref('work');

// Initialize from props or default archetype
const syncFromArchetype = (key) => {
  const arch = PROTOCOL_ARCHETYPES[key] || PROTOCOL_ARCHETYPES.founder;
  selectedArchetypeKey.value = key;
  protocolName.value = arch.name;
  protocolDescription.value = arch.description;
  wakeTime.value = arch.wakeTime || '05:30';
  workStart.value = arch.workStart || '08:30';
  workEnd.value = arch.workEnd || '18:00';
  sleepTime.value = arch.sleepTime || '22:30';
  habitsList.value = (arch.habits || []).map(h => ({
    ...h,
    enabled: true
  }));
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    currentStep.value = 1;
    if (props.isJyoti) {
      syncFromArchetype('jyotiMaster');
    } else if (props.isAshish) {
      syncFromArchetype('ashishMaster');
    } else if (props.currentProtocol?.key && PROTOCOL_ARCHETYPES[props.currentProtocol.key]) {
      syncFromArchetype(props.currentProtocol.key);
    } else {
      syncFromArchetype('founder');
    }
  }
});

const handleArchetypeSelect = (key) => {
  syncFromArchetype(key);
  currentStep.value = 2;
};

// Step 2 live calculated dynamic slots preview
const calculatedMorningSlot = computed(() => `${wakeTime.value} – ${workStart.value}`);
const calculatedWorkSlot = computed(() => `${workStart.value} – ${workEnd.value}`);
const calculatedEveningSlot = computed(() => `${workEnd.value} – ${sleepTime.value}`);

// Active enabled habits summary
const enabledHabits = computed(() => habitsList.value.filter(h => h.enabled));
const totalPointsPerDay = computed(() => enabledHabits.value.reduce((acc, h) => acc + (Number(h.points) || 1), 0));

const toggleHabitEnabled = (index) => {
  habitsList.value[index].enabled = !habitsList.value[index].enabled;
};

const removeHabit = (index) => {
  habitsList.value.splice(index, 1);
};

const handleAddCustomHabit = () => {
  if (!newHabitName.value.trim()) return;
  habitsList.value.push({
    id: `custom-h-${Date.now()}`,
    name: newHabitName.value.trim(),
    points: Number(newHabitPoints.value) || 1,
    timeSlot: newHabitSlot.value,
    category: newHabitCategory.value,
    hint: 'Custom activity created in Protocol Builder',
    enabled: true
  });
  newHabitName.value = '';
  newHabitPoints.value = 1;
  isAddingCustomHabit.value = false;
  emit('toast', 'Custom habit added to protocol');
};

const handleActivateProtocol = () => {
  const payload = {
    id: `proto-${Date.now()}`,
    key: selectedArchetypeKey.value,
    name: protocolName.value,
    description: protocolDescription.value,
    wakeTime: wakeTime.value,
    workStart: workStart.value,
    workEnd: workEnd.value,
    sleepTime: sleepTime.value,
    habits: enabledHabits.value
  };

  emit('activate', payload);
  emit('toast', `🚀 Protocol "${protocolName.value}" Activated!`);
  emit('close');
};
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
    <div class="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#14151b] border border-gold/30 rounded-2xl shadow-2xl overflow-hidden text-gray-100">
      
      <!-- Modal Top Bar -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#191b22]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gold/10 border border-gold/40 flex items-center justify-center text-gold shadow-glow-gold">
            <Sliders class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              Dynamic Protocol Builder
              <span class="text-xs px-2 py-0.5 rounded-full bg-gold/20 text-gold font-mono border border-gold/30">Step {{ currentStep }} of 4</span>
            </h2>
            <p class="text-xs text-gray-400">Tailor circadian time blocks, priority activities, and lifestyle anchors</p>
          </div>
        </div>
        <button
          @click="emit('close')"
          class="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Close Wizard"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Step Progress Bar -->
      <div class="w-full bg-white/5 h-1.5 flex">
        <div
          class="h-full bg-gradient-to-r from-gold to-amber-400 transition-all duration-300"
          :style="{ width: `${(currentStep / 4) * 100}%` }"
        ></div>
      </div>

      <!-- Scrollable Wizard Body -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6">

        <!-- ══ STEP 1: CHOOSE ARCHETYPE ══ -->
        <div v-if="currentStep === 1" class="space-y-4">
          <div class="text-center max-w-lg mx-auto mb-6">
            <h3 class="text-xl font-bold text-white mb-1">Select an Operating Archetype</h3>
            <p class="text-xs text-gray-400">Choose a proven baseline protocol. You can fine-tune every habit, time slot, and point weight in the next steps.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Founder Executive -->
            <div
              @click="handleArchetypeSelect('founder')"
              class="group p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-gold/5 hover:border-gold/50 cursor-pointer transition-all duration-200 relative overflow-hidden"
              :class="{ 'border-gold bg-gold/10 ring-1 ring-gold': selectedArchetypeKey === 'founder' }"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Briefcase class="w-5 h-5" />
                </div>
                <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">Founder & Exec</span>
              </div>
              <h4 class="font-bold text-white group-hover:text-gold transition-colors text-sm">Founder / Deep Work Executive</h4>
              <p class="text-xs text-gray-400 mt-1">Deep architecture focus sprints, cortisol reset, clean brain fuel, and non-negotiable shutdown.</p>
              <div class="mt-3 flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-white/5">
                <span>⏰ 05:30 Wake · 16 Habits</span>
                <span class="text-gold font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">Select <ChevronRight class="w-3.5 h-3.5" /></span>
              </div>
            </div>

            <!-- Mind-Body Longevity -->
            <div
              @click="handleArchetypeSelect('longevity')"
              class="group p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-emerald-500/5 hover:border-emerald-500/50 cursor-pointer transition-all duration-200 relative overflow-hidden"
              :class="{ 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500': selectedArchetypeKey === 'longevity' }"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Activity class="w-5 h-5" />
                </div>
                <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Longevity</span>
              </div>
              <h4 class="font-bold text-white group-hover:text-emerald-400 transition-colors text-sm">Mind-Body & Longevity</h4>
              <p class="text-xs text-gray-400 mt-1">Spinal decompression, diaphragmatic breathwork, Zone-2 cardio, vascular flush, early light meals.</p>
              <div class="mt-3 flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-white/5">
                <span>⏰ 05:00 Wake · 18 Habits</span>
                <span class="text-emerald-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">Select <ChevronRight class="w-3.5 h-3.5" /></span>
              </div>
            </div>

            <!-- Postpartum Mother & Family -->
            <div
              @click="handleArchetypeSelect('postpartum')"
              class="group p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-rose-500/5 hover:border-rose-500/50 cursor-pointer transition-all duration-200 relative overflow-hidden"
              :class="{ 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-500': selectedArchetypeKey === 'postpartum' }"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Heart class="w-5 h-5" />
                </div>
                <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">Nurture</span>
              </div>
              <h4 class="font-bold text-white group-hover:text-rose-400 transition-colors text-sm">Postpartum Mother & Family</h4>
              <p class="text-xs text-gray-400 mt-1">Protected morning rest window, pelvic resetting, lactation hydration, career micro-sprint, baby bonding.</p>
              <div class="mt-3 flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-white/5">
                <span>⏰ 06:00 Rest Floor · 16 Habits</span>
                <span class="text-rose-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">Select <ChevronRight class="w-3.5 h-3.5" /></span>
              </div>
            </div>

            <!-- Blank Canvas Protocol -->
            <div
              @click="handleArchetypeSelect('blank')"
              class="group p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-purple-500/5 hover:border-purple-500/50 cursor-pointer transition-all duration-200 relative overflow-hidden"
              :class="{ 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500': selectedArchetypeKey === 'blank' }"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Edit class="w-5 h-5" />
                </div>
                <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">Custom Canvas</span>
              </div>
              <h4 class="font-bold text-white group-hover:text-purple-400 transition-colors text-sm">Blank Canvas Protocol</h4>
              <p class="text-xs text-gray-400 mt-1">Start from a clean slate. Define custom wake times, work windows, and build your bespoke habit matrix.</p>
              <div class="mt-3 flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-white/5">
                <span>⏰ Customizable · 6 Habits</span>
                <span class="text-purple-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">Select <ChevronRight class="w-3.5 h-3.5" /></span>
              </div>
            </div>

            <!-- Ashish Master Reference Preset -->
            <div
              @click="handleArchetypeSelect('ashishMaster')"
              class="p-4 rounded-xl border border-gold/30 bg-gold/[0.04] hover:bg-gold/10 hover:border-gold/60 cursor-pointer transition-all duration-200 relative"
              :class="{ 'border-gold bg-gold/15 ring-1 ring-gold': selectedArchetypeKey === 'ashishMaster' }"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="w-9 h-9 rounded-lg bg-gold/10 border border-gold/40 flex items-center justify-center text-gold">
                  <Crown class="w-5 h-5" />
                </div>
                <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-gold/20 text-gold border border-gold/40">Master 68-Step</span>
              </div>
              <h4 class="font-bold text-gold text-sm">Ashish Master Protocol</h4>
              <p class="text-xs text-gray-300 mt-1">Flagship 68-step blueprint with MOVERS Sadhana, clinical biomarkers, and 4 travel modes.</p>
              <div class="mt-3 flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gold/10">
                <span>⏰ 04:45 Wake · 68 Activities</span>
                <span class="text-gold font-medium flex items-center gap-1">Select <ChevronRight class="w-3.5 h-3.5" /></span>
              </div>
            </div>

            <!-- Jyoti Master Reference Preset -->
            <div
              @click="handleArchetypeSelect('jyotiMaster')"
              class="p-4 rounded-xl border border-pink-500/30 bg-pink-500/[0.04] hover:bg-pink-500/10 hover:border-pink-500/60 cursor-pointer transition-all duration-200 relative"
              :class="{ 'border-pink-500 bg-pink-500/15 ring-1 ring-pink-500': selectedArchetypeKey === 'jyotiMaster' }"
            >
              <div class="flex items-start justify-between mb-2">
                <div class="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/40 flex items-center justify-center text-pink-400">
                  <Heart class="w-5 h-5" />
                </div>
                <span class="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/40">Master 37-Step</span>
              </div>
              <h4 class="font-bold text-pink-400 text-sm">Jyoti Master Protocol</h4>
              <p class="text-xs text-gray-300 mt-1">Flagship maternal recovery & career growth blueprint with Shaarvi milestones.</p>
              <div class="mt-3 flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-pink-500/10">
                <span>⏰ 05:00 Rest Floor · 37 Activities</span>
                <span class="text-pink-400 font-medium flex items-center gap-1">Select <ChevronRight class="w-3.5 h-3.5" /></span>
              </div>
            </div>
          </div>
        </div>

        <!-- ══ STEP 2: CIRCADIAN RHYTHM & SCHEDULE ══ -->
        <div v-if="currentStep === 2" class="space-y-6">
          <div class="text-center max-w-lg mx-auto">
            <h3 class="text-xl font-bold text-white mb-1">Circadian Rhythm & Daily Boundaries</h3>
            <p class="text-xs text-gray-400">Set your anchor hours. The app dynamically partitions your habits into Morning, Deep Work, and Evening phases.</p>
          </div>

          <!-- Protocol Label & Description -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
            <div>
              <label class="block text-xs font-semibold text-gray-300 mb-1.5">Protocol Title</label>
              <input
                v-model="protocolName"
                type="text"
                class="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold"
                placeholder="e.g. My Peak Protocol"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-300 mb-1.5">Focus Objective / Motto</label>
              <input
                v-model="protocolDescription"
                type="text"
                class="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold"
                placeholder="e.g. High leverage & calm mind"
              />
            </div>
          </div>

          <!-- Time Pickers Grid -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
              <div class="flex items-center gap-1.5 text-xs font-medium text-amber-400 mb-2">
                <Sun class="w-4 h-4" /> Wake-Up Hour
              </div>
              <input
                v-model="wakeTime"
                type="time"
                class="w-full bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-center text-sm font-mono text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
              <div class="flex items-center gap-1.5 text-xs font-medium text-blue-400 mb-2">
                <Briefcase class="w-4 h-4" /> Work Start
              </div>
              <input
                v-model="workStart"
                type="time"
                class="w-full bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-center text-sm font-mono text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
              <div class="flex items-center gap-1.5 text-xs font-medium text-purple-400 mb-2">
                <Clock class="w-4 h-4" /> Work Shutdown
              </div>
              <input
                v-model="workEnd"
                type="time"
                class="w-full bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-center text-sm font-mono text-white focus:border-gold focus:outline-none"
              />
            </div>

            <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
              <div class="flex items-center gap-1.5 text-xs font-medium text-indigo-400 mb-2">
                <Moon class="w-4 h-4" /> Lights Out Target
              </div>
              <input
                v-model="sleepTime"
                type="time"
                class="w-full bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-center text-sm font-mono text-white focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          <!-- Dynamic Slots Visualization Preview -->
          <div class="p-4 rounded-xl bg-gradient-to-br from-gold/5 via-transparent to-amber-500/5 border border-gold/20">
            <h4 class="text-xs font-bold text-gold uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap class="w-4 h-4" /> Calculated Time Slots Rail
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="p-3 rounded-lg bg-black/30 border border-white/5">
                <div class="text-[11px] text-amber-400 font-semibold mb-0.5">🌅 Morning Routine</div>
                <div class="text-sm font-mono text-white">{{ calculatedMorningSlot }}</div>
                <div class="text-[10px] text-gray-400 mt-1">Awakening, Sadhana, Mobility & Breakfast</div>
              </div>
              <div class="p-3 rounded-lg bg-black/30 border border-white/5">
                <div class="text-[11px] text-gold font-semibold mb-0.5">⚡ Deep Work & Ops</div>
                <div class="text-sm font-mono text-white">{{ calculatedWorkSlot }}</div>
                <div class="text-[10px] text-gray-400 mt-1">High-leverage focus, calls & deliverables</div>
              </div>
              <div class="p-3 rounded-lg bg-black/30 border border-white/5">
                <div class="text-[11px] text-purple-400 font-semibold mb-0.5">🌙 Evening & Family</div>
                <div class="text-sm font-mono text-white">{{ calculatedEveningSlot }}</div>
                <div class="text-[10px] text-gray-400 mt-1">Dinner, family stroll, journaling & sleep prep</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ══ STEP 3: HABITS CUSTOMIZER ══ -->
        <div v-if="currentStep === 3" class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-white">Fine-Tune Protocol Activities</h3>
              <p class="text-xs text-gray-400">Toggle habits on/off, adjust point weights, or add bespoke routines.</p>
            </div>
            <button
              @click="isAddingCustomHabit = !isAddingCustomHabit"
              class="px-3 py-1.5 rounded-lg bg-gold/20 hover:bg-gold/30 text-gold border border-gold/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus class="w-4 h-4" /> Add Habit
            </button>
          </div>

          <!-- Add Habit Inline Drawer -->
          <div v-if="isAddingCustomHabit" class="p-4 rounded-xl bg-gold/5 border border-gold/30 space-y-3 animate-fadeIn">
            <h4 class="text-xs font-bold text-gold uppercase tracking-wider">New Custom Activity</h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                v-model="newHabitName"
                type="text"
                placeholder="e.g. 15-Min Cold Plunge / Reading"
                class="sm:col-span-2 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-gold"
              />
              <div class="flex gap-2">
                <select
                  v-model="newHabitSlot"
                  class="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-gold"
                >
                  <option value="morning">Morning</option>
                  <option value="work">Work</option>
                  <option value="evening">Evening</option>
                  <option value="anytime">Anytime</option>
                  <option value="weekly">Weekly</option>
                </select>
                <input
                  v-model="newHabitPoints"
                  type="number"
                  min="1"
                  max="5"
                  class="w-14 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-center text-xs text-white focus:outline-none focus:border-gold"
                  title="Points"
                />
              </div>
            </div>
            <div class="flex justify-end gap-2 pt-1">
              <button
                @click="isAddingCustomHabit = false"
                class="px-3 py-1 rounded text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                @click="handleAddCustomHabit"
                class="px-3 py-1 rounded bg-gold text-black text-xs font-bold hover:bg-gold-light"
              >
                Save Activity
              </button>
            </div>
          </div>

          <!-- Habits List -->
          <div class="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            <div
              v-for="(habit, idx) in habitsList"
              :key="habit.id || idx"
              class="flex items-center justify-between p-3 rounded-xl border transition-all"
              :class="habit.enabled ? 'bg-white/[0.03] border-white/10' : 'bg-white/[0.01] border-white/5 opacity-40'"
            >
              <div class="flex items-center gap-3 flex-1 min-w-0 pr-3">
                <button
                  @click="toggleHabitEnabled(idx)"
                  class="w-5 h-5 rounded flex items-center justify-center transition-colors"
                  :class="habit.enabled ? 'bg-gold text-black' : 'border border-gray-600 text-transparent'"
                >
                  <Check class="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <div class="min-w-0 flex-1">
                  <div class="text-xs font-medium text-white truncate" :class="{ 'line-through text-gray-500': !habit.enabled }">
                    {{ habit.name }}
                  </div>
                  <div class="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                    <span class="uppercase tracking-wider font-mono text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-gold">{{ habit.timeSlot || 'anytime' }}</span>
                    <span>{{ habit.category || 'general' }}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold text-gold px-2 py-0.5 rounded bg-gold/10 border border-gold/20">
                  +{{ habit.points }} pt
                </span>
                <button
                  @click="removeHabit(idx)"
                  class="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Remove from protocol"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ══ STEP 4: ACTIVATION & CONFIRMATION ══ -->
        <div v-if="currentStep === 4" class="space-y-6 text-center py-2">
          <div class="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-gold to-amber-400 flex items-center justify-center text-black shadow-glow-gold">
            <Sparkles class="w-8 h-8" />
          </div>

          <div class="max-w-md mx-auto">
            <h3 class="text-xl font-bold text-white mb-1">Ready to Activate {{ protocolName }}?</h3>
            <p class="text-xs text-gray-400">Your dashboard, daily time rails, and target scoring will update immediately.</p>
          </div>

          <!-- Protocol Metrics Summary Card -->
          <div class="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <div class="text-2xl font-black text-gold font-mono">{{ enabledHabits.length }}</div>
              <div class="text-[10px] text-gray-400 uppercase tracking-wider font-medium mt-1">Active Habits</div>
            </div>
            <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <div class="text-2xl font-black text-amber-400 font-mono">{{ totalPointsPerDay }}</div>
              <div class="text-[10px] text-gray-400 uppercase tracking-wider font-medium mt-1">Daily Points Max</div>
            </div>
            <div class="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-center">
              <div class="text-2xl font-black text-emerald-400 font-mono">{{ wakeTime }}</div>
              <div class="text-[10px] text-gray-400 uppercase tracking-wider font-medium mt-1">Anchor Wake</div>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-white/[0.02] border border-white/10 text-left text-xs space-y-2 max-w-lg mx-auto">
            <div class="flex items-center gap-2 text-gold font-semibold">
              <ShieldCheck class="w-4 h-4" /> Multi-Tenant Synchronization
            </div>
            <p class="text-gray-300 text-[11px] leading-relaxed">
              This protocol is saved to your profile and backed up in real time. You can switch between archetypes or customize habits at any time from the Top Command Bar.
            </p>
          </div>
        </div>

      </div>

      <!-- Modal Bottom Navigation Rail -->
      <div class="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#191b22]">
        <div>
          <button
            v-if="currentStep > 1"
            @click="currentStep--"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
          >
            <ChevronLeft class="w-4 h-4" /> Back
          </button>
        </div>

        <div class="flex items-center gap-3">
          <button
            v-if="currentStep < 4"
            @click="currentStep++"
            class="px-5 py-2 rounded-xl bg-gold text-black text-xs font-bold hover:bg-gold-light transition-all flex items-center gap-1.5 shadow-gold"
          >
            Next <ChevronRight class="w-4 h-4" />
          </button>

          <button
            v-else
            @click="handleActivateProtocol"
            class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-gold to-amber-400 text-black text-xs font-black hover:opacity-95 transition-all flex items-center gap-2 shadow-glow-gold transform hover:scale-[1.02]"
          >
            <CheckCircle2 class="w-4 h-4" /> Activate Protocol Now
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.98); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fadeIn {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.shadow-glow-gold {
  box-shadow: 0 0 20px rgba(212, 160, 62, 0.35);
}
</style>
