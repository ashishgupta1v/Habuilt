<script setup>
import { ref, computed } from 'vue';
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
  MapPin,
  Calendar,
  Search,
  Users,
  Sliders,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  X,
  Heart,
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
  displayName: { type: String, default: '' },
  travelMode: { type: Boolean, default: false },
  dayType: { type: String, default: 'home' },
  dayTypeLabel: { type: String, default: '🏠 Home' },
  darkMode: { type: Boolean, default: true },
  isSyncing: { type: Boolean, default: false },
  notificationsSupported: { type: Boolean, default: false },
  dueNowNotificationsEnabled: { type: Boolean, default: false },
  tierThresholds: { type: Object, default: () => ({ floor: 4, half: 8, full: 15, target: 15 }) },
  zenMode: { type: Boolean, default: false },
  isGuestActive: { type: Boolean, default: false },
});

const emit = defineEmits([
  'toggle-up-next',
  'toggle-theme',
  'toggle-zen',
  'toggle-travel',
  'share-scorecard',
  'reload-app',
  'toggle-notifications',
  'open-spotlight',
  'open-calendar-sync',
  'open-partner-sync',
  'open-partner-pair',
  'open-protocol-wizard',
  'sign-out',
]);

const isExpanded = ref(false);
const isToolsOpen = ref(false);

const autoProtocolBadge = computed(() => {
  const pts = props.todayPoints;
  const tiers = props.tierThresholds || { floor: 4, half: 8, full: 15, target: 15 };
  if (pts >= tiers.full) return { label: '👑 Full', class: 'mcb-auto-badge--full' };
  if (pts >= tiers.half)  return { label: '⚡ Half', class: 'mcb-auto-badge--half' };
  if (pts >= tiers.floor)  return { label: '🛡️ Floor', class: 'mcb-auto-badge--floor' };
  return { label: `${pts}/${tiers.target}p`, class: 'mcb-auto-badge--base' };
});
</script>

