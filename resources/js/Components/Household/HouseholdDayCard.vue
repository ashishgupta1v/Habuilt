<script setup>
import { onMounted, ref, watch } from 'vue';
import { callLocalApi } from '@/lib/supabase';

const props = defineProps({
  suggestedDayType: { type: String, default: 'home' },
});

const dayTypes = [
  { id: 'home', label: 'Home' },
  { id: 'office', label: 'Office' },
  { id: 'half-day', label: 'Half-day' },
  { id: 'holiday', label: 'Holiday' },
];

const anchors = [
  { key: 'morning-start', label: 'Morning start' },
  { key: 'midday-pause', label: 'Midday pause' },
  { key: 'evening-check', label: 'Evening check' },
];

const loading = ref(true);
const unavailable = ref(false);
const ready = ref(false);
const day = ref(null);
const selectedType = ref('home');
const selectedAnchors = ref([]);

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const normalizeType = (value) => {
  if (value === 'half-day' || value === 'holiday' || value === 'home') return value;
  if (String(value || '').startsWith('office')) return 'office';
  return 'home';
};

const statusLabel = (status) => (status === 'kept' ? 'Kept' : 'Not yet');

const loadDay = async () => {
  loading.value = true;
  const data = await callLocalApi(`/api/household-day?date=${todayKey()}`, 'GET', null, { returnError: true });
  loading.value = false;
  if (!data || data.status === 403 || data.error || !data.you) {
    unavailable.value = true;
    day.value = null;
    return;
  }
  if (!data.you) return;
  unavailable.value = false;
  day.value = data;
  ready.value = false;
  selectedType.value = normalizeType(data.you.day_type || props.suggestedDayType);
  selectedAnchors.value = (data.your_anchors || []).map((anchor) => anchor.key);
  ready.value = true;
};

const saveDay = async () => {
  const data = await callLocalApi('/api/household-day', 'POST', {
    date: todayKey(),
    day_type: selectedType.value,
    anchors: selectedAnchors.value,
  }, { returnError: true });
  if (data?.you) {
    unavailable.value = false;
    day.value = data;
  }
};

const toggleAnchor = (key) => {
  const next = new Set(selectedAnchors.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  selectedAnchors.value = [...next];
  saveDay();
};

watch(selectedType, (value, previous) => {
  if (ready.value && previous && value !== previous && day.value) saveDay();
});

onMounted(loadDay);
</script>

<template>
  <section class="card household-day" id="household-day">
    <div class="section-head">
      <div class="section-title-wrap">
        <h2 class="section-title">Shared day</h2>
        <small>Today's status for the two of you. Habit details stay private.</small>
      </div>
    </div>

    <p v-if="loading" class="household-day__note">Loading today's shared day…</p>
    <p v-else-if="unavailable" class="household-day__note">A shared day appears after a pairing is accepted.</p>
    <div v-else-if="day" class="household-day__grid">
      <article class="household-day__person">
        <span>You</span>
        <strong>{{ statusLabel(day.you.status) }}</strong>
        <em>{{ day.you.day_type || 'No day type yet' }}</em>
      </article>
      <article class="household-day__person">
        <span>Partner</span>
        <strong>{{ statusLabel(day.partner.status) }}</strong>
        <em>{{ day.partner.day_type || 'No day type yet' }}</em>
      </article>
    </div>

    <div v-if="day" class="household-day__controls">
      <label class="household-day__label" for="household-day-type">Your day type</label>
      <select id="household-day-type" v-model="selectedType" class="household-day__select">
        <option v-for="option in dayTypes" :key="option.id" :value="option.id">{{ option.label }}</option>
      </select>
      <div class="household-day__anchors">
        <button
          v-for="anchor in anchors"
          :key="anchor.key"
          type="button"
          class="household-day__anchor"
          :class="{ 'is-on': selectedAnchors.includes(anchor.key) }"
          @click="toggleAnchor(anchor.key)"
        >
          {{ anchor.label }}
        </button>
      </div>
      <p class="household-day__note">
        Shared anchors:
        <template v-if="day.shared_anchors?.length">
          {{ day.shared_anchors.map((anchor) => anchor.label).join(', ') }}
        </template>
        <template v-else>none yet. Both of you choose the same one.</template>
      </p>
    </div>
  </section>
</template>

<style scoped>
.household-day__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}
.household-day__person {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
}
.household-day__person strong {
  font-size: 1.15rem;
}
.household-day__person em {
  font-style: normal;
  opacity: 0.75;
}
.household-day__controls {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.household-day__select,
.household-day__anchor {
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: inherit;
  padding: 8px 10px;
}
.household-day__anchors {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.household-day__anchor.is-on {
  background: rgba(79, 211, 190, 0.18);
}
.household-day__note {
  margin: 8px 0 0;
  opacity: 0.8;
}
</style>
