import { ref, computed } from 'vue';

// Public starter habits used when no archetype protocol is selected.
export const genericStarterHabits = [
  { id: 'g-1', name: 'Morning water & stretch (10 min)', points: 1, hint: 'Drink a glass of water first thing. Spend 10 min stretching or doing light movement.', timeSlot: 'morning', category: 'fitness' },
  { id: 'g-2', name: 'Daily exercise (30 min)', points: 2, hint: 'Any form of exercise: walk, run, gym, yoga, sport. Just move with intent for 30 min.', timeSlot: 'morning', category: 'fitness' },
  { id: 'g-3', name: 'Eat 1 healthy, balanced meal', points: 1, hint: 'At least one meal today focused on real food: protein + vegetables + complex carbs.', timeSlot: 'work', category: 'nutrition' },
  { id: 'g-4', name: 'Deep focus block (60 min)', points: 3, hint: '60 min of uninterrupted work on your most important task. Phone on silent, notifications off.', timeSlot: 'work', category: 'work' },
  { id: 'g-5', name: 'Read for 15 minutes', points: 1, hint: 'Read a book (not social media). Fiction or non-fiction, 15 min minimum.', timeSlot: 'evening', category: 'rest' },
  { id: 'g-6', name: 'Plan tomorrow (5 min)', points: 1, hint: 'Write down your top 3 priorities for tomorrow. Takes 5 min, saves 30 min of decision-making.', timeSlot: 'evening', category: 'work' },
  { id: 'g-7', name: 'Lights out by target time', points: 2, hint: 'Pick your target bedtime and stick to it. Screens off 30 min before. Room dark and cool.', timeSlot: 'evening', category: 'rest' },
];

export const sharedCoupleHabits = {};

export function getSharedHabitInfo(habitId) {
  if (!habitId) return null;
  return sharedCoupleHabits[habitId] || null;
}

export const timeSlotDefinitions = {
  morning: { label: 'Morning Routine', time: '05:30–08:30', emoji: '🌅', color: '#D4A03E' },
  work: { label: 'Deep Work & Execution', time: '08:30–18:00', emoji: '⚡', color: '#D4B36A' },
  evening: { label: 'Evening & Recovery', time: '18:00–22:30', emoji: '🌙', color: '#B08D3E' },
  anytime: { label: 'Health & Mindset', time: 'All Day', emoji: '💚', color: '#6366f1' },
  weekly: { label: 'Weekly Review', time: 'Weekly', emoji: '📅', color: '#B8865A' },
};

export const timeSlotOrder = {
  morning: 1,
  work: 2,
  evening: 3,
  anytime: 4,
  weekly: 5,
};

export function getTimeSlotForHabit(id, habit = null) {
  if (habit && habit.timeSlot && timeSlotOrder[habit.timeSlot]) return habit.timeSlot;
  if (habit && habit.startTime) {
    const [h, m] = String(habit.startTime).split(':').map(Number);
    const mins = (h || 0) * 60 + (m || 0);
    if (mins < 8 * 60 + 30) return 'morning';
    if (mins < 18 * 60) return 'work';
    return 'evening';
  }

  const name = String(habit?.name || '');
  const prefix = name.match(/^(\d{2}):(\d{2})/);
  if (prefix) {
    const mins = Number(prefix[1]) * 60 + Number(prefix[2]);
    if (mins < 8 * 60 + 30) return 'morning';
    if (mins < 18 * 60) return 'work';
    return 'evening';
  }

  return 'anytime';
}

export function getHabitCategory(habit) {
  if (habit && habit.category) return habit.category;
  const name = (habit?.name || '').toLowerCase();
  if (name.includes('workout') || name.includes('exercise') || name.includes('run') || name.includes('walk') || name.includes('stretch') || name.includes('mobility') || name.includes('yoga') || name.includes('strength')) return 'fitness';
  if (name.includes('water') || name.includes('protein') || name.includes('breakfast') || name.includes('lunch') || name.includes('dinner') || name.includes('meal') || name.includes('hydrat')) return 'nutrition';
  if (name.includes('deep work') || name.includes('focus') || name.includes('sprint') || name.includes('meeting') || name.includes('priority') || name.includes('project')) return 'work';
  if (name.includes('family') || name.includes('partner') || name.includes('connection')) return 'family';
  if (name.includes('sleep') || name.includes('wake') || name.includes('journal') || name.includes('rest') || name.includes('meditat') || name.includes('lights out')) return 'rest';
  return 'ops';
}

export function getCurrentTimeBlock(targetDate = new Date()) {
  const now = targetDate instanceof Date ? targetDate : new Date(targetDate);
  const mins = now.getHours() * 60 + now.getMinutes();
  if (mins < 8 * 60 + 30) return 'morning';
  if (mins < 18 * 60) return 'work';
  return 'evening';
}

export function useHabitsState() {
  const habits = ref([]);
  const completedCount = computed(() => habits.value.length);
  return { habits, completedCount, genericStarterHabits };
}
