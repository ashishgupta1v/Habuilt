<script setup>
import { computed, ref } from 'vue';
import {
  Check,
  Clock,
  MessageSquare,
  Info,
  FileText,
  Edit2,
  MoreVertical,
} from 'lucide-vue-next';
import HabitGuidanceCard from './HabitGuidanceCard.vue';
import { getSharedHabitInfo } from '../../Composables/useHabitsState.js';
import { useAudioHapticFeedback } from '../../Composables/useAudioHapticFeedback.js';

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
  'edit-habit',
]);

const { triggerCelebrationFeedback } = useAudioHapticFeedback();
const sharedInfo = computed(() => getSharedHabitInfo(props.habit?.id));
const isSharedActivity = computed(() => !!sharedInfo.value || (props.habit?.name || '').startsWith('★'));

// Silky micro-celebration ripple
const celebratingNow = ref(false);

const handleCheckToggle = () => {
  if (props.isPending) return;
  if (!props.isDone) {
    celebratingNow.value = true;
    triggerCelebrationFeedback();
    setTimeout(() => {
      celebratingNow.value = false;
    }, 600);
  }
  emit('toggle-check');
};

const handleCardClick = () => {
  // Fast 1-tap card toggle for high-speed habit checkoffs
  handleCheckToggle();
};
</script>

<template>
  <div class="habit-card-wrapper">
    <div
      class="mobile-daily__card"
      :class="{
        'mobile-daily__card--done': isDone,
        'mobile-daily__card--shared': isSharedActivity,
        'mobile-daily__card--up-next': mobileDayIsToday && isUpNext && !isDone,
        'mobile-daily__card--future': mobileDayIsFuture,
        'mobile-daily__card--celebrating': celebratingNow,
        [`mobile-daily__card--cat-${getHabitCategory(habit)}`]: true
      }"
      tabindex="0"
      role="button"
      :aria-label="`${habit.name}, ${isDone ? 'Completed' : 'Pending'}. +${habit.points} points.`"
      @click="handleCardClick"
      @keydown.enter.prevent="handleCardClick"
      @keydown.space.prevent="handleCardClick"
    >
      <!-- UP NEXT Banner for active flow habit -->
      <span
        v-if="mobileDayIsToday && isUpNext && !isDone"
        class="mobile-daily__up-next-badge"
        :class="{ 'mobile-daily__up-next-badge--due': upNextInfo?.status === 'due' }"
      >
        <Clock class="icon-xs" /> {{ upNextInfo?.badgeText || 'UP NEXT' }}
      </span>

      <!-- 44×44px Accessible Isolated Check Target -->
      <button
        type="button"
        class="mobile-daily__card-check-btn"
        :class="{ 'mobile-daily__card-check-btn--done': isDone }"
        @click.stop="handleCheckToggle"
        :title="isDone ? 'Mark as incomplete' : 'Mark complete (+ ' + habit.points + ' XP)'"
        :aria-label="isDone ? 'Mark habit as incomplete' : 'Mark habit completed'"
      >
        <div class="mobile-daily__card-check">
          <span v-if="isPending" class="mobile-daily__spinner">…</span>
          <span v-else-if="isDone" class="mobile-daily__checkmark">
            <Check class="icon-check-mobile" />
          </span>
          <span v-else class="mobile-daily__circle"></span>
        </div>
      </button>

      <!-- Habit Body Info -->
      <div class="mobile-daily__card-body">
        <span class="mobile-daily__card-name">{{ habit.name }}</span>
        <span class="mobile-daily__card-meta">
          <span class="mobile-daily__card-category">{{ groupMeta.label }}</span>
          <span
            v-if="sharedInfo"
            class="habit-shared-badge"
            :title="'Aligned with ' + sharedInfo.partnerName + ': ' + sharedInfo.partnerAction"
          >
            {{ sharedInfo.badge }}
          </span>
          <span v-if="habit.scheduleLabel && scheduleFilterMode === 'all'" class="habit-schedule-badge">
            {{ habit.scheduleLabel }}
          </span>
          <button
            type="button"
            class="tier-badge tier-badge--inline"
            :class="tierColorClass(tier)"
            @click.stop="emit('toggle-tier-detail')"
            :title="`Tier ${tier}: Click to switch target tier`"
          >
            T{{ tier }}
          </button>
        </span>

        <!-- Tier Detail Expandable Selector -->
        <div v-if="tierDetailExpanded" class="tier-detail-expand" @click.stop>
          <div
            v-for="t in 4"
            :key="'td-' + t"
            class="tier-detail-row"
            :class="{ 'tier-detail-row--current': tier === t }"
          >
            <span class="tier-detail-label" :class="tierColorClass(t)">T{{ t }}</span>
            <span class="tier-detail-desc">{{ tierDescriptions[t - 1] }}</span>
            <button
              v-if="tier !== t"
              type="button"
              class="tier-detail-set"
              @click.stop="emit('set-tier', t)"
            >
              Set
            </button>
            <Check v-else class="icon-xs tier-detail-active" />
          </div>
        </div>
      </div>

      <!-- Right Meta: Points & Isolated Action Buttons -->
      <div class="mobile-daily__card-right" @click.stop>
        <span class="mobile-daily__card-pts mono-num">
          +{{ habit.points }}<small>pt{{ habit.points !== 1 ? 's' : '' }}</small>
        </span>

        <!-- Habit Options / Details & Note Toggle (Isolated Touch Area) -->
        <button
          type="button"
          class="habit-action-btn habit-note-btn"
          :class="{
            'habit-note-btn--has': !!noteValue,
            'habit-note-btn--open': noteOpen,
            'habit-note-btn--hint': !!habit.hint
          }"
          @click.stop="emit('toggle-note')"
          :title="habit.hint ? 'View instructions & daily note' : 'Habit options & notes'"
          :aria-label="'Instructions and notes for ' + habit.name"
        >
          <Info v-if="habit.hint && !noteValue" class="icon-xs habit-note-btn__icon" />
          <FileText v-else-if="noteValue" class="icon-xs habit-note-btn__icon" />
          <MoreVertical v-else class="icon-xs habit-note-btn__icon" />
        </button>
      </div>
    </div>

    <!-- Habit Note Input & Guidance Drawer -->
    <div v-if="noteOpen" class="habit-note-input" @click.stop>
      <div class="habit-drawer-toolbar">
        <button
          type="button"
          class="habit-drawer-edit-btn habit-edit-card-btn"
          @click.stop="emit('edit-habit', habit)"
          title="Edit habit details, time & points"
        >
          <Edit2 class="icon-xs" />
          <span>Edit Habit & Points</span>
        </button>
      </div>
      <div v-if="sharedInfo" class="habit-shared-partner-notice">
        <span class="habit-shared-partner-notice__icon">👫</span>
        <div class="habit-shared-partner-notice__content">
          <strong>Couple Alignment: {{ sharedInfo.partnerName }}</strong>
          <p>{{ sharedInfo.partnerAction }}</p>
        </div>
      </div>
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
