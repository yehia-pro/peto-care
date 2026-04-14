import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  experimental: {
    renderBuiltUrl(filename: string, { hostType }: { hostType: string }) {
      if (hostType === 'html') {
        return '/' + filename
      }
      return filename
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'https://yehia-ayman-peto-care-server.hf.space',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'https://yehia-ayman-peto-care-server.hf.space',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Normalize path for cross-platform compatibility
          const normalizedId = id.replace(/\\/g, '/');

          // Only process node_modules
          if (!normalizedId.includes('node_modules')) {
            return undefined;
          }

          // Extract package name from node_modules path
          const match = normalizedId.match(/node_modules\/(@[^/]+\/[^/]+|[^/]+)/);
          if (!match) return 'vendor-libs';

          const packageName = match[1];

          // 1. Ant Design ecosystem (largest dependency)
          if (packageName.startsWith('@ant-design') ||
            packageName === 'antd' ||
            packageName.startsWith('rc-')) {
            return 'ui-antd';
          }

          // 2. React ecosystem
          if (packageName === 'react' ||
            packageName === 'react-dom' ||
            packageName === 'react-router-dom' ||
            packageName === 'scheduler' ||
            packageName === 'prop-types') {
            return 'vendor-react';
          }

          // 3. Internationalization
          if (packageName.startsWith('i18next') ||
            packageName === 'react-i18next') {
            return 'vendor-i18n';
          }

          // 4. HTTP & State Management
          if (packageName === 'axios' ||
            packageName === 'zustand') {
            return 'vendor-http';
          }

          // 5. Icons
          if (packageName === 'lucide-react' ||
            packageName.includes('icon')) {
            return 'ui-icons';
          }

          // 6. Utilities
          if (packageName === 'date-fns' ||
            packageName === 'lodash' ||
            packageName.startsWith('lodash')) {
            return 'vendor-utils';
          }

          // 7. UI Libraries (Sonner, etc.)
          if (packageName === 'sonner' ||
            packageName.includes('toast')) {
            return 'ui-toast';
          }

          // 8. Everything else
          return 'vendor-libs';
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'zustand'],
  },
});
