import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

for (const file of ['Disclaimer.vue', 'Privacy.vue', 'Terms.vue']) {
  test(`${file} leaves the dark legal canvas`, () => {
    const vue = readFileSync(new URL(`../../resources/js/Pages/${file}`, import.meta.url), 'utf8');
    assert.doesNotMatch(vue, /#07090e|#07111D/i);
    assert.doesNotMatch(vue, /rgba\(15,\s*20,\s*31/);
    assert.doesNotMatch(vue, /AI Bridge/);
    assert.doesNotMatch(vue, /intelligence system/i);
  });
}
