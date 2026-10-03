<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import HabuiltLogo from '@/Components/Brand/HabuiltLogo.vue';
import {
  Zap,
  Plane,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sun,
  Moon,
  CheckSquare,
  Timer,
  BarChart3,
  Award,
  X,
  Download,
  MapPin,
  Sparkles,
  Search,
  Users,
  Sliders,
  Heart,
  ChevronDown,
  Settings,
  Briefcase,
  Activity,
  Crown,
  Check,
  Eye,
  EyeOff,
  MoreHorizontal,
} from 'lucide-vue-next';

const props = defineProps({
  isJyoti: { type: Boolean, default: false },
  isAshish: { type: Boolean, default: false },
  displayName: { type: String, default: 'User' },
  activeProtocolName: { type: String, default: 'Master Protocol' },
  allProtocols: { type: Array, default: () => [] },
  activeProtocolId: { type: String, default: '' },
  isPartnerPaired: { type: Boolean, default: false },
  levelData: { type: Object, required: true },
  levelTitle: { type: String, default: 'Starter' },
  totalXP: { type: Number, default: 0 },
  travelMode: { type: Boolean, default: false },
  dayType: { type: String, default: 'home' },
  dayTypeLabel: { type: String, default: '🏠 Home' },
  canNavigatePrevMonth: { type: Boolean, default: true },
  canNavigateNextMonth: { type: Boolean, default: true },
  isNavigatingMonth: { type: Boolean, default: false },
  monthLabel: { type: String, default: '' },
  year: { type: Number, required: true },
  darkMode: { type: Boolean, default: false },
  activeTab: { type: String, default: 'today' },
  timerRunning: { type: Boolean, default: false },
  notificationsEnabled: { type: Boolean, default: false },
  zenMode: { type: Boolean, default: false },
});

const emit = defineEmits([
  'toggle-travel',
  'prev-month',
  'next-month',
  'toggle-theme',
  'toggle-zen',
  'set-tab',
  'open-install-modal',
  'open-spotlight',
  'open-calendar-sync',
  'open-partner-sync',
  'open-partner-pair',
  'open-protocol-wizard',
  'open-protocol-settings',
  'switch-protocol',
]);

const showLevelInfo = ref(false);
const isProtocolMenuOpen = ref(false);
const protocolMenuRef = ref(null);
const isToolsMenuOpen = ref(false);
const toolsMenuRef = ref(null);

const toggleProtocolMenu = () => {
  isProtocolMenuOpen.value = !isProtocolMenuOpen.value;
  if (isProtocolMenuOpen.value) isToolsMenuOpen.value = false;
};

const toggleToolsMenu = () => {
  isToolsMenuOpen.value = !isToolsMenuOpen.value;
  if (isToolsMenuOpen.value) isProtocolMenuOpen.value = false;
};

const handleSelectProtocol = (id) => {
  emit('switch-protocol', id);
  isProtocolMenuOpen.value = false;
};

const handleOpenWizard = () => {
  emit('open-protocol-wizard');
  isProtocolMenuOpen.value = false;
};

const handleOpenSettings = () => {
  emit('open-protocol-settings');
  isProtocolMenuOpen.value = false;
};

const onDocumentClick = (e) => {
  if (protocolMenuRef.value && !protocolMenuRef.value.contains(e.target)) {
    isProtocolMenuOpen.value = false;
  }
  if (toolsMenuRef.value && !toolsMenuRef.value.contains(e.target)) {
    isToolsMenuOpen.value = false;
  }
};

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('click', onDocumentClick);
  }
});

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', onDocumentClick);
  }
});
</script>

