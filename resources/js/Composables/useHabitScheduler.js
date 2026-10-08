import { computed } from 'vue';

/**
 * ══════════════════════════════════════════════════════════════════════
 * useHabitScheduler.js — Circadian Routine Phase & Up-Next Engine
 * ══════════════════════════════════════════════════════════════════════
 *
 * Dynamically resolves:
 * 1. Current routine phase window (Morning, Deep Execution, Operations, Evening, Rest)
 * 2. Chronological sorting for habits by start time / circadian slot
 * 3. Real-time "DUE NOW" vs "UP NEXT" habit determination
 */

export function useHabitScheduler(currentClock, activeProtocol = null) {
  // Routine Phase Window based on active protocol circadian anchors
  const currentRoutineWindow = computed(() => {
    const now = currentClock?.value || new Date();
    const mins = now.getHours() * 60 + now.getMinutes();

    // Pull protocol anchors if provided, or default circadian baseline
    const wakeStr = activeProtocol?.value?.wakeTime || '05:00';
    const [wh, wm] = wakeStr.split(':').map(Number);
    const wakeMins = (wh * 60 + wm) || 300;

    const workStartStr = activeProtocol?.value?.workStart || '08:30';
    const [wsh, wsm] = workStartStr.split(':').map(Number);
    const workStartMins = (wsh * 60 + wsm) || 510;

    const workEndStr = activeProtocol?.value?.workEnd || '18:00';
    const [weh, wem] = workEndStr.split(':').map(Number);
    const workEndMins = (weh * 60 + wem) || 1080;

    if (workEndMins >= 1200) {
      // Dual-track master routine (work until 21:00 shutdown)
      if (mins < workStartMins) {
        return { name: 'Morning Protocol', time: `${wakeStr} – ${workStartStr}`, icon: '🌅' };
      } else if (mins < 14 * 60) {
        return { name: 'Deep Build Block', time: `${workStartStr} – 14:00`, icon: '⚡' };
      } else if (mins < 18 * 60 + 15) {
        return { name: 'Afternoon Build & Meetings', time: '14:00 – 18:15', icon: '☀️' };
      } else if (mins < workEndMins) {
        return { name: 'Evening Fitness, Office & Shutdown', time: `18:15 – ${workEndStr}`, icon: '🌙' };
      } else if (mins < workEndMins + 60) {
        return { name: 'Spinal Wind-Down & Heated Eye Mask', time: `${workEndStr} – 22:00`, icon: '🛡️' };
      } else {
        return { name: 'Night Sanctuary & Rest', time: `22:00 – ${wakeStr}`, icon: '✨' };
      }
    }

    if (mins < workStartMins) {
      return { name: 'Morning Protocol', time: `${wakeStr} – ${workStartStr}`, icon: '🌅' };
    } else if (mins < workStartMins + 240) {
      return { name: 'Deep Execution Block', time: `${workStartStr} – Midday`, icon: '⚡' };
    } else if (mins < workEndMins) {
      return { name: 'Operations & Midday Block', time: `Midday – ${workEndStr}`, icon: '☀️' };
    } else if (mins < workEndMins + 210) {
      return { name: 'Evening Routine & Shutdown', time: `${workEndStr} – Wind-down`, icon: '🌙' };
    } else {
      return { name: 'Night Sanctuary & Rest', time: 'Wind-down+', icon: '✨' };
    }
  });

  const getScheduleForHabit = (habit) => {
    if (!habit) return null;
    if (habit.startTime && habit.endTime) {
      return { start: habit.startTime, end: habit.endTime };
    }
    const match = (habit.name || '').match(/^(\d{2}:\d{2})/);
    if (match) {
      const start = match[1];
      const [h, m] = start.split(':').map(Number);
      const endMins = ((h * 60 + m + 30) % 1440);
      const eh = String(Math.floor(endMins / 60)).padStart(2, '0');
      const em = String(endMins % 60).padStart(2, '0');
      return { start, end: `${eh}:${em}` };
    }
    return null;
  };

  const calculateUpNextHabit = (visibleHabits, currentDay, isCurrentMonth, isHabitScheduledForDay, hasCompletedDay) => {
    if (!isCurrentMonth) return null;
    const now = currentClock?.value || new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const uncompleted = (visibleHabits || []).filter(h => isHabitScheduledForDay(h, currentDay) && !hasCompletedDay(h, currentDay));
    if (uncompleted.length === 0) return null;

    // Check Due Now
    for (const habit of uncompleted) {
      const sched = getScheduleForHabit(habit);
      if (sched) {
        const [sh, sm] = sched.start.split(':').map(Number);
        const [eh, em] = sched.end.split(':').map(Number);
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;
        if (currentMins >= startMins && currentMins <= endMins) {
          return {
            habit,
            status: 'due',
            badgeText: `DUE NOW (${sched.start})`,
            shortBadge: 'DUE NOW',
            timeLabel: `${sched.start}–${sched.end}`
          };
        }
      }
    }

    // Check Upcoming
    for (const habit of uncompleted) {
      const sched = getScheduleForHabit(habit);
      if (sched) {
        const [sh, sm] = sched.start.split(':').map(Number);
        const startMins = sh * 60 + sm;
        if (startMins > currentMins) {
          return {
            habit,
            status: 'upcoming',
            badgeText: `UP NEXT: ${sched.start}`,
            shortBadge: sched.start,
            timeLabel: `${sched.start}–${sched.end}`
          };
        }
      }
    }

    // Fallback to first uncompleted habit
    const first = uncompleted[0];
    return {
      habit: first,
      status: 'next',
      badgeText: 'UP NEXT',
      shortBadge: 'UP NEXT',
      timeLabel: 'Next pending'
    };
  };

  return {
    currentRoutineWindow,
    getScheduleForHabit,
    calculateUpNextHabit,
  };
}
