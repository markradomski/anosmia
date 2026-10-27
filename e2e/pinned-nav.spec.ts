// Every screen with a Back button keeps its compact top row (Back plus progress or title) pinned while
// the screen's content scrolls, without covering or shifting anything. Desktop Chromium at phone sizes;
// the on-screen keyboard is emulated by shrinking the viewport, which is what Android does here
// (index.html sets interactive-widget=resizes-content).
import { expect, test, type Page } from '@playwright/test'
import { committed, open, settle, tap } from './helpers.ts'

const SIZES = [{ width: 360, height: 740 }, { width: 390, height: 844 }, { width: 415, height: 915 }]
/** Roughly what an Android keyboard leaves of each screen. */
const KEYBOARD_PX = 330

/** Scroll the screen's content to the bottom, then measure the pinned row. */
async function pinnedAtBottom(page: Page) {
  return page.locator('[data-pin]').evaluate(async pin => {
    const scroller = pin.closest('.scroll') as HTMLElement
    scroller.scrollTop = scroller.scrollHeight
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
    const view = scroller.getBoundingClientRect()
    const box = pin.getBoundingClientRect()
    const back = pin.querySelector('button')!
    const b = back.getBoundingClientRect()
    const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
    return {
      overflow: scroller.scrollHeight - scroller.clientHeight, scrolled: scroller.scrollTop,
      top: box.top - view.top, height: box.height, left: box.left - view.left, width: box.width, viewWidth: scroller.clientWidth,
      horizontalOverflow: scroller.scrollWidth - scroller.clientWidth,
      backHit: !!hit && back.contains(hit), docScroll: document.scrollingElement!.scrollTop,
    }
  })
}

async function expectPinned(page: Page, screen: string) {
  await expect(page.locator('[data-pin]'), screen).toHaveCount(1)
  await settle(page)
  const g = await pinnedAtBottom(page)
  expect(g.scrolled, screen + ': scrolled to the bottom').toBeCloseTo(g.overflow, 0)
  expect(g.top, screen + ': row at the top').toBeCloseTo(0, 0)
  expect(g.height, screen + ': row height (8 px padding + 44 px row)').toBeCloseTo(52, 0)
  expect([g.left, g.width], screen + ': row spans the content width').toEqual([0, g.viewWidth])
  expect(g.horizontalOverflow, screen + ': no sideways scrolling').toBe(0)
  expect(g.backHit, screen + ': Back is what a tap hits').toBe(true)
  expect(g.docScroll, screen + ': the page itself never scrolls').toBe(0)
  return g
}

/**
 * With the keyboard open (a shorter screen) the row stays pinned and usable, and a field brought into
 * view (as Android does for the focused field, honouring scroll-padding) lands below the pinned row.
 */
async function expectKeyboardSafe(page: Page, screen: string, field: string, size: { width: number; height: number }) {
  await page.setViewportSize({ width: size.width, height: size.height - KEYBOARD_PX })
  await expectPinned(page, screen + ' with the keyboard open')
  await page.locator(field).evaluate(el => el.scrollIntoView({ block: 'nearest' }))
  await page.locator(field).click()
  const g = await page.locator(field).evaluate(el => ({
    fieldTop: el.getBoundingClientRect().top, pinBottom: document.querySelector('[data-pin]')!.getBoundingClientRect().bottom,
    focused: document.activeElement === el, docScroll: document.scrollingElement!.scrollTop,
  }))
  expect(g.focused).toBe(true)
  expect(g.fieldTop, screen + ': field below the pinned row').toBeGreaterThanOrEqual(g.pinBottom - 0.5)
  expect(g.docScroll).toBe(0)
  await page.locator(field).blur()
  await page.setViewportSize(size)
}

async function tasting(page: Page) {
  await tap(page, /Taste without naming/)
  for (const answer of ['Sweetness: Some', 'Acidity: Fresh']) {
    await tap(page, answer)
    await settle(page)
  }
  await tap(page, 'Review tasting')
}

for (const size of SIZES) {
  test.describe(`${size.width}×${size.height}`, () => {
    test.use({ viewport: size })

    test('single-wine screens: find, record, summary, entry and compare', async ({ page }) => {
      await open(page)
      await tap(page, 'Start tasting')
      await page.locator('#q').fill('a') // long list of results
      await expectPinned(page, 'find wine')
      await expectKeyboardSafe(page, 'find wine', '#q', size)

      await tap(page, /Taste without naming/)
      await expectPinned(page, 'record')
      for (const answer of ['Sweetness: Some', 'Acidity: Fresh']) {
        await tap(page, answer)
        await settle(page)
      }
      await tap(page, 'Review tasting')
      await expectPinned(page, 'summary')
      await expectKeyboardSafe(page, 'summary', 'textarea', size)
      await tap(page, /Save to journal/)
      await committed(page, 'tastings', 1)

      await tap(page, 'New tasting')
      await tasting(page)
      await tap(page, /Save to journal/)
      await committed(page, 'tastings', 2)
      // The prototype's save toast overlays the top of the screen for 2.6 s; wait for it to go.
      await expect(page.getByText(/^Saved\./)).toHaveCount(0, { timeout: 5000 })

      await page.getByRole('button', { name: /^Unnamed wine, tasted/ }).first().click()
      await expectPinned(page, 'entry')
      // Compare from an entry picks the other tasting in the journal first.
      await tap(page, 'Compare')
      await page.getByRole('button', { name: /^Unnamed wine, tasted/ }).last().click()
      await tap(page, 'Compare A vs B')
      await expectPinned(page, 'compare')
    })

    test('A/B screens: setup, record, review and saved comparison', async ({ page }) => {
      await open(page)
      await tap(page, 'Two glasses?')
      await expectPinned(page, 'A/B setup')
      await tap(page, /Start comparing/)
      await expectPinned(page, 'A/B record')
      await tap(page, /^A sweeter/)
      await settle(page)
      await tap(page, 'Review comparison')
      await expectPinned(page, 'A/B review')
      await tap(page, /Save comparison/)
      await committed(page, 'sessions', 1)
      // The prototype's save toast overlays the top of the screen for 2.6 s; wait for it to go.
      await expect(page.getByText('Saved. Your tongue has entered the chat.')).toHaveCount(0, { timeout: 5000 })
      await expectPinned(page, 'A/B saved comparison')
    })
  })
}
