import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const share = fs.readFileSync('resources/js/Components/Modals/ShareScorecardModal.vue', 'utf8');
const partner = fs.readFileSync('resources/js/Components/Modals/PartnerSyncModal.vue', 'utf8');

test('the share image no longer uses the old poster language', () => {
  for (const phrase of ['Warrior', 'WARRIOR', 'Habits Crushed', 'Daily Mastery', 'Crushed', '#C8A456', '#060a14']) {
    assert.equal(share.includes(phrase), false, phrase);
  }
  assert.match(share, /#F7F8F2/);
  assert.match(share, /#0C110D/);
  assert.match(share, /Kept today/);
  assert.match(share, /Kept together/);
});

test('a custom partner note is not labeled as a warrior ping', () => {
  assert.equal(partner.includes('Warrior Ping'), false);
  assert.match(partner, /label: 'Note'/);
});
