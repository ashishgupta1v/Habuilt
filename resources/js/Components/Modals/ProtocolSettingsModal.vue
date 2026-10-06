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
  Trash2,
  Volume2,
  VolumeX,
  Play,
  Bell,
  Fingerprint,
  MapPin,
  Compass,
  Sun,
  Moon,
  Lock,
  Unlock,
  KeyRound,
  Smartphone,
  Navigation,
} from 'lucide-vue-next';
import { PROTOCOL_ARCHETYPES } from '@/Composables/useDynamicProtocols';
import {
  isSoundEnabled,
  setSoundEnabled,
  getSoundVolume,
  setSoundVolume,
  getSoundProfile,
  setSoundProfile,
  testSoundEffect,
} from '@/lib/soundEffects';
import { useBiometricVault, isVaultConfigured } from '@/Composables/useBiometricVault';
import { useCircadianAtmosphere, SOLAR_CITY_PRESETS } from '@/Composables/useCircadianAtmosphere';

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

const activeTab = ref('scoring'); // 'scoring' | 'slots' | 'presets' | 'audio' | 'security'

// ── PROCEDURAL AUDIO & HAPTICS STATE ──
const soundEnabled = ref(true);
const soundVolume = ref(75);
const soundProfile = ref('epic'); // 'epic' | 'zen' | 'minimal'
const activeAuditionCue = ref(null);

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

// ── VAULT & SOLAR EPHEMERIS COMPOSABLES & STATE ──
const {
  isSupported: isWebAuthnSupported,
  isPlatformAvailable: isBiometricHardwareAvailable,
  registeredCredentials,
  protectedSections,
  configureVault,
  updatePin,
  registerBiometricDevice,
  deleteCredential,
  toggleSectionProtection,
  refreshRegisteredCredentials,
} = useBiometricVault();

const {
  solarCalculationMode,
  userCoordinates,
  computedSolarSchedule,
  setCoordinates,
  detectUserLocation,
  setSolarCalculationMode,
  currentPhase,
} = useCircadianAtmosphere();

const localLat = ref(userCoordinates.value?.lat || 30.7333);
const localLon = ref(userCoordinates.value?.lon || 76.7794);
const localCity = ref(userCoordinates.value?.city || 'Chandigarh / Punjab');
const newDeviceName = ref('');
const newPinInput = ref('');
const isGpsLocating = ref(false);
const isEnrollingDevice = ref(false);
const passkeyStatusMsg = ref('');

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

      // Hydrate audio synthesis settings
      soundEnabled.value = isSoundEnabled();
      soundVolume.value = Math.round(getSoundVolume() * 100);
      soundProfile.value = getSoundProfile();

      // Sync local solar coordinates & hardware passkey states
      if (userCoordinates.value) {
        localLat.value = userCoordinates.value.lat || 30.7333;
        localLon.value = userCoordinates.value.lon || 76.7794;
        localCity.value = userCoordinates.value.city || 'Chandigarh / Punjab';
      }
      refreshRegisteredCredentials();
      passkeyStatusMsg.value = '';
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

  // Persist procedural sound settings
  setSoundEnabled(soundEnabled.value);
  setSoundVolume(soundVolume.value / 100);
  setSoundProfile(soundProfile.value);

  emit('save-settings', updatedSettings);
  emit('toast', '⚡ Protocol, Scoring & Audio Settings saved!');
  emit('close');
};

const handleToggleSound = () => {
  soundEnabled.value = !soundEnabled.value;
  setSoundEnabled(soundEnabled.value);
  emit('toast', soundEnabled.value ? '🔔 Sound Effects Enabled' : '🔇 Sound Effects Muted');
};

const handleVolumeChange = () => {
  setSoundVolume(soundVolume.value / 100);
};

const handleSetProfile = (profile) => {
  soundProfile.value = profile;
  setSoundProfile(profile);
  testSoundEffect('anchor');
  emit('toast', `Acoustic Profile: ${profile.toUpperCase()}`);
};

