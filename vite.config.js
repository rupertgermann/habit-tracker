import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const apiTarget = process.env.VITE_API_TARGET || `http://127.0.0.1:${process.env.PORT || 3301}`

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3300,
    open: process.env.VITE_OPEN === 'true',
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
