// Correcting what the wine was on a saved tasting. Only identity (and, separately, the photo) can be
// edited. What the person experienced (the six observations, enjoyment, notes, date) is the original
// account of a longitudinal journal and is immutable: these tests enforce that in the UI and in storage.
import { chromium, expect, test, type Page } from '@playwright/test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { APP, DEV } from '../playwright.config.ts'
import { committed, draftOn, open, readStore, settle, tap } from './helpers.ts'

type Rec = Record<string, unknown>
const SAVE_FAILED = 'The changes couldn’t be saved. Your previous details are unchanged.'

async function jpeg(page: Page) {
  const base64 = await page.evaluate(() => {
    const c = document.createElement('canvas')
    c.width = 800
    c.height = 1000
    const g = c.getContext('2d')!
    g.fillStyle = '#7E1F35'
    g.fillRect(0, 0, 800, 1000)
    return c.toDataURL('image/jpeg', 0.9).split(',')[1]
  })
  return { name: 'label.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(base64, 'base64') }
}

async function begin(page: Page) {
  const again = page.getByRole('button', { name: 'New tasting' })
  if (await again.count()) await again.first().click()
  else await tap(page, 'Start tasting')
}

/**
 * Save a tasting with three different answer states (a level, not noticed, can't tell; the other three
 * stay unanswered), plus notes, a rating and optionally a photo, so the whole account can be compared.
 */
async function createTasting(page: Page, total: number, opts: { wine?: string; photo?: boolean; notes?: string } = {}) {
  await begin(page)
  if (opts.wine) {
    await page.locator('#q').fill(opts.wine)
    await tap(page, new RegExp(opts.wine))
  }
  if (opts.photo) {
    await tap(page, 'Snap the label')
    await page.getByTestId('label-photo-file').setInputFiles(await jpeg(page))
    await tap(page, 'Use photo')
  }
  await tap(page, /^(Start tasting|Taste without naming)/)
  await tap(page, 'Sweetness: Some')
  await settle(page)
  await tap(page, 'Not noticed')
  await settle(page)
  await tap(page, /Can’t tell/)
  await settle(page)
  await tap(page, 'Review tasting')
  await page.locator('#notes').fill(opts.notes ?? 'Crushed ants.')
  await tap(page, /Yes please/)
  await tap(page, /Save to journal/)
  await committed(page, 'tastings', total)
}

const card = (page: Page, name: RegExp) => page.getByRole('button', { name }).first()
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Edit wine details' })
const records = async (page: Page) => (await readStore(page, 'tastings')).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))) as Rec[]
const byId = (all: Rec[]) => Object.fromEntries(all.map(r => [r.id as string, r]))
/** The saved account plus photo: everything about a record except what the wine was. */
const withoutIdentity = (r: Rec) => ({ ...r, wine: undefined, title: undefined })
const wineOf = (r: Rec) => r.wine as Rec | null

async function openEntry(page: Page, name: RegExp) {
  await card(page, name).click()
  await expect(page.getByRole('button', { name: 'Edit wine details' })).toBeVisible()
}
async function openSheet(page: Page) {
  await tap(page, 'Edit wine details')
  await expect(dialog(page)).toBeVisible()
}
async function fill(page: Page, fields: Partial<Record<'Wine name' | 'Producer' | 'Variety' | 'Vintage', string>>) {
  for (const [label, value] of Object.entries(fields)) await dialog(page).getByLabel(label, { exact: true }).fill(value)
}
const save = (page: Page) => tap(page, 'Save changes')

test.use({ viewport: { width: 390, height: 844 } })

