/**
 * Weekly review counts from loaded check-ins.
 * A miss counts only on a day that habit is scheduled. Days after `today` are not missed.
 * An archived habit leaves the denominator. Its check-ins stay on the habit.
 */

import { isHabitScheduledOnDate } from './habitSchedule.js';

function parseDay(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function dayKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function mondayOf(date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = copy.getDay();
  const distance = weekday === 0 ? 6 : weekday - 1;
  copy.setDate(copy.getDate() - distance);
  return copy;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function weekReviewTitle(weekStart, weekEnd) {
  const start = parseDay(weekStart);
  const end = parseDay(weekEnd);
  if (!start || !end) return 'This week';
  if (dayKey(start) === dayKey(end)) return `Week of ${start.getDate()} ${MONTHS[start.getMonth()]}`;
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `Week of ${start.getDate()}-${end.getDate()} ${MONTHS[start.getMonth()]}`;
  }
  return `Week of ${start.getDate()} ${MONTHS[start.getMonth()]}-${end.getDate()} ${MONTHS[end.getMonth()]}`;
}

function habitEntries(habits, habitIds) {
  const source = Array.isArray(habits) ? habits : (habitIds || []).map((id) => ({ id }));
  const entries = [];
  for (const habit of source) {
    if (habit == null) continue;
    if (typeof habit === 'string' || typeof habit === 'number') {
      const id = String(habit).trim();
      if (!id) continue;
      entries.push({ id, archived: false, definition: { id } });
      continue;
    }
    const id = String(habit.id || habit.habit_id || '').trim();
    if (!id) continue;
    entries.push({
      id,
      archived: habit.archived === true,
      definition: habit,
    });
  }
  return entries;
}

export function summarizeSundayReview({ checkIns = [], habitIds = [], habits = null, today }) {
  const todayDate = parseDay(today) || new Date();
  const todayText = dayKey(todayDate);
  const weekStart = mondayOf(todayDate);
  const dates = [];
  for (let cursor = new Date(weekStart); cursor <= todayDate; cursor.setDate(cursor.getDate() + 1)) {
    dates.push(dayKey(cursor));
  }

  const entries = habitEntries(habits, habitIds);
  const active = new Map();
  const paused = new Set();
  for (const entry of entries) {
    if (entry.archived) {
      paused.add(entry.id);
      continue;
    }
    active.set(entry.id, entry.definition);
  }

  const done = new Set();
  const daysWithCheckIn = new Set();
  for (const row of checkIns) {
    const date = String(row?.completed_on || row?.completedOn || '').slice(0, 10);
    const habitId = String(row?.habit_id || row?.habitId || '').trim();
    if (!date || !habitId || paused.has(habitId)) continue;
    daysWithCheckIn.add(date);
    if (date >= dates[0] && date <= todayText) done.add(`${habitId}|${date}`);
  }

  let completed = 0;
  let missed = 0;
  if (active.size === 0) {
    completed = done.size;
  } else {
    for (const date of dates) {
      const dateObject = parseDay(date);
      for (const [habitId, definition] of active) {
        if (!isHabitScheduledOnDate(definition, dateObject)) continue;
        if (done.has(`${habitId}|${date}`)) completed += 1;
        else missed += 1;
      }
    }
    for (const key of done) {
      if (!active.has(key.split('|')[0])) completed += 1;
    }
  }

  let streak = 0;
  const cursor = new Date(todayDate);
  if (!daysWithCheckIn.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (daysWithCheckIn.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
    if (streak > 3660) break;
  }

  const title = weekReviewTitle(dates[0], todayText);
  return {
    title,
    week_start: dates[0],
    week_end: todayText,
    completed_slots: completed,
    missed_slots: missed,
    streak,
    share_text: `${title}\nCompleted: ${completed}\nMissed: ${missed}\nStreak: ${streak} days`,
  };
}

export function checkInsFromHabits(habits, year, month) {
  const rows = [];
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  for (const habit of habits || []) {
    const habitId = String(habit?.id || '');
    if (!habitId) continue;
    for (const day of habit.completed_days || []) {
      const dayNumber = Number(day);
      if (!dayNumber) continue;
      rows.push({
        habit_id: habitId,
        completed_on: `${monthKey}-${String(dayNumber).padStart(2, '0')}`,
      });
    }
  }
  return rows;
}
