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
  Tag,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Dumbbell,
  Apple,
  Bed,
  Book,
  Flame,
  Target,
  Coffee,
  Users,
  Edit2,
  Palette,
  Copy,
  Download,
  Upload,
  Share2,
  FileText,
} from 'lucide-vue-next';
import { PROTOCOL_ARCHETYPES, useDynamicProtocols } from '@/Composables/useDynamicProtocols';
import {
  useCategoryTaxonomy,
  DEFAULT_CATEGORIES,
  CATEGORY_ICON_OPTIONS,
  COLOR_PALETTE_PRESETS,
} from '@/Composables/useCategoryTaxonomy';
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
  customProtocols: { type: Array, default: () => [] },
  activeProtocol: { type: Object, default: null },
  activeProtocolId: { type: String, default: '' },
  isAshish: { type: Boolean, default: false },
  isJyoti: { type: Boolean, default: false },
  displayName: { type: String, default: 'Member' },
  habits: { type: Array, default: () => [] },
  userId: { type: String, default: 'guest' },
});

const emit = defineEmits([
  'close',
  'save-settings',
  'switch-protocol',
  'open-wizard',
  'toast',
  'update-habits',
  'create-protocol',
  'clone-protocol',
  'delete-protocol',
  'import-protocol',
]);

const activeTab = ref('scoring'); // 'scoring' | 'slots' | 'presets' | 'audio' | 'security' | 'taxonomy'

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

// ── TAXONOMY & REORDERING ENGINE ──
const taxonomySubTab = ref('categories'); // 'categories' | 'order'
const {
  categories: taxonomyCategories,
  reloadCategories: reloadTaxonomyCategories,
  saveCategory: saveTaxonomyCategory,
  deleteCategory: deleteTaxonomyCategory,
  resetToDefaults: resetTaxonomyDefaults,
  getCategoryMeta,
  applyHabitOrder,
  moveHabitUp,
  moveHabitDown,
} = useCategoryTaxonomy(
  () => props.activeProtocolId || props.activeProtocol?.id || 'default',
  () => props.userId || 'guest'
);

const localHabitList = ref([]);
watch(
  () => [props.habits, props.isOpen],
  () => {
    if (props.isOpen) {
      if (typeof reloadTaxonomyCategories === 'function') {
        reloadTaxonomyCategories();
      }
      if (Array.isArray(props.habits)) {
        localHabitList.value = applyHabitOrder(JSON.parse(JSON.stringify(props.habits)));
      }
    }
  },
  { immediate: true, deep: true }
);

const isEditingCategory = ref(false);
const isCategoryFormOpen = ref(false);
const editingCategory = ref({
  id: '',
  label: '',
  accentColor: '#10b981',
  icon: 'Activity',
  defaultPoints: 2,
});

const ICON_MAP = {
  Dumbbell, Apple, Briefcase, Heart, Bed, Activity,
  Zap, Sun, Moon, Book, Shield, Flame, Sparkles,
  Compass, Crown, Target, Coffee, Users
};
const resolveCategoryIconComponent = (iconName) => ICON_MAP[iconName] || Activity;

const openNewCategoryForm = () => {
  editingCategory.value = {
    id: '',
    label: '',
    accentColor: '#10b981',
    icon: 'Activity',
    defaultPoints: 2,
  };
  isEditingCategory.value = false;
  isCategoryFormOpen.value = true;
};

const openEditCategoryForm = (cat) => {
  editingCategory.value = { ...cat };
  isEditingCategory.value = true;
  isCategoryFormOpen.value = true;
};

const handleSaveCategory = () => {
  if (!editingCategory.value.label.trim()) {
    emit('toast', '⚠️ Category name cannot be empty');
    return;
  }
  saveTaxonomyCategory(editingCategory.value);
  isCategoryFormOpen.value = false;
  emit('toast', `✅ Category "${editingCategory.value.label}" saved!`);
};

const handleDeleteCategory = (catId) => {
  deleteTaxonomyCategory(catId);
  emit('toast', '🗑️ Category removed');
};

const handleResetCategories = () => {
  resetTaxonomyDefaults();
  emit('toast', '🔄 Categories reset to system defaults');
};

const handleMoveHabitUp = (habitId) => {
  localHabitList.value = moveHabitUp(localHabitList.value, habitId);
  emit('update-habits', localHabitList.value);
};

const handleMoveHabitDown = (habitId) => {
  localHabitList.value = moveHabitDown(localHabitList.value, habitId);
  emit('update-habits', localHabitList.value);
};

const handleHabitCategoryChange = (habitId, newCatId) => {
  const idx = localHabitList.value.findIndex(h => String(h.id) === String(habitId));
  if (idx >= 0) {
    localHabitList.value[idx].category = newCatId;
    localHabitList.value = [...localHabitList.value];
    emit('update-habits', localHabitList.value);
    emit('toast', `🏷️ Category updated to ${newCatId}`);
  }
};

// ── PROTOCOL STUDIO & INTEROPERABILITY ENGINE ──
const {
  exportProtocolJson,
  generateShareableProtocolUrl,
} = useDynamicProtocols(() => props.userId || 'guest');

const isStudioEditorOpen = ref(false);
const editingStudioProtocol = ref({
  id: '',
  name: '',
  badge: '👤 Custom Protocol',
  icon: 'award',
  tagline: '',
  description: '',
  wakeTime: '05:30',
  workStart: '08:30',
  workEnd: '18:00',
  sleepTime: '22:00',
  habits: [],
});
const starterHabitOption = ref('current');
const presetToCloneId = ref('archetype-founder');

