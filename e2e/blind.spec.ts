// Blind-mode audit: before a blind comparison is saved, nothing on screen (visible text, accessible
// names or field values) may identify which wine is in which glass.
// Known leaks are marked test.fail(): they document current behaviour and will start "failing"
// (i.e. pass their assertion) once fixed, so the annotation must then be removed.
import { expect, test, type Page } from '@playwright/test'
import { committed, open, settle, tap } from './helpers.ts'

const IDENTIFYING = ['Mallee', 'Little Ferment', 'Shiraz', 'Pinot', 'Barossa', 'Adelaide Hills']

/** Every identifying string currently exposed to a sighted or screen-reader user. */
async function exposed(page: Page) {
  const surface = await page.locator('.f-ui.grain').evaluate(root => {
    const parts = [(root as HTMLElement).innerText]
    root.querySelectorAll('[aria-label]').forEach(el => parts.push(el.getAttribute('aria-label') ?? ''))
    root.querySelectorAll('input, textarea').forEach(el => parts.push((el as HTMLInputElement).value))
    return parts.join('\n')
  })
  return IDENTIFYING.filter(word => surface.includes(word))
}

async function blindSetup(page: Page) {
  await open(page)
  await tap(page, 'Two glasses?')
  await tap(page, /Someone else/)
  await tap(page, 'Glass A: Unnamed. Tap to name.')
  await tap(page, /Mallee & Sons Shiraz/)
  await tap(page, 'Glass B: Unnamed. Tap to name.')
  await tap(page, /Little Ferment Pinot Noir/)
}

test('blind: names stay hidden through setup, recording, navigation and review', async ({ page }) => {
  await blindSetup(page)
  expect(await exposed(page), 'setup').toEqual([])
  await tap(page, /Start comparing/)
  expect(await exposed(page), 'record').toEqual([])
  await tap(page, /^A sweeter/)
  await settle(page)
  await tap(page, 'Back to setup')
  expect(await exposed(page), 'back to setup').toEqual([])
  await tap(page, /Start comparing/)
  await tap(page, 'Review comparison')
  expect(await exposed(page), 'review').toEqual([])
  await tap(page, /^Sweetness: A sweeter\. Tap to change\./)
  expect(await exposed(page), 'editing an answer from review').toEqual([])
})

test('blind: names stay hidden after reopening an unfinished comparison', async ({ page }) => {
  await blindSetup(page)
  await tap(page, /Start comparing/)
  await tap(page, /^A sweeter/)
  await settle(page)
  await page.reload()
  await expect(page.getByText('1 of 6 answered')).toBeVisible()
  expect(await exposed(page), 'reopened record').toEqual([])
  await tap(page, 'Back to setup')
  await tap(page, 'Back')
  await tap(page, 'The journal')
  await expect(page.getByRole('button', { name: /Unfinished A vs B/ })).toBeVisible()
  expect(await exposed(page), 'journal resume banner').toEqual([])
})

test('blind: names are revealed only once the comparison is saved, and the session is labelled blind', async ({ page }) => {
  await blindSetup(page)
  await tap(page, /Start comparing/)
  await tap(page, 'Review comparison')
  expect(await exposed(page)).toEqual([])
  await tap(page, /Save comparison/)
  await committed(page, 'sessions', 1)
  await expect(page.getByText('A/B session · blind (someone else poured)')).toBeVisible()
  expect(await exposed(page)).toEqual(expect.arrayContaining(['Mallee', 'Little Ferment']))
})

test('open: an open comparison is labelled open, not blind', async ({ page }) => {
  await open(page)
  await tap(page, 'Two glasses?')
  await tap(page, /Start comparing/)
  await tap(page, 'Review comparison')
  await expect(page.getByText('Blind · names hidden')).toHaveCount(0)
  await tap(page, /Save comparison/)
  await expect(page.getByText('A/B session · open (you knew which was which)')).toBeVisible()
})

test('KNOWN LEAK: “Change” on the blind review screen shows which wine is in the glass', async ({ page }) => {
  test.fail(true, 'The naming sheet highlights the hidden wine as “Selected” (aria-pressed) before the reveal.')
  await blindSetup(page)
  await tap(page, /Start comparing/)
  await tap(page, 'Review comparison')
  await page.getByRole('button', { name: 'Change' }).first().click()
  // The sheet lists every catalogue wine, so mere presence of a name is not a leak; the selection is.
  const selected = page.locator('section[role="dialog"] button[aria-pressed="true"]')
  await expect(selected).toHaveCount(0)
})

test('KNOWN LEAK: re-opening a glass on the blind setup screen shows its wine to the taster', async ({ page }) => {
  test.fail(true, 'The sheet warns “Pourer only”, but after the pourer has named a glass anyone can reopen it and see the selection.')
  await blindSetup(page)
  await tap(page, /^Glass A: Named · hidden/)
  await expect(page.locator('section[role="dialog"] button[aria-pressed="true"]')).toHaveCount(0)
})
