import { chromium, expect, test } from '@playwright/test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { APP } from '../playwright.config.ts'
import { committed, databaseNames, dockSensation, open, readStore, settle, tap } from './helpers.ts'

test('a new install starts with an empty real journal', async ({ page }) => {
  await open(page)
  await tap(page, 'The journal')
  await expect(page.getByRole('tab', { name: 'Tastings · 0' })).toBeVisible()
  await expect(page.getByRole('tab', { name: 'A/B sessions · 0' })).toBeVisible()
  await expect(page.getByText('Sample entries and ratings are illustrative.')).toHaveCount(0)
})

test('a saved tasting keeps every answer state across reloads', async ({ page }) => {
  await open(page)
  await tap(page, 'Start tasting')
  await tap(page, /Taste without naming/)
  await tap(page, 'Sweetness: Some')
  await settle(page)
  await expect(dockSensation(page)).toHaveText('Acidity')
  await tap(page, 'Not noticed')
  await settle(page)
  await expect(dockSensation(page)).toHaveText('Tannin')
  await tap(page, /Can’t tell/)
  await settle(page)
  await tap(page, 'Review tasting')
  await page.locator('#notes').fill('Crushed ants.')
  await tap(page, /Yes please/)
  await tap(page, /Save to journal/)
  await expect(page.getByRole('tab', { name: 'Tastings · 1' })).toBeVisible()
  test.info().annotations.push({ type: 'commit ms', description: String(await committed(page, 'tastings', 1)) })

  await page.reload()
  await expect(page.getByRole('tab', { name: 'Tastings · 1' })).toBeVisible()
  const [record] = await readStore(page, 'tastings')
  expect(record).toMatchObject({
    schema: 1, wine: null, title: 'Unnamed wine', notes: 'Crushed ants.', enjoyment: 4, origin: 'user',
    photo: { kind: 'none' },
    observations: {
      sweet: { state: 'level', level: 2 }, acid: { state: 'not_detected' }, tannin: { state: 'cant_tell' },
      body: { state: 'unanswered' }, warm: { state: 'unanswered' }, finish: { state: 'unanswered' },
    },
  })

  // The journal entry (blind by default) shows the same states after the reload.
  await tap(page, /^Unnamed wine, tasted/)
  await tap(page, 'Reveal what I noticed')
  const rows = page.locator('.f-ui.grain')
  for (const text of ['Some', 'Not noticed', 'Can’t tell', 'Unanswered', '“Crushed ants.”', 'Yes please']) {
    await expect(rows.getByText(text, { exact: true }).first()).toBeVisible()
  }
})

test('an interrupted tasting resumes where it was left', async ({ page }) => {
  await open(page)
  await tap(page, 'Start tasting')
  await tap(page, /Taste without naming/)
  await tap(page, 'Sweetness: Sweet')
  await settle(page)
  await tap(page, 'Acidity: Zingy')
  await settle(page)
  await expect(page.getByText('2 of 6 answered')).toBeVisible()

  await page.reload()
  await expect(page.getByText('2 of 6 answered')).toBeVisible()
  await expect(dockSensation(page)).toHaveText('Tannin')
  await expect(page.getByRole('button', { name: /^Sweetness: Sweet\./ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Acidity: Zingy\./ })).toBeVisible()
  // Nothing advanced or got answered just because time passed during the reload.
  await page.waitForTimeout(800)
  await expect(dockSensation(page)).toHaveText('Tannin')
  expect(await readStore(page, 'tastings')).toHaveLength(0)
})

