// Save reliability and sample-data isolation.
import { expect, test, type Page } from '@playwright/test'
import { committed, open, readStore, settle, tap } from './helpers.ts'

const SAVED = 'Saved. Your palate has been noted.'
const FAILED = 'Couldn’t save to this device. Storage may be full or blocked.'

/** Make IndexedDB abort writes to saved tastings while window.__failTastings is true (as a full disk would). */
async function canFailTastingWrites(page: Page) {
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
      const req = put.apply(this, args)
      if ((window as unknown as { __failTastings?: boolean }).__failTastings && this.name === 'tastings') {
        this.transaction.abort()
      }
      return req
    }
  })
}

async function tasteAndReview(page: Page, level: string) {
  await tap(page, 'Start tasting')
  await tap(page, /Taste without naming/)
  await tap(page, level)
  await settle(page)
  await tap(page, 'Review tasting')
}

test('a save is acknowledged once it is stored', async ({ page }) => {
  await open(page)
  await tasteAndReview(page, 'Sweetness: Some')
  await tap(page, /Save to journal/)
  await expect(page.getByText(SAVED)).toBeVisible()
  expect(await readStore(page, 'tastings')).toHaveLength(1)
})

test('a failed save is reported, never confirmed, and loses nothing', async ({ page }) => {
  await canFailTastingWrites(page)
  await open(page)
  await tasteAndReview(page, 'Sweetness: Some')
  await tap(page, /Save to journal/)
  await committed(page, 'tastings', 1)

  await page.evaluate(() => ((window as unknown as { __failTastings: boolean }).__failTastings = true))
  await tap(page, 'Anosmia home')
  await tasteAndReview(page, 'Sweetness: Very sweet')
  await page.locator('#notes').fill('Do not lose me.')
  await tap(page, /Save to journal/)
  await expect(page.getByText(FAILED)).toBeVisible()
  await expect(page.getByText(SAVED)).toHaveCount(0)
  // No retry storm: the error is not followed by repeated attempts while nothing changes.
  await page.waitForTimeout(1500)
  await expect(page.getByText(SAVED)).toHaveCount(0)

  // The earlier record is intact, and reopening restores the unsaved tasting instead of losing it.
  expect(await readStore(page, 'tastings')).toHaveLength(1)
  await page.reload()
  await expect(page.locator('#notes')).toHaveValue('Do not lose me.')
  await tap(page, /Save to journal/)
  await expect(page.getByText(SAVED)).toBeVisible()
  expect(await readStore(page, 'tastings')).toHaveLength(2)
})

test('the sample tasting never enters the real journal', async ({ page }) => {
  await open(page)
  await tap(page, 'Sample tasting')
  await expect(page.getByText('Sample · illustrative')).toBeVisible()
  await tap(page, /Save to journal/)
  await expect(page.getByText('That was the sample tasting, so it isn’t saved to your journal.')).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Tastings · 0' })).toBeVisible()
  await expect(page.getByText('Tastes like crushed ants...')).toHaveCount(0)
  await page.waitForTimeout(300)
  expect(await readStore(page, 'tastings')).toHaveLength(0)
  // "What you've reported" counts nothing from the sample.
  await expect(page.getByText('No levels reported yet.', { exact: false })).toBeVisible()
})
