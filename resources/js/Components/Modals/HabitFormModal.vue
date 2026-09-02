<script setup>
import { ref, computed, watch } from 'vue';
import {
  X,
  Plus,
  Check,
  Trash2,
  Clock,
  Calendar,
  Sparkles,
  Award,
  HelpCircle,
  Sun,
  Briefcase,
  Moon,
  Heart,
  Activity,
  Dumbbell,
  Apple,
  Coffee,
  Bed,
  Users,
} from 'lucide-vue-next';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  habit: { type: Object, default: null }, // null for add, object for edit
  defaultSlot: { type: String, default: 'morning' },
});

const emit = defineEmits(['close', 'save', 'delete']);

// Form Reactive State
const name = ref('');
const isTimed = ref(true);
const startTime = ref('06:00');
const endTime = ref('06:30');
const timeSlot = ref('morning'); // 'morning' | 'work' | 'evening' | 'anytime' | 'weekly'
const category = ref('fitness'); // 'fitness' | 'nutrition' | 'work' | 'family' | 'rest' | 'ops'
const points = ref(1);
const scheduleType = ref('all'); // 'all' | 'weekdays' | 'weekends' | 'custom'
const customDays = ref([1, 2, 3, 4, 5, 6, 7]); // 1=Mon .. 7=Sun
const hint = ref('');
const validationError = ref('');

// Smart Suggestions
const habitPresets = [
  { name: 'Spinal Mobility — In Bed', slot: 'morning', cat: 'fitness', pts: 1, time: { start: '05:00', end: '05:15' }, hint: 'Cat-cow, thoracic extensions, gentle hamstring stretch' },
  { name: '500ml Warm Water + Lemon', slot: 'morning', cat: 'nutrition', pts: 1, time: { start: '05:15', end: '05:20' }, hint: 'With 1 pinch pink Himalayan salt + B12/ALA' },
  { name: 'Padma Sadhana & Surya Namaskar', slot: 'morning', cat: 'fitness', pts: 2, time: { start: '05:20', end: '05:40' }, hint: 'Synchronize breath with movement' },
  { name: 'Sudarshan Kriya & Pranayama', slot: 'morning', cat: 'rest', pts: 2, time: { start: '05:40', end: '05:55' }, hint: '3 stages pranayama followed by Kriya' },
  { name: 'Meditation & Deep Silence', slot: 'morning', cat: 'rest', pts: 1, time: { start: '05:55', end: '06:05' }, hint: 'Witness mode, zero effort' },
  { name: 'Deep Architecture Focus Block 1', slot: 'work', cat: 'work', pts: 3, time: { start: '08:45', end: '10:15' }, hint: 'No Slack, phone in airplane mode, high-leverage coding' },
  { name: 'High-Leverage Work Block 2', slot: 'work', cat: 'work', pts: 2, time: { start: '11:00', end: '12:30' }, hint: 'Core product milestones & pipeline execution' },
  { name: 'Balanced Protein Lunch', slot: 'work', cat: 'nutrition', pts: 1, time: { start: '13:00', end: '13:45' }, hint: 'Whole foods + cooked vegetables + D3/Omega-3' },
  { name: 'Post-Lunch 15m Walk', slot: 'work', cat: 'fitness', pts: 1, time: { start: '13:45', end: '14:00' }, hint: 'Gentle digestion stroll, natural sunlight' },
  { name: 'Workday Shutdown Ritual', slot: 'evening', cat: 'work', pts: 1, time: { start: '18:30', end: '18:35' }, hint: 'Close tabs, clean workspace, set top 3 for tomorrow' },
  { name: 'Family Stroller Walk', slot: 'evening', cat: 'family', pts: 2, time: { start: '18:35', end: '19:05' }, hint: '100% presence with family, zero screen check' },
  { name: 'Shared Family Dinner', slot: 'evening', cat: 'family', pts: 1, time: { start: '19:25', end: '20:15' }, hint: 'Warm cooked meal, mindful conversations' },
  { name: 'Day Journaling & 3 Wins Log', slot: 'evening', cat: 'rest', pts: 1, time: { start: '21:00', end: '21:05' }, hint: 'Record what went well and key learnings' },
  { name: 'Night Supplement — Magnesium', slot: 'evening', cat: 'nutrition', pts: 1, time: { start: '21:15', end: '21:20' }, hint: 'Magnesium glycinate with warm water/milk' },
  { name: 'Lights Out & Deep Recovery Sleep', slot: 'evening', cat: 'rest', pts: 2, time: { start: '21:30', end: '05:00' }, hint: 'Pitch black, cool bedroom, 7-8 hours target' },
  { name: 'Drink 3.5L Daily Water Protocol', slot: 'anytime', cat: 'nutrition', pts: 1, timed: false, hint: 'Track 2 mineral bottles throughout the day' },
  { name: 'No Refined Sugar / Clean Whole Foods', slot: 'anytime', cat: 'nutrition', pts: 2, timed: false, hint: 'Zero processed sugar, zero junk food' },
  { name: 'Movement Break Every 45 Minutes', slot: 'anytime', cat: 'fitness', pts: 1, timed: false, hint: 'Stand up, decompress spine, drink water' },
];

