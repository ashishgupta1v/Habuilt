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

// ── Procedural Ambient Soundscapes (Web Audio API) ──
let ambientAudioCtx = null;
let activeSoundscapeNodes = null;

const getAmbientAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!ambientAudioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      ambientAudioCtx = new AudioCtx();
    }
  }
  if (ambientAudioCtx && ambientAudioCtx.state === 'suspended') {
    ambientAudioCtx.resume().catch(() => {});
  }
  return ambientAudioCtx;
};

// 1. 40Hz Gamma Binaural Beats (200Hz Left / 240Hz Right)
const createBinauralBeats = (ctx, masterGain) => {
  const merger = ctx.createChannelMerger(2);

  // Left ear: 200 Hz
  const oscL = ctx.createOscillator();
  const gainL = ctx.createGain();
  oscL.type = 'sine';
  oscL.frequency.value = 200;
  gainL.gain.value = 0.5;
  oscL.connect(gainL);
  gainL.connect(merger, 0, 0); // into left channel

  // Right ear: 240 Hz (40Hz beat frequency for gamma cognitive focus)
  const oscR = ctx.createOscillator();
  const gainR = ctx.createGain();
  oscR.type = 'sine';
  oscR.frequency.value = 240;
  gainR.gain.value = 0.5;
  oscR.connect(gainR);
  gainR.connect(merger, 0, 1); // into right channel

  merger.connect(masterGain);
  oscL.start();
  oscR.start();

  return {
    stop: () => {
      try {
        oscL.stop();
        oscR.stop();
        oscL.disconnect();
        oscR.disconnect();
        gainL.disconnect();
        gainR.disconnect();
        merger.disconnect();
      } catch (_) {}
    },
  };
};

// 2. Brown Noise (Deep Focus Blanket)
const createBrownNoise = (ctx, masterGain) => {
  const bufferSize = ctx.sampleRate * 4; // 4 seconds loop
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
  }

  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  // Warm low-pass filter
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 450;
  filter.Q.value = 0.8;

  noiseSource.connect(filter);
  filter.connect(masterGain);
  noiseSource.start();

  return {
    stop: () => {
      try {
        noiseSource.stop();
        noiseSource.disconnect();
        filter.disconnect();
      } catch (_) {}
    },
  };
};

// 3. Gentle Rainfall (Multi-filtered noise with organic modulation)
const createGentleRain = (ctx, masterGain) => {
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.4;
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 1600;

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 180;

  // Gentle wind/rain swell LFO
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.2; // slow 5-second swell
  lfoGain.gain.value = 0.15;
  lfo.connect(lfoGain.gain);

  source.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(masterGain);
  source.start();
  lfo.start();

  return {
    stop: () => {
      try {
        source.stop();
        lfo.stop();
        source.disconnect();
        highpass.disconnect();
        lowpass.disconnect();
        lfo.disconnect();
        lfoGain.disconnect();
      } catch (_) {}
    },
  };
};

// Soundscape State
const initialSoundscape = typeof window !== 'undefined' ? (localStorage.getItem('habuilt_soundscape_type') || 'off') : 'off';
const initialSoundVol = typeof window !== 'undefined' ? Number(localStorage.getItem('habuilt_soundscape_vol') || '0.35') : 0.35;

const soundscapeType = ref(initialSoundscape);
const soundscapeVolume = ref(isNaN(initialSoundVol) ? 0.35 : initialSoundVol);
const isSoundscapePlaying = ref(false);
let masterSoundscapeGain = null;

const stopSoundscapeAudio = (immediate = false) => {
  if (!activeSoundscapeNodes) {
    isSoundscapePlaying.value = false;
    return;
  }
  const ctx = getAmbientAudioContext();
  if (ctx && masterSoundscapeGain && !immediate) {
    // Smooth 0.5s fade-out
    try {
      masterSoundscapeGain.gain.setValueAtTime(masterSoundscapeGain.gain.value, ctx.currentTime);
      masterSoundscapeGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      setTimeout(() => {
        if (activeSoundscapeNodes) {
          activeSoundscapeNodes.stop();
          activeSoundscapeNodes = null;
        }
        isSoundscapePlaying.value = false;
      }, 420);
      return;
    } catch (_) {}
  }
  if (activeSoundscapeNodes) {
    activeSoundscapeNodes.stop();
    activeSoundscapeNodes = null;
  }
  isSoundscapePlaying.value = false;
};

