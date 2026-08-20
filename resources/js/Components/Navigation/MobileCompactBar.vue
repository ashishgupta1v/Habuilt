<script setup>
import { computed } from 'vue';
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
]);

const autoProtocolBadge = computed(() => {
  const pts = props.todayPoints;
  if (pts >= 15) return { label: '🏆 Full Target', class: 'mcb-auto-badge--full' };
  if (pts >= 8)  return { label: '⚡ Half Hit', class: 'mcb-auto-badge--half' };
  if (pts >= 4)  return { label: '🛡️ Floor Safe', class: 'mcb-auto-badge--floor' };
  return { label: `${pts}/15 pts`, class: 'mcb-auto-badge--base' };
});
</script>

<template>
  <div class="mobile-compact-bar">
    <!-- Top Row: Greeting, Status & Action Icons -->
    <div class="mcb-row mcb-row--top">
      <div class="mcb-user-group">
        <span class="mcb-greeting">{{ timeGreeting.salute }}, {{ timeGreeting.name }}</span>
        <span class="grade-badge mcb-grade" :class="performanceGrade.class">{{ performanceGrade.grade }}</span>
      </div>

      <div class="mcb-actions-group">
        <!-- Due Now Lockscreen Notification Actions Toggle -->
        <button
          v-if="notificationsSupported"
          id="mcb-btn-notifications"
          type="button"
          class="mcb-icon-btn mcb-icon-btn--notif"
          :class="{ 'mcb-icon-btn--notif-active': dueNowNotificationsEnabled }"
          @click="emit('toggle-notifications')"
          :title="dueNowNotificationsEnabled ? 'Due Now Lockscreen Actions Active (Tap to pause)' : 'Enable Due Now 1-Tap Lockscreen Actions'"
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

        <!-- Travel Mode Toggle (Ashish only) -->
        <button
          v-if="isAshish"
          id="mcb-btn-travel"
          type="button"
          class="mcb-icon-btn mcb-icon-btn--travel"
          :class="{ 'mcb-icon-btn--travel-active': travelMode }"
          @click="emit('toggle-travel')"
          :title="travelMode ? 'Chandigarh Routine Active • Tap to return to Home' : 'Switch to Chandigarh Routine'"
        >
          <Plane class="icon-xs" />
          <span class="mcb-travel-label">{{ travelMode ? 'CHD' : 'Travel' }}</span>
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
      </div>
    </div>

    <!-- Middle Row: Streak, Wallet & Progress Bar -->
    <div class="mcb-row mcb-row--stats">
      <div class="mcb-stats-pills">
        <span class="mcb-streak"><Flame class="icon-xs icon-flame" /> {{ systemStreak.current }}d streak</span>
        <span class="mcb-wallet"><Award class="icon-xs icon-vault-gold" /> {{ availableWallet }} pts</span>
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

    <!-- Live Up Next Activity Strip on Mobile -->
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
  gap: 4px;
  padding: 4px 10px 6px;
  background: rgba(9, 13, 22, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  position: sticky;
  top: 0;
  z-index: 80;
  box-sizing: border-box;
  width: 100%;
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

.mcb-user-group {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.mcb-greeting {
  font-size: clamp(0.72rem, 3.2vw, 0.88rem);
  font-weight: 800;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #ffffff;
  min-width: 0;
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
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: #f8fafc;
  cursor: pointer;
  padding: 0;
  transition: all 0.15s ease;
}

.mcb-icon-btn--travel {
  width: auto;
  min-width: auto;
  padding: 0 5px;
  gap: 2px;
  font-size: 0.65rem;
  font-weight: 700;
}

.mcb-travel-label {
  font-size: 0.62rem;
  font-weight: 700;
}

.mcb-row--stats {
  justify-content: space-between;
  gap: 4px;
}

.mcb-stats-pills {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex-shrink: 1;
}

.mcb-streak, .mcb-wallet {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: clamp(0.64rem, 2.7vw, 0.72rem);
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 6px;
  white-space: nowrap;
}

.mcb-streak {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.mcb-wallet {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.mcb-progress-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.mcb-auto-badge {
  font-size: clamp(0.6rem, 2.5vw, 0.68rem);
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 5px;
  white-space: nowrap;
}

.mcb-progress-track {
  width: clamp(28px, 7vw, 44px);
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.12);
  overflow: hidden;
  flex-shrink: 0;
}

.mcb-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  transition: width 0.3s ease;
}

.mcb-progress-label {
  font-size: clamp(0.6rem, 2.4vw, 0.68rem);
  color: #94a3b8;
  font-weight: 700;
}

.mcb-up-next-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  margin-top: 2px;
  background: linear-gradient(135deg, rgba(200, 164, 86, 0.12), rgba(99, 102, 241, 0.08));
  border: 1px solid rgba(200, 164, 86, 0.3);
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
}

.mcb-up-next-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  border-radius: 4px;
  background: #C8A456;
  color: #1e293b;
  font-size: clamp(0.58rem, 2.3vw, 0.65rem);
  font-weight: 800;
  letter-spacing: 0.02em;
  white-space: nowrap;
  flex-shrink: 0;
}

.mcb-up-next-tag--due {
  background: #ef4444;
  color: #fff;
}

.mcb-up-next-title {
  font-size: clamp(0.68rem, 2.8vw, 0.76rem);
  font-weight: 700;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.mcb-up-next-action {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: clamp(0.62rem, 2.5vw, 0.7rem);
  font-weight: 800;
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  padding: 2px 4px;
  border-radius: 4px;
  flex-shrink: 0;
}
</style>
