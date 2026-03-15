<script setup>
defineProps({
  appName: {
    type: String,
    default: 'Warrior Tracker',
  },
  today: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <main class="dashboard">
    <section class="card">
      <p class="eyebrow">Warrior Dashboard</p>
      <h1>{{ appName }}</h1>
      <p class="meta">Today: {{ today }}</p>
      <p class="body">Your VILT + DDD foundation is live. Start building bounded-context widgets from here.</p>
    </section>
  </main>
</template>
