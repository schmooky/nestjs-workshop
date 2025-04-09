import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    // Proxy WebSocket connections to the backend server
    proxy: {
      '/burst/slot': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },
});