<script setup>
import { ref, computed, watch } from 'vue';
import {
  X,
  Sliders,
  Shield,
  Zap,
  Trophy,
  Clock,
  Sparkles,
  Check,
  RotateCcw,
  Briefcase,
  Heart,
  Crown,
  Activity,
  Layers,
  Save,
  Plus,
  Trash2
} from 'lucide-vue-next';
import { PROTOCOL_ARCHETYPES } from '@/Composables/useDynamicProtocols';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  progressiveSettings: { type: Object, default: () => ({}) },
  tierThresholds: { type: Object, default: () => ({ floor: 4, half: 8, full: 15, target: 15 }) },
  todayPossibleDailyPoints: { type: Number, default: 15 },
  timeSlotDefinitions: { type: Object, default: () => ({}) },
  allProtocols: { type: Array, default: () => [] },
  activeProtocol: { type: Object, default: null },
  activeProtocolId: { type: String, default: '' },
  isAshish: { type: Boolean, default: false },
  isJyoti: { type: Boolean, default: false },
});

const emit = defineEmits([
  'close',
  'save-settings',
  'switch-protocol',
  'open-wizard',
  'toast',
]);

const activeTab = ref('scoring'); // 'scoring' | 'slots' | 'presets'

// ── SCORING & TIERS STATE ──
const scoringMode = ref('percent'); // 'percent' | 'fixed'
const floorPct = ref(25);
const halfPct = ref(50);
const fullPct = ref(100);

const fixedFloor = ref(4);
const fixedHalf = ref(8);
const fixedFull = ref(15);

// ── CUSTOM TIME SLOTS STATE ──
const localSlots = ref({});

// Sync state on open
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      const custom = props.progressiveSettings?.customTiers || {};
      if (custom.isFixed) {
        scoringMode.value = 'fixed';
        fixedFloor.value = custom.floor || 4;
        fixedHalf.value = custom.half || 8;
        fixedFull.value = custom.full || 15;
      } else {
        scoringMode.value = 'percent';
        floorPct.value = custom.floorPct !== undefined ? custom.floorPct : 25;
        halfPct.value = custom.halfPct !== undefined ? custom.halfPct : 50;
        fullPct.value = custom.fullPct !== undefined ? custom.fullPct : 100;
      }

      // Clone slot definitions
      const currentDefs = props.progressiveSettings?.customTimeSlots || props.timeSlotDefinitions || {};
      localSlots.value = JSON.parse(JSON.stringify(currentDefs));
    }
  },
  { immediate: true }
);

// Preview calculated points for percent mode
const previewPoints = computed(() => {
  const target = props.todayPossibleDailyPoints || 15;
  if (scoringMode.value === 'fixed') {
    return {
      floor: Math.max(1, Number(fixedFloor.value) || 4),
      half: Math.max(1, Number(fixedHalf.value) || 8),
      full: Math.max(1, Number(fixedFull.value) || 15),
      target,
    };
  }
  const f = Math.max(1, Math.round(target * (floorPct.value / 100)));
  const h = Math.max(f + 1, Math.round(target * (halfPct.value / 100)));
  const u = Math.max(h + 1, Math.round(target * (fullPct.value / 100)));
  return {
    floor: f,
    half: h,
    full: u,
    target,
  };
});

// Reset tiers to standard 25 / 50 / 100
const resetTiersToDefault = () => {
  scoringMode.value = 'percent';
  floorPct.value = 25;
  halfPct.value = 50;
  fullPct.value = 100;
  emit('toast', 'Reset to recommended 25% / 50% / 100% percentages');
};

// Reset slots to protocol baseline
const resetSlotsToDefault = () => {
  localSlots.value = JSON.parse(JSON.stringify(props.timeSlotDefinitions || {}));
  emit('toast', 'Time slots reset to protocol defaults');
};

// Add custom slot
const addCustomSlot = () => {
  const newKey = `slot_${Date.now()}`;
  localSlots.value[newKey] = {
    label: 'Custom Routine Window',
    time: '12:00–14:00',
    emoji: '⭐',
    color: '#D4A03E',
  };
};

const removeCustomSlot = (slotKey) => {
  const updated = { ...localSlots.value };
  delete updated[slotKey];
  localSlots.value = updated;
};

