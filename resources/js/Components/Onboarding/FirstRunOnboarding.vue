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
    title: 'Movement and joint mobility',
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
    subtitle: 'Movement, family, and work on one list',
    icon: Crown,
    color: 'from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-indigo-400'
  }
];

// Step 2: Routine Archetype Selection
const selectedArchetypeId = ref('archetype-founder');

const commercialArchetypes = [
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
    id: 'archetype-athlete',
    key: 'athlete',
    name: 'High-Performance Athlete & Discipline',
    tagline: 'Hyper-focused training, metabolic recovery & stamina',
    badge: '15 Habits • 25 Pts',
    icon: Flame,
    colorClass: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
    description: 'Compound strength training, cold contrast rinse, lean nutrition, and restorative 8h sleep.'
  },
  {
    id: 'archetype-postpartum',
    key: 'postpartum',
    name: 'Parenting & Family Harmony',
    tagline: 'Family balance, protected recovery & personal focus',
    badge: '15 Habits • 20 Pts',
    icon: Heart,
    colorClass: 'text-pink-400 border-pink-500/40 bg-pink-500/10',
    description: 'Protected sleep recovery, wholesome nutrition, family bonding, and stress reduction.'
  }
];

const archetypeOptions = computed(() => commercialArchetypes);

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
  const options = archetypeOptions.value || [];
  const chosenArchetype = options.find(a => a.id === selectedArchetypeId.value) || options[0] || {};
  
  emit('complete', {
    displayName: displayName.value.trim() || 'Champion',
    goal: selectedGoal.value,
    archetypeId: selectedArchetypeId.value,
    archetypeKey: chosenArchetype.key || 'founder',
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
  <div class="onb first-run-overlay">
    <div class="onb-modal first-run-modal">
      
      <div class="onb-top">
        <div class="onb-top__row">
          <div class="onb-brand">
            <div class="onb-brand__mark" aria-hidden="true">
              <Sparkles />
            </div>
            <div>
              <span class="onb-kicker">Habuilt Onboarding</span>
              <h1>Personalize Your Workspace</h1>
            </div>
          </div>
          <button
            type="button"
            id="onboarding-skip-btn"
            class="onb-skip"
            @click="handleSkip"
          >
            Skip to Default
          </button>
        </div>

        <div class="onb-progress" aria-hidden="true">
          <span
            v-for="s in [1, 2, 3]"
            :key="s"
            :class="{ 'is-on': s <= currentStep }"
          ></span>
        </div>
      </div>

      <div class="onb-body">
        
        <!-- ══ STEP 1: IDENTITY & CORE GOAL ══ -->
        <div v-if="currentStep === 1" class="onb-step onboarding-step-1">
          <div class="onb-intro">
            <span class="onb-step__count">Step 1 of 3</span>
            <h2>What should we call you?</h2>
            <p>Set your display name and primary focus aspiration for your habit tracking.</p>
          </div>

          <div class="onb-field">
            <label for="onboarding-display-name">Display Name</label>
            <div class="onb-field__control">
              <User aria-hidden="true" />
              <input
                type="text"
                v-model="displayName"
                id="onboarding-display-name"
                placeholder="e.g. Elena Rostova"
              />
            </div>
          </div>

          <div class="onb-field">
            <span class="onb-field__legend" id="onboarding-aspiration-label">Primary Focus Aspiration</span>
            <div class="onb-grid" role="group" aria-labelledby="onboarding-aspiration-label">
              <button
                v-for="g in goals"
                :key="g.id"
                type="button"
                class="onb-card"
                :class="{ 'is-selected': selectedGoal === g.id }"
                :aria-pressed="selectedGoal === g.id ? 'true' : 'false'"
                @click="selectedGoal = g.id"
              >
                <span class="onb-card__icon" aria-hidden="true">
                  <component :is="g.icon" />
                </span>
                <span class="onb-card__copy">
                  <span class="onb-card__title">{{ g.title }}</span>
                  <span class="onb-card__sub">{{ g.subtitle }}</span>
                </span>
                <span v-if="selectedGoal === g.id" class="onb-card__check" aria-hidden="true">
                  <Check />
                </span>
              </button>
            </div>
          </div>
        </div>

        <!-- ══ STEP 2: ROUTINE ARCHETYPE ══ -->
        <div v-else-if="currentStep === 2" class="onb-step onboarding-step-2">
          <div class="onb-intro">
            <span class="onb-step__count">Step 2 of 3</span>
            <h2>Select Your Routine Archetype</h2>
            <p>Pick a curated blueprint designed for your lifestyle. You can customize habits anytime.</p>
          </div>

          <div class="onb-stack">
            <button
              v-for="arch in archetypeOptions"
              :key="arch.id"
              type="button"
              :id="`onboarding-archetype-${arch.key}`"
              class="onb-arch onboarding-archetype-card"
              :class="{ 'is-selected': selectedArchetypeId === arch.id }"
              :aria-pressed="selectedArchetypeId === arch.id ? 'true' : 'false'"
              @click="selectedArchetypeId = arch.id"
            >
              <span class="onb-card__icon" aria-hidden="true">
                <component :is="arch.icon" />
              </span>
              <span class="onb-card__copy">
                <span class="onb-arch__head">
                  <span class="onb-card__title">{{ arch.name }}</span>
                  <span class="onb-badge">{{ arch.badge }}</span>
                </span>
                <span class="onb-arch__tag">{{ arch.tagline }}</span>
                <span class="onb-card__sub">{{ arch.description }}</span>
              </span>
              <span class="onb-card__check" :class="{ 'is-on': selectedArchetypeId === arch.id }" aria-hidden="true">
                <Check />
              </span>
            </button>
          </div>
        </div>

        <!-- ══ STEP 3: CIRCADIAN SCHEDULE & LAUNCH ══ -->
        <div v-else-if="currentStep === 3" class="onb-step onboarding-step-3">
          <div class="onb-intro">
            <span class="onb-step__count">Step 3 of 3</span>
            <h2>Circadian Rhythm & Time Blocks</h2>
            <p>Set your waking and sleeping targets to align your daily task matrix with natural energy curves.</p>
          </div>

          <div class="onb-grid">
            <div class="onb-time">
              <div class="onb-time__label">
                <Sun aria-hidden="true" /> Wake & Morning Window
              </div>
              <label for="onboarding-wake-time">Target Wake Up Time</label>
              <input
                type="time"
                v-model="wakeTime"
                id="onboarding-wake-time"
              />
              <p class="onb-time__window">
                <span>Morning Energy Window</span>
                <strong>{{ morningWindow }}</strong>
              </p>
            </div>

            <div class="onb-time">
              <div class="onb-time__label">
                <Moon aria-hidden="true" /> Sleep & Wind-Down Window
              </div>
              <label for="onboarding-sleep-time">Target Sleep Time</label>
              <input
                type="time"
                v-model="sleepTime"
                id="onboarding-sleep-time"
              />
              <p class="onb-time__window">
                <span>Evening Calm Window</span>
                <strong>{{ eveningWindow }}</strong>
              </p>
            </div>
          </div>

          <div class="onb-launch">
            <span class="onb-card__icon" aria-hidden="true">
              <Compass />
            </span>
            <span class="onb-card__copy">
              <span class="onb-kicker">Ready to Launch</span>
              <span class="onb-card__title">
                {{ displayName }}'s System · {{ archetypeOptions.find(a => a.id === selectedArchetypeId)?.name }}
              </span>
              <span class="onb-card__sub">Your list is saved on this device and can sync when you are signed in.</span>
            </span>
          </div>
        </div>

      </div>

      <div class="onb-footer">
        <button
          v-if="currentStep > 1"
          type="button"
          class="onb-back"
          @click="handleBack"
        >
          <ChevronLeft aria-hidden="true" /> Back
        </button>
        <span v-else></span>

        <button
          type="button"
          id="onboarding-next-btn"
          class="onb-next"
          @click="handleNext"
        >
          <span>{{ currentStep === 3 ? 'Launch My Workspace' : 'Continue' }}</span>
          <ChevronRight v-if="currentStep < 3" aria-hidden="true" />
          <ArrowRight v-else aria-hidden="true" />
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
.onb {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  box-sizing: border-box;
  overflow: auto;
  padding: 16px;
  background: #F7F8F2;
  color: #0C110D;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.onb-modal {
  display: flex;
  flex-direction: column;
  width: min(760px, 100%);
  max-height: calc(100dvh - 32px);
  margin: auto;
  overflow: hidden;
  box-sizing: border-box;
  background: #ffffff;
  color: #0C110D;
  border: 1px solid #E4E6DC;
  border-radius: 24px;
}

.onb-top,
.onb-body,
.onb-footer {
  box-sizing: border-box;
  min-width: 0;
}

.onb-top {
  flex: 0 0 auto;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #E4E6DC;
}

.onb-top__row,
.onb-brand,
.onb-footer,
.onb-arch,
.onb-card,
.onb-launch,
.onb-time__label,
.onb-time__window,
.onb-arch__head,
.onb-next,
.onb-back {
  display: flex;
  align-items: center;
  min-width: 0;
}

.onb-top__row,
.onb-arch__head,
.onb-time__window,
.onb-footer {
  justify-content: space-between;
  gap: 12px;
}

.onb-top__row,
.onb-arch__head,
.onb-footer {
  flex-wrap: wrap;
  align-items: flex-start;
}

.onb-brand {
  align-items: flex-start;
  gap: 12px;
}

.onb-brand__mark,
.onb-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #D9F27A;
  color: #0C110D;
}

.onb-kicker,
.onb-step__count {
  display: block;
  margin: 0;
  color: #3A4338;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.onb h1,
.onb h2,
.onb-card__title {
  margin: 0;
  color: #0C110D;
  font-family: Urbanist, Inter, sans-serif;
  font-weight: 700;
  letter-spacing: -0.03em;
  overflow-wrap: anywhere;
}

.onb h1 {
  font-size: clamp(1.25rem, 2vw, 1.55rem);
  line-height: 1.15;
}

.onb h2 {
  margin-top: 4px;
  font-size: clamp(1.35rem, 2.4vw, 1.85rem);
  line-height: 1.15;
}

.onb p,
.onb-card__sub,
.onb-arch__tag {
  margin: 6px 0 0;
  color: #3A4338;
  font-size: 14px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.onb-skip,
.onb-back,
.onb-next,
.onb-card,
.onb-arch {
  appearance: none;
  -webkit-appearance: none;
  box-sizing: border-box;
  height: auto;
  margin: 0;
  font: inherit;
  line-height: 1.35;
  text-align: left;
  white-space: normal;
  cursor: pointer;
}

.onb-skip,
.onb-back {
  flex: 0 0 auto;
  padding: 8px 12px;
  border: 1px solid #E4E6DC;
  border-radius: 999px;
  background: #ffffff;
  color: #0C110D;
}

.onb-progress {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.onb-progress span {
  flex: 1 1 0;
  height: 4px;
  border-radius: 999px;
  background: #E4E6DC;
}

.onb-progress span.is-on {
  background: #D9F27A;
}

.onb-body {
  flex: 1 1 auto;
  overflow: auto;
  padding: 18px 20px 22px;
}

.onb-step {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.onb-field {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.onb-field label,
.onb-field__legend,
.onb-time label {
  color: #3A4338;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.onb-field__control {
  position: relative;
  min-width: 0;
}

.onb-field__control svg {
  position: absolute;
  left: 12px;
  top: 50%;
  width: 16px;
  height: 16px;
  transform: translateY(-50%);
  color: #3A4338;
  pointer-events: none;
}

.onb input {
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 12px 14px;
  border: 1px solid #E4E6DC;
  border-radius: 12px;
  background: #ffffff;
  color: #0C110D;
  font: inherit;
  font-size: 16px;
}

.onb-field__control input {
  padding-left: 38px;
}

.onb-grid,
.onb-stack {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.onb-card,
.onb-arch {
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: 100%;
  padding: 14px;
  border: 1px solid #E4E6DC;
  border-radius: 16px;
  background: #ffffff;
  color: #0C110D;
}

.onb-card.is-selected,
.onb-arch.is-selected,
.onb-launch {
  background: #D9F27A;
  border-color: #0C110D;
}

.onb-card__copy {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
}

.onb-card__title,
.onb-card__sub,
.onb-arch__tag {
  display: block;
}

.onb-card__title {
  font-size: 15px;
  line-height: 1.25;
}

.onb-arch__head .onb-card__title {
  flex: 1 1 12rem;
}

.onb-card__sub {
  margin-top: 4px;
  font-size: 13px;
}

.onb-card__icon svg,
.onb-brand__mark svg,
.onb-next svg,
.onb-back svg,
.onb-time__label svg,
.onb-card__check svg {
  display: block;
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

.onb-card__check {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  margin-top: 1px;
  border: 1px solid #E4E6DC;
  border-radius: 999px;
  background: #ffffff;
  color: transparent;
}

.onb-card.is-selected .onb-card__check,
.onb-card__check.is-on {
  border-color: #0C110D;
  background: #ffffff;
  color: #0C110D;
}

.onb-arch__tag {
  margin-top: 4px;
  font-weight: 650;
}

.onb-badge {
  flex: 0 0 auto;
  padding: 3px 8px;
  border-radius: 999px;
  background: #F7F8F2;
  color: #0C110D;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.onb-time {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 14px;
  border: 1px solid #E4E6DC;
  border-radius: 16px;
  background: #ffffff;
}

.onb-time__label {
  justify-content: flex-start;
  gap: 8px;
  color: #0C110D;
  font-size: 13px;
  font-weight: 700;
}

.onb-time__window {
  margin: 0;
  gap: 8px;
}

.onb-time__window strong {
  font-variant-numeric: tabular-nums;
}

.onb-launch {
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border-radius: 16px;
}

.onb-footer {
  flex: 0 0 auto;
  flex-wrap: wrap;
  padding: 14px 20px;
  border-top: 1px solid #E4E6DC;
  background: #ffffff;
}

.onb-next {
  gap: 6px;
  margin-left: auto;
  padding: 12px 18px;
  border: 0;
  border-radius: 999px;
  background: #D9F27A;
  color: #0C110D;
  font-weight: 700;
}

.onb-back {
  gap: 4px;
}

@media (min-width: 720px) {
  .onb {
    padding: 28px;
  }

  .onb-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .onb-top,
  .onb-body,
  .onb-footer {
    padding-left: 28px;
    padding-right: 28px;
  }
}
</style>
