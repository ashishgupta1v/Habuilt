<script setup>
import { computed } from 'vue';
import HabuiltLogo from '@/Components/Brand/HabuiltLogo.vue';
import {
  Flame,
  Award,
  Clock,
  Check,
  Sparkles,
  Sun,
  Moon,
  Plane,
  Share2,
  RefreshCw,
  Bell,
  BellOff,
  LogOut,
} from 'lucide-vue-next';

const props = defineProps({
  timeGreeting: { type: Object, required: true },
  performanceGrade: { type: Object, required: true },
  systemStreak: { type: Object, required: true },
  availableWallet: { type: Number, default: 0 },
  todayPoints: { type: Number, default: 0 },
  todayCompletedCount: { type: Number, default: 0 },
  totalHabits: { type: Number, default: 0 },
  isCurrentMonth: { type: Boolean, default: true },
  currentDay: { type: Number, default: 1 },
  upNextHabitInfo: { type: Object, default: null },
  hasCompletedDay: { type: Function, required: true },
  isAshish: { type: Boolean, default: false },
  travelMode: { type: Boolean, default: false },
  darkMode: { type: Boolean, default: true },
  isSyncing: { type: Boolean, default: false },
  notificationsSupported: { type: Boolean, default: false },
  dueNowNotificationsEnabled: { type: Boolean, default: false },
});

const emit = defineEmits([
  'toggle-up-next',
  'toggle-theme',
  'toggle-travel',
  'share-scorecard',
  'reload-app',
  'toggle-notifications',
  'sign-out',
]);

const autoProtocolBadge = computed(() => {
  const pts = props.todayPoints;
  if (pts >= 15) return { label: '👑 Full', class: 'mcb-auto-badge--full' };
  if (pts >= 8)  return { label: '⚡ Half', class: 'mcb-auto-badge--half' };
  if (pts >= 4)  return { label: '🛡️ Floor', class: 'mcb-auto-badge--floor' };
  return { label: `${pts}/15p`, class: 'mcb-auto-badge--base' };
});
</script>

