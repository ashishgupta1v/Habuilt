import { ref, computed } from 'vue';
import { ashishHabits, jyotiHabits } from './useHabitsState';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const LOCAL_STORAGE_ACTIVE_PROTOCOL = 'habuilt_active_protocol_id_';
const LOCAL_STORAGE_CUSTOM_PROTOCOLS = 'habuilt_custom_protocols_';

// ── Curated Archetype Templates ──
export const PROTOCOL_ARCHETYPES = {
  founder: {
    id: 'archetype-founder',
    key: 'founder',
    name: 'Founder / Deep Work Executive',
    badge: '⚡ High Leverage',
    icon: 'briefcase',
    tagline: 'Deep work focus sprints, physical vitality, zero-friction shutdown.',
    description: 'Designed for engineering leads, startup founders, and technical architects who need uninterrupted deep work blocks while protecting physical health.',
    wakeTime: '05:30',
    sleepTime: '22:30',
    workStart: '08:30',
    workEnd: '18:00',
    habits: [
      { id: 'f-1', name: '05:30 Wake Up & 500ml Hydration + Electrolytes', points: 1, category: 'nutrition', timeSlot: 'morning', hint: 'Rehydrate immediately after 7+ hours of sleep. Warm water with lemon or pinch of pink salt.' },
      { id: 'f-2', name: '05:40 20-Min Morning Movement & Mobility Flow', points: 2, category: 'fitness', timeSlot: 'morning', hint: 'Spinal decompression, cat-cow, thoracic twists, and bodyweight activation.' },
      { id: 'f-3', name: '06:00 Outdoor Sunlight & Cortisol Awakening (10 min)', points: 1, category: 'rest', timeSlot: 'morning', hint: 'Natural horizon light resets master circadian pacemaker and elevates morning dopamine.' },
      { id: 'f-4', name: '06:15 High-Protein Breakfast & Brain Fuel', points: 1, category: 'nutrition', timeSlot: 'morning', hint: '30g clean protein (eggs/paneer/protein shake) + soaked nuts. Low glycemic index to prevent brain fog.' },
      { id: 'f-5', name: '07:00 Daily 1-3-5 Priority Execution Matrix', points: 1, category: 'work', timeSlot: 'morning', hint: 'Identify 1 core needle-mover, 3 critical tasks, 5 maintenance items before opening Slack.' },
      { id: 'f-6', name: '08:30 Deep Architecture Sprint (90 min Focus)', points: 3, category: 'work', timeSlot: 'work', hint: 'Uninterrupted deep focus. Notifications silenced, full screen IDE or system design.' },
      { id: 'f-7', name: '10:00 10-Min Movement Break & 20-20-20 Eye Reset', points: 1, category: 'rest', timeSlot: 'work', hint: 'Step away from screen. Hydrate and decompress neck and lower back.' },
      { id: 'f-8', name: '10:30 High-Leverage Deliverables Block (90 min)', points: 2, category: 'work', timeSlot: 'work', hint: 'Second core sprint for team code reviews, product features, and key deployments.' },
      { id: 'f-9', name: '13:00 Nourishing Lunch & Mindful Recharge', points: 1, category: 'nutrition', timeSlot: 'work', hint: 'Balanced meal with slow carbs, leafy greens, healthy fats. No heavy carb crashes.' },
      { id: 'f-10', name: '13:45 15-Min Post-Meal Metabolic Walk', points: 1, category: 'fitness', timeSlot: 'work', hint: 'Brisk walk to blunt postprandial glucose spike and clear afternoon lethargy.' },
      { id: 'f-11', name: '14:30 Pipeline / Team Sync / Ops Execution', points: 2, category: 'work', timeSlot: 'work', hint: 'Collaborative sprint: team standups, customer discovery calls, pipeline touches.' },
      { id: 'f-12', name: '18:00 Work Day Hard Shutdown Ritual', points: 1, category: 'work', timeSlot: 'evening', hint: 'Review completed items, queue tomorrow\'s top 3, close work tabs. Disconnect mentally.' },
      { id: 'f-13', name: '18:30 Family & Personal Quality Connection (45 min)', points: 2, category: 'family', timeSlot: 'evening', hint: '100% phone-free dinner, partner conversation, or relaxed walk.' },
      { id: 'f-14', name: '21:00 Evening Journaling & 3 Wins Log', points: 1, category: 'rest', timeSlot: 'evening', hint: 'Write down 3 daily victories, 1 key lesson, and practice gratitude.' },
      { id: 'f-15', name: '21:30 Screen Blackout & Sleep Chamber Prep', points: 1, category: 'rest', timeSlot: 'evening', hint: 'Devices out of bedroom, room temperature set cool, warm shower/stretching.' },
      { id: 'f-16', name: '22:30 Lights Out (7.5h Restorative Target)', points: 2, category: 'rest', timeSlot: 'evening', hint: 'Deep sleep window to consolidate memories, clear neural waste, and restore power.' }
    ]
  },

  longevity: {
    id: 'archetype-longevity',
    key: 'longevity',
    name: 'Mind-Body & Longevity Architecture',
    badge: '🌿 Holistic Health',
    icon: 'activity',
    tagline: 'Circadian optimization, spinal health, clean fuel, parasympathetic balance.',
    description: 'A scientifically engineered daily protocol focusing on lowering inflammation, maximizing cellular recovery, posture preservation, and sustainable high energy.',
    wakeTime: '05:00',
    sleepTime: '22:00',
    workStart: '08:30',
    workEnd: '18:00',
    habits: [
      { id: 'l-1', name: '05:00 Wake-Up & Spinal Bed Mobility (10 min)', points: 1, category: 'fitness', timeSlot: 'morning', hint: 'Cat-cow, knees-to-chest, gentle twists to decompress intervertebral discs before standing.' },
      { id: 'l-2', name: '05:15 500ml Warm Mineral Water + Lemon', points: 1, category: 'nutrition', timeSlot: 'morning', hint: 'Warm water with trace mineral salt and lemon to stimulate peristalsis and hydration.' },
      { id: 'l-3', name: '05:25 Pranayama Breathwork & Kriya (15 min)', points: 2, category: 'rest', timeSlot: 'morning', hint: 'Rhythmic diaphragmatic breathing to activate the vagus nerve and oxygenate tissues.' },
      { id: 'l-4', name: '05:40 Silent Meditation & Mind Reset (10 min)', points: 1, category: 'rest', timeSlot: 'morning', hint: 'Stillness before sensory inputs begin. Lowers cortisol and stabilizes autonomic tone.' },
      { id: 'l-5', name: '06:00 Outdoor Sunlight Gazing (10 min)', points: 1, category: 'rest', timeSlot: 'morning', hint: 'Direct sky photon capture sets melatonin countdown and boosts dopamine receptors.' },
      { id: 'l-6', name: '06:15 Zone 2 Cardio or Functional Strength (30 min)', points: 2, category: 'fitness', timeSlot: 'morning', hint: 'Mitochondrial biogenesis: keep heart rate at conversational pace or moderate resistance.' },
      { id: 'l-7', name: '06:50 Warm Shower with Cool Finish (60s)', points: 1, category: 'fitness', timeSlot: 'morning', hint: 'Vascular flush and cold thermogenesis to activate norepinephrine and brown fat.' },
      { id: 'l-8', name: '07:15 Anti-Inflammatory Breakfast (Berries, Omega-3, Clean Protein)', points: 1, category: 'nutrition', timeSlot: 'morning', hint: 'Polyphenols, chia/flaxseed, plant/clean protein with zero added cane sugar.' },
      { id: 'l-9', name: '08:30 Deep Focus Work Block (90 min)', points: 2, category: 'work', timeSlot: 'work', hint: 'Singular focus on key cognitive output with ergonomic upright posture.' },
      { id: 'l-10', name: '10:15 Posture Check & Decompression Stretch', points: 1, category: 'fitness', timeSlot: 'work', hint: 'Doorway pectoral stretch, chin tucks, and standing lumbar extensions.' },
      { id: 'l-11', name: '12:30 Pre-Meal Fiber / Warm Digestive Sip', points: 1, category: 'nutrition', timeSlot: 'work', hint: 'Soluble fiber (psyllium/chia) or herbal infusion before nutrient intake.' },
      { id: 'l-12', name: '13:00 Whole-Food Nutrient Dense Lunch', points: 1, category: 'nutrition', timeSlot: 'work', hint: 'Steamed greens, legumes/fish, turmeric, black pepper, and extra virgin olive oil.' },
      { id: 'l-13', name: '13:45 10-Min Post-Meal Sunlight Walk', points: 1, category: 'fitness', timeSlot: 'work', hint: 'Muscular contractions absorb circulating glucose without insulin surges.' },
      { id: 'l-14', name: '15:30 Screen Hydration & Micro-Break (5 min)', points: 1, category: 'rest', timeSlot: 'work', hint: 'Palming eyes, 20-20-20 rule, drink 300ml filtered water.' },
      { id: 'l-15', name: '18:30 Sunset Evening Walk & Nature Connection', points: 2, category: 'family', timeSlot: 'evening', hint: 'Orange horizon light prepares pineal gland for natural nocturnal melatonin release.' },
      { id: 'l-16', name: '19:30 Light Early Dinner (3h Prior to Bed)', points: 1, category: 'nutrition', timeSlot: 'evening', hint: 'Easily digestible soup, warm vegetables, clean protein. Fasting begins at 20:00.' },
      { id: 'l-17', name: '21:00 Spinal Wind-Down & Legs-Up-The-Wall (10 min)', points: 1, category: 'rest', timeSlot: 'evening', hint: 'Venous return enhancement and parasympathetic switch before sleep.' },
      { id: 'l-18', name: '22:00 In Bed — 100% Dark & Cool Sanctuary', points: 2, category: 'rest', timeSlot: 'evening', hint: 'Non-negotiable recovery sleep. Melatonin optimization.' }
    ]
  },

  postpartum: {
    id: 'archetype-postpartum',
    key: 'postpartum',
    name: 'Postpartum Mother & Family Harmony',
    badge: '🌸 Nurture & Balance',
    icon: 'heart',
    tagline: 'Protected sleep recovery, gentle pelvic resetting, maternal nutrition & family joy.',
    description: 'Designed specifically for mothers and parents navigating infant care, postpartum healing, mental well-being, and dedicated micro-sprints for personal growth.',
    wakeTime: '06:00',
    sleepTime: '22:00',
    workStart: '09:30',
    workEnd: '17:00',
    habits: [
      { id: 'p-1', name: 'Protected Morning Sleep Floor (Restorative Recovery)', points: 2, category: 'rest', timeSlot: 'morning', hint: 'Uninterrupted rest while partner or family assists with infant morning routines.' },
      { id: 'p-2', name: '08:00 Wake-Up & 500ml Warm Hydration', points: 1, category: 'nutrition', timeSlot: 'morning', hint: 'Essential for lactation support, electrolyte balance, and digestive rejuvenation.' },
      { id: 'p-3', name: '08:15 Gentle Pelvic Floor & Core Reset (10 min)', points: 1, category: 'fitness', timeSlot: 'morning', hint: 'Diaphragmatic breathing, gentle bridges, cat-cow, and pelvic stabilization.' },
      { id: 'p-4', name: '08:30 Nourishing Maternal Breakfast & Key Supplements', points: 2, category: 'nutrition', timeSlot: 'morning', hint: 'Soaked nuts, oatmeal/eggs, B12, vitamin D3, and postnatal multivitamins.' },
      { id: 'p-5', name: '09:00 Morning Baby Bond & Tummy Time Session', points: 2, category: 'family', timeSlot: 'morning', hint: 'Face-to-face vocal turn-taking, infant mobility, sensory stimulation.' },
      { id: 'p-6', name: '10:00 Protected Career & Study Focus Sprint (60 min)', points: 2, category: 'work', timeSlot: 'work', hint: 'Dedicated personal block for career upskilling, portfolio, or creative passion.' },
      { id: 'p-7', name: '11:30 Lactation Hydration & Healthy Snack Break', points: 1, category: 'nutrition', timeSlot: 'work', hint: 'Warm CCF tea, fruit, or seeds. Rehydrate consistently throughout midday.' },
      { id: 'p-8', name: '13:00 Wholesome Shared Lunch with Partner', points: 1, category: 'family', timeSlot: 'work', hint: 'Warm home-cooked dal, seasonal veggies, healthy fats. Screen-free conversation.' },
      { id: 'p-9', name: '14:00 Baby Nap & Mother Rest Window (45 min)', points: 2, category: 'rest', timeSlot: 'work', hint: 'Lie down, close eyes, and rest alongside baby without checking notifications.' },
      { id: 'p-10', name: '15:30 Afternoon Micro-Task & Admin Sprints', points: 1, category: 'work', timeSlot: 'work', hint: 'Clear household errands, messages, or high-value quick items.' },
      { id: 'p-11', name: '18:00 Outdoor Stroller Walk in Fresh Air', points: 2, category: 'fitness', timeSlot: 'evening', hint: 'Fresh air, gentle walking, and baby sensory stimulation with partner.' },
      { id: 'p-12', name: '19:30 Wholesome Family Dinner', points: 1, category: 'family', timeSlot: 'evening', hint: 'Nourishing dinner together, calm atmosphere, soothing background music.' },
      { id: 'p-13', name: '20:15 Baby Bedtime Routine & Lullaby', points: 1, category: 'family', timeSlot: 'evening', hint: 'Warm sponge/massage, dim lights, soft shloka or gentle lullaby.' },
      { id: 'p-14', name: '20:45 Daily Partner Connection & Heart-to-Heart (15 min)', points: 2, category: 'family', timeSlot: 'evening', hint: 'Share how your day felt, exchange appreciation, and team up on tomorrow.' },
      { id: 'p-15', name: '21:15 Warm Herbal Sip & Calming Stretch', points: 1, category: 'rest', timeSlot: 'evening', hint: 'Warm chamomile or golden milk, gentle shoulder releases before bed.' },
      { id: 'p-16', name: '22:00 In Bed for Night Sleep Window', points: 2, category: 'rest', timeSlot: 'evening', hint: 'Maximize restorative sleep hours before overnight feedings.' }
    ]
  },

  blank: {
    id: 'archetype-blank',
    key: 'blank',
    name: 'Blank Canvas Protocol',
    badge: '🛠️ Fully Custom',
    icon: 'edit',
    tagline: 'Build your completely personalized daily protocol from scratch.',
    description: 'Start with an empty structure and add your tailored habits, points, categories, and schedule rules.',
    wakeTime: '06:00',
    sleepTime: '22:30',
    workStart: '09:00',
    workEnd: '18:00',
    habits: [
      { id: 'c-1', name: 'Morning Hydration & Wake Up', points: 1, category: 'nutrition', timeSlot: 'morning', hint: '500ml of water upon waking.' },
      { id: 'c-2', name: 'Daily Movement / Exercise (30 min)', points: 2, category: 'fitness', timeSlot: 'morning', hint: 'Movement of your choice.' },
      { id: 'c-3', name: 'Core Focus Work Block', points: 3, category: 'work', timeSlot: 'work', hint: 'Your #1 top priority work execution.' },
      { id: 'c-4', name: 'Evening Walk or Family Time', points: 1, category: 'family', timeSlot: 'evening', hint: 'Disconnection and relaxation.' },
      { id: 'c-5', name: 'Night Journaling & Reflection', points: 1, category: 'rest', timeSlot: 'evening', hint: '3 wins and gratitude.' },
      { id: 'c-6', name: 'Target Bedtime Lights Out', points: 2, category: 'rest', timeSlot: 'evening', hint: 'Sleep on schedule.' }
    ]
  },

  ashishMaster: {
    id: 'archetype-ashish',
    key: 'ashish-master',
    name: 'Ashish Master Operating Plan (Dual-Track)',
    badge: '👑 Master Blueprint',
    icon: 'crown',
    tagline: 'ZoetiCoach & Digital Builders Studio, Infosys 4h, Spine/Eye Shield & 21:00 Shutdown.',
    description: 'The complete dual-track operating system: Home base deep laptop build blocks, Chandigarh solo sprint week, 2h alternate-day meetings, spine & ocular preservation, and strict 21:00 hard laptop shutdown.',
    wakeTime: '04:45',
    sleepTime: '22:00',
    workStart: '08:30',
    workEnd: '21:00',
    habits: ashishHabits
  },

  jyotiMaster: {
    id: 'archetype-jyoti',
    key: 'jyoti-master',
    name: 'Jyoti Master Protocol (Flagship 37-Step)',
    badge: '🌸 Master Blueprint',
    icon: 'sun',
    tagline: 'Postpartum recovery, maternal nutrition, career sprint & Shaarvi milestones.',
    description: 'The complete 37-step maternal protocol protecting sleep windows, nutritional repletion, baby developmental milestones, and partner synergy.',
    wakeTime: '05:00',
    sleepTime: '22:00',
    workStart: '08:00',
    workEnd: '17:00',
    habits: jyotiHabits
  }
};

