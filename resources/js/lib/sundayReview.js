/**
 * Sunday review counts from loaded check-ins.
 * A slot counts as completed only when that habit was checked in on that day.
 * Days after `today` are not treated as missed.
 */

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

export function summarizeSundayReview({ checkIns = [], habitIds = [], today }) {
  const todayDate = parseDay(today) || new Date();
  const todayText = dayKey(todayDate);
  const weekStart = mondayOf(todayDate);
  const dates = [];
  for (let cursor = new Date(weekStart); cursor <= todayDate; cursor.setDate(cursor.getDate() + 1)) {
    dates.push(dayKey(cursor));
  }

  const done = new Set();
  const daysWithCheckIn = new Set();
  for (const row of checkIns) {
    const date = String(row?.completed_on || row?.completedOn || '').slice(0, 10);
    const habitId = String(row?.habit_id || row?.habitId || '').trim();
    if (!date || !habitId) continue;
    daysWithCheckIn.add(date);
    if (date >= dates[0] && date <= todayText) done.add(`${habitId}|${date}`);
  }

  const ids = [...new Set(habitIds.map((id) => String(id || '').trim()).filter(Boolean))];
  let completed = 0;
  let missed = 0;
  if (ids.length === 0) {
    completed = done.size;
  } else {
    const known = new Set(ids);
    for (const date of dates) {
      for (const habitId of ids) {
        if (done.has(`${habitId}|${date}`)) completed += 1;
        else missed += 1;
      }
    }
    for (const key of done) {
      if (!known.has(key.split('|')[0])) completed += 1;
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

  return {
    week_start: dates[0],
    week_end: todayText,
    completed_slots: completed,
    missed_slots: missed,
    streak,
    share_text: `Sunday review\nCompleted: ${completed}\nMissed: ${missed}\nStreak: ${streak} days`,
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
