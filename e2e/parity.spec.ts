// Phase 1 regression guard: in demo mode the port must render exactly like the original export.
// Each checkpoint compares the serialised frame (DOM, inline styles, element boxes) of both.
import { expect, test, type Page } from '@playwright/test'
import { APP, REFERENCE } from '../playwright.config.ts'
import { installHarness } from './helpers.ts'

type Checkpoints = string[][][]

const SINGLE: Checkpoints = [
  [], [['click', 'Start tasting']], [['type', '#q', 'riesling']], [['click', 'Hollow Creek Riesling']], [['click', 'Start tasting']],
  [['click', 'Sweetness: A hint']], [['click', 'Acidity: Zingy']], [['click', 'Not noticed']], [['click', 'Body: Round']],
  [['click', '?Can’t tell']], [['click', 'Finish: Long']], [['click', 'All six. Review tasting']],
  [['click', 'Sweetness: A hint. Tap to change.']], [['click', 'Sweetness: Some']],
  [['type', '#notes', 'Bright and sharp'], ['click', 'Yes please']], [['click', 'Save to journal']],
  [['click', 'A/B sessions · 1']], [['click', 'Tastings · 7']],
]

const AB: Checkpoints = [
  // Blind is chosen before the pourer names the glasses (switching to blind clears names already shown).
  [['click', 'Two glasses?']], [['click', 'Someone else']], [['click', 'Glass A: Unnamed. Tap to name.']], [['click', 'Mallee & Sons Shiraz']],
  [['click', 'Glass B: Unnamed. Tap to name.']], [['click', 'Little Ferment Pinot Noir']], [['click', 'Start comparing']],
  [['click', 'AA']], [['click', '=About the same']], [['click', 'BB']], [['click', '?Can’t tell']], [['click', 'AA']], [['click', 'BB']],
  [['click', 'All six. Review']], [['click', 'Sweetness: A sweeter. Tap to change.']], [['click', '=About the same']],
  [['click', '+Both']], [['type', '#abnotes', 'B lighter']], [['click', 'Save comparison']],
  [['click', 'Show my earlier notes']], [['click', 'Show']], [['click', 'Journal']],
]

const JOURNAL: Checkpoints = [
  [['click', 'Journal']], [['click', 'Compare']], [['click', 'Two saved tastings']],
  [['click', 'Little Ferment Pinot Noir, tasted 14 Oct 2026']], [['click', 'Hollow Creek Riesling, tasted 3 Oct 2026']],
  [['click', 'CompareA vs B']], [['click', 'Swap sides']], [['click', 'Journal']],
  [['click', 'Penfolds Grange, tasted 12 Oct 2026']], [['click', 'Reveal what I noticed']], [['click', 'Taste it again, blind']],
  [['click', 'How to notice sweetness']], [['click', 'Got it. Back to the glass']], [['click', 'Next sensation']], [['click', 'Previous sensation']],
  [['click', 'Sweetness: Sweet']], [['click', 'Back to wine']], [['click', 'Snap the label']], [['click', 'Take photo']], [['click', 'Not quite']],
  [['click', 'Type it in']], [['type', '#mname', 'Cellar door red'], ['click', 'Red']], [['click', 'Use this']],
  [['click', 'Start tasting']], [['click', 'Review tasting']], [['click', 'Save to journal']], [['click', 'Journal']],
  [['click', 'Anosmia home']], [['click', 'Sample tasting']],
]

async function run(page: Page, url: string, checkpoints: Checkpoints) {
  await page.goto(url)
  await page.waitForFunction(() => {
    const f = document.querySelector('iframe')
    return !!(f ? f.contentDocument?.querySelector('.f-ui.grain') : document.querySelector('.f-ui.grain'))
  })
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  await page.evaluate(installHarness)
  return page.evaluate(cp => (window as unknown as { __parity: (c: Checkpoints) => Promise<string[]> }).__parity(cp), checkpoints)
}

for (const [name, checkpoints] of [['single-wine tasting', SINGLE], ['A/B comparison', AB], ['journal, compare, entry, camera, manual, sample', JOURNAL]] as const) {
  test(`demo mode matches the original export: ${name}`, async ({ browser }) => {
    test.setTimeout(120_000)
    const reference = await browser.newPage()
    const port = await browser.newPage()
    const expected = await run(reference, `${REFERENCE}/${encodeURIComponent('ANOSMIA — Wine beyond aroma.html')}`, checkpoints)
    const actual = await run(port, `${APP}/?demo`, checkpoints)
    expect(actual.length).toBe(checkpoints.length)
    actual.forEach((snap, i) => expect(snap, `checkpoint ${i}`).toBe(expected[i]))
  })
}
