import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACCOUNT_EXPORT_PATH,
  accountMenuAction,
  decideGuestImport,
  droppedGuestImportMessage,
  guestImportBody,
  partnerAcceptPayload,
  partnerConnectionFromAccept,
  readGuestBlob,
  reminderControlCopy,
  reminderScheduleAt,
  missingSettingsRowMessage,
  reminderTileAction,
  runGuestImport,
  settingsReadFromBody,
  shouldClearGuestBlob,
} from '../../resources/js/lib/followUpGates.js';
import { CHECKLIST_REPLACE_COPY, protocolActivateBody, starterListReplacesChecklist } from '../../resources/js/lib/protocolChecklist.js';

function memoryStorage(seed = {}) {
  const data = { ...seed };
  return {
    get length() {
      return Object.keys(data).length;
    },
    key(index) {
      return Object.keys(data)[index] ?? null;
    },
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    removeItem(key) {
      delete data[key];
    },
    dump() {
      return { ...data };
    },
  };
}

test('guest import runs only when the account list was never saved', () => {
  assert.equal(decideGuestImport({ listSaved: true, habits: [{ id: 'f-1' }] }), 'skip');
  assert.equal(decideGuestImport({ listSaved: false, habits: [] }), 'skip');
  assert.equal(decideGuestImport({ listSaved: false, habits: [{ id: 'f-1', name: 'Walk' }] }), 'import');
});

test('the guest blob is cleared only after the settings save and the inserts succeed', async () => {
  assert.equal(shouldClearGuestBlob({ success: false, imported: false }), false);
  assert.equal(shouldClearGuestBlob({ success: true, imported: false, reason: 'list-saved' }), false);
  assert.equal(shouldClearGuestBlob({ success: false, conflict: true }), false);
  assert.equal(shouldClearGuestBlob({ success: true, imported: true }), true);

  const storage = memoryStorage({
    'habuilt.dashboard.guest.2026-11': JSON.stringify({
      habits: [{
        id: 'f-1',
        name: 'Morning walk',
        points: 4,
        startTime: '07:15',
        completed_days: [2, 3],
      }],
      weeklyReview: {
        reviewDate: 'Nov 8, 2026',
        checks: [],
        reflections: { wins: 'Kept the morning' },
        coupleChecks: [{ text: 'Do not store' }],
      },
    }),
  });

  const failed = await runGuestImport({
    storage,
    loadSettings: async () => ({ updated_at: '2026-11-01 00:00:00', weekly_reviews: {}, custom_habits: [] }),
    postImport: async () => ({ success: false, conflict: true }),
  });
  assert.equal(failed.cleared, false);
  assert.equal(storage.getItem('habuilt.dashboard.guest.2026-11') !== null, true);

  let posted = null;
  const saved = await runGuestImport({
    storage,
    loadSettings: async () => ({ updated_at: '2026-11-01 00:00:00', weekly_reviews: {}, custom_habits: [] }),
    postImport: async (body) => {
      posted = body;
      return { success: true, imported: true, updated_at: '2026-11-02 00:00:00' };
    },
  });
  assert.equal(saved.cleared, true);
  assert.equal(storage.getItem('habuilt.dashboard.guest.2026-11'), null);
  assert.equal(posted.custom_habits[0].id, 'f-1');
  assert.equal(posted.custom_habits[0].points, 4);
  assert.equal(posted.custom_habits[0].time, '07:15');
  assert.equal('completed_days' in posted.custom_habits[0], false);
  assert.equal('coupleChecks' in posted.weekly_reviews, false);
  assert.deepEqual(posted.kept_days, [
    { habit_id: 'f-1', month_key: '2026-11', day: 2, completed_on: '2026-11-02' },
    { habit_id: 'f-1', month_key: '2026-11', day: 3, completed_on: '2026-11-03' },
  ]);
  assert.equal(JSON.stringify(posted.kept_days).includes('Morning walk'), false);
  assert.equal(JSON.stringify(posted.kept_days).includes('points'), false);
  assert.equal(droppedGuestImportMessage().includes('Morning walk'), false);
});

test('a saved account list skips the guest blob without clearing it', async () => {
  const storage = memoryStorage({
    'habuilt.dashboard.guest.2026-11': JSON.stringify({
      habits: [{ id: 'c-1', name: 'Guest habit', points: 2, completed_days: [1] }],
    }),
  });
  const result = await runGuestImport({
    storage,
    loadSettings: async () => ({ weekly_reviews: { listSaved: true }, updated_at: '2026-11-01 00:00:00' }),
    postImport: async () => {
      throw new Error('should not post');
    },
  });
  assert.equal(result.action, 'skip');
  assert.equal(result.cleared, false);
  assert.equal(storage.getItem('habuilt.dashboard.guest.2026-11') !== null, true);
  const blob = readGuestBlob(storage);
  const body = guestImportBody(blob.habits, blob.review, null, blob.keptDays);
  assert.equal('completed_days' in body.custom_habits[0], false);
});