const categoryOptions = [
  { id: 'fitness', label: 'Fitness & Mobility', icon: Dumbbell, color: 'cat-fitness' },
  { id: 'nutrition', label: 'Nutrition & Hydration', icon: Apple, color: 'cat-nutrition' },
  { id: 'work', label: 'Deep Work & Code', icon: Briefcase, color: 'cat-work' },
  { id: 'family', label: 'Family & Connection', icon: Users, color: 'cat-family' },
  { id: 'rest', label: 'Rest & Recovery', icon: Bed, color: 'cat-rest' },
  { id: 'ops', label: 'Protocols & Ops', icon: Activity, color: 'cat-ops' },
];

const pointPresets = [1, 2, 3, 5];

const dayOptions = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 7, label: 'Sun' },
];

// Helper: parse HH:MM to minutes
const toMinutes = (timeStr) => {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

// Helper: minutes to HH:MM
const fromMinutes = (mins) => {
  const normalized = ((mins % 1440) + 1440) % 1440;
  const h = String(Math.floor(normalized / 60)).padStart(2, '0');
  const m = String(normalized % 60).padStart(2, '0');
  return `${h}:${m}`;
};

// Duration Calculation
const durationMinutes = computed(() => {
  if (!isTimed.value || !startTime.value || !endTime.value) return 0;
  let diff = toMinutes(endTime.value) - toMinutes(startTime.value);
  if (diff <= 0) diff += 1440; // crosses midnight
  return diff;
});

const formattedDuration = computed(() => {
  const mins = durationMinutes.value;
  if (!mins) return '';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
});

// Auto-determine slot from start time
const computedSlot = computed(() => {
  if (!isTimed.value) return timeSlot.value;
  const mins = toMinutes(startTime.value);
  if (mins >= 4 * 60 && mins < 8 * 60 + 30) return 'morning'; // 04:00–08:30
  if (mins >= 8 * 60 + 30 && mins < 18 * 60 + 30) return 'work'; // 08:30–18:30
  if (mins >= 18 * 60 + 30 && mins < 21 * 60 + 30) return 'evening'; // 18:30–21:30
  return 'evening';
});

// Set Quick Duration Shortcut
const setDuration = (minsToAdd) => {
  if (!startTime.value) startTime.value = '06:00';
  const startMins = toMinutes(startTime.value);
  endTime.value = fromMinutes(startMins + minsToAdd);
};

// Apply a preset
const applyPreset = (preset) => {
  name.value = preset.name;
  category.value = preset.cat;
  points.value = preset.pts;
  hint.value = preset.hint || '';
  if (preset.timed === false) {
    isTimed.value = false;
    timeSlot.value = preset.slot;
  } else if (preset.time) {
    isTimed.value = true;
    startTime.value = preset.time.start;
    endTime.value = preset.time.end;
  }
};

// Toggle custom day selection
const toggleCustomDay = (dayId) => {
  const idx = customDays.value.indexOf(dayId);
  if (idx > -1) {
    if (customDays.value.length > 1) customDays.value.splice(idx, 1);
  } else {
    customDays.value.push(dayId);
    customDays.value.sort((a, b) => a - b);
  }
};

// Reset or Populate form on open/change
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    validationError.value = '';
    if (props.habit) {
      // Edit mode
      name.value = props.habit.name || '';
      points.value = Number(props.habit.points) || 1;
      category.value = props.habit.category || 'fitness';
      hint.value = props.habit.hint || '';

      if (props.habit.startTime && props.habit.endTime) {
        isTimed.value = true;
        startTime.value = props.habit.startTime;
        endTime.value = props.habit.endTime;
      } else {
        // Try extracting time from title if present (e.g. "04:45 Spinal Mobility")
        const match = (props.habit.name || '').match(/^(\d{2}:\d{2})/);
        if (match) {
          isTimed.value = true;
          startTime.value = match[1];
          endTime.value = fromMinutes(toMinutes(match[1]) + 30);
        } else {
          isTimed.value = false;
          timeSlot.value = props.habit.timeSlot || 'morning';
        }
      }

      if (props.habit.scheduleType) {
        scheduleType.value = props.habit.scheduleType;
        customDays.value = Array.isArray(props.habit.customDays) ? [...props.habit.customDays] : [1, 2, 3, 4, 5, 6, 7];
      } else if (Array.isArray(props.habit.daysOfWeek) && props.habit.daysOfWeek.length > 0) {
        const dows = props.habit.daysOfWeek;
        if (dows.length === 7) {
          scheduleType.value = 'all';
          customDays.value = [1, 2, 3, 4, 5, 6, 7];
        } else if (dows.length === 5 && [1, 2, 3, 4, 5].every(d => dows.includes(d))) {
          scheduleType.value = 'weekdays';
          customDays.value = [1, 2, 3, 4, 5];
        } else if (dows.length === 2 && [0, 6].every(d => dows.includes(d))) {
          scheduleType.value = 'weekends';
          customDays.value = [6, 7];
        } else {
          scheduleType.value = 'custom';
          customDays.value = dows.map(d => (d === 0 ? 7 : d)).sort((a, b) => a - b);
        }
      } else {
        scheduleType.value = 'all';
        customDays.value = [1, 2, 3, 4, 5, 6, 7];
      }
    } else {
      // Add mode default
      name.value = '';
      points.value = 1;
      category.value = 'fitness';
      hint.value = '';
      isTimed.value = true;
      scheduleType.value = 'all';
      customDays.value = [1, 2, 3, 4, 5, 6, 7];

      if (props.defaultSlot === 'work') {
        startTime.value = '09:00';
        endTime.value = '10:30';
        category.value = 'work';
      } else if (props.defaultSlot === 'evening') {
        startTime.value = '18:30';
        endTime.value = '19:00';
        category.value = 'family';
      } else if (props.defaultSlot === 'anytime') {
        isTimed.value = false;
        timeSlot.value = 'anytime';
        category.value = 'nutrition';
      } else {
        startTime.value = '06:00';
        endTime.value = '06:30';
        category.value = 'fitness';
      }
    }
  }
}, { immediate: true });