<template>
  <div class="mobile-compact-bar" :class="{ 'mcb--dark': darkMode, 'mcb--light': !darkMode }">
    <!-- Top Row: Brand, User Identity & Action Icons (Unified Single Mobile Navigation Bar) -->
    <div class="mcb-row mcb-row--top">
      <div class="mcb-brand-user-group">
        <HabuiltLogo size="xs" :with-text="true" class="mcb-brand-logo" />
        <span class="mcb-pro-tag">PRO</span>
        <div class="mcb-divider-dot"></div>
        <span class="mcb-user-name">{{ isAshish ? 'Ashish' : (timeGreeting?.name || 'User') }}</span>
        <span class="grade-badge mcb-grade" :class="performanceGrade.class">{{ performanceGrade.grade }}</span>
      </div>

      <div class="mcb-actions-group">
        <!-- Travel Mode Toggle (Ashish only) -->
        <button
          v-if="isAshish"
          id="mcb-btn-travel"
          type="button"
          class="mcb-icon-btn mcb-icon-btn--travel"
          :class="{ 'mcb-icon-btn--travel-active': travelMode }"
          @click="emit('toggle-travel')"
          :title="travelMode ? 'Chandigarh Routine Active' : 'Switch to Chandigarh Routine'"
        >
          <Plane class="icon-xs" />
          <span class="mcb-travel-label">{{ travelMode ? 'CHD' : 'Home' }}</span>
        </button>

        <!-- Due Now Lockscreen Notification Actions Toggle -->
        <button
          v-if="notificationsSupported"
          id="mcb-btn-notifications"
          type="button"
          class="mcb-icon-btn mcb-icon-btn--notif"
          :class="{ 'mcb-icon-btn--notif-active': dueNowNotificationsEnabled }"
          @click="emit('toggle-notifications')"
          :title="dueNowNotificationsEnabled ? 'Due Now Notifications Active' : 'Enable Notifications'"
          aria-label="Due Now Lockscreen Notifications"
        >
          <Bell v-if="dueNowNotificationsEnabled" class="icon-xs icon-gold" />
          <BellOff v-else class="icon-xs" />
        </button>

        <!-- Manual Sync / Reload Button -->
        <button
          id="mcb-btn-reload"
          type="button"
          class="mcb-icon-btn"
          @click="emit('reload-app')"
          :title="isSyncing ? 'Syncing...' : 'Reload & Sync Database'"
          aria-label="Reload and Sync"
        >
          <RefreshCw class="icon-xs" :class="{ 'animate-spin': isSyncing }" />
        </button>

        <!-- Share Scorecard Button -->
        <button
          id="mcb-btn-share"
          type="button"
          class="mcb-icon-btn"
          @click="emit('share-scorecard')"
          title="Share Daily Scorecard"
          aria-label="Share Daily Scorecard"
        >
          <Share2 class="icon-xs" />
        </button>

        <!-- Dark / Light Mode Switcher -->
        <button
          id="mcb-btn-theme"
          type="button"
          class="mcb-icon-btn mcb-icon-btn--theme"
          @click="emit('toggle-theme')"
          :title="darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          aria-label="Toggle Theme"
        >
          <Sun v-if="darkMode" class="icon-xs icon-sun" />
          <Moon v-else class="icon-xs icon-moon" />
        </button>

        <!-- Sign Out Button -->
        <button
          id="mcb-btn-logout"
          type="button"
          class="mcb-icon-btn mcb-icon-btn--logout"
          @click="emit('sign-out')"
          title="Sign out of Habuilt"
          aria-label="Sign Out"
        >
          <LogOut class="icon-xs" />
        </button>
      </div>
    </div>

    <!-- Middle Row: High-Density Mission Control Stats Capsule -->
    <div class="mcb-row mcb-row--stats">
      <div class="mcb-stats-pills">
        <span class="mcb-streak" :title="`Current streak: ${systemStreak.current} days`">
          <Flame class="icon-xs icon-flame" /> {{ systemStreak.current }}d
        </span>
        <span class="mcb-wallet" :title="`Available wallet: ${availableWallet} points`">
          <Award class="icon-xs icon-vault-gold" /> {{ availableWallet }}p
        </span>
      </div>

      <div class="mcb-progress-group">
        <span class="mcb-auto-badge" :class="autoProtocolBadge.class">
          {{ autoProtocolBadge.label }}
        </span>
        <div class="mcb-progress-track">
          <div
            class="mcb-progress-fill"
            :style="{ width: `${totalHabits > 0 ? Math.min(100, Math.round((todayCompletedCount / totalHabits) * 100)) : 0}%` }"
          ></div>
        </div>
        <span class="mcb-progress-label mono-num">{{ todayCompletedCount }}/{{ totalHabits }}</span>
      </div>
    </div>

    <!-- Live Up Next / Due Now Action Card on Mobile -->
    <div
      v-if="isCurrentMonth && upNextHabitInfo && !hasCompletedDay(upNextHabitInfo.habit, currentDay)"
      id="mcb-btn-upnext"
      class="mcb-up-next-row"
      @click="emit('toggle-up-next', upNextHabitInfo.habit, currentDay)"
      title="Tap to mark done"
    >
      <div class="mcb-up-next-tag" :class="{ 'mcb-up-next-tag--due': upNextHabitInfo.status === 'due' }">
        <Clock class="icon-xs" />
        <span>{{ upNextHabitInfo.shortBadge }}</span>
      </div>
      <span class="mcb-up-next-title">{{ upNextHabitInfo.habit.name }}</span>
      <span class="mcb-up-next-action">
        <Check class="icon-xs" />
        <span>+{{ upNextHabitInfo.habit.points }}pt</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.mobile-compact-bar {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: max(8px, env(safe-area-inset-top, 0px)) 10px 6px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  position: sticky;
  top: 0;
  z-index: 80;
  box-sizing: border-box;
  width: 100%;
  margin-top: 0;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.mobile-compact-bar.mcb--dark {
  background: rgba(6, 11, 22, 0.96);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
}

@media (min-width: 769px) {
  .mobile-compact-bar {
    display: none !important;
  }
}

.mcb-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  box-sizing: border-box;
}

.mcb-row--top {
  justify-content: space-between;
}

.mcb-brand-user-group {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  flex-shrink: 1;
}

.mcb-brand-logo {
  flex-shrink: 0;
}

.mcb-pro-tag {
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(200, 164, 86, 0.18);
  color: #D4B36A;
  border: 1px solid rgba(200, 164, 86, 0.35);
  flex-shrink: 0;
}

.mcb-divider-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(148, 163, 184, 0.4);
  flex-shrink: 0;
}

