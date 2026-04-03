import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';

import '../css/app.css';
import MainSPA from './Pages/Main.vue';

const rootElement = document.getElementById('app');
const hasInertiaPage = !!rootElement?.dataset?.page;

if (hasInertiaPage) {
  createInertiaApp({
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
} else {
  // Pure SPA fallback for Vercel static deployment
  createApp(MainSPA).mount('#app');
}