<template>
  <header class="mobile-compact-bar" :class="{ 'mcb--dark': darkMode, 'mcb--light': !darkMode }">
    <!-- Slim 52px Executive Bar -->
    <div class="mcb-primary-bar">
      <!-- Left: Brand Logo & User Grade -->
      <div class="mcb-identity" @click="isExpanded = !isExpanded">
        <HabuiltLogo size="xs" :with-text="false" class="mcb-brand-icon" />
        <span class="mcb-user-name">{{ displayName || (isAshish ? 'Ashish' : (timeGreeting?.name || 'User')) }}</span>
        <span class="grade-badge mcb-grade" :class="performanceGrade.class">{{ performanceGrade.grade }}</span>
      </div>

      <!-- Center: Combined Streak & Protocol Progress Pill -->
      <div class="mcb-combined-pill" @click="isExpanded = !isExpanded" :title="`Streak: ${systemStreak.current}d | Points: ${todayPoints}/${tierThresholds.target}p`">
        <Flame class="icon-xs icon-flame" />
        <span class="mono-num">{{ systemStreak.current }}d</span>
        <span class="mcb-pill-dot">&bull;</span>
        <span class="mono-num">{{ todayPoints }}/{{ tierThresholds.target }}p</span>
      </div>

      <!-- Right: Quick Tools & Expand Drawer Triggers -->
      <div class="mcb-actions">
        <!-- Quick Tools Menu Trigger -->
        <button
          type="button"
          class="mcb-btn mcb-btn--tools"
          :class="{ 'mcb-btn--active': isToolsOpen }"
          @click="isToolsOpen = !isToolsOpen"
          title="Quick Tools & Actions"
          aria-label="Open Tools Menu"
        >
          <MoreHorizontal class="icon-xs" />
        </button>

        <!-- Expand / Collapse HUD Indicator -->
        <button
          type="button"
          class="mcb-btn mcb-btn--expand"
          :class="{ 'mcb-btn--expand-open': isExpanded }"
          @click="isExpanded = !isExpanded"
          :title="isExpanded ? 'Collapse HUD' : 'Expand Live HUD & UP NEXT'"
          aria-label="Toggle Quick HUD"
        >
          <ChevronDown class="icon-xs mcb-expand-arrow" />
        </button>
      </div>
    </div>

    <!-- Expandable Quick HUD Drawer -->
    <Transition name="hud-slide">
      <div v-if="isExpanded" class="mcb-expanded-drawer">
        <!-- Progress Bar & Secondary Stats -->
        <div class="mcb-expanded-row">
          <div class="mcb-progress-meta">
            <span class="mcb-progress-label">Today's Progress</span>
            <span class="mcb-progress-count mono-num">{{ todayCompletedCount }}/{{ totalHabits }} Completed</span>
          </div>
          <div class="mcb-progress-track">
            <div
              class="mcb-progress-fill"
              :style="{ width: `${totalHabits > 0 ? Math.min(100, Math.round((todayCompletedCount / totalHabits) * 100)) : 0}%` }"
            ></div>
          </div>
          <div class="mcb-drawer-stats">
            <span class="mcb-wallet-pill" :title="`Reward Vault: ${availableWallet} points`">
              <Award class="icon-xs icon-vault-gold" /> {{ availableWallet }} pts
            </span>
            <span class="mcb-pts-pill">
              ⚡ {{ todayPoints }} pts today
            </span>
          </div>
        </div>

        <!-- Live UP NEXT Habit Action Strip -->
        <div
          v-if="isCurrentMonth && upNextHabitInfo && !hasCompletedDay(upNextHabitInfo.habit, currentDay)"
          class="mcb-upnext-card"
          @click="emit('toggle-up-next', upNextHabitInfo.habit, currentDay)"
        >
          <div class="mcb-upnext-left">
            <span class="mcb-upnext-tag" :class="{ 'mcb-upnext-tag--due': upNextHabitInfo.status === 'due' }">
              <Clock class="icon-xs" /> {{ upNextHabitInfo.shortBadge }}
            </span>
            <span class="mcb-upnext-name">{{ upNextHabitInfo.habit.name }}</span>
          </div>
          <button type="button" class="mcb-upnext-btn" @click.stop="emit('toggle-up-next', upNextHabitInfo.habit, currentDay)">
            <Check class="icon-xs" />
            <span>Mark Done (+{{ upNextHabitInfo.habit.points }}p)</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Tools Bottom Sheet / Dropdown -->
    <Teleport to="body">
      <Transition name="tools-fade">
        <div v-if="isToolsOpen" class="mcb-tools-overlay" @click.self="isToolsOpen = false">
          <div class="mcb-tools-sheet">
            <div class="mcb-tools-grabber"></div>
            <div class="mcb-tools-header">
              <span class="mcb-tools-title">Quick Actions & Integrations</span>
              <button type="button" class="mcb-tools-close" @click="isToolsOpen = false" aria-label="Close tools">
                <X class="icon-xs" />
              </button>
            </div>

            <div class="mcb-tools-grid">
              <button type="button" class="mcb-tool-item" @click="emit('toggle-theme'); isToolsOpen = false;">
                <div class="mcb-tool-icon icon-amber"><Sun v-if="darkMode" class="icon-sm" /><Moon v-else class="icon-sm" /></div>
                <span>{{ darkMode ? 'Light Mode' : 'Dark Mode' }}</span>
              </button>

              <button v-if="isAshish" type="button" class="mcb-tool-item" @click="emit('toggle-travel'); isToolsOpen = false;">
                <div class="mcb-tool-icon icon-sky"><Plane v-if="travelMode" class="icon-sm" /><Calendar v-else class="icon-sm" /></div>
                <span>{{ dayTypeLabel }}</span>
              </button>

              <button type="button" class="mcb-tool-item" @click="emit('open-spotlight'); isToolsOpen = false;">
                <div class="mcb-tool-icon icon-amber"><Search class="icon-sm" /></div>
                <span>Command (⌘K)</span>
              </button>

              <button type="button" class="mcb-tool-item" @click="emit('reload-app'); isToolsOpen = false;">
                <div class="mcb-tool-icon icon-emerald"><RefreshCw class="icon-sm" :class="{ 'animate-spin': isSyncing }" /></div>
                <span>Sync Cloud</span>
              </button>

              <button type="button" class="mcb-tool-item" @click="emit('share-scorecard'); isToolsOpen = false;">
                <div class="mcb-tool-icon icon-sky"><Share2 class="icon-sm" /></div>
                <span>Share Card</span>
              </button>

              <button type="button" class="mcb-tool-item" @click="emit('open-calendar-sync'); isToolsOpen = false;">
                <div class="mcb-tool-icon icon-indigo"><Calendar class="icon-sm" /></div>
                <span>Calendar Sync</span>
              </button>

              <button type="button" class="mcb-tool-item" @click="emit('open-partner-sync'); isToolsOpen = false;">
                <div class="mcb-tool-icon icon-rose"><Users class="icon-sm" /></div>
                <span>Partner Sync</span>
              </button>

              <button type="button" class="mcb-tool-item" @click="emit('open-partner-pair'); isToolsOpen = false;">
                <div class="mcb-tool-icon text-rose-400"><Heart class="icon-sm" /></div>
                <span>Pair Invite</span>
              </button>

              <button type="button" class="mcb-tool-item" @click="emit('open-protocol-wizard'); isToolsOpen = false;">
                <div class="mcb-tool-icon icon-violet"><Sliders class="icon-sm" /></div>
                <span>Protocols</span>
              </button>

              <button
                v-if="notificationsSupported"
                type="button"
                class="mcb-tool-item"
                @click="emit('toggle-notifications'); isToolsOpen = false;"
              >
                <div class="mcb-tool-icon" :class="dueNowNotificationsEnabled ? 'icon-amber' : 'text-slate-400'">
                  <Bell v-if="dueNowNotificationsEnabled" class="icon-sm" />
                  <BellOff v-else class="icon-sm" />
                </div>
                <span>{{ dueNowNotificationsEnabled ? 'Alerts On' : 'Alerts Off' }}</span>
              </button>

              <button type="button" class="mcb-tool-item" @click="emit('toggle-zen'); isToolsOpen = false;">
                <div class="mcb-tool-icon" :class="zenMode ? 'text-amber-400' : 'text-slate-400'">
                  <Eye v-if="zenMode" class="icon-sm" />
                  <EyeOff v-else class="icon-sm" />
                </div>
                <span>{{ zenMode ? 'Exit Zen' : 'Zen Mode' }}</span>
              </button>

              <button type="button" class="mcb-tool-item mcb-tool-item--signout" @click="emit('sign-out'); isToolsOpen = false;">
                <div class="mcb-tool-icon text-rose-400"><LogOut class="icon-sm" /></div>
                <span>{{ isGuestActive ? 'Exit Guest' : 'Sign Out' }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<style scoped>
.mobile-compact-bar {
  position: sticky;
  top: 0;
  z-index: 80;
  width: 100%;
  box-sizing: border-box;
  padding-top: env(safe-area-inset-top, 0px) !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  padding-bottom: 0 !important;
  margin: 0 !important;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.mobile-compact-bar.mcb--dark {
  background: rgba(9, 13, 22, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.mcb-brand-icon {
  flex-shrink: 0;
  margin-right: 2px;
}

@media (min-width: 769px) {
  .mobile-compact-bar {
    display: none !important;
  }
}

/* Slim 52px Primary Bar */
.mcb-primary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 12px;
  gap: 8px;
}

.mcb-identity {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  cursor: pointer;
  user-select: none;
}

.mcb-user-name {
  font-size: 0.88rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary, #0f172a);
  white-space: nowrap;
}

.mcb--dark .mcb-user-name {
  color: #f8fafc;
}

.mcb-grade {
  font-size: 0.65rem;
  padding: 1px 5px;
  border-radius: 5px;
  flex-shrink: 0;
}

.mcb-combined-pill {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(200, 164, 86, 0.12);
  border: 1px solid rgba(200, 164, 86, 0.28);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.75rem;
  font-weight: 750;
  color: var(--brand-gold, #C8A456);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}
.mcb--light .mcb-combined-pill {
  background: rgba(200, 164, 86, 0.1);
  border-color: rgba(200, 164, 86, 0.35);
  color: #b45309;
}
.mcb-pill-dot {
  opacity: 0.5;
  font-size: 0.6rem;
}

.mcb-auto-badge {
  font-size: 0.68rem;
  font-weight: 750;
  padding: 2px 7px;
  border-radius: 999px;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.mcb-auto-badge--base {
  background: rgba(100, 116, 139, 0.12);
  color: #94a3b8;
  border: 1px solid rgba(100, 116, 139, 0.2);
}

.mcb-auto-badge--floor {
  background: rgba(245, 158, 11, 0.12);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.28);
}

.mcb-auto-badge--half {
  background: rgba(99, 102, 241, 0.12);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.28);
}

.mcb-auto-badge--full {
  background: rgba(16, 185, 129, 0.14);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.32);
}

.mcb-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.mcb-streak-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 750;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.22);
  color: #f59e0b;
}

.mcb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: var(--radius-sm, 8px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.07));
  color: var(--text-secondary, #94a3b8);
  cursor: pointer;
  padding: 0;
  transition: all 0.14s ease;
  touch-action: manipulation;
}

