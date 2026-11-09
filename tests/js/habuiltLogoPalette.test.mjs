import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const vue = readFileSync(new URL('../../resources/js/Components/Brand/HabuiltLogo.vue', import.meta.url), 'utf8');

test('logo keeps the H and uses lime plus charcoal', () => {
  assert.match(vue, /#0C110D/i);
  assert.match(vue, /#D9F27A/i);
  assert.match(vue, /Habuilt/);
  assert.doesNotMatch(vue, /#00B4A0|#00E5C9|#FF6B35/i);
});
