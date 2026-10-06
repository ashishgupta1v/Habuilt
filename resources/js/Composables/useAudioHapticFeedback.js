import { ref, onMounted } from 'vue';

const SOUND_PROFILES = [
  { id: 'zen', name: 'Zen Bowl', icon: '🧘', desc: 'Resonant harmonic singing bowl (432Hz / 528Hz)' },
  { id: 'click', name: 'Tactile Click', icon: '⌨️', desc: 'Crisp mechanical switch impulse' },
  { id: 'arcade', name: 'Arcade Pop', icon: '👾', desc: 'Ascending 8-bit triumphal arpeggio' },
  { id: 'bubble', name: 'Liquid Bubble', icon: '🫧', desc: 'Smooth resonant pitch sweep pop' },
];

const FEEDBACK_MODES = [
  { id: 'rich', name: 'Sound & Haptic', icon: '🔊' },
  { id: 'haptic', name: 'Haptic Only', icon: '📳' },
  { id: 'silent', name: 'Silent', icon: '🔇' },
];

// Shared singleton state across components
const activeSoundProfile = ref('zen');
const activeFeedbackMode = ref('rich');
let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Unlock audio on first touch/click
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch {}
    window.removeEventListener('pointerdown', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
}

export function useAudioHapticFeedback() {
  // Load saved preferences
  onMounted(() => {
    try {
      const savedProfile = localStorage.getItem('habuilt_sound_profile');
      if (savedProfile && SOUND_PROFILES.some(p => p.id === savedProfile)) {
        activeSoundProfile.value = savedProfile;
      }
      const savedMode = localStorage.getItem('habuilt_feedback_mode');
      if (savedMode && FEEDBACK_MODES.some(m => m.id === savedMode)) {
        activeFeedbackMode.value = savedMode;
      }
    } catch {}
  });

  function setSoundProfile(profileId) {
    if (SOUND_PROFILES.some(p => p.id === profileId)) {
      activeSoundProfile.value = profileId;
      try {
        localStorage.setItem('habuilt_sound_profile', profileId);
      } catch {}
      // Preview sound immediately
      playSound(profileId);
    }
  }

  function setFeedbackMode(modeId) {
    if (FEEDBACK_MODES.some(m => m.id === modeId)) {
      activeFeedbackMode.value = modeId;
      try {
        localStorage.setItem('habuilt_feedback_mode', modeId);
      } catch {}
      if (modeId !== 'silent') {
        triggerHaptic('light');
      }
    }
  }

  function triggerHaptic(type = 'light') {
    if (activeFeedbackMode.value === 'silent') return;
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;

    try {
      switch (type) {
        case 'light':
        case 'micro':
        case 'checklist':
          navigator.vibrate([12]);
          break;
        case 'timerComplete':
        case 'focusComplete':
          navigator.vibrate([12, 50, 12, 50, 24]);
          break;
        case 'medium':
          navigator.vibrate([18]);
          break;
        case 'success':
          navigator.vibrate([12, 35, 20]);
          break;
        case 'warning':
          navigator.vibrate([25, 40, 25]);
          break;
        default:
          navigator.vibrate([12]);
      }
    } catch {}
  }

  function playSound(overrideProfile = null) {
    if (activeFeedbackMode.value === 'silent' || activeFeedbackMode.value === 'haptic') {
      return;
    }

    const ctx = getAudioContext();
    if (!ctx) return;

    const profile = overrideProfile || activeSoundProfile.value;
    const now = ctx.currentTime;

    try {
      if (profile === 'zen') {
        // Singing bowl: 432Hz fundamental + 528Hz harmonious overtone with slow decay
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(432, now);
        osc1.frequency.exponentialRampToValueAtTime(430, now + 0.6);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(528, now);
        osc2.frequency.exponentialRampToValueAtTime(526, now + 0.6);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.7);
        osc2.stop(now + 0.7);
      } else if (profile === 'click') {
        // Crisp tactile mechanical click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.035);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
      } else if (profile === 'arcade') {
        // Ascending 3-note chime: C5 (523Hz), E5 (659Hz), G5 (784Hz)
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noteStart = now + idx * 0.055;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteStart);

          gain.gain.setValueAtTime(0.001, noteStart);
          gain.gain.linearRampToValueAtTime(0.16, noteStart + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.16);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(noteStart);
          osc.stop(noteStart + 0.18);
        });
      } else if (profile === 'bubble') {
        // Resonant liquid pop: upward sweep 220Hz -> 820Hz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(820, now + 0.065);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch {}
  }

  function triggerCelebrationFeedback() {
    triggerHaptic('success');
    playSound();
  }

  function triggerTimerLaunchFeedback() {
    triggerHaptic('medium');
    playSound('click');
  }

  return {
    SOUND_PROFILES,
    FEEDBACK_MODES,
    activeSoundProfile,
    activeFeedbackMode,
    setSoundProfile,
    setFeedbackMode,
    playSound,
    triggerHaptic,
    triggerCelebrationFeedback,
    triggerTimerLaunchFeedback,
  };
}
