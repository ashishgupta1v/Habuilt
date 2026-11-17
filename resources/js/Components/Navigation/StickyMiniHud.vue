<script setup>
const props = defineProps({
  showStickyHud: { type: Boolean, default: false },
  todayPoints: { type: Number, default: 0 },
  todayPossibleDailyPoints: { type: Number, default: 0 },
  systemStreak: { type: Object, default: () => ({ current: 0 }) },
  hudTimeLabel: { type: String, default: '' },
  zenMode: { type: Boolean, default: false },
  upNextHabitInfo: { type: Object, default: null },
});
</script>

<template>
  <div
    class="sticky-hud"
    :class="{ 'sticky-hud--hidden': !showStickyHud }"
    aria-hidden="true"
  >
    <span class="sticky-hud__chip sticky-hud__chip--pts">
      {{ todayPoints }}/{{ todayPossibleDailyPoints }} pts
    </span>
    <span class="sticky-hud__chip sticky-hud__chip--streak">
      {{ systemStreak?.current || 0 }} days
    </span>
    <span class="sticky-hud__chip sticky-hud__chip--time">
      {{ hudTimeLabel }}
    </span>
    <span v-if="zenMode" class="sticky-hud__chip">
      Quiet
    </span>
    <span v-if="upNextHabitInfo && upNextHabitInfo.habit" class="sticky-hud__chip">
      {{ upNextHabitInfo.habit.name }}
    </span>
  </div>
</template>
