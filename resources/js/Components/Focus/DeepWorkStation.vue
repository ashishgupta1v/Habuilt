<script setup>
import {
  Timer,
  Play,
  Pause,
  X,
  Check,
  Coffee,
  Volume2,
  VolumeX,
  Sparkles,
  Zap,
  Clock,
} from 'lucide-vue-next';

const props = defineProps({
  timerState: { type: Object, default: null },
  timerLauncherDuration: { type: Number, default: 25 },
  customTimerMin: { type: Number, default: null },
  timerLauncherHabitId: { type: String, default: '' },
  timerSoundEnabled: { type: Boolean, default: true },
  timerProgressPct: { type: Number, default: 0 },
  timerElapsedFormatted: { type: String, default: '00:00' },
  timerRemainingFormatted: { type: String, default: '00:00' },
  timerLinkedHabit: { type: Object, default: null },
  timerHabitOptions: { type: Array, default: () => [] },
  currentDay: { type: Number, default: 1 },
  hasCompletedDay: { type: Function, required: true },
});

const emit = defineEmits([
  'update:customTimerMin',
  'update:timerLauncherDuration',
  'update:timerLauncherHabitId',
  'update:timerSoundEnabled',
  'start-timer',
  'pause-timer',
  'resume-timer',
  'stop-timer',
  'start-break',
]);
</script>

