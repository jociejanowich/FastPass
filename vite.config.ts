/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Two production hosts need two different base paths:
//  - GitHub Pages serves the app from https://<user>.github.io/FastPass/, so
//    that build needs base "/FastPass/" — opt in with GITHUB_PAGES=true (set
//    by .github/workflows/deploy.yml).
//  - A Power Apps Code App (`pa app push`) is served from its own
//    apps.powerapps.com path, so it needs base "/" (the default) — same as
//    `npm run dev` and the Microsoft Code Apps template.
export default defineConfig(({ command, isPreview }) => ({
  base: process.env.GITHUB_PAGES === 'true' && (command === 'build' || isPreview) ? '/FastPass/' : '/',
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
