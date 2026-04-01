import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';

import '../css/app.css';

const rootElement = document.getElementById('app');
const hasInertiaPage = !!rootElement?.dataset?.page;

const today = new Date();
const nowMonth = today.getMonth() + 1;
const nowYear = today.getFullYear();

const params = new URLSearchParams(window.location.search);
const requestedMonth = Number.parseInt(params.get('month') ?? '', 10);
const requestedYear = Number.parseInt(params.get('year') ?? '', 10);

const selectedMonth = Number.isInteger(requestedMonth) && requestedMonth >= 1 && requestedMonth <= 12
  ? requestedMonth
  : nowMonth;
const selectedYear = Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100
  ? requestedYear
  : nowYear;

const selectedDate = new Date(selectedYear, selectedMonth - 1, 1);
const previousDate = new Date(selectedYear, selectedMonth - 2, 1);
const nextDate = new Date(selectedYear, selectedMonth, 1);
const selectedMonthIndex = (selectedYear * 100) + selectedMonth;
const currentMonthIndex = (nowYear * 100) + nowMonth;
const isCurrentMonth = selectedMonthIndex === currentMonthIndex;
const isFutureMonth = selectedMonthIndex > currentMonthIndex;
const demoUserId = import.meta.env.VITE_HABUILT_DEMO_USER_ID || '01JQ7M2X4V8K3P6R9T1W5Y7ZAB';

const staticPreviewPage = {
  component: 'Dashboard',
  props: {
    appName: 'Habuilt Tracker',
    today: today.toISOString().slice(0, 10),
    userId: demoUserId,
    wallet: 0,
    month: selectedMonth,
    year: selectedYear,
    monthDays: new Date(selectedYear, selectedMonth, 0).getDate(),
    currentDay: isCurrentMonth ? today.getDate() : new Date(selectedYear, selectedMonth, 0).getDate(),
    isCurrentMonth,
    isFutureMonth,
    canNavigatePrevMonth: true,
    canNavigateNextMonth: !isCurrentMonth,
    previousMonth: { month: previousDate.getMonth() + 1, year: previousDate.getFullYear() },
    nextMonth: { month: nextDate.getMonth() + 1, year: nextDate.getFullYear() },
    habits: [],
    flash: {},
    staticPreview: true,
    supabaseEnabled: !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
  },
  url: '/',
  version: null,
};

createInertiaApp({
  page: hasInertiaPage ? undefined : staticPreviewPage,
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.vue', { eager: true });
    return pages[`./Pages/${name}.vue`];
  },
  setup({ el, App, props, plugin }) {
    createApp({ render: () => h(App, props) })
      .use(plugin)
      .mount(el);
  },
  progress: {
    color: '#111827',
  },
});
