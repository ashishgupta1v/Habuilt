import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  computeLifetimeStats,
  mergeStoredCheckIns,
  sumStoredCheckInPoints,
} from '../../resources/js/lib/lifetimeStats.js';
import { zoetiEventPayload } from '../../resources/js/lib/zoetiCoachBridge.js';

const read = (path) => fs.readFileSync(path, 'utf8');

test('review and rewards sources have no couple claim path', () => {
  const review = read('resources/js/Components/Review/SundayReview.vue');
  const rewards = read('resources/js/Components/Rewards/RewardShop.vue');
  const dashboard = read('resources/js/Pages/Dashboard.vue');
  const sources = [review, rewards, dashboard];

  for (const source of sources) {
    assert.equal(source.includes('Claim in Vault'), false);
    assert.equal(source.includes('coupleSynergy'), false);
    assert.equal(source.toLowerCase().includes('exclusive couple'), false);
    assert.equal(source.toLowerCase().includes('exclusive shared couple'), false);
  }

  assert.equal(review.includes('Couple Synchronization'), false);
  assert.equal(review.includes('>couple<') || review.includes("=== 'couple'"), false);
  assert.equal(dashboard.includes('rewardLedger.value.unshift'), false);
  assert.equal(dashboard.includes('saveRewardCatalogToServer(rewards.value)'), false);
});

test('an earlier month and lifetime total keep the stored point, not the habit price', () => {
  const stored = [
    { habit_id: 'h1', month_key: '2026-10', day: 4, points: 1 },
  ];
  const stats = computeLifetimeStats([
    {
      month_key: '2026-10',
      state_data: {
        habits: [{ id: 'h1', name: 'Walk', points: 3, completed_days: [4] }],
      },
    },
  ], {
    year: 2026,
    month: 11,
    day: 12,
    habits: [{ id: 'h1', name: 'Walk', points: 3, completed_days: [] }],
  }, stored);

  const october = stats.months.find((month) => month.monthKey === '2026-10');
  assert.equal(october.earned, 1);
  assert.equal(stats.totalPointsEarned, 1);
  assert.equal(stats.usesStoredCheckIns, true);
  assert.equal(sumStoredCheckInPoints(stored, { beforeMonthKey: '2026-11' }), 1);
  assert.notEqual(stats.totalPointsEarned, 3);
});

test('a pending tick uses the current price only until the stored row returns', () => {
  const pending = [
    { habit_id: 'h1', month_key: '2026-11', day: 12, points: 3, pending: true },
  ];
  assert.equal(sumStoredCheckInPoints(pending, { monthKey: '2026-11' }), 3);

  const merged = mergeStoredCheckIns([
    { habit_id: 'h1', month_key: '2026-11', day: 12, points: 1 },
  ], pending);
  assert.equal(sumStoredCheckInPoints(merged, { monthKey: '2026-11' }), 1);
});

test('a guest total still uses the habit price and is not marked as stored check-ins', () => {
  const stats = computeLifetimeStats([
    {
      month_key: '2026-10',
      state_data: {
        habits: [{ id: 'h1', name: 'Walk', points: 3, completed_days: [4] }],
      },
    },
  ], {
    year: 2026,
    month: 11,
    day: 12,
    habits: [],
  });
  assert.equal(stats.totalPointsEarned, 3);
  assert.equal(stats.usesStoredCheckIns, false);
});

test('the ZoetiCoach event omits a checklist price unless a stored sum is already known', () => {
  const omitted = zoetiEventPayload({ habitId: 'h1', eventValue: 'Walk' });
  assert.equal('points' in omitted, false);

  const stored = zoetiEventPayload({ habitId: 'h1', storedPoints: 1 });
  assert.equal(stored.points, 1);
});
