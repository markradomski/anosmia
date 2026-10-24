// Label photos must actually be visible wherever a tasting appears (regression: on the Nothing Phone the
// journal cards showed empty frames because the photo layer, an inline <span>, collapsed to zero size).
// "Visible" here means the element carrying the photo has a real rendered size, not just a style.
import { chromium, expect, test, type Page } from '@playwright/test'
import { APP } from '../playwright.config.ts'
import { committed, open, readStore, tap } from './helpers.ts'

const FAKE_CAMERA = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']

async function withCamera(run: (page: Page) => Promise<void>) {
  const browser = await chromium.launch({ args: FAKE_CAMERA })
  try {
    const context = await browser.newContext({ baseURL: APP, viewport: { width: 390, height: 844 }, permissions: ['camera'] })
    await run(await context.newPage())
  } finally {
    await browser.close()
  }
}

/** Sizes of every element currently showing a stored photo. */
const photoLayers = (page: Page) => page.locator('.f-ui.grain').evaluate(root =>
  [...root.querySelectorAll<HTMLElement>('span, div')]
    .filter(el => getComputedStyle(el).backgroundImage.startsWith('url("blob:'))
    .map(el => { const r = el.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)] }))

/** Byte sizes of the photos shown on screen, in document order, read back from their object URLs. */
const shownPhotoSizes = (page: Page) => page.locator('.f-ui.grain').evaluate(root => Promise.all(
  [...root.querySelectorAll<HTMLElement>('span, div')]
    .map(el => getComputedStyle(el).backgroundImage)
    .filter(bg => bg.startsWith('url("blob:'))
    .map(async bg => (await (await fetch(bg.slice(5, -2))).blob()).size)))

/** Byte size of each saved tasting's stored photo (null when it has none), newest first like the journal. */
const storedPhotoSizes = (page: Page) => page.evaluate(async () => {
  const db = await new Promise<IDBDatabase>(r => { const q = indexedDB.open('anosmia'); q.onsuccess = () => r(q.result) })
  const all = <T,>(store: string) => new Promise<T[]>(r => { const q = db.transaction(store).objectStore(store).getAll(); q.onsuccess = () => r(q.result as T[]) })
  const tastings = await all<{ createdAt: string; photo: { kind: string; photoId?: string } }>('tastings')
  const photos = new Map((await all<{ id: string; blob: Blob }>('photos')).map(p => [p.id, p.blob.size]))
  db.close()
  return tastings.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(t => t.photo.photoId ? photos.get(t.photo.photoId) ?? null : null)
})

/** Expect `count` photos on screen, each filling a real area (at least min × min px). */
async function expectPhotosShown(page: Page, count: number, min: number) {
  await expect.poll(async () => (await photoLayers(page)).length).toBe(count)
  for (const [w, h] of await photoLayers(page)) {
    expect(w).toBeGreaterThanOrEqual(min)
    expect(h).toBeGreaterThanOrEqual(min)
  }
}

async function takePhoto(page: Page) {
  const video = page.getByLabel('Camera viewfinder')
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).videoWidth)).toBeGreaterThan(0)
  await tap(page, 'Take photo')
  await tap(page, 'Use photo')
}

