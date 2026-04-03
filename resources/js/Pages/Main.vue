<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '@/lib/supabase';
import Dashboard from './Dashboard.vue';
import Auth from './Auth.vue';

const activeUser = ref(null);
const authLoading = ref(true);

const todayDate = new Date();
const urlParams = new URLSearchParams(window.location.search);
const qMonth = Number.parseInt(urlParams.get('month') ?? '', 10);
const qYear = Number.parseInt(urlParams.get('year') ?? '', 10);

const month = ref(Number.isInteger(qMonth) && qMonth >= 1 && qMonth <= 12 ? qMonth : todayDate.getMonth() + 1);
const year = ref(Number.isInteger(qYear) && qYear >= 2000 && qYear <= 2100 ? qYear : todayDate.getFullYear());

const monthDays = computed(() => new Date(year.value, month.value, 0).getDate());

const isCurrentMonth = computed(() => {
  return year.value === todayDate.getFullYear() && month.value === (todayDate.getMonth() + 1);
});
const isFutureMonth = computed(() => {
  const target = year.value * 100 + month.value;
  const current = todayDate.getFullYear() * 100 + (todayDate.getMonth() + 1);
  return target > current;
});
const currentDay = computed(() => isCurrentMonth.value ? todayDate.getDate() : monthDays.value);

const handleNavigateMonth = (monthOffset) => {
  let newMonth = month.value + monthOffset;
  let newYear = year.value;
  if (newMonth > 12) { newMonth = 1; newYear++; }
  if (newMonth < 1) { newMonth = 12; newYear--; }
  window.location.search = `?month=${newMonth}&year=${newYear}`;
};

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  activeUser.value = session?.user || null;
  authLoading.value = false;

  supabase.auth.onAuthStateChange((_event, session) => {
    activeUser.value = session?.user || null;
  });
});
</script>

<template>
  <div v-if="authLoading" class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="animate-pulse text-gray-500 font-medium">Loading session...</div>
  </div>
  <template v-else>
    <Dashboard 
      v-if="activeUser" 
      :userId="activeUser.id"
      :month="month"
      :year="year"
      :monthDays="monthDays"
      :today="todayDate.toISOString().slice(0, 10)"
      :currentDay="currentDay"
      :isCurrentMonth="isCurrentMonth"
      :isFutureMonth="isFutureMonth"
      :canNavigatePrevMonth="true"
      :canNavigateNextMonth="true"
    />
    <Auth v-else />
  </template>
</template>