// Form submission
const handleSave = () => {
  if (!name.value || !name.value.trim()) {
    validationError.value = 'Please enter a habit title.';
    return;
  }

  // Format habit name to include time prefix if habit is timed
  let cleanName = name.value.trim();
  if (isTimed.value && startTime.value) {
    cleanName = cleanName.replace(/^\d{2}:\d{2}\s*/, '');
    cleanName = `${startTime.value} ${cleanName}`;
  }

  // Compute normalized daysOfWeek (0=Sun, 1=Mon, ..., 6=Sat)
  let daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
  if (scheduleType.value === 'weekdays') {
    daysOfWeek = [1, 2, 3, 4, 5];
  } else if (scheduleType.value === 'weekends') {
    daysOfWeek = [0, 6];
  } else if (scheduleType.value === 'custom') {
    daysOfWeek = (customDays.value || []).map(d => (d === 7 ? 0 : d)).sort((a, b) => a - b);
  }

  const payload = {
    id: props.habit ? props.habit.id : `c-${Date.now()}`,
    name: cleanName,
    points: Math.max(1, Number(points.value) || 1),
    category: category.value,
    isTimed: isTimed.value,
    startTime: isTimed.value ? startTime.value : null,
    endTime: isTimed.value ? endTime.value : null,
    timeSlot: isTimed.value ? computedSlot.value : timeSlot.value,
    scheduleType: scheduleType.value,
    customDays: scheduleType.value === 'custom' ? customDays.value : null,
    daysOfWeek,
    hint: hint.value.trim(),
    completed_days: props.habit ? (props.habit.completed_days || []) : [],
  };

  emit('save', payload);
  emit('close');
};

