import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3300,
    open: process.env.VITE_OPEN === 'true',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3301',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
