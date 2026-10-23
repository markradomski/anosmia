// Full-screen layout in normal mode (demo mode keeps the prototype's fixed frame; see parity.spec.ts).
// Desktop Chromium at phone sizes: this checks geometry, not a real phone's browser chrome.
import { expect, test, type Page } from '@playwright/test'
import { closeSheet, open, settle, tap } from './helpers.ts'

const SIZES = [
  { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 360, height: 640 }, { width: 320, height: 568 },
  { width: 1280, height: 800 },
]

/** Controls and headings that stick out of the app frame, and whether the page scrolls sideways. */
async function overflow(page: Page) {
  return page.evaluate(() => {
    const frame = document.querySelector('.f-ui.grain')!.getBoundingClientRect()
    const out: string[] = []
    document.querySelectorAll('.f-ui.grain button, .f-ui.grain input, .f-ui.grain textarea, .f-ui.grain h1, .f-ui.grain h2').forEach(el => {
      const r = el.getBoundingClientRect()
      if (!r.width || !r.height) return
      if (r.left < frame.left - 1 || r.right > frame.right + 1) out.push(`${el.tagName} "${(el.textContent ?? '').trim().slice(0, 30)}"`)
    })
    if (document.scrollingElement!.scrollWidth > innerWidth) out.push('page scrolls horizontally')
    return out
  })
}

const box = (page: Page, name: string | RegExp) => page.getByRole('button', { name }).first().boundingBox()

for (const size of SIZES) {
  test(`fills the screen and fits every main screen at ${size.width}×${size.height}`, async ({ page }) => {
    await page.setViewportSize(size)
    await open(page)
    const frame = (await page.locator('.f-ui.grain').boundingBox())!
    expect(frame.height).toBe(size.height)
    expect(frame.width).toBe(Math.min(size.width, 480))
    expect(frame.x).toBe(Math.round((size.width - frame.width) / 2))

    const screens: [string, () => Promise<void>][] = [
      ['welcome', async () => {}],
      ['find', () => tap(page, 'Start tasting')],
      ['record', () => tap(page, /Taste without naming/)],
      ['summary', async () => { await tap(page, 'Sweetness: Some'); await settle(page); await tap(page, 'Review tasting') }],
      ['journal', () => tap(page, /Save to journal/)],
      ['A/B setup', async () => { await tap(page, 'Anosmia home'); await tap(page, 'Two glasses?') }],
      ['A/B record', () => tap(page, /Start comparing/)],
      ['A/B review', () => tap(page, 'Review comparison')],
    ]
    for (const [name, go] of screens) {
      await go()
      await page.waitForTimeout(350)
      expect(await overflow(page), name).toEqual([])
    }
  })
}

test('the thumb dock sits on the bottom edge and its actions are on screen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await open(page)
  await tap(page, 'Start tasting')
  await tap(page, /Taste without naming/)
  const dock = (await page.locator('section[aria-label="Sensation controls"]').boundingBox())!
  expect(dock.y + dock.height).toBe(640)
  const review = (await box(page, 'Review tasting'))!
  expect(review.y + review.height).toBeLessThanOrEqual(640)
})

test('the welcome screen scrolls rather than overlapping on a short phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 568 })
  await open(page)
  const art = (await page.locator('.welcome-fill > div[aria-hidden="true"]').boundingBox())!
  const heading = (await page.getByRole('heading', { level: 1 }).boundingBox())!
  expect(art.height).toBe(268)
  expect(heading.y).toBeGreaterThanOrEqual(art.y + art.height)
  await page.getByRole('button', { name: 'Start tasting' }).scrollIntoViewIfNeeded()
  await tap(page, 'Start tasting')
  await expect(page.getByRole('heading', { name: 'Which wine is it?' })).toBeVisible()
})

// With interactive-widget=resizes-content, Android shrinks the layout when the keyboard opens.
// Shrinking the viewport here stands in for that; it is not a real on-screen keyboard.
test('primary actions stay above a keyboard-sized viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page)
  await tap(page, 'Start tasting')
  await page.locator('#q').focus()
  await page.setViewportSize({ width: 390, height: 460 })
  await expect(page.locator('#q')).toBeInViewport()
  let action = (await box(page, /Taste without naming/))!
  expect(action.y + action.height).toBeLessThanOrEqual(460)

  await tap(page, 'Type it in')
  await page.waitForTimeout(350) // let the sheet finish rising
  await page.locator('#mname').focus()
  await expect(page.locator('#mname')).toBeInViewport()
  action = (await box(page, 'Use this'))!
  expect(action.y + action.height).toBeLessThanOrEqual(460)
  await closeSheet(page)

  await page.setViewportSize({ width: 390, height: 844 })
  await tap(page, /Taste without naming/)
  await tap(page, 'Review tasting')
  await page.locator('#notes').focus()
  await page.setViewportSize({ width: 390, height: 460 })
  action = (await box(page, /Save to journal/))!
  expect(action.y + action.height).toBeLessThanOrEqual(460)
})
