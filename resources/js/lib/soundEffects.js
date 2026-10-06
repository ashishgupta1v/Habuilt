// Web Audio API Procedural Sound Synthesis for Habuilt
// 100% offline, 0 external audio assets, zero latency, ultra-lightweight.

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

export function isSoundEnabled() {
  if (typeof localStorage === 'undefined') return true;
  return localStorage.getItem('habuilt.sound_effects.enabled') !== 'false';
}

export function setSoundEnabled(enabled) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('habuilt.sound_effects.enabled', enabled ? 'true' : 'false');
  }
}

export function toggleSound() {
  const current = isSoundEnabled();
  setSoundEnabled(!current);
  return !current;
}

export function getSoundVolume() {
  if (typeof localStorage === 'undefined') return 0.75;
  const raw = localStorage.getItem('habuilt.sound_effects.volume');
  if (raw === null) return 0.75;
  const parsed = parseFloat(raw);
  return isNaN(parsed) ? 0.75 : Math.max(0, Math.min(1, parsed));
}

export function setSoundVolume(volume) {
  const clamped = Math.max(0, Math.min(1, Number(volume) || 0));
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('habuilt.sound_effects.volume', String(clamped));
  }
  return clamped;
}

export function getSoundProfile() {
  if (typeof localStorage === 'undefined') return 'epic';
  return localStorage.getItem('habuilt.sound_effects.profile') || 'epic';
}

export function setSoundProfile(profile) {
  const safeProfile = ['epic', 'zen', 'minimal'].includes(profile) ? profile : 'epic';
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('habuilt.sound_effects.profile', safeProfile);
  }
  return safeProfile;
}

/**
 * Procedural Crystal Chime for Shared Anchor Sync (Celebratory Triad)
 */
export function playSharedAnchorSync() {
  if (!isSoundEnabled()) return;
  const volume = getSoundVolume();
  if (volume <= 0.001) return;

  const profile = getSoundProfile();
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (profile === 'minimal') {
      // 2-note crisp micro chime
      const notes = [1567.98, 2093.0]; // G6, C7
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.18 * volume, now + idx * 0.06 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.2);
      });
      return;
    }

    if (profile === 'zen') {
      // Gentle meditative singing chime
      const notes = [1046.5, 1567.98, 2093.0]; // C6, G6, C7
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0.001, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.14 * volume, now + idx * 0.1 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.65);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.7);
      });
      return;
    }

    // Default 'epic' full crystalline triad
    const notes = [1046.5, 1318.51, 1567.98, 2093.0]; // C6, E6, G6, C7
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.24 * volume, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.48);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.52);
    });
  } catch (e) {
    console.debug('[Sound] SharedAnchorSync error:', e);
  }
}

/**
 * Procedural Resonant Warrior Gong for Partner High-Five
 */
export function playPartnerHighFive() {
  if (!isSoundEnabled()) return;
  const volume = getSoundVolume();
  if (volume <= 0.001) return;

  const profile = getSoundProfile();
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (profile === 'minimal') {
      // Double clean acoustic tap
      [440, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.001, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.18 * volume, now + idx * 0.07 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.22);
      });
      return;
    }

    if (profile === 'zen') {
      // Tibetan bell resonance (warm sine dual tone)
      [220, 329.63].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.15 * volume, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.45);
      });
      return;
    }

    // Epic Warrior Gong with full harmonic spectrum
    const frequencies = [220, 440, 659.25, 880]; // A3, A4, E5, A5 harmonics
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime((0.2 / (i + 1)) * volume, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.3);
    });
  } catch (e) {
    console.debug('[Sound] PartnerHighFive error:', e);
  }
}

/**
 * Procedural Warm Marimba Pulse for Emotes / Encouragements
 */
export function playPartnerEmote() {
  if (!isSoundEnabled()) return;
  const volume = getSoundVolume();
  if (volume <= 0.001) return;

  const profile = getSoundProfile();
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (profile === 'minimal') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.16 * volume, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
      return;
    }

    const notes = profile === 'zen' ? [523.25, 659.25] : [587.33, 880]; // C5-E5 for zen, D5-A5 for epic
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = profile === 'zen' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.09);

      gain.gain.setValueAtTime(0.001, now + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.18 * volume, now + i * 0.09 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.36);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.09);
      osc.stop(now + i * 0.09 + 0.4);
    });
  } catch (e) {
    console.debug('[Sound] PartnerEmote error:', e);
  }
}

/**
 * Procedural Gentle Two-Tone Ping for Partner Quick Nudges (F5 -> C6)
 */
export function playPartnerNudge() {
  if (!isSoundEnabled()) return;
  const volume = getSoundVolume();
  if (volume <= 0.001) return;

  const profile = getSoundProfile();
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = profile === 'minimal' ? [1046.5] : [698.46, 1046.5]; // F5 -> C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.2 * volume, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.42);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.45);
    });
  } catch (e) {
    console.debug('[Sound] PartnerNudge error:', e);
  }
}

/**
 * Preview/audition a sound cue
 */
export function testSoundEffect(cueType = 'anchor') {
  if (cueType === 'highfive') {
    playPartnerHighFive();
  } else if (cueType === 'emote') {
    playPartnerEmote();
  } else if (cueType === 'nudge') {
    playPartnerNudge();
  } else {
    playSharedAnchorSync();
  }
}