const auditionCue = (cueType) => {
  activeAuditionCue.value = cueType;
  testSoundEffect(cueType);
  setTimeout(() => {
    if (activeAuditionCue.value === cueType) activeAuditionCue.value = null;
  }, 1000);
};

const handleSelectProtocol = (protoId) => {
  emit('switch-protocol', protoId);
  emit('close');
};

const handleOpenWizard = () => {
  emit('close');
  emit('open-wizard');
};

// ── TAB 5: VAULT & SOLAR EPHEMERIS HANDLERS ──
const handleApplyCityPreset = (preset) => {
  localLat.value = preset.lat;
  localLon.value = preset.lon;
  localCity.value = preset.city;
  setCoordinates(preset.lat, preset.lon, preset.city);
  emit('toast', `📍 Solar Coordinates: ${preset.city}`);
};

const handleSaveCustomCoords = () => {
  const lat = parseFloat(localLat.value);
  const lon = parseFloat(localLon.value);
  if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    emit('toast', '⚠️ Invalid coordinates. Lat: -90..90, Lon: -180..180');
    return;
  }
  setCoordinates(lat, lon, localCity.value || 'Custom Coordinates');
  emit('toast', `📍 Coordinates updated (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`);
};

const handleDetectGps = async () => {
  isGpsLocating.value = true;
  try {
    const res = await detectUserLocation();
    localLat.value = res.lat;
    localLon.value = res.lon;
    localCity.value = res.city;
    emit('toast', `🛰️ GPS Detected: ${res.lat}°, ${res.lon}°`);
  } catch (err) {
    emit('toast', `⚠️ GPS Error: ${err.message || 'Location unavailable'}`);
  } finally {
    isGpsLocating.value = false;
  }
};

const handleToggleSolarMode = (mode) => {
  setSolarCalculationMode(mode);
  emit('toast', mode === 'astronomical' ? '☀️ NOAA Solar Ephemeris Active' : '⏰ Fixed Schedule Active');
};

const handleToggleMasterVault = async () => {
  const next = !isVaultConfigured.value;
  await configureVault(next, newPinInput.value || '1234');
  emit('toast', next ? '🔒 Biometric Privacy Vault Enabled' : '🔓 Vault Disabled');
};

const handleSaveMasterPin = async () => {
  if (!newPinInput.value || newPinInput.value.length < 4) {
    emit('toast', '⚠️ Master PIN must be at least 4 digits');
    return;
  }
  try {
    await updatePin(newPinInput.value);
    emit('toast', '🔑 Master Sovereign PIN updated!');
    newPinInput.value = '';
  } catch (err) {
    emit('toast', `⚠️ PIN Error: ${err.message}`);
  }
};

const handleEnrollPasskey = async () => {
  isEnrollingDevice.value = true;
  passkeyStatusMsg.value = '';
  try {
    const defaultLabel = props.isAshish ? "Ashish's Primary Hardware Key" : props.isJyoti ? "Jyoti's Primary Hardware Key" : 'Personal Device Hardware Key';
    const dName = newDeviceName.value.trim() || defaultLabel;
    const cred = await registerBiometricDevice({
      deviceName: dName,
      userHandle: props.isAshish ? 'user_ashish' : props.isJyoti ? 'user_jyoti' : 'user_primary',
      userName: props.isAshish ? 'Ashish' : props.isJyoti ? 'Jyoti' : 'Habuilt Member',
    });
    passkeyStatusMsg.value = `Enrolled: ${cred.deviceName}`;
    newDeviceName.value = '';
    emit('toast', '✅ Hardware Passkey Registered to IndexedDB!');
  } catch (err) {
    passkeyStatusMsg.value = `Error: ${err.message || 'Canceled'}`;
    emit('toast', '⚠️ Passkey registration canceled or unsupported');
  } finally {
    isEnrollingDevice.value = false;
  }
};

