import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      threshold: 1024
    })
  ],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'charts': ['recharts'],
          'ui-components': ['lucide-react'],
          'redis-components': ['./src/components/RedisMatrixModal.jsx', './src/components/LivePerformanceOverlay.jsx']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false
  },
  esbuild: {
    legalComments: 'none'
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