// Save all settings
const handleSaveAll = () => {
  let customTiersPayload = null;

  if (scoringMode.value === 'fixed') {
    customTiersPayload = {
      isFixed: true,
      floor: Number(fixedFloor.value) || 4,
      half: Number(fixedHalf.value) || 8,
      full: Number(fixedFull.value) || 15,
    };
  } else {
    // If customized percentage or standard
    customTiersPayload = {
      isFixed: false,
      floorPct: Number(floorPct.value) || 25,
      halfPct: Number(halfPct.value) || 50,
      fullPct: Number(fullPct.value) || 100,
      floor: previewPoints.value.floor,
      half: previewPoints.value.half,
      full: previewPoints.value.full,
    };
  }

  const updatedSettings = {
    ...props.progressiveSettings,
    customTiers: customTiersPayload,
    customTimeSlots: localSlots.value,
  };

  emit('save-settings', updatedSettings);
  emit('toast', '⚡ Protocol & Scoring Settings saved!');
  emit('close');
};

const handleSelectProtocol = (protoId) => {
  emit('switch-protocol', protoId);
  emit('close');
};

const handleOpenWizard = () => {
  emit('close');
  emit('open-wizard');
};
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card modal-card--lg proto-settings-modal" role="dialog" aria-modal="true">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="modal-title-wrap">
          <div class="modal-icon-badge">
            <Sliders class="icon-md icon-gold" />
          </div>
          <div>
            <h3 class="modal-title">Protocol & Routine Customizer</h3>
            <p class="modal-subtitle">Dynamic Milestone Tiers, Flexible Time Slots & Routine Switching</p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" @click="emit('close')" aria-label="Close">
          <X class="icon-sm" />
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="proto-settings-tabs">
        <button
          type="button"
          class="proto-settings-tab"
          :class="{ 'proto-settings-tab--active': activeTab === 'scoring' }"
          @click="activeTab = 'scoring'"
        >
          <Trophy class="icon-xs" />
          <span>Milestone Scoring Tiers</span>
        </button>
        <button
          type="button"
          class="proto-settings-tab"
          :class="{ 'proto-settings-tab--active': activeTab === 'slots' }"
          @click="activeTab = 'slots'"
        >
          <Clock class="icon-xs" />
          <span>Time Slot Windows</span>
        </button>
        <button
          type="button"
          class="proto-settings-tab"
          :class="{ 'proto-settings-tab--active': activeTab === 'presets' }"
          @click="activeTab = 'presets'"
        >
          <Layers class="icon-xs" />
          <span>Preset Library</span>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="modal-body proto-settings-body">
        <!-- ── TAB 1: MILESTONE SCORING TIERS ── -->
        <div v-if="activeTab === 'scoring'" class="proto-section">
          <div class="proto-info-banner">
            <Sparkles class="icon-sm icon-gold" />
            <p>
              Habuilt dynamically scales milestones against your scheduled daily points
              <strong>({{ todayPossibleDailyPoints }} pts today)</strong>. Adjust percentages or set fixed point overrides.
            </p>
          </div>

          <!-- Mode Toggle -->
          <div class="proto-mode-selector">
            <button
              type="button"
              class="proto-mode-btn"
              :class="{ 'proto-mode-btn--active': scoringMode === 'percent' }"
              @click="scoringMode = 'percent'"
            >
              <span>Dynamic Percentage (%)</span>
              <small>Auto-scales to your daily habits</small>
            </button>
            <button
              type="button"
              class="proto-mode-btn"
              :class="{ 'proto-mode-btn--active': scoringMode === 'fixed' }"
              @click="scoringMode = 'fixed'"
            >
              <span>Fixed Points (pts)</span>
              <small>Hardcoded absolute thresholds</small>
            </button>
          </div>

          <!-- Dynamic Percent Controls -->
          <div v-if="scoringMode === 'percent'" class="proto-sliders-grid">
            <!-- Floor -->
            <div class="proto-tier-control proto-tier-control--floor">
              <div class="proto-tier-control__head">
                <div class="proto-tier-control__label">
                  <Shield class="icon-xs text-amber-400" />
                  <strong>Floor Tier (Safety Net)</strong>
                </div>
                <div class="proto-tier-control__value">
                  <span class="mono-num">{{ floorPct }}%</span>
                  <span class="proto-pts-chip mono-num">≈ {{ previewPoints.floor }} pts</span>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                step="5"
                v-model.number="floorPct"
                class="proto-slider proto-slider--floor"
              />
              <p class="proto-tier-control__desc">Minimum baseline to protect momentum and streaks on low-energy days.</p>
            </div>

            <!-- Half -->
            <div class="proto-tier-control proto-tier-control--half">
              <div class="proto-tier-control__head">
                <div class="proto-tier-control__label">
                  <Zap class="icon-xs text-sky-400" />
                  <strong>Half Protocol (Solid Rhythm)</strong>
                </div>
                <div class="proto-tier-control__value">
                  <span class="mono-num">{{ halfPct }}%</span>
                  <span class="proto-pts-chip mono-num">≈ {{ previewPoints.half }} pts</span>
                </div>
              </div>
              <input
                type="range"
                min="35"
                max="75"
                step="5"
                v-model.number="halfPct"
                class="proto-slider proto-slider--half"
              />
              <p class="proto-tier-control__desc">Represents solid day execution when office or travel compresses your schedule.</p>
            </div>

            <!-- Full -->
            <div class="proto-tier-control proto-tier-control--full">
              <div class="proto-tier-control__head">
                <div class="proto-tier-control__label">
                  <Trophy class="icon-xs text-emerald-400" />
                  <strong>Full Target (Peak Performance)</strong>
                </div>
                <div class="proto-tier-control__value">
                  <span class="mono-num">{{ fullPct }}%</span>
                  <span class="proto-pts-chip mono-num">≈ {{ previewPoints.full }} pts</span>
                </div>
              </div>
              <input
                type="range"
                min="80"
                max="120"
                step="5"
                v-model.number="fullPct"
                class="proto-slider proto-slider--full"
              />
              <p class="proto-tier-control__desc">Your daily peak goal for maximum wallet points and XP velocity.</p>
            </div>
          </div>

          <!-- Fixed Points Controls -->
          <div v-else class="proto-fixed-grid">
            <div class="proto-fixed-item">
              <label><Shield class="icon-xs text-amber-400" /> Floor Threshold</label>
              <div class="proto-input-wrap">
                <input type="number" min="1" max="100" v-model.number="fixedFloor" class="proto-num-input" />
                <span>pts</span>
              </div>
            </div>
            <div class="proto-fixed-item">
              <label><Zap class="icon-xs text-sky-400" /> Half Threshold</label>
              <div class="proto-input-wrap">
                <input type="number" min="1" max="100" v-model.number="fixedHalf" class="proto-num-input" />
                <span>pts</span>
              </div>
            </div>
            <div class="proto-fixed-item">
              <label><Trophy class="icon-xs text-emerald-400" /> Full Threshold</label>
              <div class="proto-input-wrap">
                <input type="number" min="1" max="100" v-model.number="fixedFull" class="proto-num-input" />
                <span>pts</span>
              </div>
            </div>
          </div>

          <!-- Live Milestone Preview Deck -->
          <div class="proto-preview-deck">
            <span class="proto-preview-tag">LIVE PREVIEW ON TODAY'S GAUGE</span>
            <div class="proto-preview-grid">
              <div class="proto-preview-box">
                <span class="proto-preview-title">Floor</span>
                <span class="proto-preview-val mono-num">{{ previewPoints.floor }} pts</span>
              </div>
              <div class="proto-preview-box">
                <span class="proto-preview-title">Half</span>
                <span class="proto-preview-val mono-num">{{ previewPoints.half }} pts</span>
              </div>
              <div class="proto-preview-box">
                <span class="proto-preview-title">Full Target</span>
                <span class="proto-preview-val mono-num">{{ previewPoints.full }} pts</span>
              </div>
            </div>
          </div>

          <div class="proto-section-actions">
            <button type="button" class="btn btn--ghost btn--sm" @click="resetTiersToDefault">
              <RotateCcw class="icon-xs" /> <span>Reset to Defaults (25% / 50% / 100%)</span>
            </button>
          </div>
        </div>

        <!-- ── TAB 2: TIME SLOT WINDOWS ── -->
        <div v-else-if="activeTab === 'slots'" class="proto-section">
          <div class="proto-info-banner">
            <Clock class="icon-sm icon-gold" />
            <p>
              Customize your circadian time slot labels and hours. Habits mapped to these keys will
              group automatically in your checklist.
            </p>
          </div>

          <div class="proto-slots-list">
            <div
              v-for="(slot, key) in localSlots"
              :key="key"
              class="proto-slot-row"
            >
              <div class="proto-slot-emoji">
                <input
                  type="text"
                  v-model="slot.emoji"
                  maxlength="2"
                  class="proto-emoji-input"
                  title="Emoji Icon"
                />
              </div>
              <div class="proto-slot-fields">
                <div class="proto-slot-field">
                  <label>Slot Label</label>
                  <input type="text" v-model="slot.label" class="proto-text-input" placeholder="e.g. Morning Routine" />
                </div>
                <div class="proto-slot-field proto-slot-field--time">
                  <label>Time Window</label>
                  <input type="text" v-model="slot.time" class="proto-text-input" placeholder="e.g. 05:00–08:30" />
                </div>
              </div>
              <button
                v-if="!['morning', 'work', 'evening'].includes(key)"
                type="button"
                class="proto-slot-del-btn"
                @click="removeCustomSlot(key)"
                title="Remove slot"
              >
                <Trash2 class="icon-xs text-rose-400" />
              </button>
            </div>
          </div>

          <div class="proto-slots-actions">
            <button type="button" class="btn btn--secondary btn--sm" @click="addCustomSlot">
              <Plus class="icon-xs" /> <span>Add Custom Window</span>
            </button>
            <button type="button" class="btn btn--ghost btn--sm" @click="resetSlotsToDefault">
              <RotateCcw class="icon-xs" /> <span>Reset to Protocol Defaults</span>
            </button>
          </div>
        </div>

        <!-- ── TAB 3: PRESET ROUTINE LIBRARY ── -->
        <div v-else-if="activeTab === 'presets'" class="proto-section">
          <div class="proto-info-banner">
            <Layers class="icon-sm icon-gold" />
            <p>
              Switch routines instantly or launch the Archetype Wizard. Daily check-ins are preserved
              across matching habits automatically.
            </p>
          </div>

          <div class="proto-presets-grid">
            <!-- Founder -->
            <div
              class="proto-preset-card"
              :class="{ 'proto-preset-card--active': activeProtocolId === 'archetype-founder' || (!activeProtocolId && !isAshish && !isJyoti) }"
            >
              <div class="proto-preset-card__head">
                <div class="proto-preset-card__icon"><Briefcase class="icon-sm" /></div>
                <div class="proto-preset-card__info">
                  <h4 class="proto-preset-card__title">Founder Executive</h4>
                  <span class="proto-preset-card__badge">16 Habits • 24 Pts</span>
                </div>
              </div>
              <p class="proto-preset-card__desc">Deep work focus sprints, physical vitality, zero-friction shutdown.</p>
              <button
                type="button"
                class="btn btn--sm w-full"
                :class="activeProtocolId === 'archetype-founder' ? 'btn--secondary' : 'btn--primary-action'"
                @click="handleSelectProtocol('archetype-founder')"
              >
                <Check v-if="activeProtocolId === 'archetype-founder'" class="icon-xs" />
                <span>{{ activeProtocolId === 'archetype-founder' ? 'Active Protocol' : 'Switch to Founder' }}</span>
              </button>
            </div>

            <!-- Longevity -->
            <div
              class="proto-preset-card"
              :class="{ 'proto-preset-card--active': activeProtocolId === 'archetype-longevity' }"
            >
              <div class="proto-preset-card__head">
                <div class="proto-preset-card__icon"><Activity class="icon-sm text-emerald-400" /></div>
                <div class="proto-preset-card__info">
                  <h4 class="proto-preset-card__title">Mind-Body Longevity</h4>
                  <span class="proto-preset-card__badge">18 Habits • 24 Pts</span>
                </div>
              </div>
              <p class="proto-preset-card__desc">Circadian optimization, spinal health, clean fuel, parasympathetic balance.</p>
              <button
                type="button"
                class="btn btn--sm w-full"
                :class="activeProtocolId === 'archetype-longevity' ? 'btn--secondary' : 'btn--primary-action'"
                @click="handleSelectProtocol('archetype-longevity')"
              >
                <Check v-if="activeProtocolId === 'archetype-longevity'" class="icon-xs" />
                <span>{{ activeProtocolId === 'archetype-longevity' ? 'Active Protocol' : 'Switch to Longevity' }}</span>
              </button>
            </div>

            <!-- Postpartum -->
            <div
              class="proto-preset-card"
              :class="{ 'proto-preset-card--active': activeProtocolId === 'archetype-postpartum' }"
            >
              <div class="proto-preset-card__head">
                <div class="proto-preset-card__icon"><Heart class="icon-sm text-rose-400" /></div>
                <div class="proto-preset-card__info">
                  <h4 class="proto-preset-card__title">Postpartum Mother & Family</h4>
                  <span class="proto-preset-card__badge">16 Habits • 24 Pts</span>
                </div>
              </div>
              <p class="proto-preset-card__desc">Protected sleep recovery, gentle pelvic resetting, maternal nutrition & family joy.</p>
              <button
                type="button"
                class="btn btn--sm w-full"
                :class="activeProtocolId === 'archetype-postpartum' ? 'btn--secondary' : 'btn--primary-action'"
                @click="handleSelectProtocol('archetype-postpartum')"
              >
                <Check v-if="activeProtocolId === 'archetype-postpartum'" class="icon-xs" />
                <span>{{ activeProtocolId === 'archetype-postpartum' ? 'Active Protocol' : 'Switch to Postpartum' }}</span>
              </button>
            </div>

            <!-- Ashish Master -->
            <div
              class="proto-preset-card"
              :class="{ 'proto-preset-card--active': activeProtocolId === 'archetype-ashish' || (isAshish && !activeProtocolId) }"
            >
              <div class="proto-preset-card__head">
                <div class="proto-preset-card__icon"><Crown class="icon-sm icon-gold" /></div>
                <div class="proto-preset-card__info">
                  <h4 class="proto-preset-card__title">Ashish Master Protocol</h4>
                  <span class="proto-preset-card__badge">68 Habits • Flagship</span>
                </div>
              </div>
              <p class="proto-preset-card__desc">Complete clinical rheumatology layer, MOVERS Sadhana, 4 office day types.</p>
              <button
                type="button"
                class="btn btn--sm w-full"
                :class="(activeProtocolId === 'archetype-ashish' || (isAshish && !activeProtocolId)) ? 'btn--secondary' : 'btn--primary-action'"
                @click="handleSelectProtocol('archetype-ashish')"
              >
                <Check v-if="activeProtocolId === 'archetype-ashish' || (isAshish && !activeProtocolId)" class="icon-xs" />
                <span>{{ (activeProtocolId === 'archetype-ashish' || (isAshish && !activeProtocolId)) ? 'Active Protocol' : 'Switch to Ashish' }}</span>
              </button>
            </div>

            <!-- Jyoti Master -->
            <div
              class="proto-preset-card"
              :class="{ 'proto-preset-card--active': activeProtocolId === 'archetype-jyoti' || (isJyoti && !activeProtocolId) }"
            >
              <div class="proto-preset-card__head">
                <div class="proto-preset-card__icon"><Sparkles class="icon-sm text-pink-400" /></div>
                <div class="proto-preset-card__info">
                  <h4 class="proto-preset-card__title">Jyoti Master Protocol</h4>
                  <span class="proto-preset-card__badge">37 Habits • Flagship</span>
                </div>
              </div>
              <p class="proto-preset-card__desc">Postpartum healing, maternal nutrition, career upskilling & Shaarvi milestones.</p>
              <button
                type="button"
                class="btn btn--sm w-full"
                :class="(activeProtocolId === 'archetype-jyoti' || (isJyoti && !activeProtocolId)) ? 'btn--secondary' : 'btn--primary-action'"
                @click="handleSelectProtocol('archetype-jyoti')"
              >
                <Check v-if="activeProtocolId === 'archetype-jyoti' || (isJyoti && !activeProtocolId)" class="icon-xs" />
                <span>{{ (activeProtocolId === 'archetype-jyoti' || (isJyoti && !activeProtocolId)) ? 'Active Protocol' : 'Switch to Jyoti' }}</span>
              </button>
            </div>
          </div>

          <div class="proto-wizard-launch-strip">
            <div>
              <strong>Need a customized protocol?</strong>
              <p>Run the 4-step interactive Archetype Quiz to tailor circadian windows and habits.</p>
            </div>
            <button type="button" class="btn btn--secondary btn--sm" @click="handleOpenWizard">
              <Sparkles class="icon-xs icon-gold" /> <span>Launch Archetype Wizard</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer proto-settings-footer">
        <button type="button" class="btn btn--secondary" @click="emit('close')">
          Cancel
        </button>
        <button type="button" class="btn btn--primary-action" @click="handleSaveAll">
          <Save class="icon-xs" />
          <span>Save Changes</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.proto-settings-modal {
  max-width: 680px;
  width: 95%;
  background: var(--card-bg, #0f172a);
  border: 1px solid rgba(212, 175, 55, 0.22);
  border-radius: 16px;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
}

.proto-settings-tabs {
  display: flex;
  background: rgba(15, 23, 42, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0 1.25rem;
  gap: 0.5rem;
  overflow-x: auto;
}

.proto-settings-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted, #94a3b8);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.proto-settings-tab:hover {
  color: var(--text-main, #f8fafc);
}

.proto-settings-tab--active {
  color: #d4af37;
  border-bottom-color: #d4af37;
}

.proto-settings-body {
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.proto-info-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  background: rgba(212, 175, 55, 0.08);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: 10px;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--text-main, #f8fafc);
}

.proto-mode-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.proto-mode-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.proto-mode-btn span {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-main, #f8fafc);
}

.proto-mode-btn small {
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
  margin-top: 0.2rem;
}

.proto-mode-btn--active {
  background: rgba(212, 175, 55, 0.12);
  border-color: #d4af37;
}

.proto-mode-btn--active span {
  color: #d4af37;
}

.proto-sliders-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.proto-tier-control {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.proto-tier-control__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.proto-tier-control__label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.proto-tier-control__value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 700;
}

.proto-pts-chip {
  padding: 0.2rem 0.5rem;
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 6px;
  font-size: 0.75rem;
  color: #d4af37;
}

.proto-slider {
  width: 100%;
  accent-color: #d4af37;
  cursor: pointer;
}

.proto-slider--floor { accent-color: #fbbf24; }
.proto-slider--half { accent-color: #38bdf8; }
.proto-slider--full { accent-color: #34d399; }

.proto-tier-control__desc {
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
  margin: 0;
}

.proto-fixed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem;
}

.proto-fixed-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  padding: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.proto-fixed-item label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.proto-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.proto-num-input {
  width: 70px;
  padding: 0.4rem 0.6rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  text-align: center;
}

.proto-preview-deck {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1rem;
}

.proto-preview-tag {
  display: block;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #d4af37;
  margin-bottom: 0.6rem;
}

.proto-preview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.75rem;
}

.proto-preview-box {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  padding: 0.6rem;
  text-align: center;
}

.proto-preview-title {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
}

.proto-preview-val {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-main, #f8fafc);
}

/* Slots */
.proto-slots-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.proto-slot-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 10px;
}

.proto-emoji-input {
  width: 42px;
  height: 42px;
  text-align: center;
  font-size: 1.3rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
}

.proto-slot-fields {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 0.5rem;
  flex: 1;
}

.proto-slot-field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.proto-slot-field label {
  font-size: 0.7rem;
  color: var(--text-muted, #94a3b8);
}

.proto-text-input {
  padding: 0.4rem 0.6rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: #fff;
  font-size: 0.85rem;
}

.proto-slots-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

/* Presets */
.proto-presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.75rem;
}

.proto-preset-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.2s ease;
}

.proto-preset-card:hover {
  border-color: rgba(212, 175, 55, 0.4);
}

.proto-preset-card--active {
  background: rgba(212, 175, 55, 0.08);
  border-color: #d4af37;
}

.proto-preset-card__head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.proto-preset-card__icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.proto-preset-card__title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-main, #f8fafc);
}

.proto-preset-card__badge {
  font-size: 0.7rem;
  color: var(--text-muted, #94a3b8);
}

.proto-preset-card__desc {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
  line-height: 1.4;
  flex: 1;
}

.proto-wizard-launch-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  margin-top: 0.5rem;
}

.proto-wizard-launch-strip strong {
  display: block;
  font-size: 0.85rem;
  color: var(--text-main, #f8fafc);
}

.proto-wizard-launch-strip p {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
}

.proto-settings-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  background: rgba(15, 23, 42, 0.4);
}
</style>
