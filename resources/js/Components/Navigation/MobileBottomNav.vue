<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { gsap } from 'gsap';
import { Zap, Timer, BarChart3, Award } from 'lucide-vue-next';

const props = defineProps({
  activeTab: { type: String, default: 'today' },
  todayCompletedCount: { type: Number, default: 0 },
  totalHabits: { type: Number, default: 0 },
  timerRunning: { type: Boolean, default: false },
});

const emit = defineEmits(['update:activeTab', 'update:active-tab']);

const navRef = ref(null);
let gsapCtx = null;

const animateActiveIcon = (tabName) => {
  if (typeof document === 'undefined') return;
  const targetId = `mobile-nav-${tabName}`;
  const btn = document.getElementById(targetId);
  if (btn) {
    const iconWrap = btn.querySelector('.mobile-bottom-nav__icon-wrap');
    if (iconWrap) {
      gsap.fromTo(iconWrap,
        { scale: 0.8, y: 2 },
        { scale: 1, y: 0, duration: 0.38, ease: 'back.out(2.5)' }
      );
    }
  }
};

watch(() => props.activeTab, (newTab) => {
  animateActiveIcon(newTab);
});

onMounted(() => {
  if (navRef.value) {
    gsapCtx = gsap.context(() => {
      gsap.from(navRef.value, {
        y: 20,
        opacity: 0,
        duration: 0.45,
        ease: 'power3.out'
      });
      animateActiveIcon(props.activeTab);
    }, navRef.value);
  }
});

onUnmounted(() => {
  if (gsapCtx) {
    try { gsapCtx.revert(); } catch {}
  }
});

const setTab = (tab) => {
  emit('update:activeTab', tab);
  emit('update:active-tab', tab);
  animateActiveIcon(tab);
  // Update browser URL query parameter without page reload
  try {
    const url = new URL(window.location.href);
    if (tab === 'today') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', tab);
    }
    window.history.pushState({ tab, 'habuilt-app-state': true }, '', url.toString());
  } catch { /* history pushState fallback */ }

  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(10);
  }
};
</script>

<template>
  <nav class="mobile-bottom-nav" ref="navRef" role="tablist" aria-label="Mobile Navigation">
    <button
      id="mobile-nav-today"
      type="button"
      role="tab"
      :aria-selected="activeTab === 'today' ? 'true' : 'false'"
      class="mobile-bottom-nav__item"
      :class="{ 'mobile-bottom-nav__item--active': activeTab === 'today' }"
      @click="setTab('today')"
      aria-label="Today's Habits"
    >
      <div class="mobile-bottom-nav__icon-wrap">
        <Zap class="mobile-bottom-nav__icon" />
        <span v-if="todayCompletedCount < totalHabits" class="mobile-bottom-nav__badge-dot" aria-label="Habits pending"></span>
      </div>
      <span class="mobile-bottom-nav__label">Today</span>
      <span v-if="activeTab === 'today'" class="mobile-bottom-nav__indicator" aria-hidden="true"></span>
    </button>

    <button
      id="mobile-nav-focus"
      type="button"
      role="tab"
      :aria-selected="activeTab === 'focus' ? 'true' : 'false'"
      class="mobile-bottom-nav__item"
      :class="{ 'mobile-bottom-nav__item--active': activeTab === 'focus' }"
      @click="setTab('focus')"
      aria-label="Focus Workstation"
    >
      <div class="mobile-bottom-nav__icon-wrap">
        <Timer class="mobile-bottom-nav__icon" />
        <span v-if="timerRunning" class="mobile-bottom-nav__badge-pulse" aria-label="Timer running"></span>
      </div>
      <span class="mobile-bottom-nav__label">Focus</span>
      <span v-if="activeTab === 'focus'" class="mobile-bottom-nav__indicator" aria-hidden="true"></span>
    </button>

    <button
      id="mobile-nav-stats"
      type="button"
      role="tab"
      :aria-selected="activeTab === 'stats' ? 'true' : 'false'"
      class="mobile-bottom-nav__item"
      :class="{ 'mobile-bottom-nav__item--active': activeTab === 'stats' }"
      @click="setTab('stats')"
      aria-label="Stats and Analytics"
    >
      <div class="mobile-bottom-nav__icon-wrap">
        <BarChart3 class="mobile-bottom-nav__icon" />
      </div>
      <span class="mobile-bottom-nav__label">Stats</span>
      <span v-if="activeTab === 'stats'" class="mobile-bottom-nav__indicator" aria-hidden="true"></span>
    </button>

    <button
      id="mobile-nav-rewards"
      type="button"
      role="tab"
      :aria-selected="activeTab === 'rewards' ? 'true' : 'false'"
      class="mobile-bottom-nav__item"
      :class="{ 'mobile-bottom-nav__item--active': activeTab === 'rewards' }"
      @click="setTab('rewards')"
      aria-label="Reward Shop and Ledger"
    >
      <div class="mobile-bottom-nav__icon-wrap">
        <Award class="mobile-bottom-nav__icon" />
      </div>
      <span class="mobile-bottom-nav__label">Rewards</span>
      <span v-if="activeTab === 'rewards'" class="mobile-bottom-nav__indicator" aria-hidden="true"></span>
    </button>
  </nav>
