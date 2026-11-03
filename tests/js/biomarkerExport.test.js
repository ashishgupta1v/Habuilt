import test from 'node:test';
import assert from 'node:assert/strict';
import { biomarkerRowsToCsv } from '../../resources/js/lib/biomarkerExport.js';

test('biomarker csv contains only the saved rows', () => {
  const csv = biomarkerRowsToCsv([
    {
      log_date: '2026-11-02',
      stiffness_minutes: 12,
      energy_level: 7,
      hydration_ml: 500,
      sleep_hours: 8,
      notes: 'saved note',
    },
  ]);

  const lines = csv.split('\r\n');
  assert.equal(lines.length, 2);
  assert.match(lines[1], /2026-11-02/);
  assert.match(lines[1], /saved note/);
  assert.equal(csv.includes('Active Flare'), false);
  assert.equal(csv.includes('FlareRisk'), false);
  assert.equal(csv.includes('Optimal'), false);
});

test('an empty biomarker response does not invent days', () => {
  const csv = biomarkerRowsToCsv([]);
  assert.equal(csv.split('\r\n').length, 1);
  assert.equal(csv.startsWith('log_date,'), true);
});
