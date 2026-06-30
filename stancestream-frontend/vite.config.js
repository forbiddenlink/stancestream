import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression2'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    compression({
      algorithm: 'gzip',
      threshold: 1024
    })
  ],
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 2,
        drop_console: true,
        drop_debugger: true
      },
      format: {
        comments: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('recharts')) return 'charts';
          if (id.includes('lucide-react')) return 'ui-components';
          if (id.includes('RedisMatrixModal') || id.includes('LivePerformanceOverlay')) return 'redis-components';
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false
  },
  esbuild: {
    legalComments: 'none',
    drop: ['console', 'debugger']
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    hmr: {
      port: 5173,
      host: '127.0.0.1'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
        changeOrigin: true
      }
    }
  }
})
