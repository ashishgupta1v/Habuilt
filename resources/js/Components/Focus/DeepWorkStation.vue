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
  <section class="card card--mobile-focus">
    <div class="mobile-focus-header">
      <div class="mobile-focus-header__title">
        <div class="mobile-focus-icon-wrap">
          <Timer class="icon-md icon-focus-gold" />
        </div>
        <div>
          <h2 class="mobile-focus-title">Deep Work Station</h2>
          <p class="mobile-focus-subtitle">Distraction-free focus with habit auto-completion</p>
        </div>
      </div>
      <button
        type="button"
        class="mobile-focus-sound-btn"
        :class="{ 'mobile-focus-sound-btn--muted': !timerSoundEnabled }"
        @click="emit('update:timerSoundEnabled', !timerSoundEnabled)"
        :title="timerSoundEnabled ? 'Chime sound on' : 'Chime sound muted'"
      >
        <Volume2 v-if="timerSoundEnabled" class="icon-xs" />
        <VolumeX v-else class="icon-xs" />
        <span>{{ timerSoundEnabled ? 'Sound On' : 'Muted' }}</span>
      </button>
    </div>

    <!-- If timer is active or completed -->
    <div v-if="timerState" class="mobile-focus-active-card">
      <div class="mobile-focus-ring-wrap">
        <svg viewBox="0 0 100 100" class="mobile-focus-svg">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="6"/>
          <circle cx="50" cy="50" r="42" fill="none" stroke="url(#goldGradientMobileStation)" stroke-width="6"
                  stroke-dasharray="263.89" :stroke-dashoffset="263.89 - (263.89 * timerProgressPct / 100)"
                  transform="rotate(-90 50 50)" stroke-linecap="round"/>
          <defs>
            <linearGradient id="goldGradientMobileStation" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#C8A456" />
              <stop offset="100%" stop-color="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
        <div class="mobile-focus-ring-center">
          <span class="mobile-focus-time mono-num">{{ timerElapsedFormatted }}</span>
          <span class="mobile-focus-target mono-num">Target: {{ timerState.targetMin }}m</span>
          <span class="mobile-focus-pct mono-num">{{ timerProgressPct }}%</span>
        </div>
      </div>

      <div class="mobile-focus-habit-info">
        <span v-if="timerLinkedHabit" class="mobile-focus-linked-tag">
          🎯 Auto-completing: <strong>{{ timerLinkedHabit.name }}</strong> (+{{ timerLinkedHabit.points }} pts)
        </span>
        <span v-else-if="timerState.isBreak" class="mobile-focus-linked-tag mobile-focus-linked-tag--break">
          ☕ Recovery Rest Break ({{ timerRemainingFormatted }} left)
        </span>
        <span v-else class="mobile-focus-linked-tag">
          ⚡ General Deep Focus Session
        </span>
      </div>

      <div v-if="timerState._autoCompleted" class="mobile-focus-btn-row">
        <button class="btn btn--secondary" @click="emit('start-break', 5)">
          <Coffee class="icon-sm" /> 5m Break
        </button>
        <button class="btn btn--secondary" @click="emit('start-break', 15)">
          <Coffee class="icon-sm" /> 15m Break
        </button>
        <button class="btn btn--primary-action" @click="emit('stop-timer')">
          <Check class="icon-sm" /> Finish & Log
        </button>
      </div>

      <div v-else class="mobile-focus-btn-row">
        <button v-if="!timerState.running" class="btn btn--primary-action" @click="emit('resume-timer')">
          <Play class="icon-sm" /> Resume Session
        </button>
        <button v-if="timerState.running" class="btn btn--secondary" @click="emit('pause-timer')">
          <Pause class="icon-sm" /> Pause
        </button>
        <button class="btn btn--danger" @click="emit('stop-timer')">
          <X class="icon-sm" /> End Early
        </button>
      </div>
    </div>

    <!-- Setup Launcher -->
    <div v-else class="mobile-focus-launcher-card">
      <div class="mobile-focus-field">
        <label class="mobile-focus-label">Select Session Length</label>
        <div class="mobile-focus-dur-grid">
          <button
            v-for="min in [15, 25, 50, 90, 120]"
            :key="'mfocus-' + min"
            type="button"
            class="mobile-focus-dur-btn"
            :class="{ 'mobile-focus-dur-btn--active': timerLauncherDuration === min && !customTimerMin }"
            @click="emit('update:timerLauncherDuration', min); emit('update:customTimerMin', null)"
          >
            <span class="mobile-focus-dur-num">{{ min }}</span>
            <span class="mobile-focus-dur-unit">min</span>
          </button>
          <div class="mobile-focus-custom-box">
            <input
              :value="customTimerMin"
              @input="emit('update:customTimerMin', $event.target.value ? Number($event.target.value) : null)"
              type="number"
              min="1"
              max="300"
              placeholder="Custom"
              class="mobile-focus-custom-input"
            />
            <span class="mobile-focus-custom-label">min</span>
          </div>
        </div>
      </div>

      <div class="mobile-focus-field">
        <label class="mobile-focus-label">Link to Habit (Auto-completes upon finish)</label>
        <select
          :value="timerLauncherHabitId"
          @change="emit('update:timerLauncherHabitId', $event.target.value)"
          class="mobile-focus-select"
        >
          <option value="">— General Focus Session (No habit linked) —</option>
          <option v-for="h in timerHabitOptions" :key="'mopt-' + h.id" :value="h.id">
            {{ hasCompletedDay(h, currentDay) ? '✓ ' : '' }}{{ h.name }} (+{{ h.points }} pt{{ h.points !== 1 ? 's' : '' }})
          </option>
        </select>
      </div>

      <button
        type="button"
        class="btn btn--primary-action mobile-focus-launch-btn"
        @click="emit('start-timer', customTimerMin || timerLauncherDuration, timerLauncherHabitId || null)"
      >
        <Play class="icon-sm" />
        <span>Start {{ customTimerMin || timerLauncherDuration }}-Minute Focus Session</span>
      </button>
    </div>
  </section>
</template>