const isShareModalOpen = ref(false);
const shareModalMode = ref('export'); // 'export' | 'import'
const exportTargetProtocol = ref(null);
const exportJsonString = ref('');
const exportShareUrl = ref('');
const importJsonInput = ref('');
const importValidationError = ref('');
const copySuccessType = ref(null);

const resolveProtocolIconComponent = (iconName) => {
  const map = {
    briefcase: Briefcase,
    activity: Activity,
    heart: Heart,
    crown: Crown,
    sparkles: Sparkles,
    award: Trophy,
    sun: Sun,
    moon: Moon,
    zap: Zap,
    edit: Edit2,
  };
  return map[iconName?.toLowerCase()] || Briefcase;
};

const resolvedAllProtocols = computed(() => {
  if (Array.isArray(props.allProtocols) && props.allProtocols.length > 0) {
    return props.allProtocols;
  }
  return [
    PROTOCOL_ARCHETYPES.founder,
    PROTOCOL_ARCHETYPES.longevity,
    PROTOCOL_ARCHETYPES.postpartum,
    PROTOCOL_ARCHETYPES.ashishMaster,
    PROTOCOL_ARCHETYPES.jyotiMaster,
    ...(props.customProtocols || [])
  ];
});

const computedEditorWindows = computed(() => {
  const p = editingStudioProtocol.value;
  return {
    morning: `${p.wakeTime || '05:30'}–${p.workStart || '08:30'}`,
    work: `${p.workStart || '08:30'}–${p.workEnd || '18:00'}`,
    evening: `${p.workEnd || '18:00'}–${p.sleepTime || '22:00'}`,
  };
});

const openCreateProtocol = () => {
  starterHabitOption.value = 'current';
  editingStudioProtocol.value = {
    id: '',
    name: 'My Custom Protocol',
    badge: '👤 Custom',
    icon: 'award',
    tagline: 'Personal daily circadian rhythm & habits',
    description: '',
    wakeTime: '05:30',
    workStart: '08:30',
    workEnd: '18:00',
    sleepTime: '22:00',
    habits: Array.isArray(props.habits) && props.habits.length > 0
      ? JSON.parse(JSON.stringify(props.habits))
      : [
          { id: `c-${Date.now()}-1`, name: 'Morning Sunlight & Hydration', points: 1, category: 'nutrition', timeSlot: 'morning' },
          { id: `c-${Date.now()}-2`, name: 'Spinal Mobility & Movement', points: 2, category: 'fitness', timeSlot: 'morning' },
          { id: `c-${Date.now()}-3`, name: 'Deep Architecture Focus Block', points: 3, category: 'work', timeSlot: 'work' },
          { id: `c-${Date.now()}-4`, name: 'Family & Evening Disconnect', points: 2, category: 'family', timeSlot: 'evening' },
          { id: `c-${Date.now()}-5`, name: 'Target Lights Out Recovery', points: 2, category: 'rest', timeSlot: 'evening' },
        ],
  };
  isStudioEditorOpen.value = true;
};

const openCloneProtocol = (proto) => {
  starterHabitOption.value = 'preset';
  presetToCloneId.value = proto.id;
  editingStudioProtocol.value = {
    id: '',
    name: `${proto.name} (Custom)`,
    badge: '👤 Custom',
    icon: proto.icon || 'award',
    tagline: proto.tagline || '',
    description: proto.description || '',
    wakeTime: proto.wakeTime || '05:30',
    workStart: proto.workStart || '08:30',
    workEnd: proto.workEnd || '18:00',
    sleepTime: proto.sleepTime || '22:00',
    habits: Array.isArray(proto.habits) ? JSON.parse(JSON.stringify(proto.habits)) : [],
  };
  isStudioEditorOpen.value = true;
};

const handleStarterOptionChange = (option) => {
  starterHabitOption.value = option;
  if (option === 'current') {
    editingStudioProtocol.value.habits = Array.isArray(props.habits) ? JSON.parse(JSON.stringify(props.habits)) : [];
  } else if (option === 'blank') {
    editingStudioProtocol.value.habits = [
      { id: `c-${Date.now()}-1`, name: 'Morning Water & Sunlight', points: 1, category: 'nutrition', timeSlot: 'morning' },
      { id: `c-${Date.now()}-2`, name: 'Daily Movement (30 min)', points: 2, category: 'fitness', timeSlot: 'morning' },
      { id: `c-${Date.now()}-3`, name: 'Primary Focus Sprints', points: 3, category: 'work', timeSlot: 'work' },
      { id: `c-${Date.now()}-4`, name: 'Evening Walk / Disconnect', points: 1, category: 'family', timeSlot: 'evening' },
      { id: `c-${Date.now()}-5`, name: 'Target Sleep Lights Out', points: 2, category: 'rest', timeSlot: 'evening' },
    ];
  } else if (option === 'preset') {
    const found = (resolvedAllProtocols.value || []).find(p => p.id === presetToCloneId.value || p.key === presetToCloneId.value);
    if (found && Array.isArray(found.habits)) {
      editingStudioProtocol.value.habits = JSON.parse(JSON.stringify(found.habits));
    }
  }
};

