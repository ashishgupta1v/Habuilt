<script setup>
import { Sparkles } from 'lucide-vue-next';

defineProps({
  hint: { type: String, default: '' },
});
</script>

<template>
  <div v-if="hint" class="habit-note-guidance">
    <div class="habit-note-guidance__header">
      <Sparkles class="icon-xs" />
      <span class="habit-note-guidance__title">Instructions & Guidance</span>
    </div>
    <p class="habit-note-guidance__text">{{ hint }}</p>
  </div>
</template>
