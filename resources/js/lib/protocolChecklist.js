/**
 * Activating a starter list writes the daily checklist through custom_habits.
 * The protocol row is not a second copy of that list.
 */

export const CHECKLIST_REPLACE_COPY = 'The current checklist will be replaced.';

export function protocolActivateBody(protocolId, userId) {
  return {
    user_id: userId,
    id: protocolId,
    is_active: true,
  };
}

export function starterListReplacesChecklist(currentHabits, nextHabits) {
  const next = (Array.isArray(nextHabits) ? nextHabits : [])
    .filter((habit) => habit && habit.id != null && habit.id !== '');
  if (next.length === 0) return false;
  const currentKey = (Array.isArray(currentHabits) ? currentHabits : [])
    .map((habit) => (habit && habit.id != null ? String(habit.id) : ''))
    .filter(Boolean)
    .join('\n');
  const nextKey = next.map((habit) => String(habit.id)).join('\n');
  return currentKey !== nextKey;
}
