/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the app from https://<user>.github.io/FastPass/, so the
// production build (and `npm run preview`) uses that base path. `npm run dev`
// stays at "/".
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/FastPass/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          fluent: ['@fluentui/react-components', '@fluentui/react-icons'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
}));
