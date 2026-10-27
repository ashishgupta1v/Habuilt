// ══════════════════════════════════════════════════════════════════════════════
// LIFETIME STATS — pure functions extracted from Dashboard.vue
// ══════════════════════════════════════════════════════════════════════════════
// Computes cross-month streaks, XP, and per-habit history from an array of
// monthly state rows loaded from Supabase or localStorage.
//
// Kept as pure functions (no Vue reactivity) so they can be unit-tested and
// reused from other views (e.g. analytics and lifetime summary).
// ══════════════════════════════════════════════════════════════════════════════

export const parseMonthKey = (mk) => {
  const m = /^(\d{4})-(\d{2})$/.exec(String(mk || ''));
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) };
};

export const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

export const sortMonthKeys = (a, b) => {
  const pa = parseMonthKey(a);
  const pb = parseMonthKey(b);
  if (!pa || !pb) return 0;
  return (pa.year * 12 + pa.month) - (pb.year * 12 + pb.month);
};

// Convert a (year, month, day) tuple to a stable absolute day index (days since epoch).
// Ignores timezone offset — we only care about relative differences.
export const dateToAbsDay = (year, month, day) =>
  Math.floor(new Date(year, month - 1, day).getTime() / 86400000);

/**
 * Extract completed day numbers from a habit object regardless of key schema.
 */
export const getHabitCompletedDays = (habit) => {
  if (!habit) return [];
  if (Array.isArray(habit.completed_days)) return habit.completed_days.map(Number);
  if (Array.isArray(habit.completedDays)) return habit.completedDays.map(Number);
  return [];
};

/**
 * Extract habit list from a monthly state document regardless of key schema.
 */
export const getMonthlyHabits = (stateData) => {
  if (!stateData) return [];
  if (Array.isArray(stateData.habits)) return stateData.habits;
  if (Array.isArray(stateData.localHabits)) return stateData.localHabits;
  return [];
};

/**
 * Compute lifetime stats from an array of monthly state rows.
 * Each row: { month_key: 'YYYY-MM', state_data: { habits/localHabits: [{ id, name, points, completed_days/completedDays }] } }
 *
 * @param {Array} rows            — monthly state rows from Supabase / localStorage
 * @param {Object} currentMonth   — { year, month, day, habits[] } — overlays in-memory data
 * @returns {Object} lifetime summary
 */
