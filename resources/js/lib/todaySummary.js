export function buildTodaySummary(input) {
  const due = Number(input.habitsDue) || 0;
  const kept = Number(input.habitsKept) || 0;
  const streak = Number(input.streakDays) || 0;
  const reminder = String(input.nextReminderLabel || '').trim();
  const partnerState = input.partnerState || 'none';
  return {
    hero: due === 0 ? 'Nothing scheduled today' : `${kept} of ${due} kept today`,
    streak: streak === 0 ? 'No streak yet' : `${streak} day streak`,
    reminder: reminder === '' ? 'No reminder yet' : reminder,
    partner: partnerState === 'accepted_kept'
      ? 'Kept'
      : partnerState === 'accepted_not_yet'
        ? 'Not yet'
        : 'No partner yet',
    showAddHabit: due === 0,
  };
}

function dayNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function habitDueOnDate(habit, date) {
  if (!habit || habit.archived) return false;
  const dow = date.getDay();
  const listed = (values) => Array.isArray(values) && values.some((value) => Number(value) === dow || (dow === 0 && Number(value) === 7));
  if (Array.isArray(habit.daysOfWeek) && habit.daysOfWeek.length > 0) return listed(habit.daysOfWeek);
  if (habit.scheduleType === 'weekdays') return dow >= 1 && dow <= 5;
  if (habit.scheduleType === 'weekends') return dow === 0 || dow === 6;
  if (habit.scheduleType === 'custom' && Array.isArray(habit.customDays)) return listed(habit.customDays);
  return true;
}

function completedOnDay(habit, day) {
  return Array.isArray(habit?.completed_days) && habit.completed_days.some((value) => dayNumber(value) === day);
}

function clockLabel(habit) {
  if (habit?.startTime) return String(habit.startTime);
  const match = String(habit?.name || '').match(/\b(\d{1,2}:\d{2})\b/);
  return match ? match[1] : '';
}

function nextReminderLabel(habits, now) {
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const slots = habits.map((habit) => {
    const label = clockLabel(habit);
    const match = label.match(/(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return { label, minutes: Number(match[1]) * 60 + Number(match[2]) };
  }).filter(Boolean).sort((a, b) => a.minutes - b.minutes);
  const upcoming = slots.find((slot) => slot.minutes >= minutesNow) || slots[0];
  return upcoming ? upcoming.label : '';
}

export function summarizeDashboardState(state, date = new Date(), partnerState = 'none') {
  const habits = Array.isArray(state?.habits) ? state.habits : [];
  const day = date.getDate();
  const due = habits.filter((habit) => habitDueOnDate(habit, date));
  const kept = due.filter((habit) => completedOnDay(habit, day));
  let streak = 0;
  for (let cursor = kept.length > 0 ? day : day - 1; cursor >= 1; cursor -= 1) {
    const cursorDate = new Date(date.getFullYear(), date.getMonth(), cursor);
    const keptThatDay = habits.some((habit) => habitDueOnDate(habit, cursorDate) && completedOnDay(habit, cursor));
    if (!keptThatDay) break;
    streak += 1;
  }
  return buildTodaySummary({
    habitsDue: due.length,
    habitsKept: kept.length,
    streakDays: streak,
    nextReminderLabel: nextReminderLabel(due.filter((habit) => !completedOnDay(habit, day)), date),
    partnerState,
  });
}

function partnerStateFromStorage(storage) {
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !key.startsWith('habuilt_partner_connection_')) continue;
    try {
      const row = JSON.parse(storage.getItem(key) || 'null');
      const status = String(row?.status || '').toLowerCase();
      if (status === 'connected' || status === 'accepted' || status === 'active') return 'accepted_not_yet';
    } catch {
      /* a damaged partner row stays unread */
    }
  }
  return 'none';
}

function readDashboardState(storage, date) {
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  let current = null;
  let currentStamp = '';
  let newest = null;
  let newestStamp = '';
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !key.startsWith('habuilt.dashboard.')) continue;
    let parsed = null;
    try { parsed = JSON.parse(storage.getItem(key) || 'null'); } catch { parsed = null; }
    if (!parsed || typeof parsed !== 'object') continue;
    const stamp = String(parsed.updated_at || '');
    if (key.endsWith(`.${month}`) && stamp >= currentStamp) {
      current = parsed;
      currentStamp = stamp;
    }
    if (stamp >= newestStamp) {
      newest = parsed;
      newestStamp = stamp;
    }
  }
  return current || newest;
}

export function readStoredTodaySummary(storage, date = new Date()) {
  const empty = buildTodaySummary({
    habitsDue: 0,
    habitsKept: 0,
    streakDays: 0,
    nextReminderLabel: '',
    partnerState: 'none',
  });
  if (!storage || typeof storage.key !== 'function') return empty;
  try {
    return summarizeDashboardState(readDashboardState(storage, date) || {}, date, partnerStateFromStorage(storage));
  } catch {
    return empty;
  }
}