test('correcting a previously unidentified wine changes only the identity of that tasting', async ({ page }) => {
  await open(page)
  await createTasting(page, 1, { photo: true })
  const [before] = await records(page)
  expect(wineOf(before)).toBeNull()

  await openEntry(page, /^Unnamed wine, tasted/)
  await openSheet(page)
  for (const label of ['Wine name', 'Producer', 'Variety', 'Vintage']) await expect(dialog(page).getByLabel(label, { exact: true })).toHaveValue('')
  await fill(page, { 'Wine name': 'Penfolds Bin 389', Producer: 'Penfolds', Variety: 'Shiraz', Vintage: '2019' })
  await save(page)

  await expect(dialog(page)).toHaveCount(0)
  await expect(page.getByText('Wine details saved.')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Penfolds Bin 389' })).toBeVisible()
  await expect(page.getByText('Shiraz · 2019 · Added by you')).toBeVisible()
  await committed(page, 'tastings', 1)
  await expect.poll(async () => wineOf((await records(page))[0])?.name).toBe('Penfolds Bin 389')
  const [after] = await records(page)
  expect(wineOf(after)).toMatchObject({ name: 'Penfolds Bin 389', short: 'Penfolds Bin 389', producer: 'Penfolds', variety: 'Shiraz', vintage: '2019', source: 'manual' })
  expect(after.title).toBeNull()
  // The original account, the photo, the id and the date are exactly as saved.
  expect(withoutIdentity(after)).toEqual(withoutIdentity(before))
  expect(after.observations).toEqual({
    sweet: { state: 'level', level: 2 }, acid: { state: 'not_detected' }, tannin: { state: 'cant_tell' },
    body: { state: 'unanswered' }, warm: { state: 'unanswered' }, finish: { state: 'unanswered' },
  })
  expect(after.notes).toBe('Crushed ants.')
  expect(after.enjoyment).toBe(4)

  // The sensations still read the same on screen.
  await tap(page, 'Reveal what I noticed')
  for (const text of ['Some', 'Not noticed', 'Can’t tell']) await expect(page.getByText(text, { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Unanswered', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('“Crushed ants.”')).toBeVisible()
})

test('correcting an identified wine, including by kind, and leaving it alone when nothing changed', async ({ page }) => {
  await open(page)
  await createTasting(page, 1, { wine: 'Hollow Creek' })
  const [before] = await records(page)
  expect(wineOf(before)).toMatchObject({ id: 'hollow23', source: 'catalogue' })

  await openEntry(page, /^Hollow Creek Riesling, tasted/)
  await openSheet(page)
  // Prefilled with the wine's existing details.
  await expect(dialog(page).getByLabel('Wine name', { exact: true })).toHaveValue('Hollow Creek Riesling')
  await expect(dialog(page).getByLabel('Producer', { exact: true })).toHaveValue('Hollow Creek')
  await expect(dialog(page).getByLabel('Variety', { exact: true })).toHaveValue('Riesling')
  await expect(dialog(page).getByLabel('Vintage', { exact: true })).toHaveValue('2023')

  // Saving without changing anything closes the sheet and writes nothing.
  await save(page)
  await expect(dialog(page)).toHaveCount(0)
  await expect(page.getByText('Wine details saved.')).toHaveCount(0)
  expect(await records(page)).toEqual([before])

  // Correct the vintage, and pick a kind with the same chips as Type it in.
  await openSheet(page)
  await fill(page, { Vintage: '2022' })
  await dialog(page).getByRole('button', { name: 'White', exact: true }).click()
  await expect(dialog(page).getByRole('button', { name: 'White', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(dialog(page).getByLabel('Variety', { exact: true })).toHaveValue('White wine')
  await save(page)
  await expect(page.getByText('White wine · 2022 · Clare Valley, SA')).toBeVisible()
  await expect.poll(async () => wineOf((await records(page))[0])?.vintage).toBe('2022')
  const [after] = await records(page)
  // No longer the catalogue wine, so it is the user's own wine with a new id.
  expect(wineOf(after)).toMatchObject({ name: 'Hollow Creek Riesling', variety: 'White wine', vintage: '2022', source: 'manual' })
  expect(wineOf(after)!.id).not.toBe('hollow23')
  expect(withoutIdentity(after)).toEqual(withoutIdentity(before))
})

test('clearing every field leaves an unidentified tasting, which is still valid', async ({ page }) => {
  await open(page)
  await createTasting(page, 1, { wine: 'Saltbush' })
  const [before] = await records(page)
  await openEntry(page, /^Saltbush Grenache, tasted/)
  await openSheet(page)
  await fill(page, { 'Wine name': '', Producer: '', Variety: '', Vintage: '' })
  await save(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Unnamed wine' })).toBeVisible()
  await expect(page.getByText('Not identified. That’s allowed.')).toBeVisible()
  await expect.poll(async () => wineOf((await records(page))[0])).toBeNull()
  const [after] = await records(page)
  expect(after.title).toBe('Unnamed wine')
  expect(withoutIdentity(after)).toEqual(withoutIdentity(before))
  await tap(page, 'Journal')
  await expect(card(page, /^Unnamed wine, tasted/).getByText('Unidentified')).toBeVisible()
})

test('a producer or a kind alone is enough, with the same fallbacks as Type it in', async ({ page }) => {
  await open(page)
  await createTasting(page, 1)
  await openEntry(page, /^Unnamed wine, tasted/)
  await openSheet(page)
  await fill(page, { Producer: 'Penfolds' })
  await save(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Untitled bottle' })).toBeVisible()
  await expect.poll(async () => wineOf((await records(page))[0])?.producer).toBe('Penfolds')
})

test('cancelling leaves the saved tasting exactly as it was', async ({ page }) => {
  await open(page)
  await createTasting(page, 1, { wine: 'Saltbush' })
  const before = await records(page)
  await openEntry(page, /^Saltbush Grenache, tasted/)

  await openSheet(page)
  await fill(page, { 'Wine name': 'Something else', Vintage: '1999' })
  await tap(page, 'Cancel')
  await expect(dialog(page)).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1, name: 'Saltbush Grenache' })).toBeVisible()

  await openSheet(page) // reopening starts from the saved details, not from what was typed
  await expect(dialog(page).getByLabel('Wine name', { exact: true })).toHaveValue('Saltbush Grenache')
  await fill(page, { 'Wine name': 'Typed then dismissed' })
  await page.getByRole('button', { name: 'Close' }).click({ position: { x: 20, y: 20 } }) // the backdrop
  await expect(dialog(page)).toHaveCount(0)

  await openSheet(page)
  await fill(page, { Producer: 'Another' })
  await page.keyboard.press('Escape')
  await expect(dialog(page)).toHaveCount(0)

  await page.waitForTimeout(400)
  expect(await records(page)).toEqual(before)
  await page.reload()
  expect(await records(page)).toEqual(before)
})

test('a correction survives reloading and closing and reopening the browser', async () => {
  const profile = mkdtempSync(join(tmpdir(), 'anosmia-wine-profile-'))
  try {
    let context = await chromium.launchPersistentContext(profile, { baseURL: APP, viewport: { width: 390, height: 844 } })
    let page = context.pages()[0] ?? (await context.newPage())
    await open(page)
    await createTasting(page, 1)
    const [before] = await records(page)
    await openEntry(page, /^Unnamed wine, tasted/)
    await openSheet(page)
    await fill(page, { 'Wine name': 'Corrected name', Vintage: '2020' })
    await save(page)
    await expect.poll(async () => wineOf((await records(page))[0])?.name).toBe('Corrected name')

    await page.reload() // resumes on this tasting
    await expect(page.getByRole('heading', { level: 1, name: 'Corrected name' })).toBeVisible()
    await tap(page, 'Journal')
    await expect(card(page, /^Corrected name, tasted/)).toBeVisible()
    await draftOn(page, 'journal') // let the "now on the journal" draft reach the device before the browser closes
    await context.close()

    context = await chromium.launchPersistentContext(profile, { baseURL: APP, viewport: { width: 390, height: 844 } })
    page = context.pages()[0] ?? (await context.newPage())
    await open(page)
    await expect(card(page, /^Corrected name, tasted/)).toBeVisible()
    const [after] = await records(page)
    expect(wineOf(after)).toMatchObject({ name: 'Corrected name', vintage: '2020' })
    expect(withoutIdentity(after)).toEqual(withoutIdentity(before))
    await context.close()
  } finally {
    rmSync(profile, { recursive: true, force: true })
  }
})

test.describe('when the correction cannot be stored', () => {
  test('the previous details are kept, the sheet says so, and a retry works', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __failTastings?: boolean }
      const put = IDBObjectStore.prototype.put
      IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
        const req = put.apply(this, args)
        if (w.__failTastings && this.name === 'tastings') this.transaction.abort()
        return req
      }
    })
    const failing = (on: boolean) => page.evaluate(v => { (window as unknown as { __failTastings: boolean }).__failTastings = v }, on)
    await open(page)
    await createTasting(page, 1, { wine: 'Saltbush' })
    const before = await records(page)
    await openEntry(page, /^Saltbush Grenache, tasted/)
    await openSheet(page)
    await fill(page, { 'Wine name': 'Corrected name' })
    await failing(true)
    await save(page)

    await expect(page.getByRole('alert')).toHaveText(SAVE_FAILED)
    expect(await records(page)).toEqual(before)
    await expect(page.getByRole('heading', { level: 1, name: 'Saltbush Grenache' })).toBeVisible() // the tasting behind the sheet
    await expect(dialog(page).getByLabel('Wine name', { exact: true })).toHaveValue('Corrected name') // what was typed is kept

    await failing(false)
    await save(page)
    await expect(dialog(page)).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1, name: 'Corrected name' })).toBeVisible()
    await expect.poll(async () => wineOf((await records(page))[0])?.name).toBe('Corrected name')
    const [after] = await records(page)
    expect(withoutIdentity(after)).toEqual(withoutIdentity(before[0]))
  })
})

