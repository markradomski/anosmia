/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // A new version waits until the app is fully closed, so an open tasting is never reloaded under the user.
      registerType: 'prompt',
      injectRegister: 'script',
      includeAssets: ['favicon.svg', 'icons/*'],
      manifest: {
        name: 'ANOSMIA — Wine beyond aroma',
        short_name: 'Anosmia',
        description: 'Notice what your mouth can tell you: sweetness, sharpness, grip, weight, warmth and length.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F5ECD7',
        theme_color: '#F5ECD7',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Only the app's own built files. Journal data lives in IndexedDB, not in this cache.
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
