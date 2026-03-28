import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';

import '../css/app.css';

const rootElement = document.getElementById('app');
const hasInertiaPage = !!rootElement?.dataset?.page;

const today = new Date();

const staticPreviewPage = {
  component: 'Dashboard',
  props: {
    appName: 'Habuilt Tracker',
    today: today.toISOString().slice(0, 10),
    userId: 'netlify-preview',
    wallet: 0,
    month: today.getMonth() + 1,
    year: today.getFullYear(),
    monthDays: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(),
    currentDay: today.getDate(),
    isCurrentMonth: true,
    isFutureMonth: false,
    canNavigatePrevMonth: false,
    canNavigateNextMonth: false,
    previousMonth: { month: today.getMonth() + 1, year: today.getFullYear() },
    nextMonth: { month: today.getMonth() + 1, year: today.getFullYear() },
    habits: [],
    flash: {},
    staticPreview: true,
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
