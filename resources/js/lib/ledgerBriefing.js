/**
 * Default briefing from the signed-in person's loaded check-ins.
 * It names a missed or next habit and the week's completion count.
 */

function minutes(value) {
  const match = String(value || '').match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return (Number(match[1]) * 60) + Number(match[2]);
}

function habitLabel(habit) {
  const name = String(habit?.name || 'Habit').replace(/^\d{1,2}:\d{2}\s*/, '').trim();
  return name || 'Habit';
}

export function buildLedgerBriefing({
  habits = [],
  isCompleted = () => false,
  scheduleFor = () => null,
  currentDay = 1,
  now = new Date(),
  weekCompletedCount = 0,
}) {
  const clock = now instanceof Date ? now : new Date(now);
  const nowMinutes = (clock.getHours() * 60) + clock.getMinutes();
  const open = (habits || []).filter((habit) => habit && !isCompleted(habit, currentDay));

  let missed = null;
  let next = null;
  for (const habit of open) {
    const start = minutes(scheduleFor(habit)?.start || habit.startTime);
    if (start === null) {
      if (!next) next = habit;
      continue;
    }
    if (start <= nowMinutes) {
      if (!missed || start < minutes(scheduleFor(missed)?.start || missed.startTime)) missed = habit;
    } else if (!next || start < minutes(scheduleFor(next)?.start || next.startTime)) {
      next = habit;
    }
  }

  const count = Math.max(0, Number(weekCompletedCount) || 0);
  const week = `This week: ${count} completed.`;
  let headline = 'Today is clear';
  if (missed) headline = `Missed today: ${habitLabel(missed)}`;
  else if (next) {
    const start = scheduleFor(next)?.start || next.startTime || '';
    const time = String(start).match(/\d{1,2}:\d{2}/)?.[0] || '';
    headline = time ? `Next: ${habitLabel(next)} at ${time}` : `Next: ${habitLabel(next)}`;
  }

  const text = `${headline}. ${week}`;
  return {
    headline,
    directive: text,
    fullSpeechText: text,
    source: 'ledger',
    focusName: missed ? habitLabel(missed) : (next ? habitLabel(next) : ''),
    focusKind: missed ? 'missed' : (next ? 'next' : ''),
    weekCompletedCount: count,
  };
}