const handleDeletePasskey = async (id, name) => {
  await deleteCredential(id);
  emit('toast', `🗑️ Device key removed: ${name}`);
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
        <button
          type="button"
          class="proto-settings-tab proto-settings-tab--audio"
          :class="{ 'proto-settings-tab--active': activeTab === 'audio' }"
          @click="activeTab = 'audio'"
        >
          <Volume2 class="icon-xs" />
          <span>Audio &amp; Haptics</span>
        </button>
        <button
          type="button"
          class="proto-settings-tab proto-settings-tab--security"
          :class="{ 'proto-settings-tab--active': activeTab === 'security' }"
          @click="activeTab = 'security'"
          id="proto-tab-security"
        >
          <Shield class="icon-xs text-amber-400" />
          <span>Vault &amp; Solar</span>
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

        <!-- ── TAB 4: PROCEDURAL AUDIO & HAPTICS ── -->
        <div v-else-if="activeTab === 'audio'" class="proto-section">
          <div class="proto-info-banner">
            <Volume2 class="icon-sm icon-gold" />
            <p>
              Habuilt synthesizes 100% native offline audio waveforms using the browser Web Audio API.
              Zero network latency, zero MP3 downloads, and fully responsive acoustic feedback.
            </p>
          </div>

          <!-- Master Audio Toggle -->
          <div class="proto-audio-card">
            <div class="proto-audio-card__head">
              <div class="proto-audio-card__icon-wrap">
                <Volume2 v-if="soundEnabled" class="icon-sm text-amber-400" />
                <VolumeX v-else class="icon-sm text-slate-400" />
              </div>
              <div class="proto-audio-card__info">
                <strong>Procedural Audio Synthesis</strong>
                <p>Play acoustic chimes, resonant warrior gongs, and reaction pulses upon completions.</p>
              </div>
              <button
                type="button"
                id="proto-audio-toggle-btn"
                class="btn btn--sm"
                :class="soundEnabled ? 'btn--primary-action' : 'btn--secondary'"
                @click="handleToggleSound"
              >
                <span>{{ soundEnabled ? 'Audio Enabled' : 'Audio Muted' }}</span>
              </button>
            </div>
          </div>

          <!-- Master Volume Slider -->
          <div class="proto-audio-card" :class="{ 'proto-audio-card--disabled': !soundEnabled }">
            <div class="proto-audio-card__head">
              <div class="proto-tier-control__label">
                <Sliders class="icon-xs text-sky-400" />
                <strong>Master Acoustic Gain (Volume)</strong>
              </div>
              <span class="mono-num text-sky-400 font-bold">{{ soundVolume }}%</span>
            </div>
            <div class="proto-audio-slider-wrap">
              <input
                id="proto-audio-volume-slider"
                type="range"
                min="0"
                max="100"
                step="5"
                v-model.number="soundVolume"
                @input="handleVolumeChange"
                class="proto-slider proto-slider--half"
              />
            </div>
            <p class="proto-tier-control__desc">Scales oscillator gain smoothly without clipping or acoustic distortion.</p>
          </div>

          <!-- Acoustic Timbre / Profile Selector -->
          <div class="proto-audio-card" :class="{ 'proto-audio-card--disabled': !soundEnabled }">
            <label class="proto-audio-card__title">
              <Sparkles class="icon-xs icon-gold" />
              <span>Acoustic Timbre Profile</span>
            </label>
            <div class="proto-sound-profiles-grid">
              <button
                type="button"
                class="proto-sound-profile-btn"
                :class="{ 'proto-sound-profile-btn--active': soundProfile === 'epic' }"
                @click="handleSetProfile('epic')"
              >
                <div class="proto-sound-profile-btn__head">
                  <span class="proto-sound-profile-emoji">🌟</span>
                  <strong>Warrior Epic</strong>
                </div>
                <small>Full crystalline chord triads, overtone shimmer &amp; resonant warrior gong.</small>
              </button>

              <button
                type="button"
                class="proto-sound-profile-btn"
                :class="{ 'proto-sound-profile-btn--active': soundProfile === 'zen' }"
                @click="handleSetProfile('zen')"
              >
                <div class="proto-sound-profile-btn__head">
                  <span class="proto-sound-profile-emoji">🌿</span>
                  <strong>Zen Subtle</strong>
                </div>
                <small>Pure meditative sine waves, gentle soft decay &amp; singing bowl warmth.</small>
              </button>

              <button
                type="button"
                class="proto-sound-profile-btn"
                :class="{ 'proto-sound-profile-btn--active': soundProfile === 'minimal' }"
                @click="handleSetProfile('minimal')"
              >
                <div class="proto-sound-profile-btn__head">
                  <span class="proto-sound-profile-emoji">⚡</span>
                  <strong>Minimal Clean</strong>
                </div>
                <small>Crisp micro-chimes, quick acoustic ticks &amp; zero lingering reverb.</small>
              </button>
            </div>
          </div>

          <!-- Real-Time Audition Strip -->
          <div class="proto-audio-card" :class="{ 'proto-audio-card--disabled': !soundEnabled }">
            <label class="proto-audio-card__title">
              <Bell class="icon-xs text-emerald-400" />
              <span>Audition Real-Time Audio Cues</span>
            </label>
            <div class="proto-audition-grid">
              <button
                type="button"
                id="proto-audition-anchor-btn"
                class="btn btn--secondary btn--sm proto-audition-btn"
                @click="auditionCue('anchor')"
              >
                <Play class="icon-xs text-amber-400" />
                <span>Shared Anchor Chime</span>
              </button>
              <button
                type="button"
                id="proto-audition-gong-btn"
                class="btn btn--secondary btn--sm proto-audition-btn"
                @click="auditionCue('highfive')"
              >
                <Play class="icon-xs text-rose-400" />
                <span>Warrior High-Five Gong</span>
              </button>
              <button
                type="button"
                id="proto-audition-emote-btn"
                class="btn btn--secondary btn--sm proto-audition-btn"
                @click="auditionCue('emote')"
              >
                <Play class="icon-xs text-sky-400" />
                <span>Partner Emote Pulse</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ── TAB 5: VAULT & SOLAR EPHEMERIS ── -->
        <div v-if="activeTab === 'security'" class="proto-section">
          <!-- Information Banner -->
          <div class="proto-info-banner">
            <Shield class="icon-sm text-amber-400" />
            <p>
              <strong>Sovereign Privacy Vault &amp; Astronomical Solar Calculations.</strong>
              Calculate authentic solar dawn/dusk offline using NOAA astronomical equations, and secure private telemetry with platform hardware passkeys.
            </p>
          </div>

          <!-- SECTION 1: CIRCADIAN ASTRONOMICAL SOLAR CALCULATION -->
          <div class="proto-card">
            <div class="proto-card__header">
              <div class="proto-card__title">
                <Sun class="icon-xs text-amber-400" />
                <span>NOAA Astronomical Solar Calculation (Offline Zenith)</span>
              </div>
              <div class="proto-badge-status" :class="solarCalculationMode === 'astronomical' ? 'proto-badge--active' : 'proto-badge--muted'">
                {{ solarCalculationMode === 'astronomical' ? '☀️ NOAA Algorithmic Active' : '⏰ Fixed Clock Active' }}
              </div>
            </div>

            <!-- Mode Selector -->
            <div class="proto-mode-selector mb-3">
              <button
                type="button"
                class="proto-mode-btn"
                :class="{ 'proto-mode-btn--active': solarCalculationMode === 'astronomical' }"
                @click="handleToggleSolarMode('astronomical')"
                id="proto-solar-mode-astronomical"
              >
                <span>Astronomical Solar Zenith</span>
                <small>Offline NOAA ephemeris by coordinates</small>
              </button>
              <button
                type="button"
                class="proto-mode-btn"
                :class="{ 'proto-mode-btn--active': solarCalculationMode === 'fixed' }"
                @click="handleToggleSolarMode('fixed')"
                id="proto-solar-mode-fixed"
              >
                <span>Standard Fixed Schedule</span>
                <small>Preset hours (05:00, 09:00, 17:00, 21:00)</small>
              </button>
            </div>

            <!-- Live Computed Solar Ephemeris Display -->
            <div class="proto-ephemeris-card">
              <div class="proto-ephemeris-card__header">
                <div>
                  <span class="proto-ephemeris-card__city">{{ userCoordinates.city || 'Current Coordinates' }}</span>
                  <span class="proto-ephemeris-card__coords mono-num">({{ (userCoordinates.lat || 0).toFixed(4) }}°N, {{ (userCoordinates.lon || 0).toFixed(4) }}°E)</span>
                </div>
                <span class="proto-ephemeris-phase-badge">
                  {{ currentPhase?.icon }} {{ currentPhase?.name }}
                </span>
              </div>

              <div class="proto-ephemeris-grid">
                <div class="proto-ephemeris-pill">
                  <span class="proto-ephemeris-pill__label">Dawn (Twilight)</span>
                  <strong class="proto-ephemeris-pill__time mono-num">{{ computedSolarSchedule.dawn || '05:30' }}</strong>
                </div>
                <div class="proto-ephemeris-pill">
                  <span class="proto-ephemeris-pill__label">Sunrise</span>
                  <strong class="proto-ephemeris-pill__time mono-num">{{ computedSolarSchedule.sunrise || '06:00' }}</strong>
                </div>
                <div class="proto-ephemeris-pill proto-ephemeris-pill--zenith">
                  <span class="proto-ephemeris-pill__label">Solar Noon</span>
                  <strong class="proto-ephemeris-pill__time mono-num">{{ computedSolarSchedule.solarNoon || '12:00' }}</strong>
                </div>
                <div class="proto-ephemeris-pill">
                  <span class="proto-ephemeris-pill__label">Sunset</span>
                  <strong class="proto-ephemeris-pill__time mono-num">{{ computedSolarSchedule.sunset || '18:00' }}</strong>
                </div>
                <div class="proto-ephemeris-pill">
                  <span class="proto-ephemeris-pill__label">Dusk (Civil)</span>
                  <strong class="proto-ephemeris-pill__time mono-num">{{ computedSolarSchedule.dusk || '18:30' }}</strong>
                </div>
              </div>
            </div>

            <!-- Quick City Presets -->
            <div class="proto-presets-section mt-3">
              <label class="proto-label">Quick Regional Presets</label>
              <div class="proto-city-chips">
                <button
                  v-for="preset in SOLAR_CITY_PRESETS"
                  :key="preset.city"
                  type="button"
                  class="proto-city-chip"
                  :class="{ 'proto-city-chip--active': userCoordinates.city === preset.city }"
                  @click="handleApplyCityPreset(preset)"
                >
                  {{ preset.label }}
                </button>
              </div>
            </div>

            <!-- Custom Coordinates Form & GPS Auto-Detection -->
            <div class="proto-coords-form mt-3">
              <label class="proto-label">Custom Geo Coordinates &amp; Offline Ephemeris</label>
              <div class="proto-coords-inputs">
                <div class="proto-input-field">
                  <span class="proto-input-addon">Latitude</span>
                  <input
                    type="number"
                    step="0.0001"
                    min="-90"
                    max="90"
                    v-model.number="localLat"
                    class="proto-text-input mono-num"
                    placeholder="e.g. 30.7333"
                  />
                </div>
                <div class="proto-input-field">
                  <span class="proto-input-addon">Longitude</span>
                  <input
                    type="number"
                    step="0.0001"
                    min="-180"
                    max="180"
                    v-model.number="localLon"
                    class="proto-text-input mono-num"
                    placeholder="e.g. 76.7794"
                  />
                </div>
                <button
                  type="button"
                  class="btn btn--secondary btn--sm"
                  @click="handleSaveCustomCoords"
                >
                  <MapPin class="icon-xs text-amber-400" />
                  <span>Apply Coords</span>
                </button>
                <button
                  type="button"
                  class="btn btn--secondary btn--sm"
                  :disabled="isGpsLocating"
                  @click="handleDetectGps"
                  title="Detect coordinates via browser geolocation"
                >
                  <Navigation class="icon-xs text-sky-400" :class="{ 'animate-spin': isGpsLocating }" />
                  <span>{{ isGpsLocating ? 'Detecting...' : 'Detect GPS' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- SECTION 2: WEBAUTHN HARDWARE BIOMETRIC VAULT -->
          <div class="proto-card mt-3">
            <div class="proto-card__header">
              <div class="proto-card__title">
                <Fingerprint class="icon-xs text-emerald-400" />
                <span>WebAuthn Hardware Biometric Vault</span>
              </div>
              <div class="proto-badge-status" :class="isVaultConfigured ? 'proto-badge--active' : 'proto-badge--muted'">
                {{ isVaultConfigured ? '🔒 Vault Active' : '🔓 Vault Inactive' }}
              </div>
            </div>

            <!-- Master Toggle Switch -->
            <div class="proto-toggle-row">
              <div class="proto-toggle-info">
                <strong>Biometric Protection Switch</strong>
                <p>Require Touch ID, Face ID, or Windows Hello to access shielded data.</p>
              </div>
              <button
                type="button"
                class="proto-switch-btn"
                :class="{ 'proto-switch-btn--on': isVaultConfigured }"
                @click="handleToggleMasterVault"
                id="proto-vault-master-toggle"
              >
                <span class="proto-switch-thumb"></span>
              </button>
            </div>

            <!-- Shielded Sections Toggles -->
            <div v-if="isVaultConfigured" class="proto-subsections mt-2">
              <label class="proto-label">Protected App Sections</label>
              <div class="proto-shield-options">
                <label class="proto-checkbox-label">
                  <input
                    type="checkbox"
                    :checked="protectedSections.clinical"
                    @change="toggleSectionProtection('clinical')"
                  />
                  <span>Clinical Telemetry (Biomarkers &amp; Sleep)</span>
                </label>
                <label class="proto-checkbox-label">
                  <input
                    type="checkbox"
                    :checked="protectedSections.rewards"
                    @change="toggleSectionProtection('rewards')"
                  />
                  <span>Sovereign Reward Vault &amp; Streak Ledger</span>
                </label>
              </div>
            </div>

            <!-- Multi-Device Registered Passkeys (IndexedDB) -->
            <div class="proto-passkeys-list-section mt-3">
              <div class="proto-passkeys-head">
                <label class="proto-label">Enrolled Family &amp; Device Passkeys (IndexedDB)</label>
                <span class="proto-chip-counter mono-num">{{ registeredCredentials.length }} Key(s)</span>
              </div>

              <div v-if="registeredCredentials.length === 0" class="proto-empty-keys">
                <p>No hardware passkeys enrolled yet. Enroll your device below to use Touch ID / Windows Hello.</p>
              </div>

              <div v-else class="proto-keys-table">
                <div
                  v-for="cred in registeredCredentials"
                  :key="cred.id"
                  class="proto-key-row"
                >
                  <div class="proto-key-info">
                    <div class="proto-key-name">
                      <Smartphone class="icon-xs text-amber-400" />
                      <strong>{{ cred.deviceName }}</strong>
                      <span class="proto-user-tag mono-num">{{ cred.userName || cred.userHandle }}</span>
                    </div>
                    <span class="proto-key-date">
                      Enrolled: {{ new Date(cred.createdAt).toLocaleDateString() }}
                    </span>
                  </div>
                  <button
                    type="button"
                    class="btn-icon btn-icon--danger"
                    title="Remove passkey"
                    @click="handleDeletePasskey(cred.id, cred.deviceName)"
                  >
                    <Trash2 class="icon-xs" />
                  </button>
                </div>
              </div>

              <!-- Enroll Current Device Form -->
              <div class="proto-enroll-form mt-2">
                <div class="proto-enroll-input-row">
                  <input
                    type="text"
                    v-model="newDeviceName"
                    class="proto-text-input"
                    :placeholder="props.isAshish ? 'Ashish Pixel 9 Pro' : props.isJyoti ? 'Jyoti Galaxy S24' : 'Personal Hardware Key'"
                  />
                  <button
                    type="button"
                    class="btn btn--primary-action btn--sm"
                    :disabled="isEnrollingDevice"
                    @click="handleEnrollPasskey"
                    id="proto-enroll-passkey-btn"
                  >
                    <Fingerprint class="icon-xs" />
                    <span>{{ isEnrollingDevice ? 'Authorizing...' : 'Enroll Passkey' }}</span>
                  </button>
                </div>
                <p v-if="passkeyStatusMsg" class="proto-enroll-msg mt-1 mono-num">
                  {{ passkeyStatusMsg }}
                </p>
              </div>
            </div>

            <!-- Master PIN Override Field -->
            <div class="proto-pin-form mt-3">
              <label class="proto-label">Sovereign Master PIN (Emergency Fallback)</label>
              <div class="proto-pin-input-row">
                <input
                  type="password"
                  maxlength="8"
                  v-model="newPinInput"
                  class="proto-text-input mono-num"
                  placeholder="Set 4 to 8 digit PIN"
                />
                <button
                  type="button"
                  class="btn btn--secondary btn--sm"
                  @click="handleSaveMasterPin"
                >
                  <KeyRound class="icon-xs text-amber-400" />
                  <span>Update PIN</span>
                </button>
              </div>
              <small class="proto-subtext">Used if biometric hardware is unavailable or in non-secure browser contexts.</small>
            </div>
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

/* Audio & Haptics Styles */
.proto-audio-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.1rem;
  margin-bottom: 1rem;
  transition: opacity 0.2s ease, border-color 0.2s ease;
}

.proto-audio-card--disabled {
  opacity: 0.45;
  pointer-events: none;
}

.proto-audio-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.proto-audio-card__icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.proto-audio-card__info {
  flex: 1;
}

.proto-audio-card__info strong {
  display: block;
  font-size: 0.9rem;
  color: var(--text-main, #f8fafc);
  margin-bottom: 2px;
}

.proto-audio-card__info p {
  margin: 0;
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
  line-height: 1.35;
}

.proto-audio-card__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-main, #f8fafc);
  margin-bottom: 0.75rem;
}

.proto-audio-slider-wrap {
  margin: 0.75rem 0 0.5rem;
}

.proto-sound-profiles-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .proto-sound-profiles-grid {
    grid-template-columns: 1fr;
  }
}

.proto-sound-profile-btn {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.85rem;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  text-align: left;
  transition: all 0.18s ease;
}

.proto-sound-profile-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(212, 175, 55, 0.3);
}

