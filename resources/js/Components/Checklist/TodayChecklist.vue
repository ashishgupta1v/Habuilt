<script setup>
import { computed } from 'vue';
import {
  ChevronLeft,
  ChevronRight,
  Plane,
  MapPin,
  ToggleRight,
  ToggleLeft,
  Sparkles,
  Plus,
  RotateCcw,
} from 'lucide-vue-next';
import TimeSlotAccordion from './TimeSlotAccordion.vue';
import HabitCard from './HabitCard.vue';

const props = defineProps({
  mobileDay: { type: Number, required: true },
  mobileDayLabel: { type: String, default: '' },
  mobileDayIsToday: { type: Boolean, default: true },
  mobileDayIsFuture: { type: Boolean, default: false },
  isWeekend: { type: Boolean, default: false },
  monthDays: { type: Number, default: 31 },
  activeTimeFilter: { type: String, default: 'all' },
  timeSlotCounts: { type: Object, required: true },
  timeSlotCompleted: { type: Object, required: true },
  getCurrentTimeBlock: { type: Function, required: true },
  isAshish: { type: Boolean, default: false },
  travelMode: { type: Boolean, default: false },
  mobileDayCompleted: { type: Number, default: 0 },
  totalHabits: { type: Number, default: 0 },
  mobileDayPoints: { type: Number, default: 0 },
  maxDailyPoints: { type: Number, default: 0 },
  visibleHabits: { type: Array, default: () => [] },
  missingDefaultHabits: { type: Array, default: () => [] },
  timelineGroupedHabits: { type: Array, default: () => [] },
  isSlotCollapsed: { type: Function, required: true },
  isHabitUpNext: { type: Function, required: true },
  upNextHabitInfo: { type: Object, default: null },
  hasCompletedDay: { type: Function, required: true },
  pendingCells: { type: Object, default: () => ({}) },
  keyFor: { type: Function, required: true },
  getHabitTier: { type: Function, required: true },
  getTierDescriptions: { type: Function, required: true },
  tierColorClass: { type: Function, required: true },
  getHabitCategory: { type: Function, required: true },
  tierDetailHabitId: { type: String, default: null },
  habitNotesOpen: { type: String, default: null },
  getHabitNote: { type: Function, required: true },
  onTouchStart: { type: Function, required: true },
  onTouchEnd: { type: Function, required: true },
  scheduleFilterMode: { type: String, default: 'scheduled' },
  scheduledHabitsCount: { type: Number, default: 0 },
  totalMasterHabitsCount: { type: Number, default: 0 },
});

const emit = defineEmits([
  'prev-day',
  'next-day',
  'go-today',
  'update:activeTimeFilter',
  'toggle-travel',
  'start-editing',
  'restore-defaults',
  'toggle-slot-collapse',
  'toggle-habit',
  'toggle-tier-detail',
  'set-tier',
  'toggle-note',
  'set-note',
  'toggle-schedule-filter',
]);
</script>

