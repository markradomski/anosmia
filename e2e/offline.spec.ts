// Installability and offline use of the production build (service worker + IndexedDB).
import { expect, test } from '@playwright/test'
import { committed, open, settle, tap } from './helpers.ts'

test('the app is installable: manifest, icons and service worker', async ({ page, request }) => {
  await open(page)
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))
  const manifest = await (await request.get('/manifest.webmanifest')).json()
  expect(manifest).toMatchObject({ short_name: 'Anosmia', display: 'standalone', start_url: '/', theme_color: '#F5ECD7' })
  for (const icon of manifest.icons) expect((await request.get(icon.src)).status(), icon.src).toBe(200)
  // Chrome's own installability check.
  const cdp = await page.context().newCDPSession(page)
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors')
  expect(installabilityErrors).toEqual([])
})

test('saved tastings and comparisons open without a network connection', async ({ page, context }) => {
  await open(page)
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))

  await tap(page, 'Start tasting')
  await tap(page, /Taste without naming/)
  await tap(page, 'Sweetness: Very sweet')
  await settle(page)
  await tap(page, 'Review tasting')
  await tap(page, /Save to journal/)
  await committed(page, 'tastings', 1)
  await tap(page, 'Anosmia home')
  await tap(page, 'Two glasses?')
  await tap(page, /Start comparing/)
  await tap(page, 'Review comparison')
  await tap(page, /Save comparison/)
  await committed(page, 'sessions', 1)

  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('.f-ui.grain')).toBeVisible()
  // Reopening returns to the saved comparison, where the last save left off.
  await expect(page.getByText('A/B session · open (you knew which was which)')).toBeVisible()
  await tap(page, 'Journal')
  await page.getByRole('tab', { name: 'Tastings · 1' }).click()
  await tap(page, /^Unnamed wine, tasted/)
  await tap(page, 'Reveal what I noticed')
  await expect(page.getByText('Very sweet', { exact: true }).first()).toBeVisible()

  // A cold start while offline (new tab) also works.
  const offlinePage = await context.newPage()
  await open(offlinePage)
  // It reopens where the other tab left off (the revealed entry); "Reveal" is not kept, so it is hidden again.
  await expect(offlinePage.getByRole('button', { name: 'Reveal what I noticed' })).toBeVisible()
  await tap(offlinePage, 'Journal')
  await offlinePage.getByRole('tab', { name: 'A/B sessions · 1' }).click()
  await expect(offlinePage.getByText('A/B sessions · 1')).toBeVisible()
  await expect(offlinePage.getByRole('button', { name: /^A\/B session,/ })).toBeVisible()
})
