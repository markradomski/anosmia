// Recording-screen guidance bar (Option D): a 44 px bar above the thumb dock that opens a panel in the
// overview's space. Desktop Chromium at phone sizes: geometry and behaviour, not a real phone.
import { expect, test, type Page } from '@playwright/test'
import { open, settle, tap } from './helpers.ts'

const NAMES = ['sweetness', 'acidity', 'tannin', 'body', 'alcohol warmth', 'finish']
const bar = (page: Page) => page.locator('[data-guide-bar]')
const panel = (page: Page) => page.locator('[data-guide-panel]')
const dockHeading = (page: Page) => page.locator('section[data-dock] h2')
const label = (name: string) => new RegExp(`^How to recognise ${name}`)

async function startRecording(page: Page, options: { freshGuide?: boolean } = {}) {
  await open(page, '/', options)
  await tap(page, 'Start tasting')
  await tap(page, /Taste without naming/)
}

const rect = (page: Page, selector: string) => page.evaluate(sel => {
  const r = document.querySelector(sel)!.getBoundingClientRect()
  return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }
}, selector)

/** Save the tasting in progress (one answer, no notes) and return to the journal. */
async function saveTasting(page: Page) {
  await tap(page, 'Sweetness: Some')
  await settle(page)
  await tap(page, 'Review tasting')
  await tap(page, /Save to journal/)
  await expect(page.getByRole('heading', { name: 'The Cellar Book' })).toBeVisible()
}

for (const size of [{ width: 360, height: 740 }, { width: 390, height: 844 }, { width: 415, height: 915 }]) {
  test.describe(`${size.width}×${size.height}`, () => {
    test.use({ viewport: size })

    test('the bar is a full-width 44 px control directly above the dock and labelled for every sensation', async ({ page }) => {
      await startRecording(page)
      for (const name of NAMES) {
        await expect(bar(page)).toHaveAccessibleName(label(name))
        const b = await rect(page, '[data-guide-bar]'), d = await rect(page, 'section[data-dock]')
        const frame = await rect(page, '.f-ui.grain')
        expect(b.height).toBe(44)
        expect(b.left).toBeCloseTo(frame.left, 0)
        expect(b.right).toBeCloseTo(frame.right, 0)
        expect(b.bottom).toBeCloseTo(d.top, 0)
        await tap(page, 'Next sensation')
      }
      await expect(page.getByRole('button', { name: 'How?' })).toHaveCount(0)
    })

    test('opening shows the guidance in the overview space and leaves the controls where they were', async ({ page }) => {
      await startRecording(page)
      const dockBefore = await rect(page, 'section[data-dock]')
      const overview = await rect(page, '.scroll')
      await bar(page).click()
      await expect(bar(page)).toHaveAttribute('aria-expanded', 'true')
      await expect(panel(page)).toBeVisible()
      await expect.poll(() => panel(page).evaluate(el => {
        const transform = getComputedStyle(el).transform
        return transform === 'none' || new DOMMatrixReadOnly(transform).isIdentity
      })).toBe(true) // a completed zero-translation may serialize as an identity matrix
      const p = await rect(page, '[data-guide-panel]'), b = await rect(page, '[data-guide-bar]')
      expect(p.top).toBeCloseTo(overview.top, 0)
      expect(p.bottom).toBeCloseTo(b.top, 0)
      expect(await rect(page, 'section[data-dock]')).toEqual(dockBefore)
      // The overview is covered and inert (not focusable or readable by assistive tech) while the guide is open.
      expect(await page.getByRole('button', { name: /^Sweetness: Unanswered/ }).evaluate(el => !!el.closest('[inert]'))).toBe(true)
      // The guidance does not repeat the sensation's question.
      await expect(panel(page)).not.toContainText('Is there any sugary roundness?')
      // Answer buttons stay usable, and the bottom navigation is on screen.
      for (const name of ['Previous sensation', 'Next sensation', 'Review tasting']) {
        const r = (await page.getByRole('button', { name }).boundingBox())!
        expect(r.y + r.height).toBeLessThanOrEqual(size.height)
      }
      await bar(page).click()
      await expect(panel(page)).toBeHidden()
      expect(await page.getByRole('button', { name: /^Sweetness: Unanswered/ }).evaluate(el => !!el.closest('[inert]'))).toBe(false)
      await expect(page.getByRole('button', { name: /^Sweetness: Unanswered/ })).toBeVisible()
    })

    test('the essential advice, including the valid Not noticed / Can’t tell answers, is visible without scrolling', async ({ page }) => {
      await startRecording(page)
      await bar(page).click()
      for (const name of NAMES) {
        await expect(bar(page)).toHaveAccessibleName(label(name))
        const fits = await page.evaluate(() => {
          const panel = document.querySelector('[data-guide-panel]')!, note = panel.querySelector('[data-guide-note]')!
          const steps = panel.querySelectorAll('li').length
          return { steps, noteVisible: note.getBoundingClientRect().bottom <= panel.getBoundingClientRect().bottom + 0.5, scrollable: panel.scrollHeight > panel.clientHeight }
        })
        expect(fits.steps, name).toBe(3)
        expect(fits.noteVisible, name).toBe(true)
        await tap(page, 'Next sensation')
      }
    })

    test('nothing overflows with the guide open or closed', async ({ page }) => {
      await startRecording(page)
      for (const open of [false, true]) {
        if (open) await bar(page).click()
        const out = await page.evaluate(() => {
          const frame = document.querySelector('.f-ui.grain')!.getBoundingClientRect()
          const bad: string[] = []
          document.querySelectorAll('.f-ui.grain button, .f-ui.grain h2, .f-ui.grain p').forEach(el => {
            const r = el.getBoundingClientRect()
            if (r.width && (r.left < frame.left - 1 || r.right > frame.right + 1)) bad.push((el.textContent ?? '').trim().slice(0, 30))
          })
          if (document.scrollingElement!.scrollWidth > innerWidth) bad.push('page scrolls horizontally')
          return bad
        })
        expect(out).toEqual([])
      }
    })
  })
}

