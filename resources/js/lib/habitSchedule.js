/**
 * One schedule rule for the checklist and the weekly review.
 * Fields match the habit definition: schedule, scheduleType, daysOfWeek, days, customDays.
 * Sunday is 0. A custom list may use 7 for Sunday.
 */

export function isHabitScheduledOnDate(habit, date) {
  if (!habit || !(date instanceof Date) || Number.isNaN(date.getTime())) return true;
  const dow = date.getDay();
  const scheduleType = habit.scheduleType || habit.schedule || null;
  const daysOfWeek = Array.isArray(habit.daysOfWeek) && habit.daysOfWeek.length > 0
    ? habit.daysOfWeek.map(Number)
    : null;
  const customDays = Array.isArray(habit.customDays) && habit.customDays.length > 0
    ? habit.customDays.map(Number)
    : (scheduleType === 'custom' && Array.isArray(habit.days) ? habit.days.map(Number) : null);
  const days = Array.isArray(habit.days) && habit.days.length > 0 ? habit.days.map(Number) : null;

  if (daysOfWeek) return daysOfWeek.includes(dow);
  if (scheduleType === 'weekdays') return dow >= 1 && dow <= 5;
  if (scheduleType === 'weekends') return dow === 0 || dow === 6;
  if (scheduleType === 'custom' && customDays) {
    const customDow = dow === 0 ? 7 : dow;
    return customDays.includes(customDow) || customDays.includes(dow);
  }
  if (!habit.scheduleType && !habit.daysOfWeek && days) {
    return days.includes(dow);
  }
  return true;
}

export function isHabitScheduledForDayNumber(habit, dayNum, year, month) {
  const day = Number(dayNum);
  const y = Number(year);
  const m = Number(month);
  if (!day || !y || !m) return true;
  return isHabitScheduledOnDate(habit, new Date(y, m - 1, day));
}
