import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

// ── Web Audio Chime Sound ──
export const playTimerChime = (type = 'complete') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
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

// Global reactive timer state across all components
const timerState = ref(null);
const timerLauncherDuration = ref(25);
const customTimerMin = ref(null);
const timerLauncherHabitId = ref('');
const timerSoundEnabled = ref(true);
const now = ref(Date.now());
let timerInterval = null;

export function useDeepWorkTimer(options = {}) {
  const { onHabitAutoComplete, onSessionComplete, allHabits = ref([]) } = options;

  const getHabitsList = () => {
    if (typeof allHabits === 'function') return allHabits() || [];
    if (allHabits && typeof allHabits.value === 'function') return allHabits.value() || [];
    if (allHabits && allHabits.value !== undefined) return allHabits.value || [];
    return allHabits || [];
  };

  const timerElapsedSec = computed(() => {
    if (!timerState.value) return 0;
    const { startedAt, elapsedBeforePause = 0, running, targetMin } = timerState.value;
    let sec = elapsedBeforePause;
    if (running && startedAt) {
      sec += Math.floor((now.value - startedAt) / 1000);
    }
    return Math.min(targetMin * 60, Math.max(0, sec));
  });

  const timerProgressPct = computed(() => {
    if (!timerState.value) return 0;
    const totalSec = timerState.value.targetMin * 60;
    if (totalSec <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((timerElapsedSec.value / totalSec) * 100)));
  });

  const timerElapsedFormatted = computed(() => {
    const sec = timerElapsedSec.value;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });

  const timerRemainingFormatted = computed(() => {
    if (!timerState.value) return '00:00';
    const totalSec = timerState.value.targetMin * 60;
    const remainingSec = Math.max(0, totalSec - timerElapsedSec.value);
    const m = Math.floor(remainingSec / 60);
    const s = remainingSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });

  const timerLinkedHabit = computed(() => {
    if (!timerState.value?.linkedHabitId) return null;
    const list = getHabitsList();
    return list.find(h => String(h.id) === String(timerState.value.linkedHabitId)) || null;
  });

  const timerHabitOptions = computed(() => {
    const list = getHabitsList();
    return (list || []).filter(h => !h.archived);
  });

  const checkTimerTick = () => {
    if (!timerState.value || !timerState.value.running) return;
    const { targetMin, startedAt, elapsedBeforePause = 0, linkedHabitId, isBreak } = timerState.value;
    const totalSec = targetMin * 60;
    const elapsedSec = elapsedBeforePause + Math.floor((now.value - startedAt) / 1000);

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

      if (onSessionComplete) {
        const list = getHabitsList();
        const linked = list.find((h) => String(h.id) === String(linkedHabitId));
        onSessionComplete({ isBreak, linkedHabitId, habitName: linked?.name || null });
      }

      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    }
  };

  const startInterval = () => {
    if (timerInterval) clearInterval(timerInterval);
    now.value = Date.now();
    timerInterval = setInterval(() => {
      now.value = Date.now();
      checkTimerTick();
    }, 250);
  };

  const startDeepWorkTimer = (durationMin, habitId = null) => {
    const finalMin = Number(customTimerMin.value) || Number(durationMin) || 25;
    now.value = Date.now();
    timerState.value = {
      targetMin: finalMin,
      startedAt: Date.now(),
      elapsedBeforePause: 0,
      linkedHabitId: habitId || null,
      running: true,
      isBreak: false,
      _autoCompleted: false,
    };
    startInterval();
  };

  const pauseDeepWorkTimer = () => {
    if (!timerState.value || !timerState.value.running) return;
    now.value = Date.now();
    const elapsedSec = (timerState.value.elapsedBeforePause || 0) + Math.floor((now.value - timerState.value.startedAt) / 1000);
    timerState.value.elapsedBeforePause = elapsedSec;
    timerState.value.running = false;
    timerState.value.startedAt = null;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  const resumeDeepWorkTimer = () => {
    if (!timerState.value || timerState.value.running) return;
    now.value = Date.now();
    timerState.value.startedAt = Date.now();
    timerState.value.running = true;
    startInterval();
  };

  const stopDeepWorkTimer = () => {
    timerState.value = null;
    customTimerMin.value = null;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  const startBreakTimer = (durationMin = 5) => {
    now.value = Date.now();
    timerState.value = {
      targetMin: durationMin,
      startedAt: Date.now(),
      elapsedBeforePause: 0,
      linkedHabitId: null,
      running: true,
      isBreak: true,
      _autoCompleted: false,
    };
    startInterval();
  };

  const onCustomTimerInput = () => {
    if (customTimerMin.value && customTimerMin.value > 0) {
      timerLauncherDuration.value = customTimerMin.value;
    }
  };

  const handleVisibilityChange = () => {
    if (typeof document !== 'undefined' && !document.hidden && timerState.value?.running) {
      now.value = Date.now();
      checkTimerTick();
    }
  };

  onMounted(() => {
    if (!timerInterval && timerState.value && timerState.value.running) {
      startInterval();
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
  });

  onBeforeUnmount(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  });

  return {
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
    startDeepWorkTimer,
    pauseDeepWorkTimer,
    resumeDeepWorkTimer,
    stopDeepWorkTimer,
    startBreakTimer,
    onCustomTimerInput,
  };
}
