import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const vue = readFileSync(new URL('../../resources/js/Pages/Auth.vue', import.meta.url), 'utf8');
const motion = readFileSync(new URL('../../resources/js/lib/calmMotion.js', import.meta.url), 'utf8');

test('landing describes the live tracker and drops the film', () => {
  assert.match(vue, /Nothing scheduled today|kept today|Kept or Not yet/);
  assert.match(vue, /readStoredTodaySummary/);
  assert.match(vue, /data-calm-phone/);
  assert.match(vue, /bindLandingMotion/);
  assert.match(motion, /ScrollTrigger/);
  assert.match(motion, /prefers-reduced-motion/);
  assert.doesNotMatch(vue, /hero_athlete\.jpg/);
  assert.doesNotMatch(vue, /Vitality|HRV|Warrior Rank|Coach Vikas|\$4\.99|180k/i);
  assert.doesNotMatch(vue, /#0d9488|#00B4A0|#07111D|#090d16/i);
});
