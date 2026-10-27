// The Cellar Book keeps its compact header (ANOSMIA, tasting count) and the rule beneath it pinned
// while the title, statistics and journal cards scroll underneath; the Compare / New tasting dock stays
// put and nothing shifts. Desktop Chromium at phone sizes, not the phone itself.
import { expect, test, type Page } from '@playwright/test'
import { open, settle, tap } from './helpers.ts'

const SIZES = [{ width: 360, height: 740 }, { width: 390, height: 844 }, { width: 415, height: 915 }]
const TASTINGS = 12

/** A long real journal, written straight into storage in the persisted schema. */
async function seedJournal(page: Page) {
  await page.evaluate(async count => {
    const db = await new Promise<IDBDatabase>(r => { const q = indexedDB.open('anosmia'); q.onsuccess = () => r(q.result) })
    const obs = { sweet: { state: 'level', level: 2 }, acid: { state: 'not_detected' }, tannin: { state: 'cant_tell' }, body: { state: 'unanswered' }, warm: { state: 'level', level: 3 }, finish: { state: 'unanswered' } }
    const tx = db.transaction('tastings', 'readwrite')
    for (let i = 0; i < count; i++) {
      tx.objectStore('tastings').put({ schema: 1, id: 'seed' + i, createdAt: new Date(Date.UTC(2026, 9, 1 + i, 10)).toISOString(), wine: null, title: 'Unnamed wine', photo: { kind: 'none' }, observations: obs, notes: 'Crushed ants.', enjoyment: null, origin: 'user' })
    }
    await new Promise<void>(r => { tx.oncomplete = () => r() })
    db.close()
  }, TASTINGS)
  await page.reload()
}

/** Positions relative to the journal's scroll container, at a given scroll position. */
const measure = (page: Page, scroll: 'top' | 'bottom') => page.locator('[data-pin="journal"]').evaluate(async (row, scroll) => {
  const scroller = row.closest('.scroll') as HTMLElement
  scroller.scrollTop = scroll === 'top' ? 0 : scroller.scrollHeight
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
  const view = scroller.getBoundingClientRect()
  const rel = (el: Element) => { const b = el.getBoundingClientRect(); return { top: b.top - view.top, bottom: b.bottom - view.top, left: b.left - view.left, width: b.width } }
  const home = row.querySelector('[aria-label="Anosmia home"]')!.getBoundingClientRect()
  const hit = document.elementFromPoint(home.left + home.width / 2, home.top + home.height / 2)
  const dock = [...document.querySelectorAll('button')].find(b => b.textContent?.trim() === 'New tasting')!.getBoundingClientRect()
  return {
    overflow: scroller.scrollHeight - scroller.clientHeight, scrolled: scroller.scrollTop, viewWidth: scroller.clientWidth,
    row: rel(row), rule: rel(scroller.querySelector('[data-pin-rule]')!), title: rel(scroller.querySelector('h1')!),
    count: rel(row.querySelector('.f-mono')!), homeHit: !!hit && hit.closest('[aria-label="Anosmia home"]') !== null,
    dockTop: dock.top, sideScroll: scroller.scrollWidth - scroller.clientWidth, docScroll: document.scrollingElement!.scrollTop,
  }
}, scroll)

for (const size of SIZES) {
  test(`${size.width}×${size.height}: the Cellar Book header and rule stay pinned while the journal scrolls`, async ({ page }) => {
    await page.setViewportSize(size)
    await open(page)
    await seedJournal(page)
    await tap(page, 'The journal')
    await expect(page.getByRole('tab', { name: `Tastings · ${TASTINGS}` })).toBeVisible()
    await settle(page)

    const top = await measure(page, 'top')
    // Unscrolled, the layout is the prototype's: 8 px padding, 44 px row, 6 px gap, 1.5 px rule, 14 px gap, title.
    expect(top.row.top).toBeCloseTo(0, 0)
    expect(top.rule.top).toBeCloseTo(58, 0)
    expect(top.title.top).toBeCloseTo(73.5, 0)

    const bottom = await measure(page, 'bottom')
    expect(bottom.overflow, 'a long journal scrolls').toBeGreaterThan(200)
    expect(bottom.scrolled).toBeCloseTo(bottom.overflow, 0)
    // The row (its paper reaching down to the rule) and the rule stay exactly where they started.
    expect(bottom.row.top).toBeCloseTo(0, 0)
    expect(bottom.row.bottom).toBeCloseTo(58, 0)
    expect([bottom.row.left, bottom.row.width]).toEqual([0, bottom.viewWidth])
    expect(bottom.rule.top).toBeCloseTo(58, 0)
    expect(bottom.count.top).toBeCloseTo(top.count.top, 0)
    await expect(page.locator('[data-pin="journal"]').getByText(`${TASTINGS} tastings`)).toBeInViewport()
    expect(bottom.homeHit, 'ANOSMIA is what a tap hits').toBe(true)
    // The title scrolled away underneath; the dock, the page and the sides never moved.
    expect(bottom.title.bottom).toBeLessThanOrEqual(bottom.rule.top)
    expect(bottom.dockTop).toBe(top.dockTop)
    expect(bottom.sideScroll).toBe(0)
    expect(bottom.docScroll).toBe(0)
  })
}
