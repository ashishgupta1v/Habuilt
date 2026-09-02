<script setup>
import {
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Circle,
} from 'lucide-vue-next';

const props = defineProps({
  group: { type: Object, required: true },
  mobileDay: { type: Number, required: true },
  isCollapsed: { type: Boolean, default: false },
  completedCount: { type: Number, default: 0 },
});

const emit = defineEmits(['toggle-collapse']);
</script>

<template>
  <div>
    <!-- Time Slot Header (Accordion Trigger) -->
    <div
      class="timeline-slot-header"
      :class="[
        'timeline-slot-header--' + group.slot,
        { 'timeline-slot-header--collapsed': isCollapsed }
      ]"
      @click="emit('toggle-collapse')"
      @keydown.enter="emit('toggle-collapse')"
      @keydown.space.prevent="emit('toggle-collapse')"
      role="button"
      tabindex="0"
      :aria-expanded="!isCollapsed"
    >
      <div class="timeline-slot-header__left">
        <span class="timeline-slot-emoji">{{ group.meta.emoji }}</span>
        <span class="timeline-slot-label">{{ group.meta.label }}</span>
        <span class="timeline-slot-time">{{ group.meta.time }}</span>
      </div>
      <div class="timeline-slot-header__right">
        <span
          class="timeline-slot-count"
          :class="{ 'timeline-slot-complete-badge': completedCount === group.habits.length && group.habits.length > 0 }"
        >
          {{ completedCount }}/{{ group.habits.length }}
          <span v-if="completedCount === group.habits.length && group.habits.length > 0">✓</span>
        </span>
        <ChevronUp v-if="!isCollapsed" class="icon-xs timeline-slot-chevron" />
        <ChevronDown v-else class="icon-xs timeline-slot-chevron" />
      </div>
    </div>

    <!-- Collapsed Compact Pill -->
    <div
      v-if="isCollapsed"
      class="timeline-slot-collapsed-pill"
      role="button"
      tabindex="0"
      @click="emit('toggle-collapse')"
      @keydown.enter="emit('toggle-collapse')"
      @keydown.space.prevent="emit('toggle-collapse')"
      aria-label="Expand time slot"
    >
      <span class="timeline-slot-collapsed-pill__text">
        <CheckCircle2 v-if="completedCount === group.habits.length && group.habits.length > 0" class="icon-xs icon-success" />
        <Circle v-else class="icon-xs" />
        {{ completedCount === group.habits.length && group.habits.length > 0 ? 'All ' + group.habits.length + ' activities completed' : group.habits.length + ' activities hidden' }}
      </span>
      <span class="timeline-slot-collapsed-pill__action">Expand</span>
    </div>
  </div>
</template>
