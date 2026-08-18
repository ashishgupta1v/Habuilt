<script setup>
import { ref } from 'vue';
import {
  Compass,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Circle,
  Award,
  TrendingUp,
  Check,
  Calendar,
  Shield,
  Heart,
  Target,
} from 'lucide-vue-next';

const props = defineProps({
  weeklyReviewExpanded: { type: Boolean, default: true },
  weeklySnapshotLabel: { type: String, default: '0%' },
  monthlySnapshotLabel: { type: String, default: '0%' },
  weeklyPoints: { type: Number, default: 0 },
  monthlyPoints: { type: Number, default: 0 },
  weeklyReview: { type: Object, required: true },
});

const emit = defineEmits([
  'toggle-expand',
  'fill-metrics',
  'save-review',
]);

const saveFeedback = ref(false);

const handleSave = () => {
  emit('save-review');
  saveFeedback.value = true;
  setTimeout(() => {
    saveFeedback.value = false;
  }, 2000);
};

const defaultChecks = [
  'I reviewed missed days and found one clear root cause.',
  'Family & non-negotiable personal blocks happened first.',
  'Evening hard stop held with screens out of bedroom.',
  'Sleep stayed above 7-hour floor.',
  'I reviewed my reward wallet balance and redemptions.',
  'I graduated max one habit this week (1% rule).',
];
</script>

<template>
  <div class="sunday-review-card">
    <!-- Header -->
    <div class="sunday-review-head">
      <div class="sunday-review-head__left" @click="emit('toggle-expand')">
        <div class="sunday-review-icon-wrap">
          <Compass class="icon-md icon-compass-gold" />
        </div>
        <div>
          <div class="sunday-review-title-row">
            <h3 class="sunday-review-title">Sunday Weekly Review</h3>
            <span v-if="weeklyReview.reviewDate" class="sunday-review-date-badge mono-num">
              {{ weeklyReview.reviewDate }}
            </span>
          </div>
          <p class="sunday-review-sub">Weekly accountability ritual &amp; system optimization</p>
        </div>
      </div>

      <div class="sunday-review-head__actions">
        <button
          type="button"
          class="btn btn--secondary btn--sm sunday-autofill-btn"
          @click="emit('fill-metrics')"
          title="Auto-calculate this week's points and consistency"
        >
          <Sparkles class="icon-xs" />
          <span>Auto-Fill Metrics</span>
        </button>
        <button
          type="button"
          class="btn btn--icon-only"
          @click="emit('toggle-expand')"
          aria-label="Toggle Sunday Review"
        >
          <ChevronUp v-if="weeklyReviewExpanded" class="icon-sm" />
          <ChevronDown v-else class="icon-sm" />
        </button>
      </div>
    </div>

    <!-- Body -->
    <div v-show="weeklyReviewExpanded" class="sunday-review-body">
      <!-- 4 Key Metrics Bar -->
      <div class="sunday-metrics-grid">
        <div class="sunday-metric-tile">
          <span class="sunday-metric-tile__label">Week Points</span>
          <strong class="sunday-metric-tile__val mono-num">
            {{ weeklyReview.metrics?.weeklyPoints || weeklyPoints }} <small>pts</small>
          </strong>
        </div>
        <div class="sunday-metric-tile">
          <span class="sunday-metric-tile__label">Week Consistency</span>
          <strong class="sunday-metric-tile__val mono-num">
            {{ weeklyReview.metrics?.weeklyStickiness || weeklySnapshotLabel }}
          </strong>
        </div>
        <div class="sunday-metric-tile">
          <span class="sunday-metric-tile__label">Month Total</span>
          <strong class="sunday-metric-tile__val mono-num">
            {{ weeklyReview.metrics?.monthlyPoints || monthlyPoints }} <small>pts</small>
          </strong>
        </div>
        <div class="sunday-metric-tile">
          <span class="sunday-metric-tile__label">Month Stickiness</span>
          <strong class="sunday-metric-tile__val mono-num">
            {{ weeklyReview.metrics?.monthlyStickiness || monthlySnapshotLabel }}
          </strong>
        </div>
      </div>

      <!-- Accountability Checkpoints -->
      <div class="sunday-section">
        <label class="sunday-section-title">
          <Shield class="icon-xs icon-gold" />
          <span>Execution Honesty Checks</span>
        </label>
        <div class="sunday-checks-list">
          <div
            v-for="(check, idx) in (weeklyReview.checks || [])"
            :key="'chk-' + idx"
            class="sunday-check-row"
            :class="{ 'sunday-check-row--done': check.done }"
            @click="check.done = !check.done; handleSave()"
          >
            <CheckCircle2 v-if="check.done" class="icon-sm icon-check-done" />
            <Circle v-else class="icon-sm icon-check-circle" />
            <span class="sunday-check-text">{{ check.text }}</span>
          </div>
        </div>
      </div>

      <!-- Reflection Prompt Quadrants -->
      <div class="sunday-section">
        <label class="sunday-section-title">
          <Target class="icon-xs icon-gold" />
          <span>System Reflections &amp; Next Week Intentions</span>
        </label>
        <div class="sunday-reflections-grid">
          <div class="sunday-reflection-box">
            <span class="sunday-reflection-label">🌟 Big Wins &amp; Breakthroughs</span>
            <textarea
              v-model="weeklyReview.reflections.wins"
              rows="3"
              placeholder="What habits flowed effortlessly? What wins deserve celebrating?"
              class="sunday-textarea"
              @blur="handleSave"
            ></textarea>
          </div>

          <div class="sunday-reflection-box">
            <span class="sunday-reflection-label">⚠️ Friction, Triggers &amp; Misses</span>
            <textarea
              v-model="weeklyReview.reflections.misses"
              rows="3"
              placeholder="Where was there resistance? What trigger caused missed habits?"
              class="sunday-textarea"
              @blur="handleSave"
            ></textarea>
          </div>

          <div class="sunday-reflection-box">
            <span class="sunday-reflection-label">🩺 Energy &amp; Health Check</span>
            <textarea
              v-model="weeklyReview.reflections.healthCheck"
              rows="3"
              placeholder="Sleep quality, hydration, recovery, mental clarity..."
              class="sunday-textarea"
              @blur="handleSave"
            ></textarea>
          </div>

          <div class="sunday-reflection-box sunday-reflection-box--focus">
            <span class="sunday-reflection-label">🎯 Next Week Non-Negotiables</span>
            <textarea
              v-model="weeklyReview.reflections.nextWeekFocus"
              rows="3"
              placeholder="Top 1–3 non-negotiable habits to protect at all costs next week..."
              class="sunday-textarea"
              @blur="handleSave"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="sunday-actions-bar">
        <span v-if="saveFeedback" class="sunday-save-toast">
          <Check class="icon-xs" /> Saved to storage
        </span>
        <button type="button" class="btn btn--primary-action btn--sm" @click="handleSave">
          <Check class="icon-xs" /> <span>Save Sunday Review</span>
        </button>
      </div>
    </div>
  </div>
</template>
