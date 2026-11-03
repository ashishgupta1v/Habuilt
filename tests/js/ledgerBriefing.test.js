import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLedgerBriefing } from '../../resources/js/lib/ledgerBriefing.js';

test('briefing cites the missed habit and the week count', () => {
  const briefing = buildLedgerBriefing({
    now: new Date(2026, 10, 4, 15, 0, 0),
    currentDay: 4,
    weekCompletedCount: 6,
    habits: [
      { id: 'stretch', name: 'Morning stretch', startTime: '07:00' },
      { id: 'walk', name: 'Evening walk', startTime: '18:30' },
    ],
    isCompleted: (habit) => habit.id === 'walk',
    scheduleFor: (habit) => ({ start: habit.startTime, end: '19:00' }),
  });

  assert.match(briefing.directive, /Missed today: Morning stretch/);
  assert.match(briefing.directive, /This week: 6 completed/);
  assert.equal(briefing.source, 'ledger');
  assert.equal(/stiffness|clinical|inflammation|infant/i.test(briefing.fullSpeechText), false);
});

test('briefing cites the next habit when nothing has been missed', () => {
  const briefing = buildLedgerBriefing({
    now: new Date(2026, 10, 4, 8, 0, 0),
    currentDay: 4,
    weekCompletedCount: 2,
    habits: [{ id: 'walk', name: 'Evening walk', startTime: '18:30' }],
    isCompleted: () => false,
    scheduleFor: (habit) => ({ start: habit.startTime }),
  });

  assert.match(briefing.headline, /Next: Evening walk at 18:30/);
  assert.match(briefing.directive, /This week: 2 completed/);
});
