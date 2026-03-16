<script setup>
import { computed } from 'vue';
import { usePage } from '@inertiajs/vue3';

const navItems = [
  { label: 'Overview', href: '#overview' },
  { label: 'Habits', href: '#habits' },
  { label: 'Rewards', href: '#rewards' },
  { label: 'Review', href: '#weekly-review' },
];

const page = usePage();

const wallet = computed(() => {
  const shared = page.props.wallet;

  if (typeof shared === 'number') {
    return shared;
  }

  const authPoints = page.props.auth?.user?.points;
  return typeof authPoints === 'number' ? authPoints : 0;
});
</script>

<template>
  <header class="top-nav">
    <div class="top-nav__inner">
      <a class="top-nav__brand" href="/">Habuilt Tracker</a>
      <nav class="top-nav__menu" aria-label="Primary">
        <a
          v-for="item in navItems"
          :key="item.label"
          :href="item.href"
          class="top-nav__link"
        >
          {{ item.label }}
        </a>
        <span class="top-nav__wallet">{{ wallet }} pts</span>
      </nav>
    </div>
  </header>
</template>
