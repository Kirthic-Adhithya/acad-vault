import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // In dev, /api calls are forwarded to the FastAPI backend.
      // In production (on EC2) FastAPI serves everything from one port, so no proxy needed.
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Vite puts the built output here; FastAPI mounts this directory as static files.
    outDir: 'dist',
  },
})
