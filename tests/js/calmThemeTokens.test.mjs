import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../../resources/css/design-system/tokens.css', import.meta.url), 'utf8');

test('calm tokens use lime fills and charcoal text', () => {
  assert.match(css, /--text-primary:\s*#0C110D/i);
  assert.match(css, /--accent:\s*#D9F27A/i);
  assert.match(css, /--btn-primary-bg:\s*#D9F27A/i);
  assert.match(css, /--btn-primary-text:\s*#0C110D/i);
  assert.match(css, /--font-display:\s*'Urbanist'/);
  assert.match(css, /--font-base:\s*'Inter'/);
  assert.doesNotMatch(css, /--btn-primary-text:\s*#fff/i);
});

test('restyled surfaces drop teal and navy', () => {
  const files = [
    '../../resources/css/app.css',
    '../../resources/css/landing.css',
    '../../resources/css/design-system/framer-bento.css',
    '../../resources/js/Components/Legal/CookieConsentBanner.vue',
    '../../resources/js/Components/Modals/ProtocolSettingsModal.vue',
    '../../resources/js/Components/Modals/HabitFormModal.vue',
    '../../resources/js/Components/Focus/DeepWorkStation.vue',
    '../../resources/js/Components/Intelligence/ZoetiCoachAdherenceHud.vue',
    '../../resources/js/Components/Navigation/HeroExecutiveDeck.vue',
    '../../resources/js/Components/Navigation/MobileBottomNav.vue',
    '../../resources/js/Components/Onboarding/FirstRunOnboarding.vue',
    '../../resources/js/Components/Recovery/ErrorBoundary.vue',
    '../../android/app/src/main/res/drawable/widget_pill_gold.xml',
    '../../android/app/src/main/res/drawable/widget_pill_teal.xml',
  ];
  const banned = /#0d9488|#00B4A0|#00E5C9|#07111D|#090d16|#07090e|rgba\(\s*15\s*,\s*20\s*,\s*31/i;
  for (const file of files) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(source, banned, file);
  }
  const gold = readFileSync(new URL('../../android/app/src/main/res/drawable/widget_pill_gold.xml', import.meta.url), 'utf8');
  const teal = readFileSync(new URL('../../android/app/src/main/res/drawable/widget_pill_teal.xml', import.meta.url), 'utf8');
  assert.match(gold, /#FBEA86/i);
  assert.match(teal, /#D9F27A/i);
  assert.doesNotMatch(gold, /#FF6B35|#5C2310/i);
  const offline = readFileSync(new URL('../../resources/css/app.css', import.meta.url), 'utf8');
  const pill = offline.match(/\.offline-pill \{[^}]+\}/);
  assert.ok(pill, 'offline pill exists');
  assert.match(pill[0], /bottom:/);
  assert.doesNotMatch(pill[0], /top:\s*calc/);
});
