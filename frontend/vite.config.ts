import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:5050'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
      // Same-origin proxy so auth cookies stay SameSite=Strict and no CORS is needed in dev.
      proxy: {
        '/api': { target: apiTarget, changeOrigin: false },
      },
    },
    build: {
      sourcemap: false,
    },
  }
})