const handleSaveStudioProtocol = () => {
  if (!editingStudioProtocol.value.name.trim()) {
    emit('toast', '⚠️ Protocol name is required');
    return;
  }
  emit('create-protocol', editingStudioProtocol.value);
  isStudioEditorOpen.value = false;
  emit('toast', `✨ Protocol "${editingStudioProtocol.value.name}" Saved & Activated!`);
};

const handleDeleteStudioProtocol = (protoId) => {
  emit('delete-protocol', protoId);
  emit('toast', '🗑️ Custom Protocol Removed');
};

const openExportProtocol = (proto) => {
  exportTargetProtocol.value = proto;
  exportJsonString.value = exportProtocolJson(proto);
  exportShareUrl.value = generateShareableProtocolUrl(proto);
  shareModalMode.value = 'export';
  copySuccessType.value = null;
  isShareModalOpen.value = true;
};

const openImportProtocolModal = () => {
  importJsonInput.value = '';
  importValidationError.value = '';
  shareModalMode.value = 'import';
  copySuccessType.value = null;
  isShareModalOpen.value = true;
};

const handleCopyJson = async () => {
  try {
    await navigator.clipboard.writeText(exportJsonString.value);
    copySuccessType.value = 'json';
    emit('toast', '📋 JSON copied to clipboard!');
    setTimeout(() => { copySuccessType.value = null; }, 2000);
  } catch (e) {
    emit('toast', '⚠️ Copy failed');
  }
};

const handleCopyShareUrl = async () => {
  try {
    await navigator.clipboard.writeText(exportShareUrl.value);
    copySuccessType.value = 'url';
    emit('toast', '🔗 Shareable link copied!');
    setTimeout(() => { copySuccessType.value = null; }, 2000);
  } catch (e) {
    emit('toast', '⚠️ Copy failed');
  }
};

