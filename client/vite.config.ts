import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Electron loads the built app via file://, which needs relative asset paths.
// The web build is served from the domain root with SPA rewrites, so it needs
// an absolute base — otherwise a hard refresh on a nested route (e.g.
// /admin/salons) resolves asset URLs against the wrong path and renders blank.
export default defineConfig(({ mode }) => ({
  base: mode === 'electron' ? './' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));