test('correcting one tasting leaves every other tasting untouched, including a repeat that shared the wine', async ({ page }) => {
  await open(page)
  await createTasting(page, 1, { wine: 'Hollow Creek', photo: true })
  // "Taste it again" makes a new, separately dated tasting that starts from the same wine and photo.
  await card(page, /^Hollow Creek Riesling, tasted/).click()
  await tap(page, 'Taste it again, blind')
  await tap(page, 'Sweetness: Very sweet')
  await settle(page)
  await tap(page, 'Review tasting')
  await tap(page, /Save to journal/)
  await committed(page, 'tastings', 2)
  await tap(page, 'Journal')
  await createTasting(page, 3, { wine: 'Saltbush', notes: 'Salty air.' })
  const before = await records(page)
  const [older, repeat, other] = before
  expect(wineOf(repeat)!.id).toBe(wineOf(older)!.id) // they share one wine
  expect(repeat.createdAt).not.toBe(older.createdAt)

  await page.getByRole('button', { name: /^Hollow Creek Riesling, tasted/ }).last().click() // the older one (newest first)
  await openSheet(page)
  await fill(page, { 'Wine name': 'Hollow Creek Riesling (corrected)', Vintage: '2021' })
  await save(page)
  await expect.poll(async () => byId(await records(page))[older.id as string] && wineOf(byId(await records(page))[older.id as string])?.vintage).toBe('2021')

  const after = byId(await records(page))
  expect(withoutIdentity(after[older.id as string])).toEqual(withoutIdentity(older))
  expect(after[repeat.id as string]).toEqual(repeat) // the repeat keeps its own record, wine included
  expect(after[other.id as string]).toEqual(other)
  expect(after[repeat.id as string].observations).not.toEqual(after[older.id as string].observations) // fresh observations, kept apart
})

