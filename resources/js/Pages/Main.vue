<script setup>
import { ref, onMounted, computed } from 'vue';
import { supabase } from '@/lib/supabase';
import Dashboard from './Dashboard.vue';
import Auth from './Auth.vue';
import { LogOut, LayoutDashboard, User } from 'lucide-vue-next';

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

const handleSignOut = async () => {
  await supabase.auth.signOut();
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
  <div v-if="authLoading" class="app-loading">
    <div class="app-spinner">
      <svg class="spinner-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="spinner-fill" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <div class="loading-text">Loading Habuilt Workspace...</div>
    </div>
  </div>

  <template v-else>
    <div v-if="activeUser" class="app-root">
      
      <!-- Styled App Navbar -->
      <nav class="app-nav">
        <div class="app-nav__container">
          <div class="app-nav__left">
            <div class="app-nav__logo-icon">
              <LayoutDashboard class="icon-brand" />
            </div>
            <span class="app-nav__brand-text">Habuilt</span>
          </div>
          
          <div class="app-nav__right">
            <div class="user-badge">
              <User class="icon-sm" />
              <span class="user-badge__text">{{ activeUser.email }}</span>
            </div>
            
            <button @click="handleSignOut" class="btn btn--logout">
              <LogOut class="icon-sm" />
              <span class="logout-text">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <!-- Dashboard Wrapper -->
      <main class="app-main-content">
        <Dashboard 
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
      </main>
    </div>
    
    <Auth v-else />
  </template>
</template>
