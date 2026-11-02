import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_SYNC_ATTEMPTS,
  backoffDelayMs,
  isAttemptDue,
  isRetryableAccountId,
  publicSyncError,
  settleAttempt,
} from '../../resources/js/lib/syncQueuePolicy.js';

test('guest and blank ids are not retried against the API', () => {
  for (const id of ['', '   ', 'guest', 'Guest', 'guest-42', 'anonymous', 'null', 'undefined']) {
    assert.equal(isRetryableAccountId(id), false, id);
    const settled = settleAttempt({ payload: { userId: id }, attempts: 0 }, 1_000, { ok: false });
    assert.equal(settled.disposition, 'drop');
  }
  assert.equal(isRetryableAccountId('11111111-2222-4333-8444-555555555555'), true);
});

test('backoff grows and includes jitter', () => {
  const first = backoffDelayMs(1, () => 0);
  const second = backoffDelayMs(2, () => 0);
  const jittered = backoffDelayMs(1, () => 1);
  assert.equal(first, 25000);
  assert.equal(second, 50000);
  assert.ok(jittered > first);
  assert.ok(jittered <= 25000 * 1.25);
});

test('a failed mutation is dead-lettered on the fifth attempt and not before', () => {
  const now = Date.parse('2026-11-02T12:00:00Z');
  let item = { id: 'mut_1', payload: { userId: 'user-a' }, attempts: 0 };
  for (let attempt = 1; attempt < MAX_SYNC_ATTEMPTS; attempt += 1) {
    const settled = settleAttempt(item, now, { ok: false, error: 'HTTP 500' }, () => 0);
    assert.equal(settled.disposition, 'retry');
    assert.equal(settled.item.attempts, attempt);
    assert.equal(isAttemptDue(settled.item, now), false);
    assert.equal(isAttemptDue(settled.item, Date.parse(settled.item.nextAttemptAt)), true);
    item = settled.item;
  }
  const dead = settleAttempt(item, now + 60_000, { ok: false, error: 'Bearer secret-token failed' }, () => 0);
  assert.equal(dead.disposition, 'dead');
  assert.equal(dead.item.attempts, MAX_SYNC_ATTEMPTS);
  assert.match(dead.item.lastError, /bearer \[redacted\]/);
  assert.equal(publicSyncError('Bearer abc.def.ghi').includes('abc.def'), false);
});

test('a successful attempt leaves the queue', () => {
  const settled = settleAttempt(
    { payload: { user_id: 'user-a' }, attempts: 2 },
    5_000,
    { ok: true },
  );
  assert.equal(settled.disposition, 'done');
  assert.equal(settled.item.attempts, 3);
});