<template>
  <div
    class="mobile-daily"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <!-- Consolidated Day Navigator & Schedule Mode -->
    <div class="mobile-daily__nav">
      <button
        class="mobile-daily__nav-btn"
        :disabled="mobileDay <= 1"
        @click="emit('prev-day')"
        aria-label="Previous Day"
      >
        <ChevronLeft class="icon-sm" />
      </button>
      <div class="mobile-daily__nav-center">
        <div class="mobile-daily__nav-title-row">
          <span class="mobile-daily__nav-label" :class="{ 'mobile-daily__nav-label--today': mobileDayIsToday }">
            {{ mobileDayLabel }}
          </span>
          <span v-if="mobileDayIsToday" class="mobile-daily__today-badge">TODAY</span>
          <button v-else class="mobile-daily__today-link" @click="emit('go-today')">
            Jump to today
          </button>
        </div>
        <!-- Compact Inline Schedule Mode Chip -->
        <button
          type="button"
          class="mobile-daily__schedule-chip"
          :class="{ 'mobile-daily__schedule-chip--active': scheduleFilterMode === 'scheduled' }"
          @click="emit('toggle-schedule-filter')"
          :title="scheduleFilterMode === 'scheduled' ? 'Showing habits scheduled specifically for today. Tap to show master list.' : 'Showing master list. Tap to show scheduled routine.'"
        >
          <Sparkles class="icon-xs" />
          <span v-if="scheduleFilterMode === 'scheduled'">{{ scheduledHabitsCount }} scheduled</span>
          <span v-else>Master ({{ totalMasterHabitsCount }})</span>
        </button>
      </div>
      <button
        class="mobile-daily__nav-btn"
        :disabled="mobileDay >= monthDays || mobileDayIsFuture"
        @click="emit('next-day')"
        aria-label="Next Day"
      >
        <ChevronRight class="icon-sm" />
      </button>
    </div>

    <!-- Future Day Interactive Alert Banner -->
    <div v-if="mobileDayIsFuture" class="future-day-alert-banner" @click="emit('go-today')">
      <div class="future-alert-left">
        <Sparkles class="icon-sm icon-gold" />
        <span>Viewing Future Day ({{ mobileDayLabel }}). Tap to <strong>Jump to Today</strong></span>
      </div>
      <button type="button" class="btn-jump-today">Jump to Today</button>
    </div>

    <!-- Time-Slot Filter Carousel Pills (Compact & Smooth) -->
    <div class="time-filter-bar">
      <button
        class="time-filter-pill"
        :class="{ 'time-filter-pill--active': activeTimeFilter === 'all' }"
        @click="emit('update:activeTimeFilter', 'all')"
      >
        <span class="time-filter-pill__label">All</span>
        <span class="time-filter-pill__count mono-num">{{ timeSlotCompleted.all }}/{{ timeSlotCounts.all }}</span>
      </button>
      <button
        v-if="timeSlotCounts.morning > 0"
        class="time-filter-pill"
        :class="{
          'time-filter-pill--active': activeTimeFilter === 'morning',
          'time-filter-pill--current': getCurrentTimeBlock() === 'morning' && activeTimeFilter === 'all'
        }"
        @click="emit('update:activeTimeFilter', activeTimeFilter === 'morning' ? 'all' : 'morning')"
      >
        <span class="time-filter-pill__label">Morning</span>
        <span class="time-filter-pill__count mono-num">{{ timeSlotCompleted.morning }}/{{ timeSlotCounts.morning }}</span>
      </button>
      <button
        v-if="timeSlotCounts.work > 0"
        class="time-filter-pill"
        :class="{
          'time-filter-pill--active': activeTimeFilter === 'work',
          'time-filter-pill--current': getCurrentTimeBlock() === 'work' && activeTimeFilter === 'all'
        }"
        @click="emit('update:activeTimeFilter', activeTimeFilter === 'work' ? 'all' : 'work')"
      >
        <span class="time-filter-pill__label">{{ isWeekend ? 'Weekend' : 'Work' }}</span>
        <span class="time-filter-pill__count mono-num">{{ timeSlotCompleted.work }}/{{ timeSlotCounts.work }}</span>
      </button>
      <button
        v-if="timeSlotCounts.evening > 0"
        class="time-filter-pill"
        :class="{
          'time-filter-pill--active': activeTimeFilter === 'evening',
          'time-filter-pill--current': getCurrentTimeBlock() === 'evening' && activeTimeFilter === 'all'
        }"
        @click="emit('update:activeTimeFilter', activeTimeFilter === 'evening' ? 'all' : 'evening')"
      >
        <span class="time-filter-pill__label">Evening</span>
        <span class="time-filter-pill__count mono-num">{{ timeSlotCompleted.evening }}/{{ timeSlotCounts.evening }}</span>
      </button>
      <button
        v-if="timeSlotCounts.anytime > 0"
        class="time-filter-pill"
        :class="{ 'time-filter-pill--active': activeTimeFilter === 'anytime' }"
        @click="emit('update:activeTimeFilter', activeTimeFilter === 'anytime' ? 'all' : 'anytime')"
      >
        <span class="time-filter-pill__label">Health</span>
        <span class="time-filter-pill__count mono-num">{{ timeSlotCompleted.anytime }}/{{ timeSlotCounts.anytime }}</span>
      </button>
      <button
        v-if="timeSlotCounts.weekly > 0"
        class="time-filter-pill"
        :class="{ 'time-filter-pill--active': activeTimeFilter === 'weekly' }"
        @click="emit('update:activeTimeFilter', activeTimeFilter === 'weekly' ? 'all' : 'weekly')"
      >
        <span class="time-filter-pill__label">Weekly</span>
        <span class="time-filter-pill__count mono-num">{{ timeSlotCompleted.weekly }}/{{ timeSlotCounts.weekly }}</span>
      </button>
    </div>

    <!-- Slim Daily Execution Progress Line -->
    <div class="mobile-daily__progress">
      <div class="mobile-daily__progress-bar">
        <div
          class="mobile-daily__progress-fill"
          :style="{ width: totalHabits > 0 ? (mobileDayCompleted / totalHabits * 100) + '%' : '0%' }"
        ></div>
      </div>
      <div class="mobile-daily__progress-stats">
        <span><strong>{{ mobileDayCompleted }}</strong>/{{ totalHabits }} habits completed</span>
        <span><strong>{{ mobileDayPoints }}</strong>/{{ maxDailyPoints }} pts earned</span>
      </div>
    </div>

    <!-- Timeline-Grouped Habit Cards -->
    <div class="mobile-daily__list">
      <!-- Empty state -->
      <div v-if="visibleHabits.length === 0" class="checklist-empty">
        <div class="checklist-empty__icon"><Sparkles class="icon-md" /></div>
        <h3 class="checklist-empty__title">Your checklist is empty</h3>
        <p class="checklist-empty__body">
          Add habits that fit your life — even 3–5 to start is enough.
          You can archive or remove any of them anytime.
        </p>
        <div class="checklist-empty__actions">
          <button class="btn btn--primary-action" @click="emit('start-editing')">
            <Plus class="icon-sm" /> <span>Add Your First Habits</span>
          </button>
          <button v-if="missingDefaultHabits.length > 0" class="btn btn--secondary" @click="emit('restore-defaults')">
            <RotateCcw class="icon-sm" /> <span>Load Starter Preset ({{ missingDefaultHabits.length }})</span>
          </button>
        </div>
      </div>

      <!-- Accordion Slot Groups -->
      <template v-for="group in timelineGroupedHabits" :key="'tg-' + group.slot">
        <TimeSlotAccordion
          :group="group"
          :mobile-day="mobileDay"
          :is-collapsed="isSlotCollapsed(group.slot, group.habits, mobileDay)"
          :completed-count="group.habits.filter(h => hasCompletedDay(h, mobileDay)).length"
          @toggle-collapse="emit('toggle-slot-collapse', group.slot, group.habits, mobileDay)"
        />

        <!-- Render habits in slot when not collapsed -->
        <template v-if="!isSlotCollapsed(group.slot, group.habits, mobileDay)">
          <HabitCard
            v-for="habit in group.habits"
            :key="'m-' + habit.id"
            :habit="habit"
            :group-meta="group.meta"
            :mobile-day="mobileDay"
            :mobile-day-is-today="mobileDayIsToday"
            :mobile-day-is-future="mobileDayIsFuture"
            :is-up-next="isHabitUpNext(habit)"
            :up-next-info="upNextHabitInfo"
            :is-done="hasCompletedDay(habit, mobileDay)"
            :is-pending="!!pendingCells[keyFor(habit.id, mobileDay)]"
            :tier="getHabitTier(habit.id)"
            :tier-descriptions="getTierDescriptions(habit.id)"
            :tier-color-class="tierColorClass"
            :get-habit-category="getHabitCategory"
            :tier-detail-expanded="tierDetailHabitId === habit.id"
            :note-open="habitNotesOpen === habit.id + ':' + mobileDay"
            :note-value="getHabitNote(habit.id, mobileDay)"
            :schedule-filter-mode="scheduleFilterMode"
            @toggle-check="emit('toggle-habit', habit, mobileDay)"
            @toggle-tier-detail="emit('toggle-tier-detail', habit.id)"
            @set-tier="(t) => emit('set-tier', habit.id, t)"
            @toggle-note="emit('toggle-note', habit.id, mobileDay)"
            @update-note="(val) => emit('set-note', habit.id, mobileDay, val)"
          />
        </template>
      </template>
    </div>
  </div>
</template>