test('guidance always starts closed, and the first time it is opened it carries a one-time introduction', async ({ page }) => {
  await startRecording(page, { freshGuide: true })
  await expect(panel(page)).toBeHidden()
  await expect(bar(page)).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByRole('heading', { name: 'What can you feel?' })).toBeVisible() // the overview is not covered on arrival
  await bar(page).click()
  await expect(panel(page)).toBeVisible()
  await expect(bar(page)).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('[data-guide-intro]')).toHaveText('Read, sip, then tap an answer below. The guide follows you; hide it any time.')
  // Answering moves on; the panel stays open for Acidity with no introduction.
  await tap(page, 'Sweetness: Some')
  await settle(page)
  await expect(dockHeading(page)).toHaveText('Acidity')
  await expect(panel(page)).toBeVisible()
  await expect(page.locator('[data-guide-intro]')).toHaveCount(0)
  await expect(bar(page)).toHaveAccessibleName(label('acidity'))
  // Going back to Sweetness does not bring it back.
  await tap(page, 'Previous sensation')
  await expect(page.locator('[data-guide-intro]')).toHaveCount(0)
})

test('every tasting starts with the guide closed, whatever it was left as, and guidance is never required', async ({ page }) => {
  await startRecording(page, { freshGuide: true })
  await expect(panel(page)).toBeHidden()
  // Not mandatory: the answers work with it closed.
  await bar(page).click()
  await expect(panel(page)).toBeVisible()
  await saveTasting(page) // saved while it was open
  await tap(page, 'New tasting')
  await tap(page, /Taste without naming/)
  await expect(panel(page)).toBeHidden()
  await expect(page.locator('[data-guide-intro]')).toHaveCount(0)
})

test('opening and closing animate: the panel fades and slides over about half a second, and is hidden once closed', async ({ page }) => {
  await startRecording(page)
  const state = () => panel(page).evaluate(el => { const c = getComputedStyle(el); return { opacity: +c.opacity, visibility: c.visibility, duration: c.transitionDuration } })
  expect((await state()).visibility).toBe('hidden')
  await bar(page).click()
  await page.waitForTimeout(120)
  const mid = await state()
  expect(mid.opacity).toBeGreaterThan(0) // already appearing...
  expect(mid.opacity).toBeLessThan(1) // ...but not finished: it is not a jump cut
  expect(parseFloat(mid.duration.split(',')[0])).toBeGreaterThanOrEqual(0.4)
  expect(parseFloat(mid.duration.split(',')[0])).toBeLessThanOrEqual(0.6)
  await expect(panel(page)).toBeVisible()
  await page.waitForTimeout(600)
  expect((await state()).opacity).toBe(1)
  await bar(page).click()
  await page.waitForTimeout(120)
  const out = await state()
  expect(out.visibility).toBe('visible') // still there while it fades out
  expect(out.opacity).toBeLessThan(1)
  await expect(panel(page)).toBeHidden()
})