test('journal cards and the comparison selection show the corrected wine straight away', async ({ page }) => {
  await open(page)
  await createTasting(page, 1)
  await createTasting(page, 2, { wine: 'Saltbush' })
  await card(page, /^Unnamed wine, tasted/).click()
  await openSheet(page)
  await fill(page, { 'Wine name': 'Dad’s cellar red', Variety: 'Shiraz', Vintage: '2018' })
  await save(page)
  await expect(page.getByRole('heading', { level: 1, name: 'Dad’s cellar red' })).toBeVisible()
  await tap(page, 'Journal')
  await expect(card(page, /^Dad’s cellar red, tasted/)).toBeVisible()
  await expect(card(page, /^Dad’s cellar red, tasted/).getByText('Shiraz · 2018')).toBeVisible()
  await expect(page.getByRole('button', { name: /^Unnamed wine, tasted/ })).toHaveCount(0)

  await tap(page, 'Compare')
  await page.getByRole('button', { name: /^Two saved tastings/ }).click()
  await expect(card(page, /^Dad’s cellar red, tasted/)).toBeVisible()
  await expect(card(page, /^Saltbush Grenache, tasted/)).toBeVisible()
  await card(page, /^Dad’s cellar red, tasted/).click()
  await card(page, /^Saltbush Grenache, tasted/).click()
  await page.getByRole('button', { name: /^Compare\s*A vs B/ }).click()
  await expect(page.getByText('Dad’s cellar red').first()).toBeVisible()
})