body:not(.theme-dark) .mcb-btn {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.07);
  color: #334155;
}

.mcb-btn:active {
  transform: scale(0.92);
}

.mcb-btn--travel {
  width: auto;
  padding: 0 6px;
  gap: 3px;
}

.mcb-travel-text {
  font-size: 10px;
  font-weight: 700;
}

.mcb-btn--travel-active {
  background: rgba(59, 130, 246, 0.18) !important;
  border-color: rgba(59, 130, 246, 0.35) !important;
  color: #60a5fa !important;
}

.mcb-expand-arrow {
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.mcb-btn--expand-open .mcb-expand-arrow {
  transform: rotate(180deg);
}

/* Expandable Drawer */
.mcb-expanded-drawer {
  padding: 8px 12px 10px;
  border-top: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: rgba(13, 20, 36, 0.6);
}

body:not(.theme-dark) .mcb-expanded-drawer {
  background: rgba(241, 245, 249, 0.8);
  border-top-color: rgba(0, 0, 0, 0.06);
}

.mcb-expanded-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mcb-progress-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.72rem;
  color: var(--text-muted, #64748b);
  font-weight: 600;
}

.mcb-progress-track {
  width: 100%;
  height: 5px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

body:not(.theme-dark) .mcb-progress-track {
  background: rgba(0, 0, 0, 0.08);
}

.mcb-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
  border-radius: 999px;
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.mcb-drawer-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.72rem;
  font-weight: 700;
}

.mcb-wallet-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--brand-amber, #f59e0b);
}

