/**
 * Habuilt AI Habit Intelligence & Audio Briefing Engine
 * Powered by Gemini with Smart Heuristic Synthesis & Browser Neural Speech Synthesis
 */

const LOCAL_AI_KEY_STORAGE = 'habuilt_gemini_api_key';
const LOCAL_BRIEFING_CACHE_PREFIX = 'habuilt_daily_briefing_';
let sessionGeminiKey = '';

const forgetPersistedGeminiKey = () => {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(LOCAL_AI_KEY_STORAGE);
  } catch {
    // The key must not remain on disk.
  }
};

forgetPersistedGeminiKey();

/**
 * Voice persona configurations for Web Speech API
 */
export const VOICE_PERSONAS = {
  executive: {
    id: 'executive',
    label: 'Clear',
    badge: 'Plain',
    rate: 1.05,
    pitch: 1.0,
    prefix: '',
    tone: 'Plain, calm habit-tracker voice'
  },
  spartan: {
    id: 'spartan',
    label: 'Steady',
    badge: 'Quiet',
    rate: 1.0,
    pitch: 0.95,
    prefix: '',
    tone: 'Steady and brief'
  },
  zen: {
    id: 'zen',
    label: 'Calm',
    badge: 'Soft',
    rate: 0.95,
    pitch: 1.05,
    prefix: '',
    tone: 'Calm and short'
  }
};

/**
 * Session opt-in only. The key is never written to localStorage or sent to this server.
 */
export function getGeminiApiKey() {
  return sessionGeminiKey;
}

export function setGeminiApiKey(key = '') {
  forgetPersistedGeminiKey();
  sessionGeminiKey = typeof key === 'string' ? key.trim() : '';
}

/**
 * Generate Multi-Dimensional AI Tactical Briefing Context
 */
export function buildBriefingContext({
  displayName = 'You',
  isAshish = false,
  isJyoti = false,
  dayTypeLabel = 'Home',
  circadianPhase = 'Morning Sadhana',
  todayPoints = 0,
  targetPoints = 15,
  completedCount = 0,
  scheduledCount = 0,
  systemStreak = 0,
  stiffnessMinutes = 0,
  hydrationMl = 0,
  partnerName = 'Partner',
  activeHabitName = '',
  adherenceRate = 0,
  clinicalDirective = '',
}) {
  return {
    displayName,
    isAshish,
    isJyoti,
    dayTypeLabel,
    circadianPhase,
    todayPoints,
    targetPoints,
    completedCount,
    scheduledCount,
    systemStreak,
    stiffnessMinutes,
    hydrationMl,
    partnerName,
    activeHabitName,
    adherenceRate,
    clinicalDirective,
  };
}

/**
 * High-IQ Heuristic Synthesis Engine (Offline / Instant Fallback)
 * Produces crisp, bio-individually tailored briefings without API delays.
 */
export function generateHeuristicBriefing(ctx, personaKey = 'executive') {
  const kept = Number(ctx.completedCount) || 0;
  const scheduled = Number(ctx.scheduledCount) || 0;
  const streak = Number(ctx.systemStreak) || 0;
  const hook = `${ctx.displayName}, ${kept} of ${scheduled} habits kept today.`;
  const progressNote = streak > 0
    ? `${ctx.todayPoints} points today. Streak: ${streak} days.`
    : `${ctx.todayPoints} points today.`;
  const note = ctx.activeHabitName
    ? `Next habit: ${ctx.activeHabitName}.`
    : 'Nothing else is scheduled right now.';
  const partnerSynergy = ctx.partnerName && ctx.partnerName !== 'Partner'
    ? `You and ${ctx.partnerName} each see Kept or Not yet for today.`
    : 'No partner yet.';
  const fullSpeechText = `${hook} ${progressNote} ${note} ${partnerSynergy}`;

  return {
    headline: hook,
    directive: `${progressNote} ${note}`,
    executiveSummary: `${hook} ${progressNote}`,
    clinicalRecovery: note,
    keystoneAction: note,
    keystoneFocus: ctx.activeHabitName || '',
    stiffnessAdvisory: '',
    partnerSynergy,
    fullSpeechText,
    source: 'heuristic',
    timestamp: new Date().toISOString()
  };
}

