import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTodaySummary, summarizeDashboardState } from '../../resources/js/lib/todaySummary.js';

test('a new guest sees empty copy and an add action', () => {
  const summary = buildTodaySummary({
    habitsDue: 0,
    habitsKept: 0,
    streakDays: 0,
    nextReminderLabel: '',
    partnerState: 'none',
  });
  assert.equal(summary.hero, 'Nothing scheduled today');
  assert.equal(summary.streak, 'No streak yet');
  assert.equal(summary.reminder, 'No reminder yet');
  assert.equal(summary.partner, 'No partner yet');
  assert.equal(summary.showAddHabit, true);
});

test('pending partner is not kept', () => {
  const summary = buildTodaySummary({
    habitsDue: 2,
    habitsKept: 1,
    streakDays: 3,
    nextReminderLabel: '7:00',
    partnerState: 'pending',
  });
  assert.equal(summary.hero, '1 of 2 kept today');
  assert.equal(summary.partner, 'No partner yet');
});

test('accepted partner reports kept or not yet', () => {
  assert.equal(buildTodaySummary({
    habitsDue: 1, habitsKept: 1, streakDays: 2, nextReminderLabel: '7:00', partnerState: 'accepted_kept',
  }).partner, 'Kept');
  assert.equal(buildTodaySummary({
    habitsDue: 1, habitsKept: 0, streakDays: 2, nextReminderLabel: '7:00', partnerState: 'accepted_not_yet',
  }).partner, 'Not yet');
});

test('a stored monday list drives the phone summary', () => {
  const now = new Date(2026, 10, 9, 8, 0, 0);
  const summary = summarizeDashboardState({
    habits: [
      { id: 'water', name: '07:30 Water', completed_days: [9], daysOfWeek: [1] },
      { id: 'walk', name: '18:00 Walk', completed_days: [], daysOfWeek: [1] },
      { id: 'weekend', name: 'Weekend reset', scheduleType: 'weekends', completed_days: [] },
    ],
  }, now, 'none');
  assert.equal(summary.hero, '1 of 2 kept today');
  assert.equal(summary.reminder, '18:00');
  assert.equal(summary.showAddHabit, false);
});

test('a day with no due habits stays empty', () => {
  const now = new Date(2026, 10, 9, 8, 0, 0);
  const summary = summarizeDashboardState({
    habits: [{ id: 'weekend', name: 'Weekend reset', scheduleType: 'weekends', completed_days: [] }],
  }, now, 'accepted_kept');
  assert.equal(summary.hero, 'Nothing scheduled today');
  assert.equal(summary.showAddHabit, true);
  assert.equal(summary.partner, 'Kept');
});
