// The active sensation must stay visible above the fixed thumb dock (found on the Nothing Phone:
// Finish, the 6th row, ended up behind the dock). Desktop Chromium at phone sizes; the phone's own
// browser chrome still needs checking on the device.
import { expect, test, type Page } from '@playwright/test'
import { open, settle, tap } from './helpers.ts'

/** 390 × 844 with the browser's toolbars taking ~144 px, and a small phone. */
const SIZES = [{ width: 390, height: 700 }, { width: 360, height: 640 }]

/** Geometry of the active row, its scroll container and the dock. */
const geometry = (page: Page) => page.evaluate(() => {
  const row = document.querySelector('[data-active="true"]')!.getBoundingClientRect()
  const scroller = document.querySelector('[data-active="true"]')!.closest('.scroll')!
  const view = scroller.getBoundingClientRect()
  // The pinned top row (Back, progress) covers the top of the overview; rows must clear it too.
  const pin = scroller.querySelector('[data-pin]')
  const viewTop = pin ? Math.max(view.top, pin.getBoundingClientRect().bottom) : view.top
  const dock = document.querySelector('[data-dock]')!.getBoundingClientRect()
  // On the recording screen the guidance bar sits between the overview and the dock; rows must clear it.
  const edge = (document.querySelector('[data-guide-bar]') ?? document.querySelector('[data-dock]'))!.getBoundingClientRect()
  return { rowTop: row.top, rowBottom: row.bottom, viewTop, dockTop: edge.top, dockBottom: dock.bottom,
    scrollTop: scroller.scrollTop, docScroll: document.scrollingElement!.scrollTop, innerHeight }
})

/** Fully visible: not above the overview (or under its pinned top row) and not behind the dock. */
const activeRowVisible = async (page: Page) => {
  const g = await geometry(page)
  return g.rowTop >= g.viewTop - 0.5 && g.rowBottom <= g.dockTop + 0.5
}

const expectActiveVisible = async (page: Page) => {
  await expect.poll(() => activeRowVisible(page), { timeout: 3000 }).toBe(true)
  const g = await geometry(page)
  // The dock stays fixed to the bottom and the page itself never scrolls.
  expect(g.dockBottom).toBe(g.innerHeight)
  expect(g.docScroll).toBe(0)
}

async function toFinish(page: Page) {
  await tap(page, 'Start tasting')
  await tap(page, /Taste without naming/)
  for (const answer of ['Sweetness: Some', 'Acidity: Fresh', 'Not noticed', 'Body: Round', 'Alcohol warmth: Warm']) {
    await tap(page, answer)
    await settle(page)
  }
  await expect(page.locator('section[data-dock] h2')).toHaveText('Finish')
}

for (const size of SIZES) {
  test.describe(`${size.width}×${size.height}`, () => {
    test.use({ viewport: size })

    test('Finish is visible above the dock after answering the previous sensation', async ({ page }) => {
      await open(page)
      await toFinish(page)
      await expectActiveVisible(page)
    })

    test('navigating backwards brings an earlier sensation back into view', async ({ page }) => {
      await open(page)
      await toFinish(page)
      await expectActiveVisible(page)
      for (let i = 0; i < 5; i++) await tap(page, 'Previous sensation')
      await expect(page.locator('section[data-dock] h2')).toHaveText('Sweetness')
      await expectActiveVisible(page)
    })

    test('tapping a partially hidden row scrolls it fully into view, no further than needed', async ({ page }) => {
      await open(page)
      await tap(page, 'Start tasting')
      await tap(page, /Taste without naming/)
      // Put the Finish row half behind the dock, then tap it where it is (no scrolling by the test).
      const finish = page.getByRole('button', { name: /^Finish: Unanswered/ })
      await finish.evaluate(el => {
        const scroller = el.closest('.scroll')!
        const dockTop = (document.querySelector('[data-guide-bar]') ?? document.querySelector('[data-dock]'))!.getBoundingClientRect().top
        scroller.scrollTop += el.getBoundingClientRect().top - (dockTop - 20)
      })
      await finish.evaluate(el => (el as HTMLElement).click())
      await expect(page.locator('section[data-dock] h2')).toHaveText('Finish')
      await expectActiveVisible(page)
      const g = await geometry(page)
      expect(g.dockTop - g.rowBottom).toBeLessThanOrEqual(9) // just clear of the dock, not scrolled to the top
    })

    test('returning from a summary edit shows the active sensation', async ({ page }) => {
      await open(page)
      await tap(page, 'Start tasting')
      await tap(page, /Taste without naming/)
      await tap(page, 'Review tasting')
      await tap(page, /^Finish: Unanswered\. Tap to change\./)
      await tap(page, 'Finish: Long')
      await expect(page.getByRole('heading', { name: 'What you noticed' })).toBeVisible()
      await page.waitForTimeout(600) // the edit returns to the summary after its 420 ms confirmation
      await tap(page, 'Keep tasting')
      await expect(page.locator('section[data-dock] h2')).toHaveText('Finish')
      await expectActiveVisible(page)
    })

    test('the A/B overview keeps its active sensation visible too', async ({ page }) => {
      await open(page)
      await tap(page, 'Two glasses?')
      await tap(page, /Start comparing/)
      for (const answer of [/^A sweeter/, /About the same/, /^B drier/, /Can’t tell/, /^A warmer/]) {
        await tap(page, answer)
        await settle(page)
      }
      await expect(page.locator('section[data-dock] h2')).toHaveText('Finish')
      await expectActiveVisible(page)
    })
  })
}