export const computeLifetimeStats = (rows, currentMonth) => {
  const months = [];
  const perHabitCompletions = {};
  const habitNames = {};
  const currentScope = currentMonth
    ? `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}`
    : null;
  let sawCurrent = false;

  const sortedRows = [...(rows || [])].sort((a, b) => sortMonthKeys(a.month_key, b.month_key));

  sortedRows.forEach((row) => {
    const parsed = row?.state_data;
    const pm = parseMonthKey(row?.month_key);
    if (!parsed || !pm) return;
    if (row.month_key === currentScope) sawCurrent = true;

    const habitsInMonth = getMonthlyHabits(parsed);
    let earned = 0;
    let possible = 0;
    const daysWithActivity = new Set();

    habitsInMonth.forEach((h) => {
      const pts = Number(h.points) || 1;
      const cd = getHabitCompletedDays(h);
      earned += pts * cd.length;
      possible += pts * daysInMonth(pm.year, pm.month);
      if (!perHabitCompletions[h.id]) perHabitCompletions[h.id] = [];
      habitNames[h.id] = h.name || habitNames[h.id] || h.id;
      cd.forEach((d) => {
        perHabitCompletions[h.id].push({ year: pm.year, month: pm.month, day: d });
        daysWithActivity.add(`${pm.year}-${pm.month}-${d}`);
      });
    });

    const rewardLedger = Array.isArray(parsed.rewardLedger) ? parsed.rewardLedger : [];
    const redeemed = rewardLedger.reduce((sum, r) => sum + (Number(r.cost) || 0), 0);

    months.push({
      monthKey: row.month_key,
      year: pm.year,
      month: pm.month,
      earned,
      possible,
      redeemed,
      completionRate: possible > 0 ? Math.round((earned / possible) * 100) : 0,
      activeDays: daysWithActivity.size,
    });
  });

  // Overlay current-month in-memory habits if not already in rows
  if (currentMonth && Array.isArray(currentMonth.habits)) {
    const pm = { year: currentMonth.year, month: currentMonth.month };

    if (!sawCurrent) {
      let earned = 0;
      let possible = 0;
      const daysWithActivity = new Set();
      currentMonth.habits.forEach((h) => {
        const pts = Number(h.points) || 1;
        const cd = getHabitCompletedDays(h);
        earned += pts * cd.length;
        possible += pts * daysInMonth(pm.year, pm.month);
        cd.forEach((d) => daysWithActivity.add(`${pm.year}-${pm.month}-${d}`));
      });
      months.push({
        monthKey: currentScope,
        year: pm.year,
        month: pm.month,
        earned,
        possible,
        redeemed: 0,
        completionRate: possible > 0 ? Math.round((earned / possible) * 100) : 0,
        activeDays: daysWithActivity.size,
      });
    }

    // Merge live current-month completions (dedupe by day)
    currentMonth.habits.forEach((h) => {
      if (!perHabitCompletions[h.id]) perHabitCompletions[h.id] = [];
      habitNames[h.id] = h.name || habitNames[h.id] || h.id;
      const existing = new Set(
        perHabitCompletions[h.id]
          .filter((x) => x.year === pm.year && x.month === pm.month)
          .map((x) => x.day)
      );
      getHabitCompletedDays(h).forEach((d) => {
        if (!existing.has(d)) {
          perHabitCompletions[h.id].push({ year: pm.year, month: pm.month, day: d });
        }
      });
    });
  }

  // Per-habit longest & current streak (across months)
  const perHabitStreaks = {};
  let allTimeBest = { name: '—', days: 0, habitId: null };

  const todayAbs = currentMonth
    ? dateToAbsDay(currentMonth.year, currentMonth.month, currentMonth.day)
    : null;

  Object.entries(perHabitCompletions).forEach(([habitId, arr]) => {
    const daysAbs = arr
      .map(({ year, month, day }) => dateToAbsDay(year, month, day))
      .sort((a, b) => a - b);
    const unique = [...new Set(daysAbs)];

    let longest = 0;
    let run = 0;
    let prev = null;
    for (const d of unique) {
      if (prev !== null && d === prev + 1) run++;
      else run = 1;
      if (run > longest) longest = run;
      prev = d;
    }

    let current = 0;
    if (todayAbs !== null && unique.length > 0) {
      const todayDone = unique.includes(todayAbs);
      const startAbs = todayDone ? todayAbs : (unique.includes(todayAbs - 1) ? todayAbs - 1 : null);
      if (startAbs !== null) {
        for (let i = unique.length - 1; i >= 0; i--) {
          if (unique[i] === startAbs - current) current++;
          else if (unique[i] < startAbs - current) break;
        }
      }
    }

    perHabitStreaks[habitId] = {
      longest,
      current,
      total: unique.length,
      name: habitNames[habitId] || habitId,
    };

    if (longest > allTimeBest.days) {
      allTimeBest = { name: habitNames[habitId] || habitId, days: longest, habitId };
    }
  });

  // Lifetime "any active day" streak
  const allActiveDays = new Set();
  Object.values(perHabitCompletions).forEach((arr) => {
    arr.forEach(({ year, month, day }) => allActiveDays.add(dateToAbsDay(year, month, day)));
  });
  const sortedActive = [...allActiveDays].sort((a, b) => a - b);
  let lifetimeStreak = 0;
  if (todayAbs !== null && sortedActive.length > 0) {
    const todayDone = sortedActive.includes(todayAbs);
    const startAbs = todayDone ? todayAbs : (sortedActive.includes(todayAbs - 1) ? todayAbs - 1 : null);
    if (startAbs !== null) {
      for (let i = sortedActive.length - 1; i >= 0; i--) {
        if (sortedActive[i] === startAbs - lifetimeStreak) lifetimeStreak++;
        else if (sortedActive[i] < startAbs - lifetimeStreak) break;
      }
    }
  }

  return {
    months: months.sort((a, b) => sortMonthKeys(a.monthKey, b.monthKey)),
    perHabitStreaks,
    totalXP: months.reduce((s, m) => s + m.earned, 0) * 10,
    totalPointsEarned: months.reduce((s, m) => s + m.earned, 0),
    totalPointsRedeemed: months.reduce((s, m) => s + (m.redeemed || 0), 0),
    totalDaysTracked: allActiveDays.size,
    allTimeBestStreak: allTimeBest,
    currentLifetimeStreak: lifetimeStreak,
  };
};
