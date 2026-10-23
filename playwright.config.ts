import { defineConfig, devices } from '@playwright/test'

// Browser interaction tests run against the production build (vite preview), plus a static server
// for references/ so tests can compare the port with the original export.
// Desktop Chromium with a phone-sized viewport: this is not Android or physical-device testing.
export const APP = 'http://127.0.0.1:5233'
export const REFERENCE = 'http://127.0.0.1:5234'
/** Dev server, used only to import source modules into a real browser for module-level tests. */
export const DEV = 'http://127.0.0.1:5235'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: { ...devices['Desktop Chrome'], baseURL: APP, viewport: { width: 430, height: 932 } },
  webServer: [
    { command: 'npm run build && npx vite preview --port 5233 --strictPort --host 127.0.0.1', url: APP, reuseExistingServer: false },
    { command: 'node scripts/serve-static.mjs references 5234', url: `${REFERENCE}/prototype/logic.js`, reuseExistingServer: false },
    { command: 'npx vite --port 5235 --strictPort --host 127.0.0.1', url: DEV, reuseExistingServer: false },
  ],
})
