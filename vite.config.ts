/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Optional HTTPS for testing on a phone over Wi-Fi (see device-testing.md): set both variables to a
// locally trusted certificate and key, kept outside git (e.g. in private/). Off unless both are set.
const httpsCert = process.env.ANOSMIA_HTTPS_CERT
const httpsKey = process.env.ANOSMIA_HTTPS_KEY
const https = httpsCert && httpsKey ? { cert: readFileSync(httpsCert), key: readFileSync(httpsKey) } : undefined

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
        globPatterns: ['**/*.{js,css,html,woff2,svg,png,jpg,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  preview: {
    // e2e/camera.spec.ts reaches the preview server by this name (mapped inside the test browser only)
    // to reproduce a phone on plain http. `.test` is reserved and never resolves publicly.
    allowedHosts: ['anosmia-lan.test'],
    https,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
