import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyCheckInWrite } from '../../resources/js/lib/checkInWrite.js';
import { plainStatusText } from '../../resources/js/lib/statusCopy.js';

test('a check-in write is saved, rejected, or retried', () => {
  assert.equal(classifyCheckInWrite({ success: true }), 'saved');
  assert.equal(classifyCheckInWrite({ guest: true }), 'saved');
  assert.equal(classifyCheckInWrite({ error: 'Unknown habit', status: 422 }), 'rejected');
  assert.equal(classifyCheckInWrite({ error: 'Invalid check-in payload', status: 400 }), 'rejected');
  assert.equal(classifyCheckInWrite({ success: false, offline: true }), 'retry');
  assert.equal(classifyCheckInWrite({ status: 401 }), 'retry');
  assert.equal(classifyCheckInWrite({ status: 500 }), 'retry');
  assert.equal(classifyCheckInWrite(null), 'retry');
});

test('status text drops pictographs and middle dots', () => {
  assert.equal(plainStatusText('⚡ Marked done'), 'Marked done');
  assert.equal(plainStatusText('⚠️ Could not save'), 'Could not save');
  assert.equal(plainStatusText('Back online · Synchronizing'), 'Back online. Synchronizing');
  assert.equal(plainStatusText('Account export started.'), 'Account export started.');
  assert.equal(plainStatusText(''), '');
});
