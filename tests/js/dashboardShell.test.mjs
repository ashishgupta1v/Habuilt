import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const vue = readFileSync(new URL('../../resources/js/Pages/Dashboard.vue', import.meta.url), 'utf8');

test('dashboard uses the summary and the four tabs', () => {
  assert.match(vue, /buildTodaySummary/);
  assert.match(vue, /Today/);
  assert.match(vue, /Habits/);
  assert.match(vue, /Rewards/);
  assert.match(vue, /Review/);
  assert.doesNotMatch(vue, /Vitality|HRV|7h 42m/);
  assert.match(vue, /data-calm-hero-count/);
  assert.match(vue, /animateToday/);
  assert.doesNotMatch(vue, /#0d9488|#00B4A0|#07111D|#090d16/i);
});
