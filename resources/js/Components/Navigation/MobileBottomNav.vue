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
  <nav class="mobile-bottom-nav" ref="navRef" aria-label="Mobile Navigation">
    <button
      id="mobile-nav-today"
      type="button"
      class="mobile-bottom-nav__item"
      :class="{ 'mobile-bottom-nav__item--active': activeTab === 'today' }"
      @click="setTab('today')"
      aria-label="Today's Habits"
    >
      <div class="mobile-bottom-nav__icon-wrap">
        <Zap class="mobile-bottom-nav__icon" />
        <span v-if="todayCompletedCount < totalHabits" class="mobile-bottom-nav__badge-dot"></span>
      </div>
      <span class="mobile-bottom-nav__label">Today</span>
    </button>

    <button
      id="mobile-nav-focus"
      type="button"
      class="mobile-bottom-nav__item"
      :class="{ 'mobile-bottom-nav__item--active': activeTab === 'focus' }"
      @click="setTab('focus')"
      aria-label="Focus Workstation"
    >
      <div class="mobile-bottom-nav__icon-wrap">
        <Timer class="mobile-bottom-nav__icon" />
        <span v-if="timerRunning" class="mobile-bottom-nav__badge-pulse"></span>
      </div>
      <span class="mobile-bottom-nav__label">Focus</span>
    </button>

    <button
      id="mobile-nav-stats"
      type="button"
      class="mobile-bottom-nav__item"
      :class="{ 'mobile-bottom-nav__item--active': activeTab === 'stats' }"
      @click="setTab('stats')"
      aria-label="Stats and Analytics"
    >
      <div class="mobile-bottom-nav__icon-wrap">
        <BarChart3 class="mobile-bottom-nav__icon" />
      </div>
      <span class="mobile-bottom-nav__label">Stats</span>
    </button>

    <button
      id="mobile-nav-rewards"
      type="button"
      class="mobile-bottom-nav__item"
      :class="{ 'mobile-bottom-nav__item--active': activeTab === 'rewards' }"
      @click="setTab('rewards')"
      aria-label="Reward Shop and Ledger"
    >
      <div class="mobile-bottom-nav__icon-wrap">
        <Award class="mobile-bottom-nav__icon" />
      </div>
      <span class="mobile-bottom-nav__label">Rewards</span>
    </button>
  </nav>
</template>
