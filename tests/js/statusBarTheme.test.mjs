import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('native status bar launches on the light ground', () => {
  const main = readFileSync(new URL('../../resources/js/Pages/Main.vue', import.meta.url), 'utf8');
  const boot = readFileSync(new URL('../../resources/js/app.js', import.meta.url), 'utf8');

  for (const source of [main, boot]) {
    assert.doesNotMatch(source, /#090[Dd]16/);
    assert.match(source, /StatusBar\.setBackgroundColor\(\{\s*color:\s*'#F7F8F2'\s*\}\)/);
    assert.match(source, /StatusBar\.setStyle\(\{\s*style:\s*Style\.Dark\s*\}\)/);
  }
});
