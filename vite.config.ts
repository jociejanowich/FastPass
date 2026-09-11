/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Three cases need different base paths:
//  - GitHub Pages serves the app from https://<user>.github.io/FastPass/, so
//    that build needs base "/FastPass/" — opt in with GITHUB_PAGES=true (set
//    by .github/workflows/deploy.yml).
//  - A Power Apps Code App (`pa app push`) is served from a per-environment
//    content host at whatever path it assigns the app, so its build needs a
//    *relative* base ("./") — this is exactly what Microsoft's own
//    @microsoft/power-apps-vite plugin sets, and why: "needed for publishing
//    static assets correctly." An absolute "/" 404s every asset there.
//  - `npm run dev` (and `pa app run`, which drives the same dev server)
//    stays at the default "/".
export default defineConfig(({ command, isPreview }) => ({
  base:
    process.env.GITHUB_PAGES === 'true' && (command === 'build' || isPreview)
      ? '/FastPass/'
      : command === 'build'
        ? './'
        : '/',
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
