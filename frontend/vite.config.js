// vite.config.js - Vite configuration with React plugin
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      // Proxy socket.io connections
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
      },
    },
  },
});
