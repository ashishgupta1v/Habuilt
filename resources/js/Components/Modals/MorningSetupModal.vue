<script setup>
import {
  X,
  Coffee,
  Check,
  Circle,
} from 'lucide-vue-next';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  userName: { type: String, default: 'there' },
  morningHabits: { type: Array, default: () => [] },
  morningSetupFocus: { type: Array, default: () => ['', '', ''] },
  currentDay: { type: Number, default: 1 },
  hasCompletedDay: { type: Function, required: true },
});

const emit = defineEmits([
  'close',
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
        <p class="morning-setup__sub">Set your daily intention in 20 seconds. Zero friction, total focus.</p>
      </div>

      <!-- Step 1: Morning Habits Quick Tap -->
      <div class="morning-setup__step" v-if="morningHabits.length > 0">
        <div class="morning-setup__step-num">1</div>
        <div class="morning-setup__step-body">
          <div class="morning-setup__step-title">Tap what's already done this morning</div>
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

      <!-- Step 2: Top 3 Daily Focus -->
      <div class="morning-setup__step">
        <div class="morning-setup__step-num">2</div>
        <div class="morning-setup__step-body">
          <div class="morning-setup__step-title">Top 3 priorities for today</div>
          <div class="morning-setup__focus-list">
            <input
              v-for="(_, i) in morningSetupFocus"
              :key="'msf-' + i"
              v-model="morningSetupFocus[i]"
              :placeholder="`Focus ${i + 1}${i === 0 ? ' — the one high-leverage win' : ''}`"
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