test('an open guide follows the sensation, and answering with it open still confirms then advances', async ({ page }) => {
  await startRecording(page)
  await bar(page).click()
  await tap(page, 'Next sensation')
  await expect(bar(page)).toHaveAccessibleName(label('acidity'))
  await expect(panel(page)).toContainText('Swallow, then tip your chin down slightly.')
  await tap(page, 'Previous sensation')
  await expect(panel(page)).toContainText('Take a small sip and let it sit')
  // A deliberate new answer: acknowledged, then moves to Acidity after about 420 ms with the guide still open.
  await tap(page, 'Sweetness: Sweet')
  await expect(page.getByRole('button', { name: 'Sweetness: Sweet', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(dockHeading(page)).toHaveText('Sweetness')
  await page.waitForTimeout(150)
  await expect(dockHeading(page)).toHaveText('Sweetness')
  await expect(dockHeading(page)).toHaveText('Acidity')
  await expect(panel(page)).toBeVisible()
  await expect(bar(page)).toHaveAccessibleName(label('acidity'))
})

test('manual navigation, opening, closing and scrolling the guide never advance or answer', async ({ page }) => {
  await startRecording(page)
  // Next pressed inside the 420 ms window cancels the pending advance.
  await tap(page, 'Sweetness: Some')
  await page.waitForTimeout(120)
  await tap(page, 'Next sensation')
  await settle(page)
  await expect(dockHeading(page)).toHaveText('Acidity')
  await tap(page, 'Previous sensation')
  // Opening and closing the guide inside the window also cancel it, without moving anything.
  await tap(page, 'Sweetness: Sweet')
  await page.waitForTimeout(120)
  await bar(page).click()
  await settle(page)
  await expect(dockHeading(page)).toHaveText('Sweetness')
  await bar(page).click()
  await settle(page)
  await expect(dockHeading(page)).toHaveText('Sweetness')
  // Scrolling the guide neither answers nor advances.
  await bar(page).click()
  await panel(page).hover()
  await page.mouse.wheel(0, 400)
  await settle(page)
  await expect(dockHeading(page)).toHaveText('Sweetness')
  await expect(page.getByText('1 of 6 answered')).toBeVisible()
})

test('the guide scrolls on its own and starts from the top for each sensation', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 560 })
  await startRecording(page, { freshGuide: true })
  await bar(page).click() // guidance starts closed
  await expect(panel(page)).toBeVisible()
  const metrics = () => panel(page).evaluate(el => ({ top: el.scrollTop, scrollable: el.scrollHeight > el.clientHeight, docScroll: document.scrollingElement!.scrollTop }))
  expect((await metrics()).scrollable).toBe(true)
  await panel(page).hover()
  await page.mouse.wheel(0, 300)
  await expect.poll(async () => (await metrics()).top).toBeGreaterThan(0)
  expect((await metrics()).docScroll).toBe(0)
  await tap(page, 'Next sensation')
  expect((await metrics()).top).toBe(0)
  await panel(page).hover()
  await page.mouse.wheel(0, 300)
  await expect.poll(async () => (await metrics()).top).toBeGreaterThan(0)
  await tap(page, 'Previous sensation')
  expect((await metrics()).top).toBe(0)
})

test('closing the guide restores the overview with the active row fully above the bar, including after jumps', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await startRecording(page)
  const visible = () => page.evaluate(() => {
    const row = document.querySelector('[data-active="true"]')!.getBoundingClientRect()
    const scroller = document.querySelector('[data-active="true"]')!.closest('.scroll')!.getBoundingClientRect()
    const b = document.querySelector('[data-guide-bar]')!.getBoundingClientRect()
    return row.top >= scroller.top - 0.5 && row.bottom <= b.top + 0.5
  })
  await bar(page).click()
  for (let i = 0; i < 5; i++) await tap(page, 'Next sensation')
  await expect(dockHeading(page)).toHaveText('Finish')
  await bar(page).click()
  await expect.poll(visible).toBe(true)
  // Jump straight back to the first sensation with the guide closed, then forward again.
  await page.getByRole('button', { name: /^Sweetness: Unanswered/ }).click()
  await expect.poll(visible).toBe(true)
  await page.getByRole('button', { name: /^Finish: Unanswered/ }).click()
  await expect(dockHeading(page)).toHaveText('Finish')
  await expect.poll(visible).toBe(true)
  // Open and close again: still visible.
  await bar(page).click()
  await bar(page).click()
  await expect.poll(visible).toBe(true)
})

test('Escape hides the guide, and the bar is reachable and operable from the keyboard', async ({ page }) => {
  await startRecording(page)
  await bar(page).focus()
  await page.keyboard.press('Enter')
  await expect(panel(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(panel(page)).toBeHidden()
  await bar(page).focus()
  await page.keyboard.press('Space')
  await expect(panel(page)).toBeVisible()
  await expect(dockHeading(page)).toHaveText('Sweetness')
})

test('demo mode keeps the prototype’s How? sheet and has no bar', async ({ page }) => {
  await open(page, '/?demo')
  await tap(page, 'Start tasting')
  await tap(page, /Taste without naming|Start tasting/)
  await expect(page.locator('[data-guide-bar]')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^How to notice sweetness/ })).toBeVisible()
})