</template>

<style scoped>
.mobile-bottom-nav {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  overflow-x: hidden;
  height: calc(64px + env(safe-area-inset-bottom, 14px));
  padding-top: 4px;
  padding-left: 8px;
  padding-right: 8px;
  padding-bottom: max(10px, env(safe-area-inset-bottom, 14px));
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-top: 1px solid rgba(226, 232, 240, 0.9);
  z-index: 1100;
  align-items: center;
  justify-content: space-around;
  box-shadow: 0 -4px 20px rgba(15, 23, 42, 0.05);
  user-select: none;
  -webkit-user-select: none;
}

@media (min-width: 769px) {
  .mobile-bottom-nav {
    display: none !important;
  }
}

.mobile-bottom-nav__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 6px 4px 4px;
  color: #64748b;
  cursor: pointer;
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  max-width: 25%;
  min-height: 48px;
  height: 100%;
  border-radius: 12px;
  box-sizing: border-box;
  overflow: visible;
  transition: color 0.16s ease, background-color 0.16s ease, transform 0.14s ease;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.mobile-bottom-nav__item:focus-visible {
  outline: 2px solid #0d9488;
  outline-offset: -2px;
}

.mobile-bottom-nav__item:active {
  transform: scale(0.93);
  background-color: rgba(13, 148, 136, 0.06);
}

.mobile-bottom-nav__item--active {
  color: #0f766e !important;
  font-weight: 750;
  background-color: rgba(13, 148, 136, 0.08);
}

.mobile-bottom-nav__icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.mobile-bottom-nav__icon {
  width: 22px;
  height: 22px;
  stroke-width: 2.2;
  color: inherit;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease;
}

.mobile-bottom-nav__item--active .mobile-bottom-nav__icon {
  color: #0d9488;
  transform: translateY(-1px) scale(1.08);
  filter: drop-shadow(0 2px 6px rgba(13, 148, 136, 0.35));
}

.mobile-bottom-nav__label {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  display: block;
  line-height: 1.2;
  color: inherit;
}

.mobile-bottom-nav__indicator {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: #0d9488;
  border-radius: 999px;
  box-shadow: 0 1px 4px rgba(13, 148, 136, 0.4);
  animation: navIndicatorIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes navIndicatorIn {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 20px;
    opacity: 1;
  }
}

.mobile-bottom-nav__badge-dot {
  position: absolute;
  top: -1px;
  right: -2px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.6);
  border: 1.5px solid #ffffff;
}

.mobile-bottom-nav__badge-pulse {
  position: absolute;
  top: -1px;
  right: -2px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
  border: 1.5px solid #ffffff;
  animation: pulse 1.5s infinite;
}
</style>
