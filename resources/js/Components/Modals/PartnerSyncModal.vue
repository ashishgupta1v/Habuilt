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
});

const emit = defineEmits(['close', 'send-emote', 'toast']);

// Shared Couple Anchors with daily standard timing
const sharedAnchors = computed(() => [
  {
    id: 'anchor-lunch',
    time: '13:30 - 14:15',
    title: 'Shared Wholesome Lunch',
    subtitle: 'Warm nourishing food, zero screens, active listening',
    icon: Coffee,
    badge: 'Nutrition',
  },
  {
    id: 'anchor-stroller',
    time: '18:35 - 19:15',
    title: 'Shaarvi Stroller Park Walk',
    subtitle: 'Outdoor metabolic walk, fresh air, baby bonding',
    icon: Sparkles,
    badge: 'Family',
  },
  {
    id: 'anchor-dinner',
    time: '19:25 - 20:15',
    title: 'Family Dinner Preparation',
    subtitle: 'Cooking together, table setup & peaceful evening meal',
    icon: Heart,
    badge: 'Household',
  },
  {
    id: 'anchor-diya',
    time: '20:35 - 20:50',
    title: 'Evening Diya & Gratitude',
    subtitle: 'Lighting the lamp, quiet reflection & daily thanks',
    icon: Flame,
    badge: 'Spiritual',
  },
]);

// Interactive Peer Emotes
const emotes = [
  { id: 'high-five', label: '🙌 High-Five', message: 'sent you a Warrior High-Five! 🔥' },
  { id: 'keep-going', label: '💪 Keep Crushing It', message: 'is cheering for you! Keep crushing your goals! ⚡' },
  { id: 'coffee', label: '☕ Coffee Boost', message: 'sent you a virtual coffee & focus boost! ☕' },
  { id: 'love', label: '❤️ Thinking of You', message: 'sent you lots of love and gratitude! ❤️' },
  { id: 'cheer', label: '🎉 Victory Cheer', message: 'is celebrating your consistency! Peak Warrior! 👑' },
];

const selectedEmote = ref(null);

const handleSendEmote = (emote) => {
  emit('send-emote', emote);
  emit('toast', `Sent "${emote.label}" to ${props.partnerName}!`);
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
            {{ partnerName.charAt(0) }}
          </div>
          <span class="partner-presence-dot" title="Live Supabase Sync Active"></span>
        </div>

        <div class="partner-banner-info">
          <div class="partner-name-row">
            <span class="partner-banner-name">{{ partnerName }}</span>
            <span class="badge-partner-status">🌸 Co-Warrior Active</span>
          </div>
          <span class="partner-banner-sub">
            Real-time peer visibility & reciprocal habit celebrations
          </span>
        </div>

        <div class="partner-banner-stats">
          <div class="stat-pill mono-num">
            <span class="stat-pill__val">{{ partnerPoints }}</span>
            <span class="stat-pill__lbl">Pts Today</span>
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
        <span class="partner-section-label">🕊️ Shared Couple Anchors (Today)</span>
        <div class="partner-anchors-list">
          <div
            v-for="anchor in sharedAnchors"
            :key="anchor.id"
            class="partner-anchor-item"
          >
            <div class="partner-anchor-time mono-num">
              <Clock class="icon-xs" />
              <span>{{ anchor.time }}</span>
            </div>
            <div class="partner-anchor-content">
              <span class="partner-anchor-title">{{ anchor.title }}</span>
              <span class="partner-anchor-sub">{{ anchor.subtitle }}</span>
            </div>
            <span class="partner-anchor-badge">{{ anchor.badge }}</span>
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