const handleDownloadJson = () => {
  try {
    const protoName = (exportTargetProtocol.value?.name || 'custom-protocol').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const blob = new Blob([exportJsonString.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habuilt-${protoName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    emit('toast', '💾 Protocol JSON downloaded!');
  } catch (e) {
    emit('toast', '⚠️ Download failed');
  }
};

const handleImportFileUpload = (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    importJsonInput.value = e.target.result;
  };
  reader.readAsText(file);
};

const handleSubmitImport = () => {
  if (!importJsonInput.value.trim()) {
    importValidationError.value = 'Please paste JSON payload or choose a file.';
    return;
  }
  try {
    const parsed = JSON.parse(importJsonInput.value);
    const proto = parsed.protocol || parsed;
    if (!proto.name) {
      importValidationError.value = 'Invalid format: protocol name is missing.';
      return;
    }
    emit('import-protocol', parsed);
    isShareModalOpen.value = false;
    emit('toast', `📥 Protocol "${proto.name}" Imported & Activated!`);
  } catch (err) {
    importValidationError.value = 'Syntax error: Invalid JSON syntax.';
  }
};

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
  if (localHabitList.value.length > 0) {
    emit('update-habits', localHabitList.value);
  }
  emit('toast', '⚡ Protocol, Scoring & Taxonomy saved!');
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
    const defaultLabel = `${props.displayName}'s Hardware Key`;
    const dName = newDeviceName.value.trim() || defaultLabel;
    const cred = await registerBiometricDevice({
      deviceName: dName,
      userHandle: `user_${(props.displayName || 'member').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      userName: props.displayName || 'Habuilt Member',
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
    <div class="modal-card modal-card--lg proto-settings-modal modal-card--protocol-settings" role="dialog" aria-modal="true">
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
          id="proto-tab-presets"
        >
          <Layers class="icon-xs" />
          <span>Protocol Studio</span>
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
        <button
          type="button"
          class="proto-settings-tab proto-settings-tab--taxonomy"
          :class="{ 'proto-settings-tab--active': activeTab === 'taxonomy' }"
          @click="activeTab = 'taxonomy'"
          id="proto-tab-taxonomy"
        >
          <Tag class="icon-xs text-amber-400" />
          <span>Categories &amp; Order</span>
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

        <!-- ── TAB 3: PROTOCOL STUDIO & ARCHETYPES ── -->
        <div v-else-if="activeTab === 'presets'" class="proto-section proto-section--studio animate-fadeIn">
          <div class="proto-studio-header flex items-center justify-between mb-3 pb-3 border-b border-white/10">
            <div>
              <h3 class="text-sm font-bold text-white flex items-center gap-2">
                <Layers class="icon-xs icon-gold" />
                <span>Protocol Studio &amp; Archetypes</span>
              </h3>
              <p class="text-xs text-gray-400 mt-0.5">
                Design custom protocols, clone blueprints, or export and share your routine.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                class="btn btn--secondary btn--xs"
                @click="openImportProtocolModal"
                id="proto-studio-import-btn"
                title="Import protocol from JSON or share link"
              >
                <Upload class="icon-xs" />
                <span>Import JSON</span>
              </button>
              <button
                type="button"
                class="btn btn--primary-action btn--xs"
                @click="openCreateProtocol"
                id="proto-studio-create-btn"
              >
                <Plus class="icon-xs" />
                <span>+ Create Protocol</span>
              </button>
            </div>
          </div>

          <div class="proto-presets-grid">
            <div
              v-for="proto in (resolvedAllProtocols || [])"
              :key="proto.id"
              class="proto-preset-card"
              :class="{ 'proto-preset-card--active': activeProtocolId === proto.id || activeProtocol?.id === proto.id }"
              :id="`proto-card-${proto.id}`"
            >
              <div class="proto-preset-card__head">
                <div class="proto-preset-card__icon">
                  <component :is="resolveProtocolIconComponent(proto.icon)" class="icon-sm" />
                </div>
                <div class="proto-preset-card__info">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <h4 class="proto-preset-card__title">{{ proto.name }}</h4>
                    <span v-if="proto.id.startsWith('custom-') || proto.isRemote" class="proto-cat-custom-pill">Custom</span>
                  </div>
                  <span class="proto-preset-card__badge">
                    {{ (proto.habits || []).length }} Habits • {{ proto.badge || 'Blueprint' }}
                  </span>
                </div>
              </div>

              <p class="proto-preset-card__desc">{{ proto.tagline || proto.description }}</p>

              <!-- Circadian Anchors Pill -->
              <div class="proto-circadian-pill mono-num text-[10px] text-gray-400 bg-black/30 border border-white/5 px-2 py-1.5 rounded-lg mb-2 flex items-center justify-between">
                <span>🌅 {{ proto.wakeTime || '05:00' }}</span>
                <span>⚡ {{ proto.workStart || '08:30' }}–{{ proto.workEnd || '18:00' }}</span>
                <span>🌙 {{ proto.sleepTime || '22:00' }}</span>
              </div>

              <!-- Action Bar -->
              <div class="proto-card-actions-row flex items-center gap-2 mt-auto">
                <button
                  type="button"
                  class="btn btn--sm flex-1"
                  :class="(activeProtocolId === proto.id || activeProtocol?.id === proto.id) ? 'btn--secondary' : 'btn--primary-action'"
                  :id="`proto-switch-btn-${proto.id}`"
                  @click="handleSelectProtocol(proto.id)"
                >
                  <Check v-if="activeProtocolId === proto.id || activeProtocol?.id === proto.id" class="icon-xs" />
                  <span>{{ (activeProtocolId === proto.id || activeProtocol?.id === proto.id) ? 'Active' : 'Activate' }}</span>
                </button>

                <button
                  type="button"
                  class="btn-icon btn-icon--subtle"
                  title="Clone as Custom Protocol"
                  :id="`proto-clone-btn-${proto.id}`"
                  @click="openCloneProtocol(proto)"
                >
                  <Copy class="icon-xs" />
                </button>

                <button
                  type="button"
                  class="btn-icon btn-icon--subtle"
                  title="Export / Share Protocol"
                  :id="`proto-export-btn-${proto.id}`"
                  @click="openExportProtocol(proto)"
                >
                  <Share2 class="icon-xs" />
                </button>

                <button
                  v-if="proto.id.startsWith('custom-') || proto.isRemote"
                  type="button"
                  class="btn-icon btn-icon--danger"
                  title="Delete Custom Protocol"
                  :id="`proto-del-btn-${proto.id}`"
                  @click="handleDeleteStudioProtocol(proto.id)"
                >
                  <Trash2 class="icon-xs" />
                </button>
              </div>
            </div>
          </div>

          <div class="proto-wizard-launch-strip mt-4">
            <div>
              <strong>Looking for guided protocol generation?</strong>
              <p>Run the 4-step interactive Archetype Quiz to tailor circadian windows and habits.</p>
            </div>
            <button type="button" class="btn btn--secondary btn--sm" @click="handleOpenWizard">
              <Sparkles class="icon-xs icon-gold" /> <span>Launch Archetype Wizard</span>
            </button>
          </div>

          <!-- ── SUB-MODAL 1: PROTOCOL STUDIO BUILDER / EDITOR ── -->
          <div v-if="isStudioEditorOpen" class="proto-cat-form-overlay" id="proto-studio-editor-modal">
            <div class="proto-cat-form-card max-w-lg">
              <div class="proto-cat-form-head flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <h4 class="text-sm font-bold text-white flex items-center gap-2">
                  <Layers class="icon-xs icon-gold" />
                  <span>Custom Protocol Studio</span>
                </h4>
                <button type="button" class="btn-icon" @click="isStudioEditorOpen = false">
                  <X class="icon-xs" />
                </button>
              </div>

              <div class="proto-cat-form-body space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <label class="block text-xs font-semibold text-gray-300 mb-1">Protocol Name</label>
                  <input
                    type="text"
                    v-model="editingStudioProtocol.name"
                    id="proto-editor-name-input"
                    placeholder="e.g. Deep Work & Biohacking"
                    class="proto-text-input"
                  />
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-xs font-semibold text-gray-300 mb-1">Badge Pill</label>
                    <input
                      type="text"
                      v-model="editingStudioProtocol.badge"
                      id="proto-editor-badge-input"
                      placeholder="e.g. ⚡ Performance"
                      class="proto-text-input"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-300 mb-1">Tagline</label>
                    <input
                      type="text"
                      v-model="editingStudioProtocol.tagline"
                      id="proto-editor-tagline-input"
                      placeholder="e.g. Daily sprint routine"
                      class="proto-text-input"
                    />
                  </div>
                </div>

                <!-- Circadian Anchors -->
                <div class="bg-black/30 border border-white/10 rounded-lg p-2.5">
                  <span class="block text-xs font-bold text-amber-400 mb-2">Circadian Schedule Anchors</span>
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span class="text-gray-400 block mb-0.5">🌅 Wake-Up Target</span>
                      <input
                        type="time"
                        v-model="editingStudioProtocol.wakeTime"
                        id="proto-editor-wake-input"
                        class="proto-text-input mono-num"
                      />
                    </div>
                    <div>
                      <span class="text-gray-400 block mb-0.5">🌙 Sleep / Lights Out</span>
                      <input
                        type="time"
                        v-model="editingStudioProtocol.sleepTime"
                        id="proto-editor-sleep-input"
                        class="proto-text-input mono-num"
                      />
                    </div>
                    <div>
                      <span class="text-gray-400 block mb-0.5">⚡ Work Block Start</span>
                      <input
                        type="time"
                        v-model="editingStudioProtocol.workStart"
                        id="proto-editor-work-start-input"
                        class="proto-text-input mono-num"
                      />
                    </div>
                    <div>
                      <span class="text-gray-400 block mb-0.5">🏁 Work Block End</span>
                      <input
                        type="time"
                        v-model="editingStudioProtocol.workEnd"
                        id="proto-editor-work-end-input"
                        class="proto-text-input mono-num"
                      />
                    </div>
                  </div>
                  <div class="mt-2 pt-2 border-t border-white/5 text-[10px] text-gray-400 mono-num flex items-center justify-between">
                    <span>Morning: {{ computedEditorWindows.morning }}</span>
                    <span>Work: {{ computedEditorWindows.work }}</span>
                    <span>Evening: {{ computedEditorWindows.evening }}</span>
                  </div>
                </div>

                <!-- Starter Habit Source Selector -->
                <div>
                  <label class="block text-xs font-semibold text-gray-300 mb-1.5">Starter Habits Source</label>
                  <div class="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      class="btn btn--xs"
                      :class="starterHabitOption === 'current' ? 'btn--primary-action' : 'btn--secondary'"
                      @click="handleStarterOptionChange('current')"
                    >
                      Current ({{ (habits || []).length }})
                    </button>
                    <button
                      type="button"
                      class="btn btn--xs"
                      :class="starterHabitOption === 'blank' ? 'btn--primary-action' : 'btn--secondary'"
                      @click="handleStarterOptionChange('blank')"
                    >
                      Blank Canvas (5)
                    </button>
                    <button
                      type="button"
                      class="btn btn--xs"
                      :class="starterHabitOption === 'preset' ? 'btn--primary-action' : 'btn--secondary'"
                      @click="handleStarterOptionChange('preset')"
                    >
                      From Blueprint
                    </button>
                  </div>
                  <div v-if="starterHabitOption === 'preset'" class="mt-2">
                    <select
                      v-model="presetToCloneId"
                      @change="handleStarterOptionChange('preset')"
                      class="proto-cat-select w-full max-w-none"
                    >
                      <option v-for="p in resolvedAllProtocols" :key="p.id" :value="p.id">
                        {{ p.name }} ({{ (p.habits || []).length }} habits)
                      </option>
                    </select>
                  </div>
                </div>

                <!-- Included Habits Preview -->
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-semibold text-gray-300">
                      Included Habits ({{ (editingStudioProtocol.habits || []).length }})
                    </span>
                  </div>
                  <div class="max-h-36 overflow-y-auto space-y-1 bg-black/20 p-2 rounded-lg border border-white/5">
                    <div
                      v-for="(h, idx) in (editingStudioProtocol.habits || [])"
                      :key="h.id || idx"
                      class="text-xs text-gray-300 flex items-center justify-between py-0.5 border-b border-white/5 last:border-0"
                    >
                      <span class="truncate mr-2">#{{ idx + 1 }} {{ h.name }}</span>
                      <span class="text-amber-400 mono-num text-[11px] shrink-0">+{{ h.points }} pts</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="proto-cat-form-foot flex justify-end gap-2 mt-4 pt-3 border-t border-white/10">
                <button type="button" class="btn btn--secondary btn--sm" @click="isStudioEditorOpen = false">
                  Cancel
                </button>
                <button
                  type="button"
                  class="btn btn--primary-action btn--sm"
                  @click="handleSaveStudioProtocol"
                  id="proto-editor-save-btn"
                >
                  <Check class="icon-xs" />
                  <span>Save &amp; Activate</span>
                </button>
              </div>
            </div>
          </div>

          <!-- ── SUB-MODAL 2: EXPORT / IMPORT / SHARE MODAL ── -->
          <div v-if="isShareModalOpen" class="proto-cat-form-overlay" id="proto-studio-share-modal">
            <div class="proto-cat-form-card max-w-md">
              <div class="proto-cat-form-head flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <h4 class="text-sm font-bold text-white flex items-center gap-2">
                  <Share2 class="icon-xs text-sky-400" />
                  <span>{{ shareModalMode === 'export' ? 'Export & Share Protocol' : 'Import Protocol' }}</span>
                </h4>
                <button type="button" class="btn-icon" @click="isShareModalOpen = false">
                  <X class="icon-xs" />
                </button>
              </div>

              <!-- Export Mode -->
              <div v-if="shareModalMode === 'export'" class="space-y-3">
                <div class="text-xs text-gray-400">
                  Share <strong>{{ exportTargetProtocol?.name }}</strong> via one-click link or JSON file.
                </div>

                <!-- One-Click Shareable Link -->
                <div>
                  <label class="block text-xs font-semibold text-gray-300 mb-1">Shareable Universal URL</label>
                  <div class="flex items-center gap-1.5">
                    <input
                      type="text"
                      readonly
                      :value="exportShareUrl"
                      id="proto-share-url-input"
                      class="proto-text-input mono-num text-[11px]"
                    />
                    <button
                      type="button"
                      class="btn btn--secondary btn--sm shrink-0"
                      @click="handleCopyShareUrl"
                      id="proto-copy-share-url-btn"
                    >
                      <Check v-if="copySuccessType === 'url'" class="icon-xs text-emerald-400" />
                      <Copy v-else class="icon-xs" />
                      <span>{{ copySuccessType === 'url' ? 'Copied' : 'Copy' }}</span>
                    </button>
                  </div>
                </div>

                <!-- JSON Payload -->
                <div>
                  <label class="block text-xs font-semibold text-gray-300 mb-1">JSON Blueprint Manifest</label>
                  <textarea
                    readonly
                    :value="exportJsonString"
                    id="proto-export-json-textarea"
                    rows="6"
                    class="proto-text-input mono-num text-[10px] font-mono leading-tight"
                  ></textarea>
                </div>

                <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    class="btn btn--secondary btn--sm"
                    @click="handleCopyJson"
                    id="proto-copy-json-btn"
                  >
                    <Copy class="icon-xs" />
                    <span>Copy JSON</span>
                  </button>
                  <button
                    type="button"
                    class="btn btn--primary-action btn--sm"
                    @click="handleDownloadJson"
                    id="proto-download-json-btn"
                  >
                    <Download class="icon-xs" />
                    <span>Download .json</span>
                  </button>
                </div>
              </div>

              <!-- Import Mode -->
              <div v-else class="space-y-3">
                <div class="text-xs text-gray-400">
                  Paste a JSON protocol manifest or upload a downloaded <code>.json</code> file.
                </div>

                <div v-if="importValidationError" class="habit-modal__alert text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 p-2 rounded">
                  {{ importValidationError }}
                </div>

                <div>
                  <label class="block text-xs font-semibold text-gray-300 mb-1">Paste JSON Manifest</label>
                  <textarea
                    v-model="importJsonInput"
                    id="proto-import-json-input"
                    placeholder='{"protocol": { "name": "Biohacker Protocol", "wakeTime": "05:00", ... }}'
                    rows="7"
                    class="proto-text-input mono-num text-[10px] font-mono leading-tight"
                  ></textarea>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-gray-300 mb-1">Or Upload JSON File</label>
                  <input
                    type="file"
                    accept=".json"
                    @change="handleImportFileUpload"
                    id="proto-import-file-input"
                    class="text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-white/10 file:text-white"
                  />
                </div>

                <div class="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button type="button" class="btn btn--secondary btn--sm" @click="isShareModalOpen = false">
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="btn btn--primary-action btn--sm"
                    @click="handleSubmitImport"
                    id="proto-import-submit-btn"
                  >
                    <Upload class="icon-xs" />
                    <span>Validate &amp; Import</span>
                  </button>
                </div>
              </div>
            </div>
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
                    :placeholder="`${props.displayName} Device (e.g. Pixel / iPhone)`"
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

        <!-- ══ TAB 6: CATEGORIES & ORDER TAXONOMY ══ -->
        <div v-if="activeTab === 'taxonomy'" class="proto-section proto-section--taxonomy animate-fadeIn">
          <!-- Info Banner -->
          <div class="proto-info-banner">
            <Sparkles class="icon-sm icon-gold shrink-0" />
            <div>
              <strong>Custom Category &amp; Habit Sequence Engine:</strong>
              Design bespoke categories with tailored colors and icons, and prioritize your daily habits with fluid Up/Down ordering.
            </div>
          </div>

          <!-- Sub-Tab Navigation -->
          <div class="proto-taxonomy-subtabs">
            <button
              type="button"
              class="proto-taxonomy-subtab"
              :class="{ 'proto-taxonomy-subtab--active': taxonomySubTab === 'categories' }"
              @click="taxonomySubTab = 'categories'"
              id="proto-subtab-categories"
            >
              <Palette class="icon-xs" />
              <span>Category Manager ({{ taxonomyCategories.length }})</span>
            </button>
            <button
              type="button"
              class="proto-taxonomy-subtab"
              :class="{ 'proto-taxonomy-subtab--active': taxonomySubTab === 'order' }"
              @click="taxonomySubTab = 'order'"
              id="proto-subtab-order"
            >
              <Sliders class="icon-xs" />
              <span>Habit Sequence ({{ localHabitList.length }})</span>
            </button>
          </div>

          <!-- ── SUBSECTION 1: CATEGORY MANAGER ── -->
          <div v-if="taxonomySubTab === 'categories'" class="proto-taxonomy-view">
            <div class="flex items-center justify-between mb-3">
              <div class="text-xs text-gray-400">
                Click any category to edit its color, icon, or point weight.
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="btn btn--secondary btn--xs"
                  @click="handleResetCategories"
                  title="Reset to default system categories"
                  id="proto-reset-categories-btn"
                >
                  <RotateCcw class="icon-xs" />
                  <span>Reset Defaults</span>
                </button>
                <button
                  type="button"
                  class="btn btn--primary-action btn--xs"
                  @click="openNewCategoryForm"
                  id="proto-add-category-btn"
                >
                  <Plus class="icon-xs" />
                  <span>New Category</span>
                </button>
              </div>
            </div>

            <!-- Categories Grid -->
            <div class="proto-categories-grid">
              <div
                v-for="cat in taxonomyCategories"
                :key="cat.id"
                class="proto-category-card"
                :style="{ borderColor: cat.accentColor + '55', boxShadow: '0 4px 14px ' + cat.accentColor + '15' }"
                :id="`proto-category-card-${cat.id}`"
              >
                <div class="proto-cat-icon-badge" :style="{ background: cat.accentColor + '20', color: cat.accentColor }">
                  <component :is="resolveCategoryIconComponent(cat.icon)" class="icon-sm" />
                </div>
                <div class="proto-cat-details">
                  <div class="proto-cat-title-row">
                    <strong class="proto-cat-name">{{ cat.label }}</strong>
                    <span v-if="cat.isCustom" class="proto-cat-custom-pill">Custom</span>
                  </div>
                  <div class="proto-cat-meta-row">
                    <span class="proto-cat-id mono-num">#{{ cat.id }}</span>
                    <span class="proto-cat-points mono-num">+{{ cat.defaultPoints }} pts</span>
                  </div>
                </div>
                <div class="proto-cat-actions">
                  <button
                    type="button"
                    class="btn-icon btn-icon--subtle"
                    title="Edit category"
                    :id="`proto-edit-cat-${cat.id}`"
                    @click="openEditCategoryForm(cat)"
                  >
                    <Edit2 class="icon-xs" />
                  </button>
                  <button
                    v-if="cat.isCustom"
                    type="button"
                    class="btn-icon btn-icon--danger"
                    title="Delete custom category"
                    :id="`proto-delete-cat-${cat.id}`"
                    @click="handleDeleteCategory(cat.id)"
                  >
                    <Trash2 class="icon-xs" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Inline Category Edit Modal / Form -->
            <div v-if="isCategoryFormOpen" class="proto-cat-form-overlay" id="proto-category-modal">
              <div class="proto-cat-form-card">
                <div class="proto-cat-form-head flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <h4 class="text-sm font-bold text-white flex items-center gap-2">
                    <Palette class="icon-xs text-amber-400" />
                    <span>{{ isEditingCategory ? 'Edit Category' : 'Create Custom Category' }}</span>
                  </h4>
                  <button type="button" class="btn-icon" @click="isCategoryFormOpen = false">
                    <X class="icon-xs" />
                  </button>
                </div>

                <div class="proto-cat-form-body space-y-3">
                  <div>
                    <label class="block text-xs font-semibold text-gray-300 mb-1">Category Name</label>
                    <input
                      type="text"
                      v-model="editingCategory.label"
                      id="proto-category-name-input"
                      placeholder="e.g. Biohacking & Recovery"
                      class="proto-text-input"
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-gray-300 mb-1.5">Accent Color Swatch</label>
                    <div class="proto-color-swatches">
                      <button
                        v-for="color in COLOR_PALETTE_PRESETS"
                        :key="color"
                        type="button"
                        class="proto-color-dot"
                        :style="{ backgroundColor: color }"
                        :class="{ 'proto-color-dot--active': editingCategory.accentColor === color }"
                        @click="editingCategory.accentColor = color"
                        :title="color"
                      >
                        <Check v-if="editingCategory.accentColor === color" class="icon-xs text-white" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-gray-300 mb-1.5">Category Icon</label>
                    <div class="proto-icon-picker-grid">
                      <button
                        v-for="iconName in CATEGORY_ICON_OPTIONS"
                        :key="iconName"
                        type="button"
                        class="proto-icon-btn"
                        :class="{ 'proto-icon-btn--active': editingCategory.icon === iconName }"
                        @click="editingCategory.icon = iconName"
                      >
                        <component :is="resolveCategoryIconComponent(iconName)" class="icon-xs" />
                        <span class="text-[9px] truncate">{{ iconName }}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label class="block text-xs font-semibold text-gray-300 mb-1">Default Habit Points</label>
                    <div class="flex items-center gap-2">
                      <button
                        v-for="pts in [1, 2, 3, 5]"
                        :key="'pts-' + pts"
                        type="button"
                        class="btn btn--xs"
                        :class="editingCategory.defaultPoints === pts ? 'btn--primary-action' : 'btn--secondary'"
                        @click="editingCategory.defaultPoints = pts"
                      >
                        +{{ pts }} pt{{ pts > 1 ? 's' : '' }}
                      </button>
                    </div>
                  </div>
                </div>

                <div class="proto-cat-form-foot flex justify-end gap-2 mt-4 pt-3 border-t border-white/10">
                  <button type="button" class="btn btn--secondary btn--sm" @click="isCategoryFormOpen = false">
                    Cancel
                  </button>
                  <button
                    type="button"
                    class="btn btn--primary-action btn--sm"
                    @click="handleSaveCategory"
                    id="proto-save-category-btn"
                  >
                    <Check class="icon-xs" />
                    <span>Save Category</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ── SUBSECTION 2: HABIT SEQUENCE REORDERING ── -->
          <div v-else-if="taxonomySubTab === 'order'" class="proto-taxonomy-view">
            <div class="text-xs text-gray-400 mb-2">
              Move habits up or down to set their sequence on the daily tracker.
            </div>

            <div v-if="localHabitList.length === 0" class="proto-empty-keys">
              <p>No active habits loaded for this protocol.</p>
            </div>

            <div v-else class="proto-habits-reorder-list">
              <div
                v-for="(habit, idx) in localHabitList"
                :key="habit.id"
                class="proto-reorder-row"
                :id="`proto-habit-row-${habit.id}`"
              >
                <div class="proto-reorder-left">
                  <span class="proto-drag-grip text-gray-500">
                    <GripVertical class="icon-xs" />
                  </span>
                  <span class="proto-order-badge mono-num">#{{ idx + 1 }}</span>
                  <div class="proto-habit-info">
                    <strong class="proto-habit-title">{{ habit.name }}</strong>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="proto-habit-pts mono-num">+{{ habit.points }} pts</span>
                      <span class="proto-habit-slot-pill">{{ habit.timeSlot || 'anytime' }}</span>
                    </div>
                  </div>
                </div>

                <div class="proto-reorder-right">
                  <!-- Category Selector Dropdown -->
                  <select
                    class="proto-cat-select"
                    :value="habit.category || 'ops'"
                    @change="handleHabitCategoryChange(habit.id, $event.target.value)"
                    :title="`Reassign category for ${habit.name}`"
                    :id="`proto-habit-cat-select-${habit.id}`"
                  >
                    <option v-for="c in taxonomyCategories" :key="c.id" :value="c.id">
                      {{ c.label }}
                    </option>
                  </select>

                  <!-- Reorder Chevrons -->
                  <div class="proto-chevron-btns">
                    <button
                      type="button"
                      class="btn-icon btn-icon--xs"
                      :disabled="idx === 0"
                      :id="`proto-move-up-${habit.id}`"
                      @click="handleMoveHabitUp(habit.id)"
                      title="Move Up"
                    >
                      <ArrowUp class="icon-xs" />
                    </button>
                    <button
                      type="button"
                      class="btn-icon btn-icon--xs"
                      :disabled="idx === localHabitList.length - 1"
                      :id="`proto-move-down-${habit.id}`"
                      @click="handleMoveHabitDown(habit.id)"
                      title="Move Down"
                    >
                      <ArrowDown class="icon-xs" />
                    </button>
                  </div>
                </div>
              </div>
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

/* ── Taxonomy Tab Styles ── */
.proto-settings-tab--taxonomy {
  border-bottom-color: transparent;
}
.proto-taxonomy-subtabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 0.5rem;
}
.proto-taxonomy-subtab {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-muted, #94a3b8);
  font-size: 0.775rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.proto-taxonomy-subtab:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
}
.proto-taxonomy-subtab--active {
  background: rgba(212, 175, 55, 0.15);
  border-color: rgba(212, 175, 55, 0.4);
  color: #f8fafc;
}
.proto-categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.75rem;
}
.proto-category-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.85rem;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: transform 0.15s ease, border-color 0.2s ease;
}
.proto-cat-icon-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.proto-cat-details {
  flex: 1;
  min-width: 0;
}
.proto-cat-title-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.proto-cat-name {
  font-size: 0.825rem;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.proto-cat-custom-pill {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 999px;
  background: rgba(212, 175, 55, 0.2);
  color: #f59e0b;
  font-weight: 700;
}
.proto-cat-meta-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}
.proto-cat-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
/* Reorder rows */
.proto-habits-reorder-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 420px;
  overflow-y: auto;
  padding-right: 0.25rem;
}
.proto-reorder-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  gap: 0.5rem;
  transition: background 0.15s ease;
}
.proto-reorder-row:hover {
  background: rgba(255, 255, 255, 0.05);
}
.proto-reorder-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
}
.proto-order-badge {
  font-size: 11px;
  font-weight: 700;
  color: #d4af37;
  min-width: 26px;
}
.proto-habit-info {
  min-width: 0;
  flex: 1;
}
.proto-habit-title {
  display: block;
  font-size: 0.8rem;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.proto-habit-pts {
  font-size: 10px;
  color: #f59e0b;
  font-weight: 600;
}
.proto-habit-slot-pill {
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  color: #94a3b8;
  text-transform: capitalize;
}
.proto-reorder-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}
.proto-cat-select {
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f8fafc;
  font-size: 11px;
  border-radius: 6px;
  padding: 3px 6px;
  outline: none;
  max-width: 130px;
}
.proto-chevron-btns {
  display: flex;
  gap: 2px;
}
/* Form Overlay */
.proto-cat-form-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 60;
  padding: 1rem;
}
.proto-cat-form-card {
  width: 100%;
  max-width: 440px;
  background: #0e1626;
  border: 1px solid rgba(212, 175, 55, 0.3);
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
}
.proto-color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.proto-color-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease;
}
.proto-color-dot--active {
  border-color: #fff;
  transform: scale(1.15);
}
.proto-icon-picker-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.35rem;
  max-height: 120px;
  overflow-y: auto;
  padding: 0.25rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}
.proto-icon-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
}
.proto-icon-btn--active {
  background: rgba(212, 175, 55, 0.2);
  border-color: #d4af37;
  color: #fff;
}
.proto-circadian-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.375rem 0.6rem;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 10px;
  color: #94a3b8;
  margin-bottom: 0.75rem;
}
.proto-card-actions-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: auto;
}
</style>