test('with a keyboard-sized screen the fields scroll and the buttons stay in view', async ({ page }) => {
  await open(page)
  await createTasting(page, 1, { wine: 'Saltbush' })
  await openEntry(page, /^Saltbush Grenache, tasted/)
  await openSheet(page)
  const vintage = dialog(page).getByLabel('Vintage', { exact: true })
  await vintage.focus()
  await page.setViewportSize({ width: 390, height: 460 }) // Android shrinks the page when the keyboard opens
  await page.waitForTimeout(600)
  const frame = (await page.locator('.f-ui.grain').boundingBox())!
  const footer = (await page.getByRole('button', { name: 'Save changes' }).boundingBox())!
  const field = (await vintage.boundingBox())!
  expect(footer.y + footer.height).toBeLessThanOrEqual(frame.y + frame.height) // Save changes is on screen
  expect((await page.getByRole('button', { name: 'Cancel' }).boundingBox())!.y).toBeGreaterThan(footer.y)
  expect(field.y).toBeGreaterThanOrEqual(frame.y) // the field being typed in is visible, above the buttons
  expect(field.y + field.height).toBeLessThanOrEqual(footer.y)
  // The fields keep their full, thumb-sized height; a height-limited sheet must not squash them.
  for (const label of ['Wine name', 'Producer', 'Variety', 'Vintage']) {
    expect((await dialog(page).getByLabel(label, { exact: true }).boundingBox())!.height, label).toBeGreaterThanOrEqual(48)
  }
  for (const kind of ['Red', 'Sweet']) {
    expect((await dialog(page).getByRole('button', { name: kind, exact: true }).boundingBox())!.height, kind).toBeGreaterThanOrEqual(44)
  }
})

