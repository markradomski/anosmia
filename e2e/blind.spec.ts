// Blind-mode integrity: before a blind comparison is saved, nothing exposed to the taster (visible
// text, accessible names, field values, selection state, photos) may identify which wine is in which
// glass; and a comparison is only labelled blind when the taster hasn't seen the assignment.
import { expect, test, type Page } from '@playwright/test'
import { closeSheet, committed, draftOn, open, readStore, settle, tap } from './helpers.ts'

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

/** A naming sheet that marks the hidden wine as selected would reveal it. */
const selectedInSheet = (page: Page) => page.locator('section[role="dialog"] button[aria-pressed="true"]')

async function blindSetup(page: Page) {
  await open(page)
  await tap(page, 'Two glasses?')
  await tap(page, /Someone else/)
  await tap(page, 'Glass A: Unnamed. Tap to name.')
  await tap(page, /Mallee & Sons Shiraz/)
  await tap(page, 'Glass B: Unnamed. Tap to name.')
  await tap(page, /Little Ferment Pinot Noir/)
}

test('the complete blind journey keeps identities hidden until the comparison is saved', async ({ page }) => {
  await blindSetup(page)
  expect(await exposed(page), 'setup').toEqual([])

  // Reopening a named glass on setup shows no selection.
  await tap(page, /^Glass A: Named · hidden/)
  await expect(page.getByText(/Pourer only/)).toBeVisible()
  await expect(selectedInSheet(page)).toHaveCount(0)
  await closeSheet(page)

  await tap(page, /Start comparing/)
  expect(await exposed(page), 'record').toEqual([])
  await tap(page, /^A sweeter/)
  await settle(page)
  await tap(page, 'Back to setup')
  expect(await exposed(page), 'back to setup').toEqual([])
  await tap(page, /Start comparing/)

  // Reopening an unfinished comparison.
  await draftOn(page, 'abRecord')
  await page.reload()
  await expect(page.getByText('1 of 6 answered')).toBeVisible()
  expect(await exposed(page), 'reopened').toEqual([])

  await tap(page, 'Review comparison')
  expect(await exposed(page), 'review').toEqual([])
  await expect(page.getByText('Blind · names hidden')).toBeVisible()

  // Editing an answer from review.
  await tap(page, /^Sweetness: A sweeter\. Tap to change\./)
  expect(await exposed(page), 'editing an answer').toEqual([])
  await tap(page, /About the same/)
  await settle(page)

  // "Change" on the review screen opens the naming sheet without revealing the selection.
  await page.getByRole('button', { name: 'Change' }).first().click()
  await expect(page.getByText(/Pourer only/)).toBeVisible()
  await expect(selectedInSheet(page)).toHaveCount(0)
  await closeSheet(page)
  expect(await exposed(page), 'after the naming sheet').toEqual([])

  await tap(page, /Save comparison/)
  await committed(page, 'sessions', 1)
  await expect(page.getByText('A/B session · blind (someone else poured)')).toBeVisible()
  expect(await exposed(page)).toEqual(expect.arrayContaining(['Mallee', 'Little Ferment']))
})

test('switching to blind after names were shown clears them, so the label stays honest', async ({ page }) => {
  await open(page)
  await tap(page, 'Two glasses?')
  await tap(page, 'Glass A: Unnamed. Tap to name.')
  await tap(page, /Mallee & Sons Shiraz/)
  await expect(page.getByText('Mallee & Sons Shiraz 2021')).toBeVisible()
  await tap(page, /Someone else/)
  await expect(page.getByText('Names cleared. Whoever poured can name the glasses.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Glass A: Unnamed. Tap to name.' })).toBeVisible()
  expect(await exposed(page)).toEqual([])
})

test('repeating a revealed blind pair starts as an open comparison', async ({ page }) => {
  await blindSetup(page)
  await tap(page, /Start comparing/)
  await tap(page, 'Review comparison')
  await tap(page, /Save comparison/)
  await committed(page, 'sessions', 1)

  await tap(page, /Repeat this pair/)
  await expect(page.getByRole('button', { name: /I did/ })).toHaveAttribute('aria-pressed', 'true')
  await tap(page, /Start comparing/)
  await tap(page, 'Review comparison')
  await expect(page.getByText('Blind · names hidden')).toHaveCount(0)
  await tap(page, /Save comparison/)
  await committed(page, 'sessions', 2)
  const modes = (await readStore(page, 'sessions')).map(s => s.mode).sort()
  expect(modes).toEqual(['blind', 'open'])
})

test('an open comparison is labelled open, not blind', async ({ page }) => {
  await open(page)
  await tap(page, 'Two glasses?')
  await tap(page, /Start comparing/)
  await tap(page, 'Review comparison')
  await expect(page.getByText('Blind · names hidden')).toHaveCount(0)
  await tap(page, /Save comparison/)
  await expect(page.getByText('A/B session · open (you knew which was which)')).toBeVisible()
})
