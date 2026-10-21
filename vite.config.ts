import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/visigeo-proxy': {
        target: 'https://weddemulle-estate.visigeo.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/visigeo-proxy/, ''),
      },
    },
  },
})