test('records saved by earlier versions are corrected without a migration', async ({ page }) => {
  await open(page)
  // Shapes written before photos and edits existed: a catalogue wine with the simulated photo flag,
  // and an unidentified tasting. Both are schema 1.
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(r => { const q = indexedDB.open('anosmia'); q.onsuccess = () => r(q.result) })
    const obs = { sweet: { state: 'level', level: 3 }, acid: { state: 'cant_tell' }, tannin: { state: 'not_detected' }, body: { state: 'unanswered' }, warm: { state: 'unanswered' }, finish: { state: 'unanswered' } }
    const wine = { id: 'grange16', name: 'Penfolds Grange', short: 'Grange', producer: 'Penfolds', variety: 'Shiraz', vintage: '2016', region: 'South Australia', source: 'catalogue' }
    const tx = db.transaction('tastings', 'readwrite')
    tx.objectStore('tastings').put({ schema: 1, id: 'old1', createdAt: '2026-10-20T10:00:00.000Z', wine, title: null, photo: { kind: 'simulated' }, observations: obs, notes: 'Old notes', enjoyment: 3, origin: 'user' })
    tx.objectStore('tastings').put({ schema: 1, id: 'old2', createdAt: '2026-10-19T10:00:00.000Z', wine: null, title: 'Unnamed wine', photo: { kind: 'none' }, observations: obs, notes: '', enjoyment: null, origin: 'user' })
    await new Promise<void>(r => { tx.oncomplete = () => r() })
    db.close()
  })
  await page.reload()
  const before = byId(await records(page))

  await tap(page, 'The journal')
  await openEntry(page, /^Penfolds Grange, tasted/)
  await openSheet(page)
  await fill(page, { Vintage: '2015' })
  await save(page)
  await tap(page, 'Journal')
  await openEntry(page, /^Unnamed wine, tasted/)
  await openSheet(page)
  await fill(page, { 'Wine name': 'Now named' })
  await save(page)
  await expect.poll(async () => wineOf(byId(await records(page)).old2)?.name).toBe('Now named')

  const after = byId(await records(page))
  expect(after.old1.schema).toBe(1)
  expect(wineOf(after.old1)).toMatchObject({ name: 'Penfolds Grange', vintage: '2015', source: 'manual' })
  for (const id of ['old1', 'old2']) expect(withoutIdentity(after[id]), id).toEqual(withoutIdentity(before[id]))
  expect(after.old1.photo).toEqual({ kind: 'simulated' }) // a photo flag from the old camera is kept as it was
  expect(await page.evaluate(async () => (await indexedDB.databases()).find(d => d.name === 'anosmia')?.version)).toBe(1)
})

test('a saved tasting offers no way to rewrite what the person experienced', async ({ page }) => {
  await open(page)
  await createTasting(page, 1, { wine: 'Saltbush' })
  await createTasting(page, 2, { notes: 'Second' })

  const controls = async () => page.locator('.f-ui.grain').evaluate(root => ({
    fields: root.querySelectorAll('input, textarea, select, [contenteditable="true"]').length,
    buttons: [...root.querySelectorAll('button')].map(b => (b.getAttribute('aria-label') || b.textContent || '').trim()),
  }))
  const rewriting = /edit.*(words|notes|rating|enjoy|sensation|date)|add.*(words|notes)|change.*(rating|date)/i

  // The saved tasting: only the wine details and the photo can be edited.
  await card(page, /^Saltbush Grenache, tasted/).click()
  let seen = await controls()
  expect(seen.fields).toBe(0)
  expect(seen.buttons.filter(b => /edit|change|add/i.test(b)).sort()).toEqual(['Add photo', 'Edit wine details'])
  // The notes and rating are shown but read-only; so are the sensations once revealed.
  await tap(page, 'Reveal what I noticed')
  seen = await controls()
  expect(seen.fields).toBe(0)
  expect(seen.buttons.filter(b => rewriting.test(b))).toEqual([])
  expect(seen.buttons.filter(b => /^(Sweetness|Acidity|Tannin|Body|Alcohol warmth|Finish)/.test(b))).toEqual([])

  // Nor does the journal or the comparison selection.
  await tap(page, 'Journal')
  expect((await controls()).fields).toBe(0)
  expect((await controls()).buttons.filter(b => rewriting.test(b))).toEqual([])
  await tap(page, 'Compare')
  await page.getByRole('button', { name: /^Two saved tastings/ }).click()
  expect((await controls()).buttons.filter(b => rewriting.test(b))).toEqual([])

  // The wine-details sheet itself has identity fields only.
  await tap(page, 'Cancel')
  await card(page, /^Saltbush Grenache, tasted/).click()
  await openSheet(page)
  const labels = await dialog(page).locator('input, textarea').evaluateAll(els => els.map(el => (el as HTMLInputElement).id))
  expect(labels).toEqual(['edit-name', 'edit-producer', 'edit-variety', 'edit-vintage'])
  await expect(dialog(page).getByText('your sensations, notes, rating and date stay exactly as you recorded them')).toBeVisible()
})

