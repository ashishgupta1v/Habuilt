/**
 * ══════════════════════════════════════════════════════════════════════
 * useOfficeCalendar.js — Ashish's 4-Month Office Block Calendar Engine
 * ══════════════════════════════════════════════════════════════════════
 *
 * Determines the "day type" for any given date based on the Sep–Dec 2026
 * office routine plan:
 *
 *   home       — Default WFH in Ludhiana (full routine)
 *   office-mon — Office block Monday (Ludhiana → CHD, ~2.75h drive, stay at Panchkula flat)
 *   office-mid — Office block Tue–Thu (Panchkula flat → office, 30min, back to flat)
 *   office-fri — Office block Friday (flat → office, 30min, then return to Ludhiana ~2.75h)
 *   half-day   — Half day WFH in Ludhiana (lighter work blocks)
 *   holiday    — Holiday (no office, relaxed routine)
 */

// ── Office Block Weeks (Mon–Fri, 5 consecutive attendance days) ──
const officeBlockWeeks = [
  { start: '2026-09-07', end: '2026-09-11', label: 'September Office Block' },
  { start: '2026-10-05', end: '2026-10-09', label: 'October Office Block' },
  { start: '2026-11-16', end: '2026-11-20', label: 'November Office Block' },
  { start: '2026-12-07', end: '2026-12-11', label: 'December Office Block' },
];

// ── Holidays (full day off) ──
const holidays = {
  '2026-09-04': 'Janmashtami',
  '2026-09-14': 'Ganesh Chaturthi',
  '2026-10-02': 'Gandhi Jayanti',
  '2026-10-20': 'Vijaya Dashami',
  '2026-11-24': 'Guru Nanak Jayanti',
};

// ── Half Days (lighter WFH schedule) ──
const halfDays = {
  '2026-09-15': 'Festival / Family',
  '2026-09-24': 'Bank & Documentation',
  '2026-09-30': 'Month-End Personal',
  '2026-10-19': 'Festival Prep',
  '2026-10-22': 'Family / Medical Appointment',
  '2026-10-28': 'Diwali Prep',
  '2026-11-09': 'Post-Diwali Family Visits',
  '2026-11-12': 'Family',
  '2026-11-23': 'Bridge to Holiday',
  '2026-11-27': 'Vehicle Servicing / Home Maintenance',
  '2026-12-03': 'Personal',
  '2026-12-15': 'Personal',
  '2026-12-17': 'Personal',
  '2026-12-22': 'Personal',
  '2026-12-24': 'Christmas Eve',
};

/**
 * Format a Date as 'YYYY-MM-DD' in local timezone.
 */
function toDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Check if a date falls within any office block week.
 * Returns the block info or null.
 */
function getOfficeBlock(date) {
  const key = toDateKey(date);
  for (const block of officeBlockWeeks) {
    if (key >= block.start && key <= block.end) {
      return block;
    }
  }
  return null;
}

/**
 * Determine the day type for a given date.
 *
 * Priority order:
 *   1. Holiday (always wins)
 *   2. Half day
 *   3. Office block day (Mon/Tue–Thu/Fri variants)
 *   4. Default home
 *
 * @param {Date|string} date
 * @returns {'home'|'office-mon'|'office-mid'|'office-fri'|'half-day'|'holiday'}
 */
export function getDayType(date) {
  const d = date instanceof Date ? date : new Date(date);
  const key = toDateKey(d);
  const dow = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // 1. Check holidays first
  if (holidays[key]) return 'holiday';

  // 2. Check half days
  if (halfDays[key]) return 'half-day';

  // 3. Check office block weeks
  const block = getOfficeBlock(d);
  if (block) {
    if (dow === 1) return 'office-mon';   // Monday
    if (dow === 5) return 'office-fri';   // Friday
    if (dow >= 2 && dow <= 4) return 'office-mid'; // Tue–Thu
    // Weekend within block range (shouldn't happen with Mon–Fri blocks)
    return 'home';
  }

  // 4. Default
  return 'home';
}

/**
 * Human-readable label for a day type.
 */
export function getDayTypeLabel(dayType) {
  const labels = {
    'home':       '🏠 Home',
    'office-mon': '🏢 Office (Mon · LDH→CHD)',
    'office-mid': '🏢 Office (Flat→Office)',
    'office-fri': '🏢 Office (Fri · →LDH)',
    'half-day':   '½ Half Day',
    'holiday':    '🎉 Holiday',
  };
  return labels[dayType] || '🏠 Home';
}

/**
 * Short label for compact UI display.
 */
export function getDayTypeShortLabel(dayType) {
  const labels = {
    'home':       'Home',
    'office-mon': 'Office',
    'office-mid': 'Office',
    'office-fri': 'Office',
    'half-day':   '½ Day',
    'holiday':    'Holiday',
  };
  return labels[dayType] || 'Home';
}

/**
 * Emoji for the day type.
 */
export function getDayTypeEmoji(dayType) {
  const emojis = {
    'home':       '🏠',
    'office-mon': '🏢',
    'office-mid': '🏢',
    'office-fri': '🏢',
    'half-day':   '⏳',
    'holiday':    '🎉',
  };
  return emojis[dayType] || '🏠';
}

/**
 * Check if a day type is any office variant.
 */
export function isOfficeDay(dayType) {
  return dayType === 'office-mon' || dayType === 'office-mid' || dayType === 'office-fri';
}

/**
 * Whether the evening is at the Panchkula flat (Mon–Thu office weeks).
 */
export function isFlatEvening(dayType) {
  return dayType === 'office-mon' || dayType === 'office-mid';
}

/**
 * Get holiday name for a date, if applicable.
 */
export function getHolidayName(date) {
  return holidays[toDateKey(date)] || null;
}

/**
 * Get half-day reason for a date, if applicable.
 */
export function getHalfDayReason(date) {
  return halfDays[toDateKey(date)] || null;
}

/**
 * Get upcoming office/half/holiday days from today, for preview.
 * @param {number} limit - Max items to return
 * @returns {Array<{date: string, type: string, label: string, detail: string}>}
 */
export function getUpcomingSpecialDays(limit = 5) {
  const results = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Scan next 120 days
  for (let i = 0; i < 120 && results.length < limit; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const key = toDateKey(d);
    const type = getDayType(d);

    if (type !== 'home') {
      let detail = '';
      if (holidays[key]) detail = holidays[key];
      else if (halfDays[key]) detail = halfDays[key];
      else {
        const block = getOfficeBlock(d);
        if (block) detail = block.label;
      }

      results.push({
        date: key,
        type,
        label: getDayTypeLabel(type),
        detail,
      });
    }
  }

  return results;
}

/**
 * The ordered list of day types for manual cycling.
 */
export const dayTypeCycle = ['home', 'office-mon', 'office-mid', 'office-fri', 'half-day', 'holiday'];

/**
 * Get the next day type in the manual cycle.
 */
export function getNextDayType(current) {
  const idx = dayTypeCycle.indexOf(current);
  return dayTypeCycle[(idx + 1) % dayTypeCycle.length];
}

export { officeBlockWeeks, holidays, halfDays };