const handleDelete = () => {
  if (props.habit && props.habit.id) {
    emit('delete', props.habit.id);
    emit('close');
  }
};
</script>

<template>
  <div v-if="isOpen" class="habit-modal-overlay" @click.self="emit('close')">
    <div class="habit-modal-card" role="dialog" aria-modal="true" :aria-label="habit ? 'Edit Habit' : 'Add New Habit'">
      <!-- Modal Header -->
      <div class="habit-modal__header">
        <div class="habit-modal__header-left">
          <div class="habit-modal__header-icon">
            <Sparkles class="icon-sm icon-gold" />
          </div>
          <div>
            <h3 class="habit-modal__title">{{ habit ? 'Edit Habit' : 'Create New Habit' }}</h3>
            <span class="habit-modal__subtitle">Configure timing, points, and daily rhythm</span>
          </div>
        </div>
        <button class="habit-modal__close-btn" @click="emit('close')" aria-label="Close modal">
          <X class="icon-sm" />
        </button>
      </div>

      <!-- Quick Template Suggestions (Add mode only) -->
      <div v-if="!habit" class="habit-modal__presets">
        <span class="habit-modal__presets-label">Quick Suggestions:</span>
        <div class="habit-modal__presets-scroll">
          <button
            v-for="(p, idx) in habitPresets.slice(0, 8)"
            :key="'preset-' + idx"
            type="button"
            class="habit-preset-chip"
            @click="applyPreset(p)"
          >
            + {{ p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name }}
          </button>
        </div>
      </div>

      <!-- Modal Body Form -->
      <div class="habit-modal__body">
        <!-- Error Banner -->
        <div v-if="validationError" class="habit-modal__alert">
          {{ validationError }}
        </div>

        <!-- 1. Habit Title -->
        <div class="habit-form-group">
          <label class="habit-form-label">
            <span>Habit Title</span>
            <span class="habit-form-label__req">*</span>
          </label>
          <input
            v-model="name"
            type="text"
            class="habit-form-input"
            placeholder="e.g. 05:00 Morning Stretch & Hydration"
            maxlength="120"
            autofocus
            @keydown.enter.prevent="handleSave"
          />
        </div>

        <!-- 2. Timing Mode Switch & Pickers -->
        <div class="habit-form-group">
          <div class="habit-form-label-row">
            <label class="habit-form-label">
              <Clock class="icon-xs" />
              <span>Routine Timing</span>
            </label>
            <div class="timing-segmented-toggle">
              <button
                type="button"
                class="timing-toggle-btn"
                :class="{ 'timing-toggle-btn--active': isTimed }"
                @click="isTimed = true"
              >
                ⏰ Timed
              </button>
              <button
                type="button"
                class="timing-toggle-btn"
                :class="{ 'timing-toggle-btn--active': !isTimed }"
                @click="isTimed = false"
              >
                ☀️ Flexible / Anytime
              </button>
            </div>
          </div>

          <!-- Timed Activity: Start & End Time Pickers -->
          <div v-if="isTimed" class="timed-pickers-card">
            <div class="timed-pickers-row">
              <div class="time-field-box">
                <span class="time-field-caption">Start Time</span>
                <input
                  v-model="startTime"
                  type="time"
                  class="time-native-input"
                  required
                />
              </div>

              <span class="time-field-arrow">→</span>

              <div class="time-field-box">
                <span class="time-field-caption">End Time</span>
                <input
                  v-model="endTime"
                  type="time"
                  class="time-native-input"
                  required
                />
              </div>

              <div class="time-duration-badge" v-if="durationMinutes > 0">
                <span class="time-duration-val">{{ formattedDuration }}</span>
                <span class="time-duration-sub">{{ computedSlot }} slot</span>
              </div>
            </div>

            <!-- Quick Duration Shortcuts -->
            <div class="quick-duration-row">
              <span class="quick-duration-label">Quick Duration:</span>
              <div class="quick-duration-chips">
                <button type="button" class="duration-chip" @click="setDuration(15)">+15m</button>
                <button type="button" class="duration-chip" @click="setDuration(30)">+30m</button>
                <button type="button" class="duration-chip" @click="setDuration(45)">+45m</button>
                <button type="button" class="duration-chip" @click="setDuration(60)">+60m</button>
                <button type="button" class="duration-chip" @click="setDuration(90)">+90m</button>
              </div>
            </div>
          </div>

          <!-- Flexible / Untimed: Slot Selector -->
          <div v-else class="flexible-slots-card">
            <div class="slot-radios-grid">
              <button
                type="button"
                class="slot-radio-btn"
                :class="{ 'slot-radio-btn--active': timeSlot === 'morning' }"
                @click="timeSlot = 'morning'"
              >
                <Sun class="icon-xs" /> Morning
              </button>
              <button
                type="button"
                class="slot-radio-btn"
                :class="{ 'slot-radio-btn--active': timeSlot === 'work' }"
                @click="timeSlot = 'work'"
              >
                <Briefcase class="icon-xs" /> Work
              </button>
              <button
                type="button"
                class="slot-radio-btn"
                :class="{ 'slot-radio-btn--active': timeSlot === 'evening' }"
                @click="timeSlot = 'evening'"
              >
                <Moon class="icon-xs" /> Evening
              </button>
              <button
                type="button"
                class="slot-radio-btn"
                :class="{ 'slot-radio-btn--active': timeSlot === 'anytime' }"
                @click="timeSlot = 'anytime'"
              >
                <Activity class="icon-xs" /> Health / All-Day
              </button>
              <button
                type="button"
                class="slot-radio-btn"
                :class="{ 'slot-radio-btn--active': timeSlot === 'weekly' }"
                @click="timeSlot = 'weekly'"
              >
                <Calendar class="icon-xs" /> Weekly
              </button>
            </div>
          </div>
        </div>

        <!-- 3. Category & Points Row -->
        <div class="habit-form-two-col">
          <!-- Category -->
          <div class="habit-form-group">
            <label class="habit-form-label">Category</label>
            <div class="category-select-grid">
              <button
                v-for="cat in categoryOptions"
                :key="cat.id"
                type="button"
                class="category-option-btn"
                :class="{ 'category-option-btn--active': category === cat.id }"
                @click="category = cat.id"
              >
                <component :is="cat.icon" class="icon-xs" />
                <span>{{ cat.label }}</span>
              </button>
            </div>
          </div>

          <!-- Points Weight -->
          <div class="habit-form-group">
            <label class="habit-form-label">
              <Award class="icon-xs" />
              <span>Point Value</span>
            </label>
            <div class="points-preset-row">
              <button
                v-for="pt in pointPresets"
                :key="'pt-' + pt"
                type="button"
                class="points-preset-btn"
                :class="{ 'points-preset-btn--active': points === pt }"
                @click="points = pt"
              >
                +{{ pt }} pt{{ pt > 1 ? 's' : '' }}
              </button>
              <div class="points-custom-box">
                <input
                  v-model.number="points"
                  type="number"
                  min="1"
                  max="50"
                  class="points-custom-input"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Frequency / Schedule Rules -->
        <div class="habit-form-group">
          <label class="habit-form-label">
            <Calendar class="icon-xs" />
            <span>Frequency & Active Days</span>
          </label>
          <div class="schedule-type-row">
            <button
              type="button"
              class="schedule-pill"
              :class="{ 'schedule-pill--active': scheduleType === 'all' }"
              @click="scheduleType = 'all'"
            >
              Every Day
            </button>
            <button
              type="button"
              class="schedule-pill"
              :class="{ 'schedule-pill--active': scheduleType === 'weekdays' }"
              @click="scheduleType = 'weekdays'"
            >
              Weekdays (Mon–Fri)
            </button>
            <button
              type="button"
              class="schedule-pill"
              :class="{ 'schedule-pill--active': scheduleType === 'weekends' }"
              @click="scheduleType = 'weekends'"
            >
              Weekends (Sat–Sun)
            </button>
            <button
              type="button"
              class="schedule-pill"
              :class="{ 'schedule-pill--active': scheduleType === 'custom' }"
              @click="scheduleType = 'custom'"
            >
              Custom Days
            </button>
          </div>

          <!-- Custom Days Selector -->
          <div v-if="scheduleType === 'custom'" class="custom-days-selector">
            <button
              v-for="day in dayOptions"
              :key="'cday-' + day.id"
              type="button"
              class="custom-day-btn"
              :class="{ 'custom-day-btn--active': customDays.includes(day.id) }"
              @click="toggleCustomDay(day.id)"
            >
              {{ day.label }}
            </button>
          </div>
        </div>

        <!-- 5. Coaching Protocol / Hint (Optional) -->
        <div class="habit-form-group">
          <label class="habit-form-label">
            <HelpCircle class="icon-xs" />
            <span>Protocol Coaching Cue <small>(Optional)</small></span>
          </label>
          <input
            v-model="hint"
            type="text"
            class="habit-form-input habit-form-input--hint"
            placeholder="e.g. Keep water bottle by bed, start with 3 rounds of deep breathing"
            maxlength="180"
          />
        </div>
      </div>

      <!-- Modal Footer Actions -->
      <div class="habit-modal__footer">
        <div class="habit-modal__footer-left">
          <button
            v-if="habit"
            type="button"
            class="btn-habit-delete"
            @click="handleDelete"
            title="Delete this habit"
          >
            <Trash2 class="icon-xs" />
            <span>Delete</span>
          </button>
        </div>

        <div class="habit-modal__footer-right">
          <button type="button" class="btn btn--secondary" @click="emit('close')">
            Cancel
          </button>
          <button type="button" class="btn btn--primary-action" @click="handleSave">
            <Check class="icon-sm" />
            <span>{{ habit ? 'Save Changes' : 'Create Habit' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.habit-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(4, 7, 15, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: scale(0.97); }
  to { opacity: 1; transform: scale(1); }
}

.habit-modal-card {
  width: 100%;
  max-width: 580px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.25rem;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(59, 130, 246, 0.1);
  overflow: hidden;
  color: #f8fafc;
}

.habit-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(30, 41, 59, 0.4);
}

