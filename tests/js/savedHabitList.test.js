import test from 'node:test';
import assert from 'node:assert/strict';
import {
  decideSyncAction,
  droppedRetryMessage,
  listIsSaved,
  personalReview,
  retryShouldDrop,
  settingsColumns,
  unmarkedEmptyList,
} from '../../resources/js/lib/savedHabitList.js';

test('settings post keeps the habit definition and drops kept days', () => {
  const body = settingsColumns(
    [{
      id: 'f-1',
      name: '05:40 Mobility',
      points: 4,
      category: 'fitness',
      hint: 'Easy pace',
      timeSlot: 'morning',
      startTime: '05:40',
      scheduleType: 'weekdays',
      daysOfWeek: [1, 2, 3, 4, 5],
      completed_days: [1, 2, 3],
      completedDays: [1],
    }, {
      id: 'c-11',
      name: 'Custom walk',
      points: 2,
      category: 'fitness',
      hint: '',
      completed_days: [4],
    }],
    {
      reviewDate: 'Nov 8, 2026',
      checks: [{ text: 'I reviewed missed days and found one clear trigger.', done: true }],
      reflections: { wins: 'Kept the morning', misses: '' },
      coupleChecks: [{ text: 'Shared anchor', done: true }],
      coupleReflections: { wins: 'Do not store', friction: '', commitments: '' },
      metrics: { weeklyPoints: 12 },
    },
    '2026-11-01 00:00:00',
  );

  assert.deepEqual(Object.keys(body), ['custom_habits', 'weekly_reviews', 'expected_updated_at']);
  assert.equal(body.expected_updated_at, '2026-11-01 00:00:00');
  assert.equal(body.custom_habits[0].id, 'f-1');
  assert.equal(body.custom_habits[0].name, '05:40 Mobility');
  assert.equal(body.custom_habits[0].points, 4);
  assert.equal(body.custom_habits[0].time, '05:40');
  assert.equal(body.custom_habits[0].schedule, 'weekdays');
  assert.deepEqual(body.custom_habits[0].days, [1, 2, 3, 4, 5]);
  assert.equal(body.custom_habits[1].id, 'c-11');
  assert.equal('completed_days' in body.custom_habits[0], false);
  assert.equal('completedDays' in body.custom_habits[0], false);
  assert.equal('completed_days' in body.custom_habits[1], false);

  assert.equal(body.weekly_reviews.listSaved, true);
  assert.equal(body.weekly_reviews.reviewDate, 'Nov 8, 2026');
  assert.equal(body.weekly_reviews.checks[0].done, true);
  assert.equal(body.weekly_reviews.reflections.wins, 'Kept the morning');
  assert.equal('coupleChecks' in body.weekly_reviews, false);
  assert.equal('coupleReflections' in body.weekly_reviews, false);
  assert.equal('metrics' in body.weekly_reviews, false);
  assert.equal(JSON.stringify(body).includes('Do not store'), false);
  assert.equal(JSON.stringify(body).includes('Shared anchor'), false);
});

test('personal review always carries the saved marker and no couple fields', () => {
  const review = personalReview({
    reviewDate: '',
    checks: [],
    reflections: { wins: '' },
    coupleChecks: [{ text: 'hidden', done: false }],
    coupleReflections: { wins: 'hidden' },
  });
  assert.equal(review.listSaved, true);
  assert.equal('coupleChecks' in review, false);
  assert.equal('coupleReflections' in review, false);
});

test('an unmarked empty array is not a deliberate empty list', () => {
  assert.equal(unmarkedEmptyList([], {}), true);
  assert.equal(unmarkedEmptyList(null, null), true);
  assert.equal(listIsSaved({}), false);
  assert.equal(unmarkedEmptyList([], { reviewDate: '', checks: [], reflections: {}, listSaved: true }), false);
  assert.equal(unmarkedEmptyList([{ id: 'f-1', name: 'Wake', points: 1 }], { listSaved: true }), false);
});

test('a retry is dropped only after the remembered revision moves', () => {
  assert.equal(retryShouldDrop({ pending: true, sawRevision: false, expectedUpdatedAt: null }, '2026-11-02 00:00:00'), false);
  assert.equal(retryShouldDrop({ pending: true, sawRevision: true, expectedUpdatedAt: '2026-11-01 00:00:00' }, '2026-11-01 00:00:00'), false);
  assert.equal(retryShouldDrop({ pending: true, sawRevision: true, expectedUpdatedAt: '2026-11-01 00:00:00' }, '2026-11-02 00:00:00'), true);
  assert.equal(droppedRetryMessage(), 'Dropped settings retry because updated_at moved');
  assert.equal(droppedRetryMessage().includes('Mobility'), false);
});

test('a phone with no local list loads a marked server list and otherwise saves the preset', () => {
  assert.equal(decideSyncAction({
    openedWithoutLocalList: true,
    localListSaved: false,
    serverReview: { listSaved: true },
    retryRecord: null,
    readUpdatedAt: '2026-11-01 00:00:00',
  }), 'load-server');
  assert.equal(decideSyncAction({
    openedWithoutLocalList: true,
    localListSaved: false,
    serverReview: {},
    retryRecord: null,
    readUpdatedAt: '2026-11-01 00:00:00',
  }), 'save-preset');
  assert.equal(decideSyncAction({
    openedWithoutLocalList: false,
    localListSaved: true,
    serverReview: { listSaved: true },
    retryRecord: { pending: true, sawRevision: true, expectedUpdatedAt: '2026-11-01 00:00:00' },
    readUpdatedAt: '2026-11-03 00:00:00',
  }), 'drop-and-load');
  assert.equal(decideSyncAction({
    openedWithoutLocalList: true,
    localListSaved: false,
    serverReview: {},
    retryRecord: { pending: true, sawRevision: true, expectedUpdatedAt: '2026-11-01 00:00:00' },
    readUpdatedAt: '2026-11-03 00:00:00',
  }), 'drop-and-load');
  assert.equal(decideSyncAction({
    openedWithoutLocalList: false,
    localListSaved: false,
    serverReview: {},
    retryRecord: null,
    readUpdatedAt: '2026-11-01 00:00:00',
  }), 'save-local');
  assert.equal(decideSyncAction({
    openedWithoutLocalList: false,
    localListSaved: false,
    serverReview: { listSaved: true },
    retryRecord: null,
    readUpdatedAt: '2026-11-01 00:00:00',
  }), 'load-server');
  assert.equal(decideSyncAction({
    openedWithoutLocalList: false,
    localListSaved: true,
    serverReview: { listSaved: true },
    retryRecord: null,
    readUpdatedAt: '2026-11-01 00:00:00',
  }), 'keep-local');
});
