/**
 * Habuilt AI Habit Intelligence & Audio Briefing Engine
 * Powered by Gemini with Smart Heuristic Synthesis & Browser Neural Speech Synthesis
 */

const LOCAL_AI_KEY_STORAGE = 'habuilt_gemini_api_key';
const LOCAL_BRIEFING_CACHE_PREFIX = 'habuilt_daily_briefing_';

/**
 * Voice persona configurations for Web Speech API
 */
export const VOICE_PERSONAS = {
  executive: {
    id: 'executive',
    label: 'Executive Commander',
    badge: '⚡ Tactical',
    rate: 1.05,
    pitch: 1.0,
    prefix: 'Commander',
    tone: 'Crisp, authoritative, high-leverage execution mindset'
  },
  spartan: {
    id: 'spartan',
    label: 'Spartan Warrior',
    badge: '🛡️ Relentless',
    rate: 1.0,
    pitch: 0.85,
    prefix: 'Warrior',
    tone: 'Deep, steady, disciplined, anti-complacency focus'
  },
  zen: {
    id: 'zen',
    label: 'Mindful Scribe',
    badge: '🌿 Grounded',
    rate: 0.95,
    pitch: 1.1,
    prefix: 'Champion',
    tone: 'Calm, breath-synchronized, recovery-first perspective'
  }
};

/**
 * Get configured Gemini API Key (from env or user storage)
 */
