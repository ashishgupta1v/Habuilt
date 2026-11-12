/**
 * Maps the checklist a person edits into the two user_settings columns.
 * Kept days stay on habit_check_ins. Couple review fields stay on this phone.
 */

const HABIT_FIELDS = [
  'id',
  'name',
  'points',
  'category',
  'hint',
  'time',
  'timeSlot',
  'startTime',
  'endTime',
  'isTimed',
  'schedule',
  'scheduleType',
  'days',
  'daysOfWeek',
  'customDays',
  'archived',
];

export function habitDefinition(habit) {
  if (!habit || typeof habit !== 'object' || habit.id == null || habit.id === '') return null;

  const definition = { id: habit.id };
  for (const key of HABIT_FIELDS) {
    if (key === 'id' || habit[key] === undefined) continue;
    definition[key] = habit[key];
  }
  if (definition.name == null) definition.name = '';
  const points = Number(habit.points);
  definition.points = Number.isFinite(points) ? points : 1;
  if (definition.time == null) {
    if (habit.startTime) definition.time = habit.startTime;
    else if (habit.timeSlot) definition.time = habit.timeSlot;
  }
  if (definition.schedule == null && habit.scheduleType != null) {
    definition.schedule = habit.scheduleType;
  }
  if (definition.days == null) {
    if (Array.isArray(habit.daysOfWeek)) definition.days = habit.daysOfWeek;
    else if (Array.isArray(habit.customDays)) definition.days = habit.customDays;
  }
  return definition;
}

export function habitsFromDefinitions(habits) {
  if (!Array.isArray(habits)) return [];
  return habits.map((habit) => {
    const definition = habitDefinition(habit);
    if (!definition) return null;
    return { ...definition, completed_days: [] };
  }).filter(Boolean);
}

export function personalReview(review) {
  const source = review && typeof review === 'object' ? review : {};
  const reflections = source.reflections && typeof source.reflections === 'object' && !Array.isArray(source.reflections)
    ? { ...source.reflections }
    : {};
  return {
    reviewDate: typeof source.reviewDate === 'string' ? source.reviewDate : '',
    checks: Array.isArray(source.checks) ? source.checks.map((check) => ({ ...check })) : [],
    reflections,
    listSaved: true,
  };
}

export function settingsColumns(habits, review, expectedUpdatedAt) {
  return {
    custom_habits: (Array.isArray(habits) ? habits : []).map(habitDefinition).filter(Boolean),
    weekly_reviews: personalReview(review),
    expected_updated_at: expectedUpdatedAt ?? null,
  };
}

export function listIsSaved(weeklyReviews) {
  return Boolean(
    weeklyReviews
    && typeof weeklyReviews === 'object'
    && !Array.isArray(weeklyReviews)
    && weeklyReviews.listSaved === true,
  );
}

export function unmarkedEmptyList(customHabits, weeklyReviews) {
  const habits = Array.isArray(customHabits) ? customHabits : [];
  return habits.length === 0 && !listIsSaved(weeklyReviews);
}

export function applyPersonalReview(current, saved) {
  const base = current && typeof current === 'object' ? { ...current } : {};
  if (!listIsSaved(saved)) return base;
  const reflections = {
    ...(base.reflections || {}),
    ...(saved.reflections && typeof saved.reflections === 'object' && !Array.isArray(saved.reflections)
      ? saved.reflections
      : {}),
  };
  return {
    ...base,
    reviewDate: typeof saved.reviewDate === 'string' ? saved.reviewDate : (base.reviewDate || ''),
    checks: Array.isArray(saved.checks) ? saved.checks : (base.checks || []),
    reflections,
    listSaved: true,
  };
}

export function overlayCheckIns(habits, rows) {
  const byId = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row || row.habit_id == null) continue;
    const day = Number(row.day);
    if (!Number.isFinite(day)) continue;
    const id = String(row.habit_id);
    if (!byId.has(id)) byId.set(id, new Set());
    byId.get(id).add(day);
  }
  return (Array.isArray(habits) ? habits : []).map((habit) => {
    const days = byId.get(String(habit?.id));
    return {
      ...habit,
      completed_days: days ? Array.from(days).sort((left, right) => left - right) : [],
    };
  });
}

export function sameUpdatedAt(left, right) {
  return normalizeUpdatedAt(left) === normalizeUpdatedAt(right);
}

function normalizeUpdatedAt(value) {
  if (value == null) return '';
  const text = String(value).trim();
  if (text === '' || text.toLowerCase() === 'null') return '';
  return text;
}

export function retryShouldDrop(record, readUpdatedAt) {
  if (!record?.pending || record.sawRevision !== true) return false;
  return !sameUpdatedAt(record.expectedUpdatedAt ?? null, readUpdatedAt ?? null);
}

export function dayTotalFromStoredPoints(rows, monthKey, day) {
  let total = 0;
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row) continue;
    const rowMonth = String(row.month_key || row.monthKey || '');
    if (monthKey && rowMonth && rowMonth !== String(monthKey)) continue;
    if (Number(row.day) !== Number(day)) continue;
    const points = Number(row.points);
    total += Number.isFinite(points) ? points : 0;
  }
  return total;
}

export function decideSyncAction({
  openedWithoutLocalList,
  localListSaved,
  serverReview,
  retryRecord,
  readUpdatedAt,
  guestBlobWaiting = false,
}) {
  const serverSaved = listIsSaved(serverReview);
  if (retryRecord?.pending && retryShouldDrop(retryRecord, readUpdatedAt)) {
    return 'drop-and-load';
  }
  if (openedWithoutLocalList) {
    if (serverSaved) return 'load-server';
    if (guestBlobWaiting) return 'wait-guest';
    return 'save-preset';
  }
  if (retryRecord?.pending) return 'save-local';
  if (!localListSaved) {
    return serverSaved ? 'load-server' : 'save-local';
  }
  if (!serverSaved) return 'save-local';
  return 'keep-local';
}

export function droppedRetryMessage() {
  return 'Dropped settings retry because updated_at moved';
}
