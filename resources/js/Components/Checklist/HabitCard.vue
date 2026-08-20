<script setup>
import { computed } from 'vue';
import {
  Check,
  Clock,
  MessageSquare,
  Info,
  FileText,
} from 'lucide-vue-next';
import HabitGuidanceCard from './HabitGuidanceCard.vue';

const props = defineProps({
  habit: { type: Object, required: true },
  groupMeta: { type: Object, required: true },
  mobileDay: { type: Number, required: true },
  mobileDayIsToday: { type: Boolean, default: true },
  mobileDayIsFuture: { type: Boolean, default: false },
  isUpNext: { type: Boolean, default: false },
  upNextInfo: { type: Object, default: null },
  isDone: { type: Boolean, default: false },
  isPending: { type: Boolean, default: false },
  tier: { type: Number, default: 1 },
  tierDescriptions: { type: Array, default: () => [] },
  tierColorClass: { type: Function, required: true },
  getHabitCategory: { type: Function, required: true },
  tierDetailExpanded: { type: Boolean, default: false },
  noteOpen: { type: Boolean, default: false },
  noteValue: { type: String, default: '' },
  scheduleFilterMode: { type: String, default: 'scheduled' },
});

const emit = defineEmits([
  'toggle-check',
  'toggle-tier-detail',
  'set-tier',
  'toggle-note',
  'update-note',
]);

const handleCardClick = () => {
  if (props.isPending) return;
  emit('toggle-check');
};
</script>

<template>
  <div>
    <div
      class="mobile-daily__card"
      :class="{
        'mobile-daily__card--done': isDone,
        'mobile-daily__card--shared': habit.name.startsWith('★'),
        'mobile-daily__card--up-next': mobileDayIsToday && isUpNext && !isDone,
        'mobile-daily__card--future': mobileDayIsFuture,
        [`mobile-daily__card--cat-${getHabitCategory(habit)}`]: true
      }"
      tabindex="0"
      role="button"
      style="touch-action: manipulation; -webkit-tap-highlight-color: transparent;"
      @click="handleCardClick"
      @keydown.enter.prevent="handleCardClick"
      @keydown.space.prevent="handleCardClick"
    >
      <span v-if="mobileDayIsToday && isUpNext && !isDone" class="mobile-daily__up-next-badge" :class="{ 'mobile-daily__up-next-badge--due': upNextInfo?.status === 'due' }">
        <Clock class="icon-xs" /> {{ upNextInfo?.badgeText || 'UP NEXT' }}
      </span>

      <div class="mobile-daily__card-check" @click.stop="handleCardClick">
        <span v-if="isPending" class="mobile-daily__spinner">…</span>
        <span v-else-if="isDone" class="mobile-daily__checkmark">
          <Check class="icon-check-mobile" />
        </span>
        <span v-else class="mobile-daily__circle"></span>
      </div>

      <div class="mobile-daily__card-body" @click.stop="handleCardClick">
        <span class="mobile-daily__card-name">{{ habit.name }}</span>
        <span class="mobile-daily__card-meta">
          <span class="mobile-daily__card-category">{{ groupMeta.label }}</span>
          <span v-if="habit.scheduleLabel && scheduleFilterMode === 'all'" class="habit-schedule-badge">
            {{ habit.scheduleLabel }}
          </span>
          <span class="tier-badge tier-badge--inline" :class="tierColorClass(tier)" @click.stop="emit('toggle-tier-detail')">
            T{{ tier }}
          </span>
        </span>

        <!-- Tier Detail Expand -->
        <div v-if="tierDetailExpanded" class="tier-detail-expand" @click.stop>
          <div v-for="t in 4" :key="'td-' + t" class="tier-detail-row" :class="{ 'tier-detail-row--current': tier === t }">
            <span class="tier-detail-label" :class="tierColorClass(t)">T{{ t }}</span>
            <span class="tier-detail-desc">{{ tierDescriptions[t - 1] }}</span>
            <button v-if="tier !== t" class="tier-detail-set" @click.stop="emit('set-tier', t)">Set</button>
            <Check v-else class="icon-xs tier-detail-active" />
          </div>
        </div>
      </div>

      <!-- Right Meta: Points & Instructions/Note Action -->
      <div class="mobile-daily__card-right">
        <span class="mobile-daily__card-pts">
          +{{ habit.points }}<small>pt{{ habit.points !== 1 ? 's' : '' }}</small>
        </span>

        <!-- Habit Instruction & Note Toggle -->
        <button
          type="button"
          class="habit-note-btn"
          :class="{
            'habit-note-btn--has': !!noteValue,
            'habit-note-btn--open': noteOpen,
            'habit-note-btn--hint': !!habit.hint
          }"
          @click.stop="emit('toggle-note')"
          :title="habit.hint ? 'View instructions & daily note' : 'Add quick note'"
          :aria-label="'Instructions and notes for ' + habit.name"
        >
          <Info v-if="habit.hint && !noteValue" class="icon-xs habit-note-btn__icon" />
          <FileText v-else-if="noteValue" class="icon-xs habit-note-btn__icon" />
          <MessageSquare v-else class="icon-xs habit-note-btn__icon" />
        </button>
      </div>
    </div>

    <!-- Habit Note Input & Guidance Drawer -->
    <div v-if="noteOpen" class="habit-note-input" @click.stop>
      <HabitGuidanceCard :hint="habit.hint" />
      <textarea
        :value="noteValue"
        @input="emit('update-note', $event.target.value)"
        rows="2"
        :placeholder="'Quick note / log about ' + habit.name + ' today...'"
      ></textarea>
    </div>
  </div>
</template>
