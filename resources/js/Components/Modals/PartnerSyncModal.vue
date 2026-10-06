<script setup>
import { ref, computed } from 'vue';
import {
  Users,
  Heart,
  Sparkles,
  Zap,
  Coffee,
  CheckCircle2,
  Clock,
  Send,
  X,
  MessageCircle,
  Flame,
  Award,
  Radio,
  WifiOff,
} from 'lucide-vue-next';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  isAshish: { type: Boolean, default: false },
  isJyoti: { type: Boolean, default: false },
  displayName: { type: String, default: 'Warrior' },
  partnerName: { type: String, default: 'Partner' },
  partnerCompletedCount: { type: Number, default: 0 },
  partnerTotalCount: { type: Number, default: 0 },
  partnerPoints: { type: Number, default: 0 },
  currentDay: { type: Number, default: 1 },
  partnerHabits: { type: Array, default: () => [] },
  sharedHabits: { type: Array, default: () => [] },
  sharedAnchors: { type: Array, default: () => [] },
  alignmentScore: { type: Number, default: null },
  isOffline: { type: Boolean, default: false },
  partnerPresence: {
    type: Object,
    default: () => ({
      isOnline: false,
      lastSeen: null,
      currentWindow: '',
      statusLabel: 'Offline',
    }),
  },
});

const emit = defineEmits(['close', 'send-emote', 'send-nudge', 'toast']);

// Default fallback couple anchors if no dynamic computed anchors are provided
const fallbackAnchors = [
  {
    id: 'anchor-lunch',
    time: '13:30 - 14:15',
    title: 'Shared Wholesome Lunch',
    subtitle: 'Warm nourishing food, zero screens, active listening',
    badge: 'Nutrition',
    completedByUser: false,
    completedByPartner: false,
    completedTogether: false,
  },
  {
    id: 'anchor-stroller',
    time: '18:35 - 19:15',
    title: 'Shaarvi Stroller Park Walk',
    subtitle: 'Outdoor metabolic walk, fresh air, baby bonding',
    badge: 'Family',
    completedByUser: false,
    completedByPartner: false,
    completedTogether: false,
  },
  {
    id: 'anchor-dinner',
    time: '19:25 - 20:15',
    title: 'Family Dinner Preparation',
    subtitle: 'Cooking together, table setup & peaceful evening meal',
    badge: 'Household',
    completedByUser: false,
    completedByPartner: false,
    completedTogether: false,
  },
  {
    id: 'anchor-diya',
    time: '20:35 - 20:50',
    title: 'Evening Diya & Gratitude',
    subtitle: 'Lighting the lamp, quiet reflection & daily thanks',
    badge: 'Spiritual',
    completedByUser: false,
    completedByPartner: false,
    completedTogether: false,
  },
];

const activeAnchors = computed(() => {
  if (Array.isArray(props.sharedAnchors) && props.sharedAnchors.length > 0) {
    return props.sharedAnchors;
  }
  return fallbackAnchors;
});

const calculatedAlignment = computed(() => {
  if (props.alignmentScore !== null && props.alignmentScore !== undefined) {
    return props.alignmentScore;
  }
  const anchors = activeAnchors.value;
  if (!anchors || anchors.length === 0) return 0;
  const synced = anchors.filter(a => a.completedTogether).length;
  return Math.round((synced / anchors.length) * 100);
});

// Interactive Peer Emotes
const emotes = [
  { id: 'high-five', label: '🙌 High-Five', message: 'sent you a Warrior High-Five! 🔥' },
  { id: 'keep-going', label: '💪 Keep Crushing It', message: 'is cheering for you! Keep crushing your goals! ⚡' },
  { id: 'coffee', label: '☕ Coffee Boost', message: 'sent you a virtual coffee & focus boost! ☕' },
  { id: 'love', label: '❤️ Thinking of You', message: 'sent you lots of love and gratitude! ❤️' },
  { id: 'cheer', label: '🎉 Victory Cheer', message: 'is celebrating your consistency! Peak Warrior! 👑' },
];

const handleSendEmote = (emote) => {
  emit('send-emote', emote);
  emit('toast', `Sent "${emote.label}" to ${props.partnerName}!`);
};

// ── Instant Routine Nudges ──
const quickNudges = [
  {
    id: 'lunch',
    icon: '🥗',
    label: '13:30 Lunch Stop',
    time: 'Nutrition',
    message: 'Time for our shared lunch! Zero screens & warm nourishment.',
    accent: 'emerald',
  },
  {
    id: 'hydration',
    icon: '💧',
    label: 'Hydration & Posture',
    time: 'Vitality',
    message: 'Drink water, stretch your spine & rest eyes for 2 minutes!',
    accent: 'sky',
  },
  {
    id: 'focus',
    icon: '🎯',
    label: 'Deep Work Sprint',
    time: 'Focus Block',
    message: 'Entering high-intensity focus block. Let’s conquer standards! ⚔️',
    accent: 'indigo',
  },
  {
    id: 'wind-down',
    icon: '🌙',
    label: '18:30 Evening Wind-Down',
    time: 'Shutdown',
    message: 'Time to shutdown screens, walk & prepare family evening.',
    accent: 'rose',
  },
];