test('the storage layer itself refuses to rewrite a saved tasting’s original account', async ({ page }) => {
  await page.goto(`${DEV}/?demo`)
  const result = await page.evaluate(async () => {
    interface Logic {
      state: Record<string, unknown> & { journal: Record<string, unknown>[] | null; toast: string }
      setState(patch: Record<string, unknown>): void
      save(): void
      subscribe(fn: () => void): () => void
    }
    const logicModule = (await import(/* @vite-ignore */ '/src/anosmia/AnosmiaLogic.ts' as string)) as { AnosmiaLogic: new (props: unknown) => Logic }
    const persistenceModule = (await import(/* @vite-ignore */ '/src/data/persistence.ts' as string)) as {
      startPersistence(name: string): Promise<{ initial: Record<string, unknown>; photos: unknown; attach(logic: Logic): () => void }>
    }
    const name = 'anosmia-history-guard-test'
    indexedDB.deleteDatabase(name)
    const persistence = await persistenceModule.startPersistence(name)
    const logic = new logicModule.AnosmiaLogic({ photos: persistence.photos })
    logic.state = { ...logic.state, ...persistence.initial }
    persistence.attach(logic)

    const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
    const read = async () => {
      const db = await new Promise<IDBDatabase>(r => { const q = indexedDB.open(name); q.onsuccess = () => r(q.result) })
      const all = await new Promise<Record<string, unknown>[]>(r => { const q = db.transaction('tastings').objectStore('tastings').getAll(); q.onsuccess = () => r(q.result) })
      db.close()
      return all
    }
    // Save a tasting the normal way.
    logic.setState({ screen: 'summary', notes: 'Original notes', enjoy: 4, obs: { sweet: 2, acid: 'none', tannin: 'unsure', body: null, warm: null, finish: null } })
    logic.save()
    await wait(400)
    const saved = (await read())[0]

    // A change to the original account is refused: nothing is written, and the user is told.
    logic.setState({ journal: logic.state.journal!.map(e => ({ ...e, notes: 'Rewritten', enjoy: 1, obs: { ...(e.obs as object), sweet: 4 } })) })
    await wait(400)
    const afterRewrite = (await read())[0]
    const refusalToast = logic.state.toast

    // The same tasting is still correctable: an identity change is written.
    logic.setState({ journal: logic.state.journal!.map(e => ({ ...e, notes: 'Original notes', enjoy: 4, obs: { sweet: 2, acid: 'none', tannin: 'unsure', body: null, warm: null, finish: null }, wine: { id: 'm1', name: 'Corrected', short: 'Corrected', producer: 'Corrected', variety: '', vintage: '', region: 'Added by you', custom: true }, title: null })) })
    await wait(400)
    const afterIdentity = (await read())[0]
    indexedDB.deleteDatabase(name)
    return { saved, afterRewrite, refusalToast, afterIdentity }
  })
  expect(result.afterRewrite).toEqual(result.saved) // the original account is untouched on the device
  expect(result.refusalToast).toBe('A saved tasting’s original account can’t be changed. Taste it again to record a new one.')
  expect(result.saved.notes).toBe('Original notes')
  expect((result.afterIdentity.wine as Rec).name).toBe('Corrected')
  expect({ ...result.afterIdentity, wine: undefined, title: undefined }).toEqual({ ...result.saved, wine: undefined, title: undefined })
})