.habit-modal__header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.habit-modal__header-icon {
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: rgba(234, 179, 8, 0.12);
  border: 1px solid rgba(234, 179, 8, 0.25);
}

.habit-modal__title {
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0;
  color: #ffffff;
}

.habit-modal__subtitle {
  font-size: 0.78rem;
  color: #94a3b8;
}

.habit-modal__close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.habit-modal__close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.habit-modal__presets {
  padding: 0.65rem 1.5rem;
  background: rgba(15, 23, 42, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  overflow: hidden;
}

.habit-modal__presets-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  white-space: nowrap;
}

.habit-modal__presets-scroll {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.habit-modal__presets-scroll::-webkit-scrollbar {
  display: none;
}

.habit-preset-chip {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 0.72rem;
  font-weight: 500;
  padding: 0.25rem 0.6rem;
  border-radius: 2rem;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}

.habit-preset-chip:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.4);
  color: #93c5fd;
}

.habit-modal__body {
  padding: 1.25rem 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}

.habit-modal__alert {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
  font-size: 0.82rem;
  padding: 0.6rem 0.85rem;
  border-radius: 0.5rem;
}

.habit-form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.habit-form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.habit-form-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #cbd5e1;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.habit-form-label__req {
  color: #f43f5e;
}

.habit-form-label small {
  color: #64748b;
  font-weight: 400;
}

