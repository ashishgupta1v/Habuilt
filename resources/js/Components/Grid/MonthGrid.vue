<script setup>
import { Clock } from 'lucide-vue-next';

const props = defineProps({
  visibleHabits: { type: Array, default: () => [] },
  days: { type: Array, default: () => [] },
  currentDay: { type: Number, default: 1 },
  isCurrentMonth: { type: Boolean, default: true },
  isWeekendDay: { type: Function, required: true },
  isHabitUpNext: { type: Function, required: true },
  upNextHabitInfo: { type: Object, default: null },
  getHabitTier: { type: Function, required: true },
  getTierDescriptions: { type: Function, required: true },
  tierColorClass: { type: Function, required: true },
  hasCompletedDay: { type: Function, required: true },
  isFutureDay: { type: Function, required: true },
  isPending: { type: Function, required: true },
  cellAriaLabel: { type: Function, required: true },
  cellTooltip: { type: Function, required: true },
  getDayTotal: { type: Function, required: true },
  mobileViewMode: { type: String, default: 'daily' },
});

const emit = defineEmits(['toggle-cell']);
</script>

<template>
  <div class="habit-grid-wrap" :class="{ 'habit-grid-wrap--mobile-hidden': mobileViewMode === 'daily' }">
    <table class="habit-grid">
      <thead>
        <tr>
          <th class="habit-grid__sticky">Core Habit (Leading Indicator)</th>
          <th class="habit-grid__pts">Pts</th>
          <th
            v-for="day in days"
            :key="`head-${day}`"
            class="habit-grid__day"
            :class="[
              isCurrentMonth && day === currentDay ? 'habit-grid__day--current' : '',
              isWeekendDay(day) ? 'habit-grid__day--weekend' : '',
            ]"
          >
            {{ day }}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="habit in visibleHabits"
          :key="habit.id"
          class="habit-grid__row"
          :class="{ 'habit-grid__row--up-next': isCurrentMonth && isHabitUpNext(habit) }"
        >
          <td
            class="habit-grid__sticky habit-grid__name"
            :class="{
              'habit-grid__name--shared': habit.name.startsWith('★'),
              'habit-grid__name--up-next': isCurrentMonth && isHabitUpNext(habit)
            }"
          >
            <span
              class="habit-grid__name-text"
              :title="habit.hint ? (habit.name + '\n\n💡 Instructions:\n' + habit.hint) : habit.name"
            >
              {{ habit.name }}
            </span>
            <span
              v-if="isCurrentMonth && isHabitUpNext(habit)"
              class="habit-grid__up-next-pill"
              :class="{ 'habit-grid__up-next-pill--due': upNextHabitInfo?.status === 'due' }"
              :title="'Scheduled: ' + (upNextHabitInfo?.timeLabel || '')"
            >
              <Clock class="icon-xs" /> {{ upNextHabitInfo?.badgeText || 'UP NEXT' }}
            </span>
            <span
              class="tier-badge tier-badge--grid"
              :class="tierColorClass(getHabitTier(habit.id))"
              :title="getTierDescriptions(habit.id)[getHabitTier(habit.id) - 1]"
            >
              T{{ getHabitTier(habit.id) }}
            </span>
          </td>
          <td class="habit-grid__pts">{{ habit.points }}</td>

          <td
            v-for="day in days"
            :key="`${habit.id}-${day}`"
            class="habit-grid__cell"
            :class="[
              hasCompletedDay(habit, day) ? 'habit-grid__cell--done' : '',
              isCurrentMonth && day === currentDay ? 'habit-grid__cell--current' : '',
              isWeekendDay(day) ? 'habit-grid__cell--weekend' : '',
              isFutureDay(day) ? 'habit-grid__cell--future' : '',
              isPending(habit.id, day) ? 'habit-grid__cell--pending' : '',
            ]"
            :title="cellTooltip(habit, day)"
            :aria-label="cellAriaLabel(habit, day)"
            role="button"
            tabindex="0"
            @click="emit('toggle-cell', habit, day)"
            @keydown.enter.prevent="emit('toggle-cell', habit, day)"
            @keydown.space.prevent="emit('toggle-cell', habit, day)"
          >
            <span v-if="isPending(habit.id, day)" class="habit-grid__cell-spin">…</span>
            <span v-else-if="hasCompletedDay(habit, day)" class="habit-grid__cell-mark">✓</span>
          </td>
        </tr>

        <!-- Daily Totals Row -->
        <tr class="habit-grid__row habit-grid__row--total">
          <td class="habit-grid__sticky habit-grid__name">Daily Total Points</td>
          <td class="habit-grid__pts"></td>
          <td
            v-for="day in days"
            :key="`total-${day}`"
            class="habit-grid__cell habit-grid__cell--total"
            :class="[
              isCurrentMonth && day === currentDay ? 'habit-grid__cell--current' : '',
              isWeekendDay(day) ? 'habit-grid__cell--weekend' : '',
              isFutureDay(day) ? 'habit-grid__cell--future' : '',
            ]"
          >
            {{ getDayTotal(day) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
