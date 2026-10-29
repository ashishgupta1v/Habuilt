import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/vue3';

import '../css/app.css';
import '../css/landing.css';
import '../css/design-system/framer-bento.css';
import MainSPA from './Pages/Main.vue';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { telemetry } from './lib/telemetry.js';

// Early initialization of global error & telemetry listeners
telemetry.init();

// Native Android Status Bar Harmony (Pure Light Theme)
if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
  try {
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    StatusBar.setBackgroundColor({ color: '#f8fafc' }).catch(() => {});
  } catch {
    // Non-native / fallback
  }
}

const rootElement = document.getElementById('app');
const mountMainSPA = () => {
  if (rootElement) {
    const app = createApp(MainSPA);
    telemetry.init(app);
    app.mount(rootElement);
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
      const app = createApp({ render: () => h(App, props) });
      telemetry.init(app);
      app.use(plugin).mount(el);
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

// Register Service Worker for Web PWA only (native Android uses native background services)
// __BUILD_TIME__ is replaced at build time by Vite's define config,
// ensuring the browser fetches a fresh SW on each deploy.
const swUrl = '/sw.js?v=' + (typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : Date.now());
if (typeof window !== 'undefined' && !Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  let refreshing = false;
  const hadExistingController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadExistingController) return;
    if (refreshing || navigator.webdriver) return;
    const isTyping = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
    if (!isTyping) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(swUrl)
      .then(async (reg) => {
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (newSW) {
            newSW.addEventListener('statechange', () => {
              if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                newSW.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });

        // Register Periodic Background Sync (Android Chrome / Edge PWA)
        if ('periodicSync' in reg) {
          try {
            const status = await navigator.permissions?.query({ name: 'periodic-background-sync' }).catch(() => null);
            if (!status || status.state === 'granted') {
              await reg.periodicSync.register('habuilt-periodic-sync', {
                minInterval: 12 * 60 * 60 * 1000,
              });
              console.debug('[SW] Periodic background sync registered: habuilt-periodic-sync');
            }
          } catch (e) {
            console.debug('[SW] Periodic background sync skipped:', e?.message || e);
          }
        }
      })
      .catch(() => {
        // SW registration failed — app works fine without it
      });
  });
}
