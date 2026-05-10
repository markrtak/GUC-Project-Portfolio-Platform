/**
 * vite.config.js — Vite build tool configuration
 *
 * Vite is the build tool and dev server for this project. It provides:
 *  - Instant Hot Module Replacement (HMR) during development so the browser
 *    updates without a full page reload as you edit files.
 *  - An optimized production bundle via Rollup under the hood.
 *
 * @vitejs/plugin-react  — enables JSX transform, Fast Refresh, and React-
 *   specific optimisations without needing Babel configuration files.
 *
 * resolve.alias  — maps "@" to the "src/" directory so every import can be
 *   written as "@/components/..." instead of "../../../components/...".
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