<template>
  <div class="hero-command-bar">
    <div class="hero-command-bar__left">
      <!-- Habuilt Brand Logo & Name -->
      <HabuiltLogo size="xs" :with-text="true" :show-badge="false" class="hero-brand-logo" />

      <!-- User / Track System Pill -->
      <span class="hero-track-pill" :class="isJyoti ? 'hero-track-pill--jyoti' : (isAshish ? 'hero-track-pill--ashish' : 'hero-track-pill--generic')">
        <Sparkles class="icon-xs" />
        <span v-if="isJyoti">Jyoti's System</span>
        <span v-else-if="isAshish">Ashish's System</span>
        <span v-else>{{ displayName }}'s System</span>
      </span>

      <!-- Dynamic Protocol Badge / Switcher Button & Dropdown -->
      <div class="hero-protocol-menu-wrap" ref="protocolMenuRef">
        <button
          type="button"
          class="hero-protocol-chip"
          :class="{ 'hero-protocol-chip--open': isProtocolMenuOpen }"
          @click.stop="toggleProtocolMenu"
          :title="`Current Protocol: ${activeProtocolName} • Click to switch or customize`"
        >
          <Sliders class="icon-xs icon-gold" />
          <span class="hero-protocol-chip__name truncate">{{ activeProtocolName }}</span>
          <ChevronDown class="icon-xxs hero-protocol-chip__arrow" :class="{ 'hero-protocol-chip__arrow--open': isProtocolMenuOpen }" />
        </button>

        <!-- Floating Protocol Quick Switcher Menu -->
        <Transition name="proto-drop">
          <div v-if="isProtocolMenuOpen" class="hero-protocol-dropdown" role="menu">
            <div class="hero-protocol-dropdown__header">
              <span class="hero-protocol-dropdown__title">Routine Protocols</span>
              <span class="hero-protocol-dropdown__hint">Quick Switch</span>
            </div>

            <div class="hero-protocol-dropdown__list">
              <button
                type="button"
                class="hero-protocol-option"
                :class="{ 'hero-protocol-option--active': activeProtocolId === 'archetype-founder' || (!activeProtocolId && !isAshish && !isJyoti) }"
                @click="handleSelectProtocol('archetype-founder')"
              >
                <div class="hero-protocol-option__icon"><Briefcase class="icon-xs" /></div>
                <div class="hero-protocol-option__info">
                  <span class="hero-protocol-option__name">Founder Executive</span>
                  <span class="hero-protocol-option__sub">16 habits • Deep Work Focus</span>
                </div>
                <Check v-if="activeProtocolId === 'archetype-founder' || (!activeProtocolId && !isAshish && !isJyoti)" class="icon-xs icon-gold ml-auto" />
              </button>

              <button
                type="button"
                class="hero-protocol-option"
                :class="{ 'hero-protocol-option--active': activeProtocolId === 'archetype-longevity' }"
                @click="handleSelectProtocol('archetype-longevity')"
              >
                <div class="hero-protocol-option__icon text-emerald-400"><Activity class="icon-xs" /></div>
                <div class="hero-protocol-option__info">
                  <span class="hero-protocol-option__name">Mind-Body Longevity</span>
                  <span class="hero-protocol-option__sub">18 habits • Circadian & Health</span>
                </div>
                <Check v-if="activeProtocolId === 'archetype-longevity'" class="icon-xs icon-gold ml-auto" />
              </button>

              <button
                type="button"
                class="hero-protocol-option"
                :class="{ 'hero-protocol-option--active': activeProtocolId === 'archetype-postpartum' }"
                @click="handleSelectProtocol('archetype-postpartum')"
              >
                <div class="hero-protocol-option__icon text-rose-400"><Heart class="icon-xs" /></div>
                <div class="hero-protocol-option__info">
                  <span class="hero-protocol-option__name">Postpartum & Family</span>
                  <span class="hero-protocol-option__sub">16 habits • Rest & Recovery</span>
                </div>
                <Check v-if="activeProtocolId === 'archetype-postpartum'" class="icon-xs icon-gold ml-auto" />
              </button>

              <button
                type="button"
                class="hero-protocol-option"
                :class="{ 'hero-protocol-option--active': activeProtocolId === 'archetype-ashish' || (isAshish && !activeProtocolId) }"
                @click="handleSelectProtocol('archetype-ashish')"
              >
                <div class="hero-protocol-option__icon icon-gold"><Crown class="icon-xs" /></div>
                <div class="hero-protocol-option__info">
                  <span class="hero-protocol-option__name">Ashish Master Protocol</span>
                  <span class="hero-protocol-option__sub">68 habits • 4 Office day types</span>
                </div>
                <Check v-if="activeProtocolId === 'archetype-ashish' || (isAshish && !activeProtocolId)" class="icon-xs icon-gold ml-auto" />
              </button>

              <button
                type="button"
                class="hero-protocol-option"
                :class="{ 'hero-protocol-option--active': activeProtocolId === 'archetype-jyoti' || (isJyoti && !activeProtocolId) }"
                @click="handleSelectProtocol('archetype-jyoti')"
              >
                <div class="hero-protocol-option__icon text-pink-400"><Sparkles class="icon-xs" /></div>
                <div class="hero-protocol-option__info">
                  <span class="hero-protocol-option__name">Jyoti Master Protocol</span>
                  <span class="hero-protocol-option__sub">37 habits • Maternal & Study</span>
                </div>
                <Check v-if="activeProtocolId === 'archetype-jyoti' || (isJyoti && !activeProtocolId)" class="icon-xs icon-gold ml-auto" />
              </button>
            </div>

            <div class="hero-protocol-dropdown__footer">
              <button type="button" class="hero-protocol-action-link" @click="handleOpenWizard">
                <Sparkles class="icon-xs icon-gold" />
                <span>Archetype Quiz (Wizard)</span>
              </button>
              <button type="button" class="hero-protocol-action-link" @click="handleOpenSettings">
                <Settings class="icon-xs" />
                <span>Scoring & Slot Settings</span>
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <span class="hero-version-tag">PRO</span>

      <!-- Level & XP Chip (Clickable for info) -->
      <button
        type="button"
        class="hero-level-chip"
        @click="showLevelInfo = !showLevelInfo"
        :title="`Level ${levelData.level} ${levelTitle} • ${levelData.xpInLevel}/${levelData.xpForNext} XP to next level (Click to learn more)`"
      >
        <Zap class="icon-xs icon-zap" />
        <span class="hero-level-chip__text">Lv. {{ levelData.level }} {{ levelTitle }}</span>
        <span class="hero-level-chip__xp mono-num">{{ totalXP }} XP</span>
      </button>
    </div>

    <!-- Desktop Navigation Tab Switcher -->
    <nav class="hero-desktop-nav" aria-label="Desktop Navigation">
      <button
        type="button"
        class="hero-desktop-tab"
        :class="{ 'hero-desktop-tab--active': activeTab === 'today' }"
        @click="emit('set-tab', 'today')"
      >
        <CheckSquare class="icon-xs" />
        <span>Checklist</span>
      </button>
      <button
        type="button"
        class="hero-desktop-tab"
        :class="{ 'hero-desktop-tab--active': activeTab === 'focus' }"
        @click="emit('set-tab', 'focus')"
      >
        <Timer class="icon-xs" />
        <span>Focus Station</span>
        <span v-if="timerRunning" class="hero-desktop-tab__pulse"></span>
      </button>
      <button
        type="button"
        class="hero-desktop-tab"
        :class="{ 'hero-desktop-tab--active': activeTab === 'stats' }"
        @click="emit('set-tab', 'stats')"
      >
        <BarChart3 class="icon-xs" />
        <span>Analytics</span>
      </button>
      <button
        type="button"
        class="hero-desktop-tab"
        :class="{ 'hero-desktop-tab--active': activeTab === 'rewards' }"
        @click="emit('set-tab', 'rewards')"
      >
        <Award class="icon-xs" />
        <span>Reward Vault</span>
      </button>
    </nav>

    <div class="hero-command-bar__right">
      <!-- Day Type Cycle Button (Office Calendar Aware) -->
      <button
        v-if="isAshish"
        type="button"
        class="hero-travel-btn"
        :class="{ 'hero-travel-btn--active': travelMode, 'hero-travel-btn--half': dayType === 'half-day', 'hero-travel-btn--holiday': dayType === 'holiday' }"
        @click="emit('toggle-travel')"
        :title="`Current: ${dayTypeLabel} • Tap to cycle day type`"
      >
        <Plane v-if="travelMode" class="icon-xs icon-plane" />
        <Calendar v-else-if="dayType === 'half-day' || dayType === 'holiday'" class="icon-xs" />
        <MapPin v-else class="icon-xs" />
        <span class="hero-travel-text">{{
          dayType === 'home' ? 'Home' :
          dayType === 'office-mon' ? 'Off (Mon)' :
          dayType === 'office-mid' ? 'Off (Mid)' :
          dayType === 'office-fri' ? 'Off (Fri)' :
          dayType === 'half-day' ? '½ Day' :
          dayType === 'holiday' ? 'Holiday' : 'Office'
        }}</span>
      </button>

      <!-- Month Controls -->
      <div class="hero-month-group">
        <button
          type="button"
          class="hero-icon-btn"
          :disabled="!canNavigatePrevMonth || isNavigatingMonth"
          @click="emit('prev-month')"
          title="Previous Month"
          aria-label="Previous Month"
        >
          <ChevronLeft class="icon-sm" />
        </button>
        <div class="hero-month-chip">
          <Calendar class="icon-xs" />
          <span>{{ monthLabel.slice(0, 3) }} '{{ String(year).slice(-2) }}</span>
        </div>
        <button
          type="button"
          class="hero-icon-btn"
          :disabled="!canNavigateNextMonth || isNavigatingMonth"
          @click="emit('next-month')"
          title="Next Month"
          aria-label="Next Month"
        >
          <ChevronRight class="icon-sm" />
        </button>
      </div>

      <!-- Spotlight Command Palette Launcher -->
      <button
        type="button"
        class="hero-spotlight-btn"
        @click="emit('open-spotlight')"
        title="Spotlight Command Palette (Ctrl+K / Cmd+K)"
        aria-label="Open Command Palette"
      >
        <Search class="icon-xs" />
        <span class="hero-spotlight-text">Search</span>
        <kbd class="hero-spotlight-kbd">⌘K</kbd>
      </button>

      <!-- Theme Switcher -->
      <button
        type="button"
        class="hero-icon-btn hero-icon-btn--theme"
        @click="emit('toggle-theme')"
        :title="darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
        aria-label="Toggle Theme"
      >
        <Sun v-if="darkMode" class="icon-sm icon-sun" />
        <Moon v-else class="icon-sm icon-moon" />
      </button>

      <!-- Quick Tools Consolidated Menu [•••] -->
      <div class="hero-tools-menu-wrap" ref="toolsMenuRef">
        <button
          type="button"
          class="hero-icon-btn hero-tools-trigger"
          :class="{ 'hero-icon-btn--active': isToolsMenuOpen, 'hero-icon-btn--paired': isPartnerPaired }"
          @click.stop="toggleToolsMenu"
          title="Quick Tools (Calendar, Partner, Alerts, Zen)"
          aria-label="Quick Tools"
        >
          <MoreHorizontal class="icon-sm" />
        </button>

        <Transition name="proto-drop">
          <div v-if="isToolsMenuOpen" class="hero-tools-dropdown" role="menu">
            <div class="hero-tools-dropdown__header">
              <span class="hero-tools-dropdown__title">Tools & Integrations</span>
            </div>

            <div class="hero-tools-dropdown__list">
              <button
                type="button"
                class="hero-tools-item"
                @click="emit('open-calendar-sync'); isToolsMenuOpen = false;"
              >
                <div class="hero-tools-item__icon icon-sky"><Calendar class="icon-xs" /></div>
                <div class="hero-tools-item__text">
                  <span class="hero-tools-item__title">Calendar Sync</span>
                  <span class="hero-tools-item__sub">Google & Outlook Focus</span>
                </div>
              </button>

              <button
                type="button"
                class="hero-tools-item"
                @click="emit('open-partner-sync'); isToolsMenuOpen = false;"
              >
                <div class="hero-tools-item__icon icon-indigo"><Users class="icon-xs" /></div>
                <div class="hero-tools-item__text">
                  <span class="hero-tools-item__title">Partner Cockpit</span>
                  <span class="hero-tools-item__sub">{{ isPartnerPaired ? 'Live Synced' : 'Couple Sync' }}</span>
                </div>
              </button>

              <button
                type="button"
                class="hero-tools-item"
                @click="emit('open-partner-pair'); isToolsMenuOpen = false;"
              >
                <div class="hero-tools-item__icon text-rose-400"><Heart class="icon-xs" /></div>
                <div class="hero-tools-item__text">
                  <span class="hero-tools-item__title">Pair Connection</span>
                  <span class="hero-tools-item__sub">Invite Code & Sync</span>
                </div>
              </button>

              <button
                type="button"
                class="hero-tools-item"
                @click="emit('open-install-modal'); isToolsMenuOpen = false;"
              >
                <div class="hero-tools-item__icon icon-emerald"><Download class="icon-xs" /></div>
                <div class="hero-tools-item__text">
                  <span class="hero-tools-item__title">Install Desktop App</span>
                  <span class="hero-tools-item__sub">PWA & Notifications</span>
                </div>
              </button>

              <button
                type="button"
                class="hero-tools-item"
                @click="emit('toggle-zen'); isToolsMenuOpen = false;"
              >
                <div class="hero-tools-item__icon" :class="zenMode ? 'text-amber-400' : 'text-slate-400'">
                  <Eye v-if="zenMode" class="icon-xs" />
                  <EyeOff v-else class="icon-xs" />
                </div>
                <div class="hero-tools-item__text">
                  <span class="hero-tools-item__title">{{ zenMode ? 'Exit Zen Mode' : 'Zen Focus Mode' }}</span>
                  <span class="hero-tools-item__sub">Press 'Z' shortcut</span>
                </div>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Level & XP Popover Modal – Teleported to body to escape stacking context -->
    <Teleport to="body">
      <Transition name="popover-fade">
        <div v-if="showLevelInfo" class="hero-level-popover-overlay" @click.self="showLevelInfo = false">
          <div class="hero-level-popover" role="dialog" aria-modal="true" aria-labelledby="xp-dialog-title">
            <div class="hero-level-popover__head">
              <div class="hero-level-popover__title" id="xp-dialog-title">
                <Zap class="icon-sm icon-zap" />
                <span>Habuilt XP Progression System</span>
              </div>
              <button type="button" class="hero-level-popover__close" @click="showLevelInfo = false" aria-label="Close dialog">
                <X class="icon-xs" />
              </button>
            </div>
            <div class="hero-level-popover__body">
              <p class="hero-level-popover__desc">
                You earn <strong>10 XP</strong> for every point completed. Your current rank is
                <strong>Level {{ levelData.level }} {{ levelTitle }}</strong> ({{ totalXP }} total XP).
              </p>
              <div class="hero-level-tiers-list">
                <div class="hero-level-tier-item" :class="{ 'hero-level-tier-item--current': levelData.level === 1 || levelData.level === 2 }">
                  <span class="tier-badge">Lv 1–2</span>
                  <span class="tier-title">Initiate</span>
                  <span class="tier-xp">0–999 XP</span>
                </div>
                <div class="hero-level-tier-item" :class="{ 'hero-level-tier-item--current': levelData.level === 3 || levelData.level === 4 }">
                  <span class="tier-badge">Lv 3–4</span>
                  <span class="tier-title">Practitioner</span>
                  <span class="tier-xp">1,000–1,999 XP</span>
                </div>
                <div class="hero-level-tier-item" :class="{ 'hero-level-tier-item--current': levelData.level === 5 || levelData.level === 6 }">
                  <span class="tier-badge">Lv 5–6</span>
                  <span class="tier-title">Architect</span>
                  <span class="tier-xp">2,000–2,999 XP</span>
                </div>
                <div class="hero-level-tier-item" :class="{ 'hero-level-tier-item--current': levelData.level >= 7 && levelData.level <= 9 }">
                  <span class="tier-badge">Lv 7–9</span>
                  <span class="tier-title">Titan</span>
                  <span class="tier-xp">3,000–4,999 XP</span>
                </div>
                <div class="hero-level-tier-item" :class="{ 'hero-level-tier-item--current': levelData.level >= 10 }">
                  <span class="tier-badge">Lv 10+</span>
                  <span class="tier-title">Ascendant</span>
                  <span class="tier-xp">5,000+ XP</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