export function getGeminiApiKey() {
  if (typeof localStorage !== 'undefined') {
    const userKey = localStorage.getItem(LOCAL_AI_KEY_STORAGE);
    if (userKey && userKey.trim()) return userKey.trim();
  }
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function setGeminiApiKey(key) {
  if (typeof localStorage !== 'undefined') {
    if (key && key.trim()) {
      localStorage.setItem(LOCAL_AI_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(LOCAL_AI_KEY_STORAGE);
    }
  }
}

/**
 * Generate Multi-Dimensional AI Tactical Briefing Context
 */
export function buildBriefingContext({
  displayName = 'Warrior',
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
  activeHabitName = ''
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
    activeHabitName
  };
}

/**
 * High-IQ Heuristic Synthesis Engine (Offline / Instant Fallback)
 * Produces crisp, bio-individually tailored briefings without API delays.
 */
export function generateHeuristicBriefing(ctx, personaKey = 'executive') {
  const persona = VOICE_PERSONAS[personaKey] || VOICE_PERSONAS.executive;
  const isMorning = ctx.circadianPhase.toLowerCase().includes('morning') || ctx.circadianPhase.toLowerCase().includes('sadhana');
  const isEvening = ctx.circadianPhase.toLowerCase().includes('evening') || ctx.circadianPhase.toLowerCase().includes('shutdown');

  let hook = '';
  if (isMorning) {
    hook = `Good morning, ${ctx.displayName}. Circadian clock is locked at ${ctx.circadianPhase} on a ${ctx.dayTypeLabel} schedule.`;
  } else if (isEvening) {
    hook = `Evening transition initiated, ${ctx.displayName}. Work shutdown window is active.`;
  } else {
    hook = `Midday execution check, ${ctx.displayName}. Operating in ${ctx.circadianPhase}.`;
  }

  // Clinical Rheumatology & Biomarkers Evaluation
  let clinicalNote = '';
  if (ctx.stiffnessMinutes > 0) {
    if (ctx.stiffnessMinutes <= 15) {
      clinicalNote = `Morning stiffness logged at ${ctx.stiffnessMinutes} minutes — excellent baseline decompression. Keep the thoracic mobility sequence steady.`;
    } else if (ctx.stiffnessMinutes <= 30) {
      clinicalNote = `Morning stiffness logged at ${ctx.stiffnessMinutes} minutes. Prioritize warm abhyanga and avoid compressive axial loads before your midday walk.`;
    } else {
      clinicalNote = `Elevated stiffness alert: ${ctx.stiffnessMinutes} minutes logged. Defer high-intensity strength; execute restorative pelvic tilts and keep hydration steady.`;
    }
  } else {
    clinicalNote = `Spinal decompression protocol is active. Keep hydration above the 3-litre target to flush metabolic inflammation.`;
  }

  // Progress & Streak Analysis
  let progressNote = '';
  if (ctx.todayPoints >= 15) {
    progressNote = `Target crushed with ${ctx.todayPoints} points secured! Full protocol achieved. Protect your evening wind-down.`;
  } else if (ctx.todayPoints >= 8) {
    progressNote = `Solid rhythm: ${ctx.todayPoints} of 15 points logged. Half-target cleared. Push through your afternoon execution block.`;
  } else if (ctx.todayPoints >= 4) {
    progressNote = `Floor safe at ${ctx.todayPoints} points, protecting your ${ctx.systemStreak}-day streak. Now ramp up to the 8-point half milestone.`;
  } else {
    progressNote = `Current score: ${ctx.todayPoints} points. Protect the 4-point floor first to keep your ${ctx.systemStreak}-day streak unbreakable.`;
  }

  // Keystone Needle-Mover
  let keystone = '';
  if (ctx.activeHabitName) {
    keystone = `Immediate keystone action: "${ctx.activeHabitName}". Complete this now to cement momentum.`;
  } else {
    keystone = `Anchor your day with uninterrupted focus blocks and phone-free family presence.`;
  }

  // Partner Synergy Anchor
  let partnerSynergy = '';
  if (ctx.isAshish || ctx.isJyoti) {
    partnerSynergy = `Shared couple anchors today: sync on the 18:35 joint stroller walk and 20:35 evening diya with Shaarvi.`;
  } else {
    partnerSynergy = `Accountability link with ${ctx.partnerName} is synchronized. Send a live cheer when you hit today's targets.`;
  }

  const fullSpeechText = `${hook} ${progressNote} ${clinicalNote} ${keystone} ${partnerSynergy}`;

  return {
    headline: progressNote.split('.')[0] || 'Warrior Protocol Active',
    directive: `${progressNote} ${clinicalNote}`,
    executiveSummary: `${hook} ${progressNote}`,
    clinicalRecovery: clinicalNote,
    keystoneAction: keystone,
    keystoneFocus: ctx.activeHabitName || '',
    stiffnessAdvisory: ctx.stiffnessMinutes > 30 ? `${ctx.stiffnessMinutes}min stiffness — defer heavy loads` : '',
    partnerSynergy: partnerSynergy,
    fullSpeechText: fullSpeechText,
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
    const prompt = `You are the Habuilt Elite Circadian Intelligence Coach.
Speak directly to ${ctx.displayName} in a ${VOICE_PERSONAS[personaKey]?.tone || 'crisp, tactical'} tone.
Context:
- Day Type: ${ctx.dayTypeLabel}
- Circadian Phase: ${ctx.circadianPhase}
- Points Today: ${ctx.todayPoints} / ${ctx.targetPoints} (Streak: ${ctx.systemStreak} days)
- Completed Habits: ${ctx.completedCount} of ${ctx.scheduledCount}
- Morning Stiffness Log: ${ctx.stiffnessMinutes} minutes
- Hydration Rail: ${ctx.hydrationMl} ml / 3000 ml
- Partner: ${ctx.partnerName}
- Next Keystone Habit: ${ctx.activeHabitName || 'Core Deep Work'}

Instructions:
1. Provide a 4-sentence spoken tactical briefing that analyzes progress, clinical recovery, keystone needle-mover, and partner harmony.
2. Format as valid JSON with keys: "executiveSummary", "clinicalRecovery", "keystoneAction", "partnerSynergy", "fullSpeechText".
3. Keep fullSpeechText under 80 words for optimal voice cadence.`;

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

    utterance.onstart = () => {
      this.isPlaying = true;
      this.isPaused = false;
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isPlaying = false;
      this.isPaused = false;
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onboundary = (e) => {
      if (onBoundary) onBoundary(e);
    };

    utterance.onerror = (e) => {
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