const startSoundscapeAudio = (type = soundscapeType.value) => {
  if (type === 'off') {
    stopSoundscapeAudio();
    return;
  }
  const ctx = getAmbientAudioContext();
  if (!ctx) return;

  stopSoundscapeAudio(true);

  masterSoundscapeGain = ctx.createGain();
  masterSoundscapeGain.gain.setValueAtTime(0.001, ctx.currentTime);
  masterSoundscapeGain.gain.linearRampToValueAtTime(soundscapeVolume.value, ctx.currentTime + 0.6);
  masterSoundscapeGain.connect(ctx.destination);

  if (type === 'binaural_40hz') {
    activeSoundscapeNodes = createBinauralBeats(ctx, masterSoundscapeGain);
  } else if (type === 'brown_noise') {
    activeSoundscapeNodes = createBrownNoise(ctx, masterSoundscapeGain);
  } else if (type === 'rain') {
    activeSoundscapeNodes = createGentleRain(ctx, masterSoundscapeGain);
  }

  isSoundscapePlaying.value = true;
};

const updateSoundscapeVolume = (val) => {
  const num = Math.max(0, Math.min(1, Number(val)));
  soundscapeVolume.value = num;
  if (typeof window !== 'undefined') {
    localStorage.setItem('habuilt_soundscape_vol', String(num));
  }
  if (masterSoundscapeGain && ambientAudioCtx) {
    try {
      masterSoundscapeGain.gain.setValueAtTime(num, ambientAudioCtx.currentTime);
    } catch (_) {}
  }
};

const setSoundscapeType = (type) => {
  soundscapeType.value = type;
  if (typeof window !== 'undefined') {
    localStorage.setItem('habuilt_soundscape_type', type);
  }
  if (timerState.value?.running || isSoundscapePlaying.value) {
    startSoundscapeAudio(type);
  }
};

const toggleSoundscapeManual = () => {
  if (isSoundscapePlaying.value) {
    stopSoundscapeAudio();
  } else {
    if (soundscapeType.value === 'off') {
      setSoundscapeType('binaural_40hz');
    }
    startSoundscapeAudio(soundscapeType.value);
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

      // Native micro-haptics on deep work block completion
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([12, 50, 12, 50, 24]);
        } catch (_) {}
      }

      // Stop ambient soundscape on completion
      stopSoundscapeAudio();

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

    // Auto-trigger ambient soundscape if configured
    if (soundscapeType.value !== 'off') {
      startSoundscapeAudio(soundscapeType.value);
    }
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
    stopSoundscapeAudio();
  };

  const resumeDeepWorkTimer = () => {
    if (!timerState.value || timerState.value.running) return;
    now.value = Date.now();
    timerState.value.startedAt = Date.now();
    timerState.value.running = true;
    startInterval();

    if (soundscapeType.value !== 'off') {
      startSoundscapeAudio(soundscapeType.value);
    }
  };

  const stopDeepWorkTimer = () => {
    timerState.value = null;
    customTimerMin.value = null;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    stopSoundscapeAudio();
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
    stopSoundscapeAudio();
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
      if (soundscapeType.value !== 'off' && !isSoundscapePlaying.value) {
        startSoundscapeAudio(soundscapeType.value);
      }
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
    // Ambient soundscapes
    soundscapeType,
    soundscapeVolume,
    isSoundscapePlaying,
    setSoundscapeType,
    updateSoundscapeVolume,
    toggleSoundscapeManual,
    startDeepWorkTimer,
    pauseDeepWorkTimer,
    resumeDeepWorkTimer,
    stopDeepWorkTimer,
    startBreakTimer,
    onCustomTimerInput,
  };
}
