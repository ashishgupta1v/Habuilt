/**
 * Guest import, reminder copy, partner accept, and account export decisions.
 * Habit names, review text, and tokens stay out of the log lines.
 */

import { listIsSaved, settingsColumns } from './savedHabitList.js';

export const GUEST_DASHBOARD_PREFIX = 'habuilt.dashboard.guest.';
export const ACCOUNT_EXPORT_PATH = '/api/account-export';

export function droppedGuestImportMessage() {
  return 'Dropped guest import because updated_at moved';
}

export function decideGuestImport({ listSaved, habits }) {
  if (listSaved === true) return 'skip';
  if (!Array.isArray(habits) || habits.length === 0) return 'skip';
  return 'import';
}

export function shouldClearGuestBlob(result) {
  return Boolean(result && result.success === true && result.imported === true && result.conflict !== true);
}

export function keptDaysFromGuestHabits(habits, monthKey) {
  if (!/^\d{4}-\d{2}$/.test(String(monthKey || ''))) return [];
  const days = [];
  const seen = new Set();
  for (const habit of Array.isArray(habits) ? habits : []) {
    if (!habit || habit.id == null || habit.id === '') continue;
    const completed = Array.isArray(habit.completed_days) ? habit.completed_days : [];
    for (const value of completed) {
      const day = Number(value);
      if (!Number.isInteger(day) || day < 1 || day > 31) continue;
      const habitId = String(habit.id);
      const key = `${habitId}|${monthKey}|${day}`;
      if (seen.has(key)) continue;
      seen.add(key);
      days.push({
        habit_id: habitId,
        month_key: monthKey,
        day,
        completed_on: `${monthKey}-${String(day).padStart(2, '0')}`,
      });
    }
  }
  return days;
}

export function readGuestBlob(storage) {
  const empty = { habits: [], review: {}, keptDays: [], keys: [] };
  if (!storage || typeof storage.key !== 'function') return empty;
  const rows = [];
  const keys = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !key.startsWith(GUEST_DASHBOARD_PREFIX)) continue;
    const monthKey = key.slice(GUEST_DASHBOARD_PREFIX.length);
    if (!/^\d{4}-\d{2}$/.test(monthKey)) continue;
    keys.push(key);
    let parsed = null;
    try {
      parsed = JSON.parse(storage.getItem(key) || 'null');
    } catch {
      parsed = null;
    }
    if (!parsed || typeof parsed !== 'object') continue;
    rows.push({ monthKey, parsed });
  }
  rows.sort((left, right) => left.monthKey.localeCompare(right.monthKey));
  const byId = new Map();
  const keptDays = [];
  let review = {};
  for (const row of rows) {
    const habits = Array.isArray(row.parsed.habits) ? row.parsed.habits : [];
    for (const habit of habits) {
      if (!habit || habit.id == null || habit.id === '') continue;
      byId.set(String(habit.id), habit);
    }
    keptDays.push(...keptDaysFromGuestHabits(habits, row.monthKey));
    if (row.parsed.weeklyReview && typeof row.parsed.weeklyReview === 'object' && !Array.isArray(row.parsed.weeklyReview)) {
      review = row.parsed.weeklyReview;
    }
  }
  return {
    habits: Array.from(byId.values()),
    review,
    keptDays,
    keys,
  };
}

export function guestImportBody(habits, review, expectedUpdatedAt, keptDays) {
  const body = settingsColumns(habits, review, expectedUpdatedAt);
  body.kept_days = (Array.isArray(keptDays) ? keptDays : []).map((day) => ({
    habit_id: String(day.habit_id),
    month_key: String(day.month_key),
    day: Number(day.day),
    completed_on: String(day.completed_on || ''),
  }));
  return body;
}

export function clearGuestBlob(storage, keys) {
  if (!storage || typeof storage.removeItem !== 'function') return;
  for (const key of Array.isArray(keys) ? keys : []) {
    try {
      storage.removeItem(key);
    } catch {
      /* a blocked write leaves the blob in place */
    }
  }
}

export async function runGuestImport({ storage, loadSettings, postImport }) {
  const blob = readGuestBlob(storage);
  if (decideGuestImport({ listSaved: false, habits: blob.habits }) === 'skip') {
    return { action: 'skip', cleared: false };
  }
  let settings;
  try {
    settings = await loadSettings();
  } catch {
    console.warn(droppedGuestImportMessage());
    return { action: 'import', cleared: false };
  }
  if (!settings || settings.error || settings.offline) {
    console.warn(droppedGuestImportMessage());
    return { action: 'import', cleared: false };
  }
  if (decideGuestImport({ listSaved: listIsSaved(settings.weekly_reviews), habits: blob.habits }) === 'skip') {
    return { action: 'skip', cleared: false };
  }
  const body = guestImportBody(blob.habits, blob.review, settings.updated_at ?? null, blob.keptDays);
  let result;
  try {
    result = await postImport(body);
  } catch {
    console.warn(droppedGuestImportMessage());
    return { action: 'import', cleared: false };
  }
  if (!shouldClearGuestBlob(result)) {
    console.warn(result?.conflict ? droppedGuestImportMessage() : 'Dropped guest import');
    return { action: 'import', cleared: false };
  }
  clearGuestBlob(storage, blob.keys);
  return { action: 'import', cleared: true };
}

export function reminderScheduleAt(startClock, day) {
  const match = String(startClock || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match || !(day instanceof Date) || Number.isNaN(day.getTime())) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes, 0, 0);
  return { at, triggerTimestamp: at.getTime() };
}

export function reminderControlCopy({ permission, nextLabel }) {
  if (permission === 'denied') return 'Notifications are off';
  const label = String(nextLabel || '').trim();
  return label || 'No reminder yet';
}

export function partnerConnectionFromAccept({ isGuest, response }) {
  if (isGuest) {
    return { connected: false, message: 'An account is required.' };
  }
  const connection = response && response.connection;
  if (response && response.success === true && connection && connection.status === 'connected') {
    return {
      connected: true,
      connection: { ...connection, confirmed: true },
    };
  }
  const message = response && typeof response.error === 'string' && response.error
    ? response.error
    : 'Could not connect.';
  return { connected: false, message };
}

export function partnerAcceptPayload(inviteCode, alias = '') {
  return {
    invite_code: String(inviteCode || '').trim().toUpperCase(),
    alias: String(alias || ''),
  };
}

export function accountMenuAction(name) {
  if (name === 'export') {
    return { opensProtocolSettings: false, path: ACCOUNT_EXPORT_PATH };
  }
  if (name === 'protocol-settings') {
    return { opensProtocolSettings: true, path: null };
  }
  return { opensProtocolSettings: false, path: null };
}
