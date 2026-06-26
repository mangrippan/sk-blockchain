import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Fail loudly if 5173 is already taken instead of silently moving to 5174+.
    // A different port would break the backend CORS allow-list and produce the
    // intermittent "CORS error" seen when a stale dev server is still running.
    strictPort: true,
    proxy: {
      '/api': {
        // 127.0.0.1 (not localhost): the backend runs in WSL and is reachable
        // on the IPv4 loopback that WSL forwards; "localhost" can resolve to
        // ::1 (IPv6) first, which WSL does not forward, breaking the proxy.
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
