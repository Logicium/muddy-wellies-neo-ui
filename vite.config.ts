import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // The default (LightningCSS) minifier collapses standard + -webkit-
    // prefixed pairs (backdrop-filter, mask, …) down to the prefixed one,
    // which kills blur effects in Firefox on production builds. esbuild
    // preserves both declarations as written.
    cssMinify: 'esbuild',
  },
})
