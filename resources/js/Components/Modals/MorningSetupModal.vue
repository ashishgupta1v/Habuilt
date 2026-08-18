<script setup>
import {
  X,
  Coffee,
  Sparkles,
  Check,
  Circle,
} from 'lucide-vue-next';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  userName: { type: String, default: 'there' },
  currentDayType: { type: String, default: 'full' },
  suggestedDayType: { type: Object, default: null },
  morningHabits: { type: Array, default: () => [] },
  morningSetupFocus: { type: Array, default: () => ['', '', ''] },
  currentDay: { type: Number, default: 1 },
  hasCompletedDay: { type: Function, required: true },
});

const emit = defineEmits([
  'close',
  'set-day-type',
  'apply-suggested-day-type',
  'toggle-morning-habit',
  'save-morning-setup',
]);
</script>

<template>
  <div v-if="isOpen" class="morning-setup-overlay" @click.self="emit('close')">
    <div class="morning-setup-modal" role="dialog" aria-modal="true" aria-labelledby="morning-setup-title">
      <button class="morning-setup__close" @click="emit('close')" aria-label="Close">
        <X class="icon-sm" />
      </button>
      <div class="morning-setup__hero">
        <Coffee class="icon-md morning-setup__hero-icon" />
        <h2 id="morning-setup-title">Good morning, {{ userName }}</h2>
        <p class="morning-setup__sub">Set your intention in 30 seconds. One screen, three questions.</p>
      </div>

      <!-- Step 1: Day Type -->
      <div class="morning-setup__step">
        <div class="morning-setup__step-num">1</div>
        <div class="morning-setup__step-body">
          <div class="morning-setup__step-title">Today's day type</div>
          <div class="morning-setup__day-pills">
            <button class="morning-setup__pill" :class="{ 'morning-setup__pill--active': currentDayType === 'full' }" @click="emit('set-day-type', 'full')">
              Full <small>1.0×</small>
            </button>
            <button class="morning-setup__pill" :class="{ 'morning-setup__pill--active': currentDayType === 'half' }" @click="emit('set-day-type', 'half')">
              Half <small>0.6×</small>
            </button>
            <button class="morning-setup__pill" :class="{ 'morning-setup__pill--active': currentDayType === 'floor' }" @click="emit('set-day-type', 'floor')">
              Floor <small>0.3×</small>
            </button>
          </div>
          <p v-if="suggestedDayType" class="morning-setup__suggest">
            <Sparkles class="icon-xs" />
            Suggested: <strong>{{ suggestedDayType.type }}</strong> — {{ suggestedDayType.reason }}
            <button class="morning-setup__suggest-apply" @click="emit('apply-suggested-day-type')">Apply</button>
          </p>
        </div>
      </div>

      <!-- Step 2: Morning Habits Quick Tap -->
      <div class="morning-setup__step" v-if="morningHabits.length > 0">
        <div class="morning-setup__step-num">2</div>
        <div class="morning-setup__step-body">
          <div class="morning-setup__step-title">Tap what's already done</div>
          <div class="morning-setup__habits">
            <button
              v-for="h in morningHabits"
              :key="'ms-' + h.id"
              class="morning-setup__habit"
              :class="{ 'morning-setup__habit--done': hasCompletedDay(h, currentDay) }"
              @click="emit('toggle-morning-habit', h, currentDay)"
            >
              <Check v-if="hasCompletedDay(h, currentDay)" class="icon-xs" />
              <Circle v-else class="icon-xs" />
              <span>{{ h.name.length > 30 ? h.name.slice(0, 30) + '…' : h.name }}</span>
              <span class="morning-setup__habit-pts mono-num">+{{ h.points }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Step 3: Top 3 Focus -->
      <div class="morning-setup__step">
        <div class="morning-setup__step-num">3</div>
        <div class="morning-setup__step-body">
          <div class="morning-setup__step-title">Top 3 for today</div>
          <div class="morning-setup__focus-list">
            <input
              v-for="(_, i) in morningSetupFocus"
              :key="'msf-' + i"
              v-model="morningSetupFocus[i]"
              :placeholder="`Focus ${i + 1}${i === 0 ? ' — the one that would make today feel like a win' : ''}`"
              class="morning-setup__focus-input"
              maxlength="80"
            />
          </div>
        </div>
      </div>

      <div class="morning-setup__actions">
        <button class="btn btn--secondary" @click="emit('close')">Skip</button>
        <button class="btn btn--primary-action" @click="emit('save-morning-setup')">
          <Check class="icon-sm" /> <span>Save &amp; Start Day</span>
        </button>
      </div>
    </div>
  </div>
</template>