test('a null settings body is a missing row and the guest days are posted once', async () => {
  const warnings = [];
  const original = console.warn;
  console.warn = (message) => warnings.push(String(message));
  try {
    const missing = settingsReadFromBody(null);
    assert.equal(missing.missing, true);
    assert.equal(missing.updated_at, null);
    assert.equal(missing.weekly_reviews.listSaved, false);

    const storage = memoryStorage({
      'habuilt.dashboard.guest.2026-11': JSON.stringify({
        habits: [{
          id: 'f-1',
          name: 'Morning walk',
          points: 4,
          startTime: '07:15',
          completed_days: [2],
        }],
        weeklyReview: { reviewDate: 'Nov 8, 2026', checks: [], reflections: { wins: 'Kept the morning' } },
      }),
    });
    let posts = 0;
    let posted = null;
    const saved = await runGuestImport({
      storage,
      loadSettings: async () => null,
      postImport: async (body) => {
        posts += 1;
        posted = body;
        return { success: true, imported: true, updated_at: '2026-11-02 00:00:00' };
      },
    });
    assert.equal(saved.cleared, true);
    assert.equal(posts, 1);
    assert.equal(posted.expected_updated_at, null);
    assert.equal(posted.weekly_reviews.listSaved, true);
    assert.equal(posted.custom_habits[0].points, 4);
    assert.equal('completed_days' in posted.custom_habits[0], false);
    assert.equal(warnings.includes(missingSettingsRowMessage()), true);
    assert.equal(warnings.some((line) => line.includes('updated_at moved')), false);
    assert.equal(warnings.join(' ').includes('Morning walk'), false);
    assert.equal(warnings.join(' ').includes('Kept the morning'), false);

    const again = await runGuestImport({
      storage,
      loadSettings: async () => null,
      postImport: async () => {
        throw new Error('should not post');
      },
    });
    assert.equal(again.action, 'skip');
    assert.equal(posts, 1);
  } finally {
    console.warn = original;
  }
});

test('a denied reminder tile asks for permission again', () => {
  assert.equal(reminderTileAction('denied'), 'request-permission');
  assert.equal(reminderTileAction('granted'), 'open-habits');
  assert.equal(reminderTileAction('prompt'), 'open-habits');
});

test('activating a starter list is a confirmed checklist write, not a second protocol list', () => {
  const body = protocolActivateBody('archetype-founder', 'user-1');
  assert.equal('habits' in body, false);
  assert.equal(body.is_active, true);
  assert.equal(body.id, 'archetype-founder');
  assert.equal(starterListReplacesChecklist(
    [{ id: 'c-1', name: 'Mine' }],
    [{ id: 'f-1', name: 'Wake' }],
  ), true);
  assert.equal(starterListReplacesChecklist(
    [{ id: 'f-1', name: 'Wake' }],
    [{ id: 'f-1', name: 'Wake' }],
  ), false);
  assert.equal(CHECKLIST_REPLACE_COPY, 'The current checklist will be replaced.');
  assert.equal(CHECKLIST_REPLACE_COPY.includes('Wake'), false);
});

test('a denied notification still leaves a plain reminder label', () => {
  assert.equal(reminderControlCopy({ permission: 'denied', nextLabel: '07:15' }), 'Notifications are off');
  assert.equal(reminderControlCopy({ permission: 'granted', nextLabel: '07:15' }), '07:15');
  assert.equal(reminderControlCopy({ permission: 'prompt', nextLabel: '' }), 'No reminder yet');
});

test('the reminder schedule uses the saved start, not a short delay', () => {
  const day = new Date(2026, 10, 11, 6, 0, 0);
  const scheduled = reminderScheduleAt('07:15', day);
  assert.equal(scheduled.at.getHours(), 7);
  assert.equal(scheduled.at.getMinutes(), 15);
  assert.equal(scheduled.triggerTimestamp, scheduled.at.getTime());
  assert.notEqual(scheduled.triggerTimestamp, day.getTime() + 500);
});

test('partner local state stays disconnected unless the server accepts', () => {
  const guest = partnerConnectionFromAccept({ isGuest: true, response: { success: true, connection: { status: 'connected' } } });
  assert.equal(guest.connected, false);
  assert.equal(guest.message, 'An account is required.');

  const failed = partnerConnectionFromAccept({ isGuest: false, response: { success: false, error: 'Invite code was not found.' } });
  assert.equal(failed.connected, false);
  assert.equal(failed.connection, undefined);

  const accepted = partnerConnectionFromAccept({
    isGuest: false,
    response: { success: true, connection: { status: 'connected', partner_user_id: 'partner-1', alias: 'Ada' } },
  });
  assert.equal(accepted.connected, true);
  assert.equal(accepted.connection.confirmed, true);

  const payload = partnerAcceptPayload('hab-8942', 'Ada');
  assert.deepEqual(payload, { invite_code: 'HAB-8942', alias: 'Ada' });
  assert.equal(JSON.stringify(payload).includes('habit'), false);
});

test('account export starts the existing export route', () => {
  const action = accountMenuAction('export');
  assert.equal(action.opensProtocolSettings, false);
  assert.equal(action.path, ACCOUNT_EXPORT_PATH);
  assert.equal(action.path, '/api/account-export');
  assert.equal(accountMenuAction('protocol-settings').opensProtocolSettings, true);
});