test('an A/B comparison resumes mid-way and saves as a blind session', async ({ page }) => {
  await open(page)
  await tap(page, 'Two glasses?')
  await tap(page, 'Glass A: Unnamed. Tap to name.')
  await tap(page, /Mallee & Sons Shiraz/)
  await tap(page, 'Glass B: Unnamed. Tap to name.')
  await tap(page, /Little Ferment Pinot Noir/)
  await tap(page, /Someone else/)
  await tap(page, /Start comparing/)
  await tap(page, /^A sweeter/)
  await settle(page)
  await tap(page, /About the same/)
  await settle(page)

  await page.reload()
  await expect(page.getByText('2 of 6 answered')).toBeVisible()
  await expect(page.getByText('Named · hidden').first()).toBeVisible()
  await tap(page, /^B drier/)
  await settle(page)
  await tap(page, 'Review comparison')
  await tap(page, /Save comparison/)
  test.info().annotations.push({ type: 'commit ms', description: String(await committed(page, 'sessions', 1)) })

  await page.reload()
  const [session] = await readStore(page, 'sessions')
  expect(session).toMatchObject({
    schema: 1, mode: 'blind', preference: null,
    answers: { sweet: 'A', acid: 'same', tannin: 'B', body: 'unanswered', warm: 'unanswered', finish: 'unanswered' },
  })
  expect((session.a as { wine: { id: string } }).wine.id).toBe('mallee21')
  expect((session.b as { wine: { id: string } }).wine.id).toBe('little22')
  await expect(page.getByText('A/B session · blind (someone else poured)')).toBeVisible()
})

test('records survive closing and reopening the browser', async () => {
  const profile = mkdtempSync(join(tmpdir(), 'anosmia-profile-'))
  try {
    let context = await chromium.launchPersistentContext(profile, { baseURL: APP })
    let page = context.pages()[0] ?? (await context.newPage())
    await open(page)
    await tap(page, 'Start tasting')
    await tap(page, /Taste without naming/)
    await tap(page, 'Sweetness: Very sweet')
    await settle(page)
    await tap(page, 'Review tasting')
    await tap(page, /Save to journal/)
    await expect(page.getByRole('tab', { name: 'Tastings · 1' })).toBeVisible()
    await committed(page, 'tastings', 1)
    await context.close()

    context = await chromium.launchPersistentContext(profile, { baseURL: APP })
    page = context.pages()[0] ?? (await context.newPage())
    await open(page)
    await expect(page.getByRole('tab', { name: 'Tastings · 1' })).toBeVisible()
    const [record] = await readStore(page, 'tastings')
    expect(record).toMatchObject({ observations: { sweet: { state: 'level', level: 4 }, acid: { state: 'unanswered' } } })
    await context.close()
  } finally {
    rmSync(profile, { recursive: true, force: true })
  }
})

test('a record that cannot be read is reported and left untouched', async ({ page }) => {
  await open(page)
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(r => {
      const req = indexedDB.open('anosmia')
      req.onsuccess = () => r(req.result)
    })
    const tx = db.transaction('tastings', 'readwrite')
    tx.objectStore('tastings').put({ schema: 1, id: 'broken', createdAt: '2026-10-01T00:00:00.000Z', observations: { sweet: { state: 'level', level: 9 } } })
    await new Promise<void>(resolve => { tx.oncomplete = () => resolve() })
    db.close()
  })
  await page.reload()
  await expect(page.getByText('1 saved record couldn’t be read and is hidden.')).toBeVisible()
  await tap(page, 'The journal')
  await expect(page.getByRole('tab', { name: 'Tastings · 0' })).toBeVisible()
  expect((await readStore(page, 'tastings')).map(r => r.id)).toEqual(['broken'])
})

test('demo mode shows the identified sample data and saves nothing', async ({ page }) => {
  await open(page, '/?demo')
  await tap(page, 'The journal')
  await expect(page.getByRole('tab', { name: 'Tastings · 6' })).toBeVisible()
  await expect(page.getByText('Sample entries and ratings are illustrative.')).toBeVisible()
  await tap(page, 'Anosmia home')
  await tap(page, 'Start tasting')
  await tap(page, /Taste without naming/)
  await tap(page, 'Review tasting')
  await tap(page, /Save to journal/)
  await expect(page.getByRole('tab', { name: 'Tastings · 7' })).toBeVisible()
  await page.waitForTimeout(500)
  expect(await databaseNames(page)).not.toContain('anosmia')

  await open(page, '/')
  await tap(page, 'The journal')
  await expect(page.getByRole('tab', { name: 'Tastings · 0' })).toBeVisible()
})