.mcb-user-name {
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: #0f172a;
  white-space: nowrap;
}

.mcb--dark .mcb-user-name {
  color: #f8fafc;
}

.mcb-grade {
  font-size: 0.65rem;
  padding: 1px 5px;
  border-radius: 6px;
  flex-shrink: 0;
}

.mcb-actions-group {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.mcb-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  min-width: 30px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.07);
  color: #334155;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  -webkit-tap-highlight-color: transparent;
}

.mcb-icon-btn:active {
  transform: scale(0.92);
}

.mcb--dark .mcb-icon-btn {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
}

.mcb--dark .mcb-icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.mcb-icon-btn--travel {
  width: auto;
  min-width: auto;
  padding: 0 7px;
  gap: 3px;
  font-size: 0.68rem;
  font-weight: 750;
  border-radius: 8px;
  background: rgba(200, 164, 86, 0.12);
  border-color: rgba(200, 164, 86, 0.28);
  color: #D4B36A;
}

.mcb-icon-btn--travel-active {
  background: rgba(200, 164, 86, 0.25);
  border-color: #C8A456;
  color: #F6D380;
}

.mcb-travel-label {
  font-size: 0.68rem;
  font-weight: 800;
}

.mcb-icon-btn--notif-active {
  background: rgba(200, 164, 86, 0.16);
  border-color: rgba(200, 164, 86, 0.4);
  color: #D4B36A;
}

.mcb-icon-btn--logout {
  color: #94a3b8;
}

.mcb--dark .mcb-icon-btn--logout:hover {
  color: #f87171;
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.25);
}

.mcb-row--stats {
  justify-content: space-between;
  gap: 6px;
  padding: 3px 8px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.mcb--dark .mcb-row--stats {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.05);
}

.mcb-stats-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex-shrink: 1;
}

.mcb-streak, .mcb-wallet {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.72rem;
  font-weight: 750;
  padding: 2px 7px;
  border-radius: 8px;
  white-space: nowrap;
}

.mcb-streak {
  background: rgba(245, 158, 11, 0.14);
  color: #d97706;
}

.mcb--dark .mcb-streak {
  background: rgba(245, 158, 11, 0.18);
  color: #fbbf24;
}

.mcb-wallet {
  background: rgba(200, 164, 86, 0.14);
  color: #b8860b;
}

.mcb--dark .mcb-wallet {
  background: rgba(200, 164, 86, 0.18);
  color: #D4B36A;
}

.mcb-progress-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.mcb-auto-badge {
  font-size: 0.68rem;
  font-weight: 750;
  padding: 2px 7px;
  border-radius: 8px;
  white-space: nowrap;
}

.mcb-progress-track {
  width: 40px;
  height: 5px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.1);
  overflow: hidden;
  flex-shrink: 0;
}

.mcb--dark .mcb-progress-track {
  background: rgba(255, 255, 255, 0.12);
}

.mcb-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.mcb-progress-label {
  font-size: 0.72rem;
  color: #64748b;
  font-weight: 750;
}

.mcb--dark .mcb-progress-label {
  color: #94a3b8;
}

/* ── Live Up Next / Due Now Action Row ── */
.mcb-up-next-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(200, 164, 86, 0.1);
  border: 1px solid rgba(200, 164, 86, 0.28);
  border-radius: 10px;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  transition: transform 0.15s ease, background-color 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.mcb--dark .mcb-up-next-row {
  background: linear-gradient(135deg, rgba(200, 164, 86, 0.12), rgba(13, 21, 39, 0.6));
  border-color: rgba(200, 164, 86, 0.25);
}

.mcb-up-next-row:active {
  transform: scale(0.985);
}

.mcb-up-next-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 6px;
  background: #C8A456;
  color: #060b16;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  white-space: nowrap;
  flex-shrink: 0;
}

.mcb-up-next-tag--due {
  background: #ef4444;
  color: #ffffff;
}

.mcb-up-next-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.mcb--dark .mcb-up-next-title {
  color: #f8fafc;
}

.mcb-up-next-action {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.68rem;
  font-weight: 800;
  color: #059669;
  background: rgba(16, 185, 129, 0.12);
  padding: 2px 6px;
  border-radius: 7px;
  flex-shrink: 0;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.mcb--dark .mcb-up-next-action {
  color: #34d399;
  background: rgba(16, 185, 129, 0.18);
}
</style>
