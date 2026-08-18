import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  define: {
    __BUILD_TIME__: JSON.stringify(Date.now()),
  },
  plugins: [
    laravel({
      input: ['resources/js/app.js'],
      refresh: true,
    }),
    vue({
      template: {
        transformAssetUrls: {
          base: null,
          includeAbsolute: false,
        },
      },
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        app: 'resources/js/app.js',
        preview: 'index.html',
      },
    },
  },
  resolve: {
    alias: {
      '@': '/resources/js',
    },
  },
  server: {
    hmr: {
      overlay: true,
    },
  },
});