.habit-form-input {
  width: 100%;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.65rem;
  color: #ffffff;
  font-size: 0.92rem;
  padding: 0.65rem 0.85rem;
  outline: none;
  transition: all 0.15s ease;
}

.habit-form-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
  background: rgba(15, 23, 42, 0.9);
}

.habit-form-input--hint {
  font-size: 0.82rem;
  color: #94a3b8;
}

.timing-segmented-toggle {
  display: flex;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.5rem;
  padding: 2px;
  gap: 2px;
}

.timing-toggle-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.timing-toggle-btn--active {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(37, 99, 235, 0.35);
}

.timed-pickers-card {
  background: rgba(30, 41, 59, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.timed-pickers-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.time-field-box {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
  min-width: 110px;
}

.time-field-caption {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #94a3b8;
  font-weight: 600;
}

.time-native-input {
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.5rem;
  color: #ffffff;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.45rem 0.6rem;
  outline: none;
  width: 100%;
}

.time-native-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
}

.time-field-arrow {
  color: #64748b;
  font-weight: 700;
  font-size: 1rem;
}

.time-duration-badge {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 0.5rem;
  padding: 0.35rem 0.65rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 85px;
}

.time-duration-val {
  font-size: 0.85rem;
  font-weight: 700;
  color: #60a5fa;
}

.time-duration-sub {
  font-size: 0.65rem;
  text-transform: uppercase;
  color: #93c5fd;
  font-weight: 600;
}

.quick-duration-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.quick-duration-label {
  font-size: 0.72rem;
  color: #94a3b8;
}

.quick-duration-chips {
  display: flex;
  gap: 0.35rem;
}

.duration-chip {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.2rem 0.45rem;
  border-radius: 0.35rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.duration-chip:hover {
  background: rgba(59, 130, 246, 0.25);
  border-color: #3b82f6;
  color: #ffffff;
}

.flexible-slots-card {
  background: rgba(30, 41, 59, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.75rem;
  padding: 0.65rem;
}

.slot-radios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.4rem;
}

.slot-radio-btn {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.5rem;
  padding: 0.45rem 0.5rem;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.slot-radio-btn--active {
  background: rgba(59, 130, 246, 0.2);
  border-color: #3b82f6;
  color: #93c5fd;
}

.habit-form-two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 480px) {
  .habit-form-two-col {
    grid-template-columns: 1fr;
  }
}

.category-select-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
}

.category-option-btn {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.45rem;
  padding: 0.35rem 0.5rem;
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-option-btn--active {
  background: rgba(37, 99, 235, 0.2);
  border-color: #3b82f6;
  color: #ffffff;
}

.points-preset-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.points-preset-btn {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.45rem;
  padding: 0.35rem 0.55rem;
  color: #cbd5e1;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.points-preset-btn--active {
  background: #eab308;
  border-color: #facc15;
  color: #0f172a;
  box-shadow: 0 2px 8px rgba(234, 179, 8, 0.35);
}

.points-custom-box {
  width: 50px;
}

.points-custom-input {
  width: 100%;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.45rem;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.35rem;
  text-align: center;
  outline: none;
}

.schedule-type-row {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.schedule-pill {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.45rem;
  padding: 0.35rem 0.6rem;
  color: #94a3b8;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.schedule-pill--active {
  background: rgba(59, 130, 246, 0.25);
  border-color: #3b82f6;
  color: #93c5fd;
}

.custom-days-selector {
  display: flex;
  gap: 0.35rem;
  margin-top: 0.35rem;
}

.custom-day-btn {
  flex: 1;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.4rem;
  padding: 0.3rem 0;
  color: #94a3b8;
  font-size: 0.72rem;
  font-weight: 700;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.custom-day-btn--active {
  background: #2563eb;
  border-color: #3b82f6;
  color: #ffffff;
}

.habit-modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(30, 41, 59, 0.3);
}

.habit-modal__footer-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.btn-habit-delete {
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.45rem 0.75rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-habit-delete:hover {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  color: #fca5a5;
}
</style>
