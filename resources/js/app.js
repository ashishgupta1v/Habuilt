import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';

import '../css/app.css';
import MainSPA from './Pages/Main.vue';

const rootElement = document.getElementById('app');
const mountMainSPA = () => {
  if (rootElement) {
    createApp(MainSPA).mount(rootElement);
  }
};

let initialPage = null;

try {
  const raw = rootElement?.dataset?.page;
  initialPage = raw ? JSON.parse(raw) : null;
} catch {
  initialPage = null;
}

const canBootInertia = !!(
  rootElement
  && initialPage
  && typeof initialPage === 'object'
  && typeof initialPage.component === 'string'
  && initialPage.component.trim() !== ''
);

if (canBootInertia) {
  createInertiaApp({
    page: initialPage,
    resolve: (name) => {
      const pages = import.meta.glob('./Pages/**/*.vue', { eager: true });
      const page = pages[`./Pages/${name}.vue`];

      if (!page) {
        throw new Error(`Inertia page not found: ${name}`);
      }

      return page;
    },
    setup({ el, App, props, plugin }) {
      createApp({ render: () => h(App, props) })
        .use(plugin)
        .mount(el);
    },
    progress: {
      color: '#111827',
    },
  }).catch(() => {
    mountMainSPA();
  });
} else {
  // Pure SPA fallback for Vercel static deployment
  mountMainSPA();
}
