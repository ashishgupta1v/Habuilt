<script setup>
const props = defineProps({
  habits: {
    type: Array,
    default: () => [],
  },
  days: {
    type: Array,
    default: () => [],
  },
  pendingCells: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['complete']);

const isPending = (habitId, day) => !!props.pendingCells[`${habitId}:${day}`];
const isCompleted = (habit, day) => Array.isArray(habit.completedDays) && habit.completedDays.includes(day);

const requestComplete = (habit, day) => {
  if (isCompleted(habit, day) || isPending(habit.id, day)) {
    return;
  }

  emit('complete', { habit, day });
};
</script>

<template>
  <div class="habit-grid-wrap">
    <table class="habit-grid">
      <thead>
        <tr>
          <th class="habit-grid__sticky">Habit</th>
          <th class="habit-grid__pts">Pts</th>
          <th v-for="day in days" :key="`head-${day}`" class="habit-grid__day">{{ day }}</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="habit in habits" :key="habit.id">
          <td class="habit-grid__sticky habit-grid__name">{{ habit.name }}</td>
          <td class="habit-grid__pts">{{ habit.points }}</td>

          <td v-for="day in days" :key="`${habit.id}-${day}`" class="habit-grid__cell">
            <button
              class="habit-grid__check"
              :class="isCompleted(habit, day) ? 'habit-grid__check--done' : ''"
              :disabled="isCompleted(habit, day) || isPending(habit.id, day)"
              @click="requestComplete(habit, day)"
            >
              <span v-if="isPending(habit.id, day)">…</span>
              <span v-else-if="isCompleted(habit, day)">✓</span>
              <span v-else>•</span>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
