<script setup>
import TopNav from '@/Components/TopNav.vue';
</script>

<template>
  <div class="app-shell">
    <TopNav />
    <main class="app-shell__content">
      <slot />
    </main>
  </div>
</template>