const handleSendNudge = (nudge) => {
  emit('send-nudge', nudge);
  emit('toast', `Sent "${nudge.label}" nudge to ${props.partnerName}!`);
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([15, 30, 15]);
  }
};

// ── Custom Nudge Composer ──
const customNudgeText = ref('');
const selectedNudgeEmoji = ref('⚡');
const quickEmojiTags = [
  { emoji: '⚡', label: 'Focus' },
  { emoji: '☕', label: 'Coffee' },
  { emoji: '🚶', label: 'Walk' },
  { emoji: '🍱', label: 'Food' },
  { emoji: '🧘', label: 'Stretch' },
  { emoji: '❤️', label: 'Love' },
];

const handleSendCustomNudge = () => {
  const text = customNudgeText.value.trim();
  if (!text) return;

  const customNudge = {
    id: `custom-${Date.now()}`,
    icon: selectedNudgeEmoji.value,
    label: 'Warrior Ping',
    time: 'Instant',
    message: text,
    accent: 'gold',
  };

  handleSendNudge(customNudge);
  customNudgeText.value = '';
};
</script>

<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card modal-card--partner-sync" role="dialog" aria-modal="true">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="modal-header__title-wrap">
          <div class="modal-header__icon-badge">
            <Users class="icon-md icon-teal" />
          </div>
          <div>
            <h3 class="modal-header__title">Shared Couple Cockpit</h3>
            <p class="modal-header__sub">
              Live sync & accountability between <strong>{{ displayName }}</strong> and <strong>{{ partnerName }}</strong>
            </p>
          </div>
        </div>
        <button
          type="button"
          class="modal-close-btn"
          @click="emit('close')"
          aria-label="Close Partner Sync Modal"
        >
          <X class="icon-sm" />
        </button>
      </div>

      <!-- Partner Overview Banner -->
      <div class="partner-overview-banner">
        <div class="partner-avatar-wrap">
          <div class="partner-avatar">
            {{ (partnerName || 'P').charAt(0).toUpperCase() }}
          </div>
          <span
            class="partner-presence-beacon"
            :class="{
              'partner-presence-beacon--online': partnerPresence.isOnline,
              'partner-presence-beacon--away': !partnerPresence.isOnline && partnerPresence.lastSeen,
              'partner-presence-beacon--offline': !partnerPresence.isOnline && !partnerPresence.lastSeen
            }"
            :title="partnerPresence.statusLabel"
          >
            <span v-if="partnerPresence.isOnline" class="partner-presence-beacon__ping"></span>
          </span>
        </div>

        <div class="partner-banner-info">
          <div class="partner-name-row">
            <span class="partner-banner-name">{{ partnerName }}</span>
            <span
              v-if="partnerPresence.isOnline"
              class="badge-partner-status badge-partner-status--online"
            >
              <span class="beacon-pulse-dot"></span>
              {{ partnerPresence.statusLabel }} • {{ partnerPresence.currentWindow || 'Active' }}
            </span>
            <span
              v-else-if="partnerPresence.lastSeen"
              class="badge-partner-status badge-partner-status--away"
            >
              🕒 {{ partnerPresence.statusLabel }}
            </span>
            <span v-else class="badge-partner-status badge-partner-status--offline">
              <WifiOff class="w-3 h-3" />
              Offline
            </span>
          </div>
          <span class="partner-banner-sub">
            Real-time peer visibility &amp; reciprocal habit celebrations
          </span>
        </div>

        <div class="partner-banner-stats flex items-center gap-2">
          <div class="stat-pill mono-num">
            <span class="stat-pill__val">{{ partnerPoints }}</span>
            <span class="stat-pill__lbl">Pts Today</span>
          </div>
          <div class="stat-pill mono-num">
            <span class="stat-pill__val">{{ partnerCompletedCount }}/{{ partnerTotalCount || '—' }}</span>
            <span class="stat-pill__lbl">Habits Done</span>
          </div>
          <div class="stat-pill mono-num">
            <span class="stat-pill__val text-gold">{{ calculatedAlignment }}%</span>
            <span class="stat-pill__lbl">Alignment</span>
          </div>
        </div>
      </div>

      <!-- Instant Synchronization Nudges Section -->
      <div class="partner-nudges-section">
        <div class="flex items-center justify-between mb-2">
          <span class="partner-section-label !mb-0">🔔 Instant Routine Nudges</span>
          <span class="text-[11px] font-mono text-emerald-400">Zero-Friction Ping</span>
        </div>
        <div class="partner-nudges-grid">
          <button
            v-for="nudge in quickNudges"
            :key="nudge.id"
            type="button"
            class="partner-nudge-btn"
            :class="`partner-nudge-btn--${nudge.accent}`"
            @click="handleSendNudge(nudge)"
            :title="`Nudge ${partnerName}: ${nudge.message}`"
          >
            <span class="partner-nudge-btn__icon">{{ nudge.icon }}</span>
            <div class="partner-nudge-btn__body">
              <div class="partner-nudge-btn__top">
                <span class="partner-nudge-btn__label">{{ nudge.label }}</span>
                <span class="partner-nudge-btn__pill mono-num">{{ nudge.time }}</span>
              </div>
              <span class="partner-nudge-btn__msg">{{ nudge.message }}</span>
            </div>
            <Send class="icon-xs partner-nudge-btn__send" />
          </button>
        </div>

        <!-- Compact Inline Custom Nudge Composer -->
        <div class="partner-custom-composer">
          <div class="partner-custom-composer__head">
            <span class="partner-custom-composer__title">
              <span>✍️ Custom Live Ping</span>
              <small>Tap tag & ping {{ partnerName }}</small>
            </span>
            <div class="partner-emoji-tags">
              <button
                v-for="tag in quickEmojiTags"
                :key="tag.emoji"
                type="button"
                class="partner-emoji-tag"
                :class="{ 'partner-emoji-tag--active': selectedNudgeEmoji === tag.emoji }"
                @click="selectedNudgeEmoji = tag.emoji"
                :title="tag.label"
              >
                {{ tag.emoji }}
              </button>
            </div>
          </div>
          <div class="partner-custom-composer__row">
            <div class="partner-custom-composer__input-wrap">
              <span class="partner-custom-composer__tag-preview">{{ selectedNudgeEmoji }}</span>
              <input
                v-model="customNudgeText"
                type="text"
                maxlength="60"
                class="partner-custom-composer__input"
                :placeholder="`Ping ${partnerName} with custom note (max 60 chars)...`"
                @keydown.enter.prevent="handleSendCustomNudge"
              />
              <span class="partner-custom-composer__count mono-num">
                {{ customNudgeText.length }}/60
              </span>
            </div>
            <button
              type="button"
              class="btn partner-custom-composer__send-btn"
              :disabled="!customNudgeText.trim()"
              @click="handleSendCustomNudge"
              title="Send custom nudge"
            >
              <Send class="icon-xs" />
              <span>Ping</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Live Emote Action Bar -->
      <div class="partner-emote-section">
        <span class="partner-section-label">⚡ Send Real-Time Encouragement</span>
        <div class="partner-emotes-grid">
          <button
            v-for="emote in emotes"
            :key="emote.id"
            type="button"
            class="btn-partner-emote"
            @click="handleSendEmote(emote)"
          >
            {{ emote.label }}
          </button>
        </div>
      </div>

      <!-- Shared Couple Anchors Timeline -->
      <div class="partner-anchors-section">
        <div class="flex items-center justify-between mb-2">
          <span class="partner-section-label !mb-0">🕊️ Shared Couple Anchors (Today)</span>
          <span class="text-[11px] font-mono font-bold text-gold">
            {{ calculatedAlignment }}% Synced Today
          </span>
        </div>
        <div class="partner-anchors-list">
          <div
            v-for="anchor in activeAnchors"
            :key="anchor.id"
            class="partner-anchor-item transition-all"
            :class="{
              '!border-gold/50 !bg-gold/5 shadow-sm': anchor.completedTogether,
              '!border-rose-500/30 !bg-rose-500/5': anchor.completedByPartner && !anchor.completedTogether,
            }"
          >
            <div class="partner-anchor-time mono-num">
              <Clock class="icon-xs" />
              <span>{{ anchor.time }}</span>
            </div>
            <div class="partner-anchor-content">
              <span class="partner-anchor-title flex items-center gap-1.5">
                {{ anchor.title }}
                <CheckCircle2 v-if="anchor.completedTogether" class="w-3.5 h-3.5 text-emerald-400 inline" />
              </span>
              <span class="partner-anchor-sub">{{ anchor.subtitle }}</span>
            </div>

            <!-- Real-time sync status badges -->
            <div class="flex items-center gap-1.5">
              <span
                v-if="anchor.completedTogether"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              >
                🎉 Synced
              </span>
              <span
                v-else-if="anchor.completedByPartner"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30"
              >
                🌸 Partner Done
              </span>
              <span
                v-else-if="anchor.completedByUser"
                class="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30"
              >
                ⚡ You Done
              </span>
              <span
                v-else
                class="partner-anchor-badge"
              >
                {{ anchor.badge || 'Pending' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="modal-footer">
        <div class="partner-sync-footnote">
          <Heart class="icon-xs icon-rose" />
          <span>Shared habits automatically celebrate across both devices with confetti & haptics.</span>
        </div>
        <button
          type="button"
          class="btn btn--secondary"
          @click="emit('close')"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>