.mcb-pts-pill {
  color: var(--accent, #10b981);
}

/* Live UP NEXT Card */
.mcb-upnext-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border-radius: var(--radius-sm, 8px);
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.22);
  cursor: pointer;
}

.mcb-upnext-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.mcb-upnext-tag {
  font-size: 9.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  white-space: nowrap;
}

.mcb-upnext-tag--due {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}

.mcb-upnext-name {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-primary, #f8fafc);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

body:not(.theme-dark) .mcb-upnext-name {
  color: #0f172a;
}

.mcb-upnext-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 6px;
  background: var(--accent, #10b981);
  color: #ffffff;
  border: none;
  font-size: 10.5px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;
}

/* Tools Sheet Overlay */
.mcb-tools-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  overscroll-behavior: contain;
}

.mcb-tools-sheet {
  position: relative;
  z-index: 2001;
  pointer-events: auto;
  width: 100%;
  max-height: min(76vh, 520px);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  scrollbar-width: none;
  -ms-overflow-style: none;
  background: var(--card-bg, #0d1424);
  border-top: 1px solid var(--border-medium, rgba(255, 255, 255, 0.12));
  border-radius: 20px 20px 0 0;
  padding: 8px 16px calc(36px + env(safe-area-inset-bottom, 20px));
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.75);
}

.mcb-tools-sheet::-webkit-scrollbar {
  display: none;
}

body:not(.theme-dark) .mcb-tools-sheet {
  background: #ffffff;
  border-top-color: rgba(15, 23, 42, 0.1);
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.15);
}

.mcb-tools-grabber {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.22);
  margin: 4px auto 0;
  flex-shrink: 0;
}

body:not(.theme-dark) .mcb-tools-grabber {
  background: rgba(0, 0, 0, 0.15);
}

.mcb-tools-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: inherit;
  padding-top: 4px;
  padding-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mcb-tools-title {
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text-primary, #f8fafc);
}

body:not(.theme-dark) .mcb-tools-title {
  color: #0f172a;
}

.mcb-tools-close {
  position: relative;
  z-index: 1001;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: none;
  color: var(--text-secondary, #94a3b8);
  cursor: pointer;
  touch-action: manipulation;
}

body:not(.theme-dark) .mcb-tools-close {
  background: rgba(0, 0, 0, 0.06);
  color: #64748b;
}

.mcb-tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.mcb-tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 6px;
  border-radius: var(--radius-md, 12px);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.06));
  color: var(--text-primary, #f8fafc);
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 600;
  text-align: center;
  transition: all 0.14s ease;
}

body:not(.theme-dark) .mcb-tool-item {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.06);
  color: #0f172a;
}

.mcb-tool-item:active {
  transform: scale(0.94);
  background: rgba(255, 255, 255, 0.08);
}

.mcb-tool-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
}

body:not(.theme-dark) .mcb-tool-icon {
  background: rgba(0, 0, 0, 0.04);
}

/* Animations */
.hud-slide-enter-active,
.hud-slide-leave-active {
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  max-height: 140px;
  overflow: hidden;
}

.hud-slide-enter-from,
.hud-slide-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.tools-fade-enter-active,
.tools-fade-leave-active {
  transition: opacity 0.2s ease;
}

.tools-fade-enter-from,
.tools-fade-leave-to {
  opacity: 0;
}

.tools-fade-enter-active .mcb-tools-sheet,
.tools-fade-leave-active .mcb-tools-sheet {
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
}

.tools-fade-enter-from .mcb-tools-sheet,
.tools-fade-leave-to .mcb-tools-sheet {
  transform: translateY(100%);
}
</style>
