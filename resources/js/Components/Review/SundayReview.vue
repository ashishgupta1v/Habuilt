<script setup>
import {
  Compass,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-vue-next';

const props = defineProps({
  weeklyReviewExpanded: { type: Boolean, default: false },
  weeklySnapshotLabel: { type: String, default: '0%' },
  monthlySnapshotLabel: { type: String, default: '0%' },
  weeklyReview: { type: Object, required: true },
});

const emit = defineEmits([
  'toggle-expand',
  'fill-metrics',
  'save-review',
]);
</script>

<template>
  <div class="weekly-review-wrap">
    <div class="section-head section-head--collapsible" @click="emit('toggle-expand')">
      <div class="review-header-bar">
        <h2 class="section-title">
          <span class="section-title__icon">
            <Compass class="icon-md" />
          </span>
          <span>Sunday Review</span>
          <ChevronDown v-if="!weeklyReviewExpanded" class="icon-sm collapse-chevron" />
          <ChevronUp v-else class="icon-sm collapse-chevron" />
        </h2>
        <!-- Inline auto-metrics summary when collapsed -->
        <div v-if="!weeklyReviewExpanded" class="review-inline-metrics">
          <span class="review-inline-stat mono-num">W: {{ weeklySnapshotLabel }}</span>
          <span class="review-inline-stat mono-num">M: {{ monthlySnapshotLabel }}</span>
        </div>
      </div>
      <button class="btn btn--secondary" @click.stop="emit('fill-metrics')">
        <Sparkles class="icon-sm" />
        <span>Auto Fill</span>
      </button>
    </div>

    <div v-show="weeklyReviewExpanded" class="collapsible-body">
      <!-- Compact Metrics Row -->
      <div class="review-metrics-strip">
        <div class="review-metric-cell">
          <span class="review-metric-cell__label">Weekly Avg</span>
          <strong class="review-metric-cell__val mono-num">{{ weeklySnapshotLabel }}</strong>
        </div>
        <div class="review-metric-cell">
          <span class="review-metric-cell__label">Monthly Avg</span>
          <strong class="review-metric-cell__val mono-num">{{ monthlySnapshotLabel }}</strong>
        </div>
      </div>

      <!-- Compact 4-Quadrant Reflection Grid -->
      <div class="reflection-compact-grid">
        <label>
          <span class="reflection-compact__label">Top Wins &amp; Highlights</span>
          <textarea v-model="weeklyReview.reflections.wins" rows="1" placeholder="What worked well this week..." @blur="emit('save-review')" />
        </label>
        <label>
          <span class="reflection-compact__label">Friction &amp; Root Causes</span>
          <textarea v-model="weeklyReview.reflections.challenges" rows="1" placeholder="What caused resistance..." @blur="emit('save-review')" />
        </label>
        <label>
          <span class="reflection-compact__label">Health Check</span>
          <textarea v-model="weeklyReview.reflections.healthCheck" rows="1" placeholder="Sleep, stress, energy" @blur="emit('save-review')" />
        </label>
        <label class="reflection-compact__wide">
          <span class="reflection-compact__label">Next Week Focus</span>
          <textarea v-model="weeklyReview.reflections.nextWeekFocus" rows="1" placeholder="Non-negotiable outcomes..." @blur="emit('save-review')" />
        </label>
      </div>
    </div>
  </div>
</template>