.proto-sound-profile-btn--active {
  background: rgba(212, 175, 55, 0.12);
  border-color: rgba(212, 175, 55, 0.5);
  box-shadow: 0 0 14px rgba(212, 175, 55, 0.15);
}

.proto-sound-profile-btn__head {
  display: flex;
  align-items: center;
  gap: 6px;
}

.proto-sound-profile-btn__head strong {
  font-size: 0.85rem;
  color: var(--text-main, #f8fafc);
}

.proto-sound-profile-btn small {
  font-size: 0.7rem;
  color: var(--text-muted, #94a3b8);
  line-height: 1.3;
}

.proto-audition-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.proto-audition-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* ── TAB 5: VAULT & SOLAR STYLES ── */
.proto-badge-status {
  font-size: 0.72rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-weight: 600;
}
.proto-badge--active {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.proto-badge--muted {
  background: rgba(148, 163, 184, 0.1);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.proto-ephemeris-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(212, 175, 55, 0.18);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.proto-ephemeris-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 0.5rem;
}
.proto-ephemeris-card__city {
  font-weight: 600;
  color: #f8fafc;
  font-size: 0.85rem;
  margin-right: 0.5rem;
}
.proto-ephemeris-card__coords {
  font-size: 0.75rem;
  color: #94a3b8;
}
.proto-ephemeris-phase-badge {
  font-size: 0.75rem;
  background: rgba(212, 175, 55, 0.12);
  color: #d4af37;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(212, 175, 55, 0.25);
  font-weight: 600;
}

.proto-ephemeris-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 0.5rem;
}
.proto-ephemeris-pill {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 8px;
  padding: 0.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.proto-ephemeris-pill--zenith {
  background: rgba(212, 175, 55, 0.08);
  border-color: rgba(212, 175, 55, 0.3);
}
.proto-ephemeris-pill__label {
  font-size: 0.68rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.proto-ephemeris-pill__time {
  font-size: 0.95rem;
  color: #f8fafc;
  font-weight: 700;
}

.proto-city-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.proto-city-chip {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 0.3rem 0.65rem;
  font-size: 0.75rem;
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.15s ease;
}
.proto-city-chip:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(212, 175, 55, 0.35);
  color: #f8fafc;
}
.proto-city-chip--active {
  background: rgba(212, 175, 55, 0.15);
  border-color: #d4af37;
  color: #d4af37;
  font-weight: 600;
}

.proto-coords-inputs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.proto-input-field {
  display: flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  overflow: hidden;
}
.proto-input-addon {
  font-size: 0.72rem;
  color: #94a3b8;
  padding: 0.35rem 0.5rem;
  background: rgba(255, 255, 255, 0.04);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}
.proto-text-input {
  background: transparent;
  border: none;
  color: #f8fafc;
  padding: 0.35rem 0.55rem;
  font-size: 0.82rem;
  outline: none;
  min-width: 100px;
}

.proto-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.proto-toggle-info strong {
  display: block;
  font-size: 0.85rem;
  color: #f8fafc;
}
.proto-toggle-info p {
  margin: 0.15rem 0 0;
  font-size: 0.74rem;
  color: #94a3b8;
}

.proto-switch-btn {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  padding: 0;
}
.proto-switch-btn--on {
  background: #10b981;
  border-color: #34d399;
}
.proto-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ffffff;
  transition: all 0.2s ease;
}
.proto-switch-btn--on .proto-switch-thumb {
  left: 22px;
}

.proto-shield-options {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.5rem 0;
}
.proto-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #cbd5e1;
  cursor: pointer;
}

.proto-passkeys-list-section {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 0.75rem;
}
.proto-passkeys-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.proto-chip-counter {
  font-size: 0.72rem;
  padding: 0.15rem 0.45rem;
  background: rgba(212, 175, 55, 0.1);
  color: #d4af37;
  border-radius: 10px;
  border: 1px solid rgba(212, 175, 55, 0.2);
}
.proto-empty-keys {
  font-size: 0.76rem;
  color: #94a3b8;
  font-style: italic;
  padding: 0.5rem 0;
}
.proto-keys-table {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.65rem;
}
.proto-key-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
}
.proto-key-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.proto-key-name {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: #f8fafc;
}
.proto-user-tag {
  font-size: 0.68rem;
  padding: 0.1rem 0.35rem;
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border-radius: 4px;
}
.proto-key-date {
  font-size: 0.7rem;
  color: #64748b;
}

.proto-enroll-input-row,
.proto-pin-input-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.proto-enroll-input-row .proto-text-input,
.proto-pin-input-row .proto-text-input {
  flex: 1;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  padding: 0.45rem 0.65rem;
}
.proto-enroll-msg {
  font-size: 0.72rem;
  color: #34d399;
}
</style>