<template>
  <section class="card card--focus-station">
    <!-- Header Bar -->
    <div class="focus-station-header">
      <div class="focus-station-header__left">
        <div class="focus-station-icon-glow">
          <Timer class="icon-md icon-focus-gold" />
        </div>
        <div>
          <div class="focus-station-title-row">
            <h2 class="focus-station-title">Deep Work Station</h2>
            <span class="focus-station-live-badge" v-if="timerState && timerState.running">LIVE SESSION</span>
          </div>
          <p class="focus-station-subtitle">Zero-distraction flow state with automatic habit logging</p>
        </div>
      </div>
      <button
        type="button"
        class="focus-station-sound-toggle"
        :class="{ 'focus-station-sound-toggle--muted': !timerSoundEnabled }"
        @click="emit('update:timerSoundEnabled', !timerSoundEnabled)"
        :title="timerSoundEnabled ? 'Chime sound is active' : 'Chime sound is muted'"
      >
        <Volume2 v-if="timerSoundEnabled" class="icon-xs" />
        <VolumeX v-else class="icon-xs" />
        <span>{{ timerSoundEnabled ? 'Chime On' : 'Muted' }}</span>
      </button>
    </div>

    <!-- Active Timer View -->
    <div v-if="timerState" class="focus-station-active-view">
      <!-- Grand Circular Ring -->
      <div class="focus-station-ring-container">
        <svg viewBox="0 0 240 240" class="focus-station-svg">
          <!-- Background track -->
          <circle cx="120" cy="120" r="100" class="focus-ring-track" stroke-width="12" fill="none" />
          <!-- Animated Progress track -->
          <circle
            cx="120"
            cy="120"
            r="100"
            class="focus-ring-fill"
            stroke="url(#focusGoldIndigoGrad)"
            stroke-width="12"
            stroke-dasharray="628.32"
            :stroke-dashoffset="628.32 - (628.32 * timerProgressPct / 100)"
            transform="rotate(-90 120 120)"
            stroke-linecap="round"
            fill="none"
          />
          <defs>
            <linearGradient id="focusGoldIndigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#C8A456" />
              <stop offset="50%" stop-color="#E5C77A" />
              <stop offset="100%" stop-color="#6366f1" />
            </linearGradient>
          </defs>
        </svg>

        <!-- Digital Center Display -->
        <div class="focus-station-center-content">
          <span class="focus-station-clock mono-num">{{ timerElapsedFormatted }}</span>
          <span class="focus-station-target mono-num">Target: {{ timerState.targetMin }} min</span>
          <div class="focus-station-pct-pill mono-num">
            <span>{{ timerProgressPct }}%</span>
          </div>
        </div>
      </div>

      <!-- Linked Habit Status Tag -->
      <div class="focus-station-habit-tag-wrap">
        <div v-if="timerLinkedHabit" class="focus-station-linked-pill">
          <Sparkles class="icon-xs" />
          <span>Auto-logging: <strong>{{ timerLinkedHabit.name }}</strong> (+{{ timerLinkedHabit.points }} pts)</span>
        </div>
        <div v-else-if="timerState.isBreak" class="focus-station-linked-pill focus-station-linked-pill--break">
          <Coffee class="icon-xs" />
          <span>Recovery Rest Break • {{ timerRemainingFormatted }} remaining</span>
        </div>
        <div v-else class="focus-station-linked-pill focus-station-linked-pill--general">
          <Zap class="icon-xs" />
          <span>General Flow State Block</span>
        </div>
      </div>

      <!-- Controls Row -->
      <div v-if="timerState._autoCompleted" class="focus-station-actions-bar focus-station-actions-bar--complete">
        <div class="focus-station-complete-msg">
          <span class="focus-station-complete-title">🎉 Focus Session Complete!</span>
          <span class="focus-station-complete-sub">Great work. Take a quick rest before your next sprint.</span>
        </div>
        <div class="focus-station-btn-group">
          <button type="button" class="btn btn--secondary focus-station-btn" @click="emit('start-break', 5)">
            <Coffee class="icon-sm" /> 5m Break
          </button>
          <button type="button" class="btn btn--secondary focus-station-btn" @click="emit('start-break', 15)">
            <Coffee class="icon-sm" /> 15m Break
          </button>
          <button type="button" class="btn btn--primary-action focus-station-btn focus-station-btn--finish" @click="emit('stop-timer')">
            <Check class="icon-sm" /> Finish &amp; Log
          </button>
        </div>
      </div>

      <div v-else class="focus-station-actions-bar">
        <button v-if="!timerState.running" type="button" class="btn btn--primary-action focus-station-btn" @click="emit('resume-timer')">
          <Play class="icon-sm" /> Resume Session
        </button>
        <button v-if="timerState.running" type="button" class="btn btn--secondary focus-station-btn" @click="emit('pause-timer')">
          <Pause class="icon-sm" /> Pause
        </button>
        <button type="button" class="btn btn--danger focus-station-btn" @click="emit('stop-timer')">
          <X class="icon-sm" /> End Early
        </button>
      </div>
    </div>

    <!-- Launcher Setup View -->
    <div v-else class="focus-station-launcher">
      <!-- Duration Selection -->
      <div class="focus-station-section">
        <label class="focus-station-section-label">
          <Clock class="icon-xs" />
          <span>Select Duration</span>
        </label>
        <div class="focus-station-presets-grid">
          <button
            v-for="min in [15, 25, 50, 90, 120]"
            :key="'focus-dur-' + min"
            type="button"
            class="focus-preset-chip"
            :class="{ 'focus-preset-chip--active': timerLauncherDuration === min && !customTimerMin }"
            @click="emit('update:timerLauncherDuration', min); emit('update:customTimerMin', null)"
          >
            <span class="focus-preset-num">{{ min }}</span>
            <span class="focus-preset-label">min</span>
          </button>
          <div class="focus-custom-chip" :class="{ 'focus-custom-chip--active': !!customTimerMin }">
            <input
              :value="customTimerMin"
              @input="emit('update:customTimerMin', $event.target.value ? Number($event.target.value) : null)"
              type="number"
              min="1"
              max="300"
              placeholder="Custom"
              class="focus-custom-input"
            />
            <span class="focus-custom-unit">min</span>
          </div>
        </div>
      </div>

      <!-- Linked Habit Selector -->
      <div class="focus-station-section">
        <label class="focus-station-section-label">
          <Sparkles class="icon-xs" />
          <span>Link Habit (Auto-Completes Upon Finish)</span>
        </label>
        <select
          :value="timerLauncherHabitId"
          @change="emit('update:timerLauncherHabitId', $event.target.value)"
          class="focus-station-select"
        >
          <option value="">— General Focus Session (No habit linked) —</option>
          <option v-for="h in timerHabitOptions" :key="'focus-opt-' + h.id" :value="h.id">
            {{ hasCompletedDay(h, currentDay) ? '✓ ' : '' }}{{ h.name }} (+{{ h.points }} pt{{ h.points !== 1 ? 's' : '' }})
          </option>
        </select>
      </div>

      <!-- Launch Action Button -->
      <button
        type="button"
        class="btn btn--primary-action focus-station-launch-btn"
        @click="emit('start-timer', customTimerMin || timerLauncherDuration, timerLauncherHabitId || null)"
      >
        <Play class="icon-sm" />
        <span>Start {{ customTimerMin || timerLauncherDuration }}-Minute Focus Session</span>
      </button>
    </div>
  </section>
</template>