/**
 * Generate AI Briefing via Gemini API (with seamless heuristic fallback)
 */
export async function generateAIBriefing(ctx, personaKey = 'executive') {
  const apiKey = getGeminiApiKey();
  const cacheKey = `${LOCAL_BRIEFING_CACHE_PREFIX}${ctx.displayName}_${new Date().toISOString().slice(0, 10)}_${personaKey}`;

  // If no Gemini API key configured, use high-IQ heuristic synthesis directly
  if (!apiKey) {
    return generateHeuristicBriefing(ctx, personaKey);
  }

  try {
    const prompt = `You are Habuilt, a plain habit tracker.
Speak directly to ${ctx.displayName} in a ${VOICE_PERSONAS[personaKey]?.tone || 'plain and calm'} tone.
Use only the check-ins in this context. Do not invent health scores.
Context:
- Day: ${ctx.dayTypeLabel}
- Points today: ${ctx.todayPoints} / ${ctx.targetPoints}
- Streak: ${ctx.systemStreak} days
- Kept: ${ctx.completedCount} of ${ctx.scheduledCount}
- Next habit: ${ctx.activeHabitName || 'none'}
- Partner: ${ctx.partnerName}

Instructions:
1. Write four short sentences about habits kept today, the next habit, and that a partner sees Kept or Not yet.
2. Format as valid JSON with keys: "executiveSummary", "todayNote", "keystoneAction", "partnerSynergy", "fullSpeechText".
3. Keep fullSpeechText under 80 words. Use everyday habit-tracker language.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 350,
            responseMimeType: 'application/json'
          }
        })
      }
    );

    if (!response.ok) {
      console.warn('[GeminiBriefing] API returned non-OK, using heuristic fallback');
      return generateHeuristicBriefing(ctx, personaKey);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawContent) {
      const parsed = JSON.parse(rawContent);
      return {
        ...parsed,
        clinicalRecovery: parsed.todayNote || parsed.note || '',
        source: 'gemini-1.5-flash',
        timestamp: new Date().toISOString()
      };
    }
  } catch (err) {
    console.warn('[GeminiBriefing] Error generating AI briefing:', err);
  }

  return generateHeuristicBriefing(ctx, personaKey);
}

/**
 * Web Speech API Voice Controller
 */
class SpeechSynthesizer {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.isPaused = false;
  }

  getAvailableVoices() {
    if (!this.synth) return [];
    return this.synth.getVoices() || [];
  }

  speak(text, { personaKey = 'executive', speed = 1.0, onStart, onEnd, onBoundary, onError } = {}) {
    if (!this.synth || !text) return;

    this.stop();

    const persona = VOICE_PERSONAS[personaKey] || VOICE_PERSONAS.executive;
    const utterance = new SpeechSynthesisUtterance(text);

    // Pick best natural English voice
    const voices = this.getAvailableVoices();
    const selectedVoice = voices.find(v => (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Premium'))))
      || voices.find(v => v.lang.startsWith('en'))
      || null;

    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.rate = (persona.rate || 1.0) * speed;
    utterance.pitch = persona.pitch || 1.0;

    // Headless / non-interactive browser fallback: Web Speech onstart can fail to trigger
    // if no active audio device exists or tab is unmuted. Ensure visual waveform and state update reliably.
    let fallbackTimer = null;
    if (typeof window !== 'undefined') {
      fallbackTimer = setTimeout(() => {
        if (!this.isPlaying && this.currentUtterance === utterance) {
          this.isPlaying = true;
          this.isPaused = false;
          if (onStart) onStart();
        }
      }, 100);
    }

    utterance.onstart = (e) => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      this.isPlaying = true;
      this.isPaused = false;
      if (onStart) onStart(e);
    };

    utterance.onend = () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onboundary = (e) => {
      if (onBoundary) onBoundary(e);
    };

    utterance.onerror = (e) => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      if (onError) onError(e);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  pause() {
    if (this.synth && this.isPlaying && !this.isPaused) {
      this.synth.pause();
      this.isPaused = true;
    }
  }

  resume() {
    if (this.synth && this.isPlaying && this.isPaused) {
      this.synth.resume();
      this.isPaused = false;
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
    }
  }
}

export const speechController = new SpeechSynthesizer();
