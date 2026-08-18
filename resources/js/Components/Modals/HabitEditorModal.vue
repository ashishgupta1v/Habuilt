<script setup>
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  RotateCcw,
  Archive,
  Plus,
  AlertCircle,
  Check,
} from 'lucide-vue-next';

const props = defineProps({
  habitsDraft: { type: Array, default: () => [] },
  draftHasErrors: { type: Boolean, default: false },
  habitSaveStatus: { type: String, default: 'idle' },
  missingDefaultHabits: { type: Array, default: () => [] },
});

const emit = defineEmits([
  'move-draft-habit',
  'remove-draft-habit',
  'toggle-archive',
  'add-draft-habit',
  'restore-defaults',
  'restore-single-default',
  'cancel',
  'save',
  'habit-swipe-start',
  'habit-swipe-end',
]);
</script>

<template>
  <div class="habits-editor">
    <p class="habits-editor__hint">
      Edit habit names and assign point values. Use arrow buttons to reorder by priority.
      Changes are saved securely to your account.
    </p>

    <div class="habits-editor__list">
      <div
        v-for="(habit, index) in habitsDraft"
        :key="habit.id"
        class="habits-editor__row"
        :class="{ 'habits-editor__row--archived': habit.archived }"
        @touchstart.passive="emit('habit-swipe-start', index, $event)"
        @touchend.passive="emit('habit-swipe-end', index, $event)"
      >
        <span class="habits-editor__num">{{ index + 1 }}</span>
        <div class="habits-editor__move" aria-label="Reorder habit">
          <button
            class="habits-editor__move-btn"
            :disabled="index === 0"
            @click="emit('move-draft-habit', index, index - 1)"
            title="Move up"
            type="button"
          >
            <ArrowUp class="icon-xs" />
          </button>
          <button
            class="habits-editor__move-btn"
            :disabled="index === habitsDraft.length - 1"
            @click="emit('move-draft-habit', index, index + 1)"
            title="Move down"
            type="button"
          >
            <ArrowDown class="icon-xs" />
          </button>
        </div>

        <input
          v-model="habit.name"
          type="text"
          class="habits-editor__name-input"
          :class="{ 'habits-editor__input--error': !habit.name.trim() }"
          placeholder="Habit name (e.g. 05:00 Alarm — Out of Bed)"
          maxlength="100"
          :disabled="habit.archived"
        />

        <label class="habits-editor__pts-label" title="Points earned when completed">
          <input
            v-model.number="habit.points"
            type="number"
            min="1"
            max="100"
            class="habits-editor__pts-input"
            :disabled="habit.archived"
          />
          <span class="habits-editor__pts-unit">pts</span>
        </label>

        <div class="habits-editor__row-actions">
          <button
            class="habits-editor__archive-btn"
            :class="{ 'habits-editor__archive-btn--active': habit.archived }"
            @click="emit('toggle-archive', habit)"
            :title="habit.archived ? 'Restore habit to active checklist' : 'Archive habit (hide from daily checklist)'"
            type="button"
          >
            <RotateCcw v-if="habit.archived" class="icon-xs" />
            <Archive v-else class="icon-xs" />
          </button>

          <button
            class="habits-editor__delete-btn"
            @click="emit('remove-draft-habit', index)"
            title="Delete habit"
            type="button"
            aria-label="Delete habit"
          >
            <Trash2 class="icon-xs" />
          </button>
        </div>
      </div>
    </div>

    <!-- Missing Default Habits restore panel -->
    <div v-if="missingDefaultHabits.length > 0" class="habits-editor__restore-panel">
      <span class="habits-editor__restore-label">
        <RotateCcw class="icon-xs" /> Available Default Habits ({{ missingDefaultHabits.length }} not in your list):
      </span>
      <div class="habits-editor__restore-chips">
        <button
          v-for="dh in missingDefaultHabits"
          :key="'restore-' + dh.id"
          class="habits-editor__restore-chip"
          @click="emit('restore-single-default', dh)"
          type="button"
          :title="`Add '${dh.name}' back (+${dh.points} pts)`"
        >
          <Plus class="icon-xs" /> {{ dh.name }}
        </button>
      </div>
    </div>

    <!-- Error message banner -->
    <div v-if="draftHasErrors" class="habits-editor__error">
      <AlertCircle class="icon-xs" /> All habits must have a name.
    </div>

    <!-- Actions toolbar -->
    <div class="habits-editor__actions">
      <div class="habits-editor__actions-left">
        <button class="btn btn--secondary" @click="emit('add-draft-habit')" type="button">
          <Plus class="icon-sm" />
          <span>Add Habit</span>
        </button>
        <button class="btn btn--secondary" @click="emit('restore-defaults')" type="button">
          <RotateCcw class="icon-sm" />
          <span>Restore All Defaults</span>
        </button>
      </div>

      <div class="habits-editor__actions-right">
        <button class="btn btn--secondary" @click="emit('cancel')" type="button">Cancel</button>
        <button
          class="btn btn--primary-action"
          :disabled="draftHasErrors || habitSaveStatus === 'saving'"
          @click="emit('save')"
          type="button"
        >
          <Check class="icon-sm" />
          <span>{{ habitSaveStatus === 'saving' ? 'Saving...' : 'Save Habits' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
