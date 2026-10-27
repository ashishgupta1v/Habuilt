/**
 * ══════════════════════════════════════════════════════════════════════
 * useOfficeCalendar.js — Universal Circadian Day-Type Engine
 * ══════════════════════════════════════════════════════════════════════
 *
 * Provides 4 universal routine schedule modes:
 *   home       — Standard Focus / Home Base (deep work + home cadence)
 *   office     — Office / Work Block (commute / on-site team collaboration)
 *                [Variants: office-mon, office-mid, office-fri]
 *   half-day   — Half-Day Sprint (compressed morning sprint + rest/errands)
 *   holiday    — Rest, Recovery & Rejuvenation (relaxed baseline)
 */

const LOCAL_CUSTOM_CALENDAR_KEY = 'habuilt_custom_calendar_schedule';

// Dynamic / configurable holiday and block stores with backward-compatible defaults
const officeBlockWeeks = [];
const holidays = {};
const halfDays = {};

export function getCustomCalendarSchedule() {
  if (typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_CUSTOM_CALENDAR_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (_) {}
    }
  }
  return null;
}

export function saveCustomCalendarSchedule(schedule) {
  if (typeof localStorage !== 'undefined') {
    if (schedule) {
      localStorage.setItem(LOCAL_CUSTOM_CALENDAR_KEY, JSON.stringify(schedule));
    } else {
      localStorage.removeItem(LOCAL_CUSTOM_CALENDAR_KEY);
    }
  }
}

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
 * Check if a date falls within any custom office block week.
 */
function getOfficeBlock(date) {
  const key = toDateKey(date);
  const custom = getCustomCalendarSchedule();
  const activeBlocks = (custom && Array.isArray(custom.officeBlockWeeks)) ? custom.officeBlockWeeks : officeBlockWeeks;
  for (const block of activeBlocks) {
    if (key >= block.start && key <= block.end) {
      return block;
    }
  }
  return null;
}

/**
 * Determine the day type for a given date dynamically.
 *
 * Priority order:
 *   1. Custom holiday override
 *   2. Custom half-day override
 *   3. Custom block week or default weekday pattern
 *   4. Standard home base
 *
 * @param {Date|string} date
 * @returns {'home'|'office-mon'|'office-mid'|'office-fri'|'half-day'|'holiday'}
 */
export function getDayType(date) {
  const d = date instanceof Date ? date : new Date(date);
  const key = toDateKey(d);
  const dow = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Check custom schedule overrides
  const custom = getCustomCalendarSchedule();
  if (custom?.holidays && custom.holidays[key]) return 'holiday';
  if (custom?.halfDays && custom.halfDays[key]) return 'half-day';

  // Check configured office block
  const block = getOfficeBlock(d);
  if (block) {
    if (dow === 1) return 'office-mon';
    if (dow === 5) return 'office-fri';
    if (dow >= 2 && dow <= 4) return 'office-mid';
    return 'home';
  }

  // Weekday circadian rhythm mapping (Mon=Launch, Tue-Thu=Mid, Fri=Wrap)
  if (custom?.officeDays?.includes(dow)) {
    if (dow === 1) return 'office-mon';
    if (dow === 5) return 'office-fri';
    return 'office-mid';
  }

  return 'home';
}

/**
 * Human-readable label for a day type.
 */
export function getDayTypeLabel(dayType) {
  const labels = {
    'home':       '🏠 Home Base',
    'office':     '🏢 Office Day',
    'office-mon': '🏢 Office (Sprint Launch)',
    'office-mid': '🏢 Office (Deep Execution)',
    'office-fri': '🏢 Office (Wrap & Review)',
    'half-day':   '½ Half Day Sprint',
    'holiday':    '🌿 Rest & Recovery',
  };
  return labels[dayType] || '🏠 Home Base';
}

/**
 * Short label for compact UI display.
 */
export function getDayTypeShortLabel(dayType) {
  const labels = {
    'home':       'Home',
    'office':     'Office',
    'office-mon': 'Off (Mon)',
    'office-mid': 'Off (Mid)',
    'office-fri': 'Off (Fri)',
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
    'office':     '🏢',
    'office-mon': '🏢',
    'office-mid': '🏢',
    'office-fri': '🏢',
    'half-day':   '⏳',
    'holiday':    '🌿',
  };
  return emojis[dayType] || '🏠';
}

/**
 * Check if a day type is any office variant.
 */
export function isOfficeDay(dayType) {
  return dayType === 'office' || dayType === 'office-mon' || dayType === 'office-mid' || dayType === 'office-fri';
}

/**
 * Whether the evening is at an office accommodation block.
 */
export function isFlatEvening(dayType) {
  return dayType === 'office-mon' || dayType === 'office-mid';
}

/**
 * Get holiday name for a date, if applicable.
 */
export function getHolidayName(date) {
  const key = toDateKey(date);
  const custom = getCustomCalendarSchedule();
  return custom?.holidays?.[key] || holidays[key] || null;
}

/**
 * Get half-day reason for a date, if applicable.
 */
export function getHalfDayReason(date) {
  const key = toDateKey(date);
  const custom = getCustomCalendarSchedule();
  return custom?.halfDays?.[key] || halfDays[key] || null;
}

/**
 * Get upcoming special routine days from today.
 * @param {number} limit - Max items to return
 */
export function getUpcomingSpecialDays(limit = 5) {
  const results = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 60 && results.length < limit; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const key = toDateKey(d);
    const type = getDayType(d);

    if (type !== 'home') {
      let detail = getHolidayName(d) || getHalfDayReason(d) || getDayTypeLabel(type);
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