/**
 * Composable for dynamic protocols management
 * Supports explicit archetype IDs, saved preferences, and fallback archetypes.
 */
export function useDynamicProtocols(userId = 'guest', defaultArchetypeId = null, legacyJyotiParam = false) {
  const customProtocols = ref([]);
  const activeProtocolId = ref(typeof localStorage !== 'undefined' ? (localStorage.getItem(`${LOCAL_STORAGE_ACTIVE_PROTOCOL}${userId}`) || null) : null);
  const isLoading = ref(false);

  // Compute available list of all protocols (built-in archetypes + user custom protocols)
  const allProtocols = computed(() => {
    const list = [
      PROTOCOL_ARCHETYPES.founder,
      PROTOCOL_ARCHETYPES.longevity,
      PROTOCOL_ARCHETYPES.postpartum,
      PROTOCOL_ARCHETYPES.ashishMaster,
      PROTOCOL_ARCHETYPES.jyotiMaster,
      ...customProtocols.value
    ];
    return list;
  });

  // Active protocol resolution
  const activeProtocol = computed(() => {
    // 1. If activeProtocolId is explicitly set, find in all protocols
    if (activeProtocolId.value) {
      const found = allProtocols.value.find(p => p.id === activeProtocolId.value || p.key === activeProtocolId.value);
      if (found) return found;
    }

    // 2. If defaultArchetypeId string is passed, look up matching archetype
    if (typeof defaultArchetypeId === 'string' && defaultArchetypeId.trim()) {
      const found = allProtocols.value.find(p => p.id === defaultArchetypeId || p.key === defaultArchetypeId);
      if (found) return found;
    }

    // 3. Handle backward compatibility for legacy boolean flags (isAshish, isJyoti)
    if (defaultArchetypeId === true) {
      return PROTOCOL_ARCHETYPES.ashishMaster;
    }
    if (legacyJyotiParam === true) {
      return PROTOCOL_ARCHETYPES.jyotiMaster;
    }

    // 4. Backward-compatible default for legacy user IDs
    const lowerUid = String(userId || '').toLowerCase();
    if (lowerUid === 'ashish') {
      return PROTOCOL_ARCHETYPES.ashishMaster;
    }
    if (lowerUid === 'jyoti') {
      return PROTOCOL_ARCHETYPES.jyotiMaster;
    }

    // 5. Universal default for new / guest / standard users: Founder Executive
    return PROTOCOL_ARCHETYPES.founder;
  });

  // Calculate dynamic time slots from active protocol
  const dynamicTimeSlotDefinitions = computed(() => {
    const p = activeProtocol.value || PROTOCOL_ARCHETYPES.founder;
    const wake = p.wakeTime || '05:00';
    const workS = p.workStart || '08:30';
    const workE = p.workEnd || '18:30';
    const sleep = p.sleepTime || '22:00';

    return {
      morning: { label: 'Morning Routine',  time: `${wake}–${workS}`, emoji: '🌅', color: '#D4A03E' },
      work:    { label: 'Deep Work & Ops',   time: `${workS}–${workE}`, emoji: '⚡', color: '#D4B36A' },
      evening: { label: 'Evening & Family', time: `${workE}–${sleep}`, emoji: '🌙', color: '#B08D3E' },
      anytime: { label: 'Health & Mindset', time: 'All Day', emoji: '💚', color: '#6366f1' },
      weekly:  { label: 'Weekly Recurring', time: 'Weekly',  emoji: '📅', color: '#B8865A' },
    };
  });

  // Load custom protocols from localStorage and Supabase
  const loadProtocols = async () => {
    isLoading.value = true;
    try {
      // 1. Load active ID from localStorage
      const savedActiveId = localStorage.getItem(`${LOCAL_STORAGE_ACTIVE_PROTOCOL}${userId}`);
      if (savedActiveId) {
        activeProtocolId.value = savedActiveId;
      }

      // 2. Load custom protocols from localStorage
      const savedCustom = localStorage.getItem(`${LOCAL_STORAGE_CUSTOM_PROTOCOLS}${userId}`);
      if (savedCustom) {
        try {
          customProtocols.value = JSON.parse(savedCustom);
        } catch (_) {}
      }

      // 3. Load from Supabase if connected
      const isGuestMode = typeof window !== 'undefined' && (localStorage.getItem('habuilt_guest_mode') === 'true' || userId === 'guest' || userId === 'ashish' || userId === 'jyoti');
      if (isSupabaseConfigured() && userId && userId !== 'guest' && !isGuestMode) {
        const { data, error } = await supabase
          .from('user_protocols')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          const remoteProtocols = data.map(row => ({
            id: row.id,
            key: row.archetype || 'custom',
            name: row.name,
            badge: '👤 Custom Protocol',
            icon: 'award',
            tagline: row.description || 'Custom user protocol',
            description: row.description || '',
            wakeTime: row.wake_time || '05:00',
            sleepTime: row.sleep_time || '22:00',
            workStart: row.work_start || '08:30',
            workEnd: row.work_end || '18:30',
            habits: Array.isArray(row.habits) ? row.habits : [],
            isRemote: true
          }));

          customProtocols.value = remoteProtocols;

          // Check if an active protocol is marked in DB
          const activeRemote = data.find(r => r.is_active);
          if (activeRemote && !savedActiveId) {
            activeProtocolId.value = activeRemote.id;
          }
        }
      }
    } catch (e) {
      console.warn('[useDynamicProtocols] Error loading protocols:', e);
    } finally {
      isLoading.value = false;
    }
  };

  // Set active protocol
  const switchProtocol = async (protocolId) => {
    activeProtocolId.value = protocolId;
    localStorage.setItem(`${LOCAL_STORAGE_ACTIVE_PROTOCOL}${userId}`, protocolId);

    // Sync to Supabase if logged in
    const isGuestMode = typeof window !== 'undefined' && (localStorage.getItem('habuilt_guest_mode') === 'true' || userId === 'guest' || userId === 'ashish' || userId === 'jyoti');
    if (isSupabaseConfigured() && userId && userId !== 'guest' && !isGuestMode) {
      try {
        // Set all to inactive first
        await supabase
          .from('user_protocols')
          .update({ is_active: false })
          .eq('user_id', userId);

        // Set matching to active
        await supabase
          .from('user_protocols')
          .update({ is_active: true })
          .eq('user_id', userId)
          .eq('id', protocolId);
      } catch (e) {
        console.warn('[useDynamicProtocols] Error updating active protocol in DB:', e);
      }
    }
  };

  // Save new custom protocol
  const saveCustomProtocol = async (protocolData) => {
    const id = protocolData.id || `custom-${Date.now()}`;
    const newProtocol = {
      id,
      key: protocolData.key || 'custom',
      name: protocolData.name || 'My Custom Protocol',
      badge: '👤 Custom Protocol',
      icon: 'award',
      tagline: protocolData.tagline || 'Tailored routine',
      description: protocolData.description || '',
      wakeTime: protocolData.wakeTime || '05:30',
      sleepTime: protocolData.sleepTime || '22:00',
      workStart: protocolData.workStart || '08:30',
      workEnd: protocolData.workEnd || '18:00',
      habits: protocolData.habits || []
    };

    const existingIdx = customProtocols.value.findIndex(p => p.id === id);
    if (existingIdx >= 0) {
      customProtocols.value[existingIdx] = newProtocol;
    } else {
      customProtocols.value.unshift(newProtocol);
    }

    localStorage.setItem(`${LOCAL_STORAGE_CUSTOM_PROTOCOLS}${userId}`, JSON.stringify(customProtocols.value));
    await switchProtocol(id);

    // Sync to Supabase
    const isGuestMode = typeof window !== 'undefined' && (localStorage.getItem('habuilt_guest_mode') === 'true' || userId === 'guest' || userId === 'ashish' || userId === 'jyoti');
    if (isSupabaseConfigured() && userId && userId !== 'guest' && !isGuestMode) {
      try {
        await supabase.from('user_protocols').upsert({
          id: id.startsWith('custom-') ? undefined : id,
          user_id: userId,
          name: newProtocol.name,
          archetype: newProtocol.key,
          description: newProtocol.description,
          wake_time: newProtocol.wakeTime,
          sleep_time: newProtocol.sleepTime,
          work_start: newProtocol.workStart,
          work_end: newProtocol.workEnd,
          is_active: true,
          habits: newProtocol.habits,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        console.warn('[useDynamicProtocols] Error persisting to Supabase:', e);
      }
    }

    return newProtocol;
  };

  // Delete custom protocol
  const deleteCustomProtocol = async (protocolId) => {
    if (!protocolId) return false;
    customProtocols.value = customProtocols.value.filter(p => p.id !== protocolId);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${LOCAL_STORAGE_CUSTOM_PROTOCOLS}${userId}`, JSON.stringify(customProtocols.value));
    }

    // If deleted protocol was active, revert to default archetype
    if (activeProtocolId.value === protocolId) {
      const fallbackId = String(userId).toLowerCase() === 'ashish' 
        ? PROTOCOL_ARCHETYPES.ashishMaster.id 
        : PROTOCOL_ARCHETYPES.founder.id;
      await switchProtocol(fallbackId);
    }

    // Sync to Supabase
    const isGuestMode = typeof window !== 'undefined' && (localStorage.getItem('habuilt_guest_mode') === 'true' || userId === 'guest' || userId === 'ashish' || userId === 'jyoti');
    if (isSupabaseConfigured() && userId && userId !== 'guest' && !isGuestMode) {
      try {
        await supabase
          .from('user_protocols')
          .delete()
          .eq('user_id', userId)
          .eq('id', protocolId);
      } catch (e) {
        console.warn('[useDynamicProtocols] Error deleting from Supabase:', e);
      }
    }
    return true;
  };

  // Clone protocol (built-in archetype or custom)
  const cloneProtocol = async (sourceProtocol, newName = null) => {
    if (!sourceProtocol) return null;
    const clonedName = newName || `${sourceProtocol.name || 'Protocol'} (Custom)`;
    const clonedId = `custom-${Date.now()}`;
    const clonedData = {
      id: clonedId,
      key: `custom-${Date.now()}`,
      name: clonedName,
      badge: '👤 Custom Protocol',
      icon: sourceProtocol.icon || 'award',
      tagline: sourceProtocol.tagline || 'Customized routine',
      description: sourceProtocol.description || '',
      wakeTime: sourceProtocol.wakeTime || '05:30',
      sleepTime: sourceProtocol.sleepTime || '22:00',
      workStart: sourceProtocol.workStart || '08:30',
      workEnd: sourceProtocol.workEnd || '18:00',
      habits: Array.isArray(sourceProtocol.habits) ? JSON.parse(JSON.stringify(sourceProtocol.habits)) : []
    };
    return await saveCustomProtocol(clonedData);
  };

  // Export protocol as clean JSON
  const exportProtocolJson = (protocol) => {
    if (!protocol) return null;
    const payload = {
      schema: 'habuilt-protocol-v1',
      exportedAt: new Date().toISOString(),
      protocol: {
        name: protocol.name,
        badge: protocol.badge || '👤 Custom Protocol',
        icon: protocol.icon || 'award',
        tagline: protocol.tagline || '',
        description: protocol.description || '',
        wakeTime: protocol.wakeTime || '05:30',
        sleepTime: protocol.sleepTime || '22:00',
        workStart: protocol.workStart || '08:30',
        workEnd: protocol.workEnd || '18:00',
        habits: Array.isArray(protocol.habits) ? protocol.habits.map(h => ({
          id: h.id,
          name: h.name,
          points: Number(h.points) || 1,
          category: h.category || 'ops',
          timeSlot: h.timeSlot || 'morning',
          hint: h.hint || ''
        })) : []
      }
    };
    return JSON.stringify(payload, null, 2);
  };

  // Import protocol from JSON string or object
  const importProtocolJson = async (jsonInput) => {
    try {
      const data = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput;
      const proto = data.protocol || data;
      if (!proto || !proto.name) {
        throw new Error('Invalid protocol payload: missing name');
      }

      const importedData = {
        id: `custom-import-${Date.now()}`,
        key: `import-${Date.now()}`,
        name: `${proto.name} (Imported)`,
        badge: proto.badge || '📥 Imported Protocol',
        icon: proto.icon || 'award',
        tagline: proto.tagline || 'Imported custom protocol',
        description: proto.description || '',
        wakeTime: proto.wakeTime || '05:30',
        sleepTime: proto.sleepTime || '22:00',
        workStart: proto.workStart || '08:30',
        workEnd: proto.workEnd || '18:00',
        habits: Array.isArray(proto.habits) ? proto.habits : []
      };

      return await saveCustomProtocol(importedData);
    } catch (err) {
      console.error('[useDynamicProtocols] Import failed:', err);
      throw err;
    }
  };

  // Generate shareable base64 link
  const generateShareableProtocolUrl = (protocol) => {
    if (!protocol || typeof window === 'undefined') return '';
    try {
      const jsonStr = exportProtocolJson(protocol);
      const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
      const base = window.location.origin + window.location.pathname;
      return `${base}#import-protocol=${b64}`;
    } catch (e) {
      console.warn('Failed to generate share URL:', e);
      return '';
    }
  };

  // Decode protocol from URL hash
  const decodeProtocolFromHash = (hashString) => {
    if (!hashString || !hashString.includes('#import-protocol=')) return null;
    try {
      const b64 = hashString.split('#import-protocol=')[1];
      if (!b64) return null;
      const jsonStr = decodeURIComponent(escape(atob(b64)));
      const parsed = JSON.parse(jsonStr);
      return parsed.protocol || parsed;
    } catch (e) {
      console.warn('Failed to decode protocol hash:', e);
      return null;
    }
  };

  return {
    allProtocols,
    customProtocols,
    activeProtocol,
    activeProtocolId,
    dynamicTimeSlotDefinitions,
    isLoading,
    loadProtocols,
    switchProtocol,
    saveCustomProtocol,
    deleteCustomProtocol,
    cloneProtocol,
    exportProtocolJson,
    importProtocolJson,
    generateShareableProtocolUrl,
    decodeProtocolFromHash,
    PROTOCOL_ARCHETYPES
  };
}
