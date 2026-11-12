import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeSundayReview } from '../../resources/js/lib/sundayReview.js';

test('sunday summary counts real check-ins and leaves future days out', () => {
  const summary = summarizeSundayReview({
    today: '2026-11-04',
    habitIds: ['a', 'b'],
    checkIns: [
      { habit_id: 'a', completed_on: '2026-11-01' },
      { habit_id: 'a', completed_on: '2026-11-02' },
      { habit_id: 'a', completed_on: '2026-11-03' },
      { habit_id: 'b', completed_on: '2026-11-04' },
    ],
  });

  assert.equal(summary.completed_slots, 3);
  assert.equal(summary.missed_slots, 3);
  assert.equal(summary.streak, 4);
  assert.equal(summary.title, 'Week of 2-4 Nov');
  assert.equal(summary.share_text, 'Week of 2-4 Nov\nCompleted: 3\nMissed: 3\nStreak: 4 days');
});

test('a miss counts only on a scheduled day and an archived habit leaves the week', () => {
  const summary = summarizeSundayReview({
    today: '2026-11-07',
    habits: [
      { id: 'weekday', name: 'Desk', schedule: 'weekdays' },
      { id: 'paused', name: 'Old stretch', schedule: 'weekdays', archived: true },
    ],
    checkIns: [
      { habit_id: 'weekday', completed_on: '2026-11-07' },
      { habit_id: 'paused', completed_on: '2026-11-02' },
    ],
  });
  assert.equal(summary.missed_slots, 5);
  assert.equal(summary.completed_slots, 0);
  assert.equal(summary.title, 'Week of 2-7 Nov');
  assert.equal(summary.share_text.includes('Desk'), false);
  assert.equal(summary.share_text.includes('Old stretch'), false);
});

test('without a schedule, missed slots are not invented', () => {
  const summary = summarizeSundayReview({
    today: '2026-11-04',
    habitIds: [],
    checkIns: [
      { habit_id: 'a', completed_on: '2026-11-03' },
      { habit_id: 'a', completed_on: '2026-11-03' },
    ],
  });
  assert.equal(summary.completed_slots, 1);
  assert.equal(summary.missed_slots, 0);
  assert.equal(summary.streak, 1);
});
