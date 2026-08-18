import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

// ── Web Audio Chime Sound ──
export const playTimerChime = (type = 'complete') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (type === 'complete') {
      // Ascending triumphant three-tone chord
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.65);
      });
    } else if (type === 'break') {
      // Soft gentle two-tone chime
      [440, 554.37].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.55);
      });
    }
  } catch (err) {
    console.warn('AudioContext playback unavailable:', err);
  }
};

// Global timer state across all components
const timerState = ref(null);
const timerLauncherDuration = ref(25);
const customTimerMin = ref(null);
const timerLauncherHabitId = ref('');
const timerSoundEnabled = ref(true);
const timerCompleteToast = ref(null);
let timerInterval = null;

export function useDeepWorkTimer(options = {}) {
  const { onHabitAutoComplete, allHabits = ref([]) } = options;

  const timerProgressPct = computed(() => {
    if (!timerState.value) return 0;
    const { targetMin, startedAt, elapsedBeforePause = 0, running } = timerState.value;
    const totalSec = targetMin * 60;
    let elapsedSec = elapsedBeforePause;
    if (running && startedAt) {
      elapsedSec += Math.floor((Date.now() - startedAt) / 1000);
    }
    return Math.min(100, Math.round((elapsedSec / totalSec) * 100));
  });

  const timerElapsedFormatted = computed(() => {
    if (!timerState.value) return '00:00';
    const { startedAt, elapsedBeforePause = 0, running } = timerState.value;
    let elapsedSec = elapsedBeforePause;
    if (running && startedAt) {
      elapsedSec += Math.floor((Date.now() - startedAt) / 1000);
    }
    const m = Math.floor(elapsedSec / 60);
    const s = elapsedSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });

  const timerRemainingFormatted = computed(() => {
    if (!timerState.value) return '00:00';
    const { targetMin, startedAt, elapsedBeforePause = 0, running } = timerState.value;
    const totalSec = targetMin * 60;
    let elapsedSec = elapsedBeforePause;
    if (running && startedAt) {
      elapsedSec += Math.floor((Date.now() - startedAt) / 1000);
    }
    const remainingSec = Math.max(0, totalSec - elapsedSec);
    const m = Math.floor(remainingSec / 60);
    const s = remainingSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });

  const timerLinkedHabit = computed(() => {
    if (!timerState.value?.linkedHabitId) return null;
    const habitsList = typeof allHabits.value === 'function' ? allHabits.value() : (allHabits.value || []);
    return habitsList.find(h => h.id === timerState.value.linkedHabitId) || null;
  });

  const timerHabitOptions = computed(() => {
    const habitsList = typeof allHabits.value === 'function' ? allHabits.value() : (allHabits.value || []);
    return habitsList.filter(h => !h.archived);
  });

  const checkTimerTick = () => {
    if (!timerState.value || !timerState.value.running) return;
    const { targetMin, startedAt, elapsedBeforePause = 0, linkedHabitId, isBreak } = timerState.value;
    const totalSec = targetMin * 60;
    const elapsedSec = elapsedBeforePause + Math.floor((Date.now() - startedAt) / 1000);

    if (elapsedSec >= totalSec) {
      // Completed!
      timerState.value.running = false;
      timerState.value.elapsedBeforePause = totalSec;
      timerState.value._autoCompleted = true;

      if (timerSoundEnabled.value) {
        playTimerChime(isBreak ? 'break' : 'complete');
      }

      if (linkedHabitId && !isBreak && onHabitAutoComplete) {
        onHabitAutoComplete(linkedHabitId);
      }
    }
  };

  const startDeepWorkTimer = (durationMin, habitId = null) => {
    const finalMin = Number(customTimerMin.value) || Number(durationMin) || 25;
    timerState.value = {
      targetMin: finalMin,
      startedAt: Date.now(),
      elapsedBeforePause: 0,
      linkedHabitId: habitId || null,
      running: true,
      isBreak: false,
      _autoCompleted: false,
    };
    if (!timerInterval) {
      timerInterval = setInterval(checkTimerTick, 1000);
    }
  };

  const pauseDeepWorkTimer = () => {
    if (!timerState.value || !timerState.value.running) return;
    const elapsedSec = (timerState.value.elapsedBeforePause || 0) + Math.floor((Date.now() - timerState.value.startedAt) / 1000);
    timerState.value.elapsedBeforePause = elapsedSec;
    timerState.value.running = false;
    timerState.value.startedAt = null;
  };

  const resumeDeepWorkTimer = () => {
    if (!timerState.value || timerState.value.running) return;
    timerState.value.startedAt = Date.now();
    timerState.value.running = true;
  };

  const stopDeepWorkTimer = () => {
    timerState.value = null;
    customTimerMin.value = null;
  };

  const startBreakTimer = (durationMin = 5) => {
    timerState.value = {
      targetMin: durationMin,
      startedAt: Date.now(),
      elapsedBeforePause: 0,
      linkedHabitId: null,
      running: true,
      isBreak: true,
      _autoCompleted: false,
    };
    if (!timerInterval) {
      timerInterval = setInterval(checkTimerTick, 1000);
    }
  };

  const onCustomTimerInput = () => {
    if (customTimerMin.value && customTimerMin.value > 0) {
      timerLauncherDuration.value = customTimerMin.value;
    }
  };

  onMounted(() => {
    if (!timerInterval && timerState.value && timerState.value.running) {
      timerInterval = setInterval(checkTimerTick, 1000);
    }
  });

  return {
    timerState,
    timerLauncherDuration,
    customTimerMin,
    timerLauncherHabitId,
    timerSoundEnabled,
    timerCompleteToast,
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
  };
}
