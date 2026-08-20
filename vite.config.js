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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        app: 'resources/js/app.js',
        preview: 'index.html',
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-vue-next')) {
              return 'vendor-icons';
            }
            if (id.includes('vue') || id.includes('@vue') || id.includes('@inertiajs')) {
              return 'vendor-vue';
            }
            return 'vendor';
          }
        },
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
