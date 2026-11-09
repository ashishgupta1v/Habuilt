import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('public surfaces say Habuilt and drop the dark boot', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const sw = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8');
  const strings = readFileSync(new URL('../../android/app/src/main/res/values/strings.xml', import.meta.url), 'utf8');
  assert.match(html, />Habuilt</);
  assert.doesNotMatch(html, /ZOETIHABIT|#07111D|Executive Habit Protocol/i);
  assert.match(html, /habit tracker/i);
  const manifest = readFileSync(new URL('../../public/manifest.webmanifest', import.meta.url), 'utf8');
  assert.match(manifest, /"name": "Habuilt"/);
  assert.match(manifest, /habit tracker/i);
  assert.doesNotMatch(manifest, /Executive Habit Protocol|circadian executive/i);
  const blade = readFileSync(new URL('../../resources/views/app.blade.php', import.meta.url), 'utf8');
  assert.match(blade, /#F7F8F2/);
  assert.match(blade, /habit tracker/i);
  assert.doesNotMatch(blade, /#0d9488|#090d16|Executive Habit Protocol/i);
  assert.match(sw, /habuilt-cache-calm-2026-11-09/);
  assert.match(strings, /<string name="app_name">Habuilt<\/string>/);
  assert.doesNotMatch(strings, /ZoetiHabit|by ZoetiCoach/);
});