async function uploadPhoto(page: Page) {
  const base64 = await page.evaluate(() => {
    const c = document.createElement('canvas')
    c.width = 1500
    c.height = 2000
    const g = c.getContext('2d')!
    g.fillStyle = '#7E1F35'
    g.fillRect(0, 0, 1500, 2000)
    return c.toDataURL('image/jpeg', 0.9).split(',')[1]
  })
  await page.getByTestId('label-photo-file').setInputFiles({ name: 'label.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(base64, 'base64') })
  await tap(page, 'Use photo')
}

async function saveTasting(page: Page) {
  await tap(page, 'Review tasting')
  await tap(page, /Save to journal/)
}

test('photos show in journal cards, comparison selection, comparison, entry and record screens', async () => {
  await withCamera(async page => {
    await open(page)
    // A: camera photo of a named wine (the Penfolds Grange case).
    await tap(page, 'Start tasting')
    await page.locator('#q').fill('grange')
    await tap(page, /Penfolds Grange/)
    await tap(page, 'Snap the label')
    await takePhoto(page)
    await tap(page, /^Start tasting/)
    await expectPhotosShown(page, 1, 30) // the record screen's small wine card
    await saveTasting(page)
    // B: uploaded photo, unnamed.
    await tap(page, 'New tasting')
    await tap(page, 'Snap the label')
    await uploadPhoto(page)
    await tap(page, /Taste without naming/)
    await saveTasting(page)
    // C: no photo.
    await tap(page, 'New tasting')
    await tap(page, /Taste without naming/)
    await saveTasting(page)
    await committed(page, 'tastings', 3)

    await page.reload()
    await expect(page.getByRole('tab', { name: 'Tastings · 3' })).toBeVisible()
    await expectPhotosShown(page, 2, 150) // journal cards
    // Each card shows its own tasting's photo (newest first: no photo, uploaded, Grange).
    const [none, uploaded, grange] = await storedPhotoSizes(page)
    expect(none).toBeNull()
    expect(uploaded).not.toBeNull()
    expect(grange).not.toBeNull()
    expect(uploaded).not.toBe(grange)
    expect(await shownPhotoSizes(page)).toEqual([uploaded, grange])
    // The tasting without a photo keeps the prototype's placeholder, not an empty frame.
    await expect(page.getByRole('button', { name: /^Unnamed wine, tasted/ }).first().getByText('Unidentified')).toBeVisible()

    await tap(page, 'Compare')
    await page.getByRole('button', { name: /^Two saved tastings/ }).click()
    await expectPhotosShown(page, 2, 150) // selecting two tastings to compare
    expect(await shownPhotoSizes(page)).toEqual([uploaded, grange])
    await expect(page.getByRole('button', { name: /^Unnamed wine, tasted/ }).first().getByText('Unidentified')).toBeVisible()
    await tap(page, /^Penfolds Grange, tasted/)
    await page.getByRole('button', { name: /^Unnamed wine, tasted/ }).last().click()
    await tap(page, 'Compare A vs B')
    await expectPhotosShown(page, 2, 50) // comparison heads
    expect(await shownPhotoSizes(page)).toEqual([grange, uploaded]) // A = Grange, B = uploaded

    await tap(page, 'Journal')
    await tap(page, /^Penfolds Grange, tasted/)
    await expectPhotosShown(page, 1, 250) // entry detail
    expect(await shownPhotoSizes(page)).toEqual([grange])
  })
})

test('replacing or removing a draft’s photo leaves the saved tasting’s photo in the journal', async () => {
  await withCamera(async page => {
    await open(page)
    await tap(page, 'Start tasting')
    await tap(page, 'Snap the label')
    await takePhoto(page)
    await tap(page, /Taste without naming/)
    await saveTasting(page)
    await committed(page, 'tastings', 1)
    const [saved] = await readStore(page, 'photos')

    // "Taste it again" reuses the photo; replacing it in the new draft must not touch the saved one.
    await tap(page, /^Unnamed wine, tasted/)
    await tap(page, 'Taste it again, blind')
    await tap(page, 'Back to wine')
    await tap(page, 'Retake photo')
    await tap(page, 'Retake')
    await takePhoto(page)
    // The replacement is downscaled and stored asynchronously; wait for it rather than racing it.
    await expect.poll(async () => (await readStore(page, 'photos')).length).toBe(2)
    expect((await readStore(page, 'photos')).map(p => p.id)).toContain(saved.id)

    // Removing the draft's new photo deletes only that one.
    await tap(page, 'Retake photo')
    await tap(page, 'Remove photo')
    await expect.poll(async () => (await readStore(page, 'photos')).map(p => p.id)).toEqual([saved.id])

    await tap(page, 'Back')
    await tap(page, 'The journal')
    await expectPhotosShown(page, 1, 150)
    expect(await shownPhotoSizes(page)).toEqual(await storedPhotoSizes(page))
  })
})

test('a stored photo that has gone missing shows the “No photo” placeholder, not an empty frame', async () => {
  await withCamera(async page => {
    await open(page)
    await tap(page, 'Start tasting')
    await page.locator('#q').fill('grange')
    await tap(page, /Penfolds Grange/)
    await tap(page, 'Snap the label')
    await takePhoto(page)
    await tap(page, /^Start tasting/)
    await saveTasting(page)
    await committed(page, 'tastings', 1)
    await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>(r => { const q = indexedDB.open('anosmia'); q.onsuccess = () => r(q.result) })
      const tx = db.transaction('photos', 'readwrite')
      tx.objectStore('photos').clear()
      await new Promise<void>(r => { tx.oncomplete = () => r() })
      db.close()
    })
    await page.reload()
    const card = page.getByRole('button', { name: /^Penfolds Grange, tasted/ })
    await expect(card.getByText('No photo')).toBeVisible()
    expect(await photoLayers(page)).toEqual([])
    // The record itself is untouched.
    const [record] = await readStore(page, 'tastings')
    expect((record.photo as { kind: string }).kind).toBe('image')
  })
})

test('records from before photos existed (simulated or no photo) still open and render', async ({ page }) => {
  await open(page)
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>(r => { const q = indexedDB.open('anosmia'); q.onsuccess = () => r(q.result) })
    const obs = { sweet: { state: 'level', level: 2 }, acid: { state: 'not_detected' }, tannin: { state: 'cant_tell' }, body: { state: 'unanswered' }, warm: { state: 'unanswered' }, finish: { state: 'unanswered' } }
    const wine = { id: 'grange16', name: 'Penfolds Grange', short: 'Grange', producer: 'Penfolds', variety: 'Shiraz', vintage: '2016', region: 'South Australia', source: 'catalogue' }
    const tx = db.transaction('tastings', 'readwrite')
    tx.objectStore('tastings').put({ schema: 1, id: 'old1', createdAt: '2026-10-20T10:00:00.000Z', wine, title: null, photo: { kind: 'simulated' }, observations: obs, notes: '', enjoyment: null, origin: 'user' })
    tx.objectStore('tastings').put({ schema: 1, id: 'old2', createdAt: '2026-10-19T10:00:00.000Z', wine: null, title: 'Unnamed wine', photo: { kind: 'none' }, observations: obs, notes: '', enjoyment: null, origin: 'user' })
    await new Promise<void>(r => { tx.oncomplete = () => r() })
    db.close()
  })
  await page.reload()
  await tap(page, 'The journal')
  await expect(page.getByRole('tab', { name: 'Tastings · 2' })).toBeVisible()
  // Simulated photo: the prototype's drawn label. No photo: the striped placeholder.
  await expect(page.getByRole('button', { name: /^Penfolds Grange, tasted/ }).getByText('Shiraz', { exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /^Unnamed wine, tasted/ }).getByText('Unidentified')).toBeVisible()
})
