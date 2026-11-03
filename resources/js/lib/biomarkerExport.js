const COLUMNS = ['log_date', 'stiffness_minutes', 'energy_level', 'hydration_ml', 'sleep_hours', 'notes'];

function cell(value) {
  if (value === null || value === undefined) return '';
  return `"${String(value).replace(/"/g, '""')}"`;
}

/**
 * Serialize biomarker rows that were already saved.
 * Days that were not returned by the API are not added.
 */
export function biomarkerRowsToCsv(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const lines = [COLUMNS.join(',')];
  for (const row of list) {
    if (!row || typeof row !== 'object') continue;
    lines.push(COLUMNS.map((key) => cell(row[key])).join(','));
  }
  return lines.join('\r\n');
}

export function downloadCsv(filename, csv) {
  if (typeof document === 'undefined') return;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