test('no movement when the active row is already visible', async ({ page }) => {
  // 740 px tall: with the 44 px guidance bar the overview at 640 px is too short to show Acidity unscrolled.
  await page.setViewportSize({ width: 360, height: 740 })
  await open(page)
  await tap(page, 'Start tasting')
  await tap(page, /Taste without naming/)
  await tap(page, 'Sweetness: Some')
  await settle(page)
  await expect(page.locator('section[data-dock] h2')).toHaveText('Acidity')
  expect((await geometry(page)).scrollTop).toBe(0)
})

test('with reduced motion the overview jumps instead of animating', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  await tap(page, 'Start tasting')
  await tap(page, /Taste without naming/)
  await page.getByRole('button', { name: /^Finish: Unanswered/ }).evaluate(el => (el as HTMLElement).click())
  // Checked on the next frame: an animated scroll would still be on its way.
  await page.evaluate(() => new Promise(requestAnimationFrame))
  expect(await activeRowVisible(page)).toBe(true)
})

test('answer timing is unchanged: confirmation for ~420 ms, then advance', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await open(page)
  await tap(page, 'Start tasting')
  await tap(page, /Taste without naming/)
  await tap(page, 'Sweetness: Some')
  await page.waitForTimeout(300)
  await expect(page.locator('section[data-dock] h2')).toHaveText('Sweetness')
  await page.waitForTimeout(400)
  await expect(page.locator('section[data-dock] h2')).toHaveText('Acidity')
})

// The compact top row (Back, tasting progress) stays pinned while the overview scrolls; the large
// heading scrolls away with the rows. Phone sizes from the request: 360×740, 390×844, 415×915.
for (const size of [{ width: 360, height: 740 }, { width: 390, height: 844 }, { width: 415, height: 915 }]) {
  test(`${size.width}×${size.height}: Back and progress stay visible and usable while the overview scrolls`, async ({ page }) => {
    await page.setViewportSize(size)
    await open(page)
    await toFinish(page)
    await expectActiveVisible(page)
    // Scroll the overview all the way down, as a thumb would.
    await page.locator('[data-pin]').evaluate(pin => { const s = pin.closest('.scroll')!; s.scrollTop = s.scrollHeight })
    await settle(page)
    const g = await page.evaluate(() => {
      const pin = document.querySelector('[data-pin]')!
      const scroller = pin.closest('.scroll')!
      const back = document.querySelector('[aria-label="Back to wine"]')!.getBoundingClientRect()
      const heading = [...scroller.querySelectorAll('h1')].find(h => h.textContent === 'What can you feel?')!
      return {
        scrolled: scroller.scrollTop, scrollerTop: scroller.getBoundingClientRect().top,
        pin: pin.getBoundingClientRect().toJSON(), backTop: back.top,
        // What a tap at Back's centre would actually hit: the button, not a row scrolled beneath it.
        backHit: document.elementFromPoint(back.left + back.width / 2, back.top + back.height / 2)?.closest('button')?.getAttribute('aria-label'),
        headingPosition: getComputedStyle(heading).position, headingBottom: heading.getBoundingClientRect().bottom,
      }
    })
    // The row sits exactly where it starts out, at the top of the screen.
    expect(g.pin.top).toBeCloseTo(g.scrollerTop, 0)
    expect(g.backTop).toBeCloseTo(g.scrollerTop + 8, 0)
    expect(g.backHit).toBe('Back to wine')
    await expect(page.getByText(/Tasting No\. \d+ · 5 of 6 answered/)).toBeInViewport()
    // Only the compact row is pinned: the heading scrolls away when there is anything to scroll.
    expect(g.headingPosition).toBe('static')
    if (g.scrolled > 60) expect(g.headingBottom).toBeLessThanOrEqual(g.pin.bottom)
    // Back still works from the scrolled overview.
    await tap(page, 'Back to wine')
    await expect(page.locator('[data-pin]')).toHaveCount(0)
  })
}
