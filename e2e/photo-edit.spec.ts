// Editing the photo of a saved tasting: add, replace, remove (with confirmation), cancel, reopen,
// and storage failures. Photos are uploaded as JPEGs of distinct sizes (kept as-is by the app), so
// "which photo is this?" is answered by its pixel size, both on screen and in IndexedDB.
import { chromium, expect, test, type Browser, type Page } from '@playwright/test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { APP } from '../playwright.config.ts'
import { committed, open, readStore, settle, tap } from './helpers.ts'

const FAKE_CAMERA = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
type Size = [number, number]
const A: Size = [800, 1000]
const B: Size = [900, 1100]
const C: Size = [1000, 1200]

async function withApp(run: (page: Page) => Promise<void>, prepare?: (page: Page) => Promise<void>) {
  const browser: Browser = await chromium.launch({ args: FAKE_CAMERA })
  try {
    const context = await browser.newContext({ baseURL: APP, viewport: { width: 390, height: 844 }, permissions: ['camera'] })
    const page = await context.newPage()
    await prepare?.(page)
    await run(page)
  } finally {
    await browser.close()
  }
}

async function jpeg(page: Page, [w, h]: Size) {
  const base64 = await page.evaluate(([width, height]) => {
    const c = document.createElement('canvas')
    c.width = width
    c.height = height
    const g = c.getContext('2d')!
    g.fillStyle = '#7E1F35'
    g.fillRect(0, 0, width, height)
    return c.toDataURL('image/jpeg', 0.9).split(',')[1]
  }, [w, h])
  return { name: `label-${w}x${h}.jpg`, mimeType: 'image/jpeg', buffer: Buffer.from(base64, 'base64') }
}

/** Choose an image file in the open photo sheet (the sheet's "Choose photo" input). */
async function choose(page: Page, size: Size) {
  await page.getByTestId('label-photo-file').setInputFiles(await jpeg(page, size))
  await expect(page.getByAltText('Label photo preview')).toBeVisible()
}

async function begin(page: Page) {
  const again = page.getByRole('button', { name: 'New tasting' })
  if (await again.count()) await again.first().click()
  else await tap(page, 'Start tasting')
}

/** Record and save a tasting; `photo` is attached while it is a draft. Returns once it is on the device. */
async function createTasting(page: Page, total: number, opts: { wine?: string; photo?: Size; notes?: string; rating?: boolean } = {}) {
  await begin(page)
  if (opts.wine) {
    await page.locator('#q').fill(opts.wine)
    await tap(page, new RegExp(opts.wine))
  }
  if (opts.photo) {
    await tap(page, 'Snap the label')
    await choose(page, opts.photo)
    await tap(page, 'Use photo')
  }
  await tap(page, /^(Start tasting|Taste without naming)/)
  await tap(page, 'Sweetness: Some')
  await settle(page)
  await tap(page, 'Review tasting')
  if (opts.notes) await page.locator('#notes').fill(opts.notes)
  if (opts.rating) await tap(page, /Yes please/)
  await tap(page, /Save to journal/)
  await committed(page, 'tastings', total)
}

const card = (page: Page, name: RegExp) => page.getByRole('button', { name }).first()

/** Natural sizes of every stored photo showing inside `scope`. */
const dimsIn = (scope: ReturnType<Page['locator']>) => scope.evaluate(async root => {
  const urls = [...root.querySelectorAll<HTMLElement>('span, div')]
    .map(el => getComputedStyle(el).backgroundImage).filter(b => b.startsWith('url("blob:')).map(b => b.slice(5, -2))
  return Promise.all(urls.map(src => new Promise<number[]>(ok => {
    const im = new Image()
    im.onload = () => ok([im.naturalWidth, im.naturalHeight])
    im.onerror = () => ok([0, 0])
    im.src = src
  })))
})
const shown = (page: Page) => dimsIn(page.locator('.f-ui.grain'))
const cardShows = (page: Page, name: RegExp) => dimsIn(card(page, name))

/** Pixel size of a stored photo. */
const storedSize = (page: Page, id: string) => page.evaluate(async photoId => {
  const db = await new Promise<IDBDatabase>(r => { const q = indexedDB.open('anosmia'); q.onsuccess = () => r(q.result) })
  const rec = await new Promise<{ blob: Blob }>(r => { const q = db.transaction('photos').objectStore('photos').get(photoId); q.onsuccess = () => r(q.result) })
  db.close()
  const bmp = await createImageBitmap(rec.blob)
  return [bmp.width, bmp.height]
}, id)

const tastingByTitle = async (page: Page) => Object.fromEntries((await readStore(page, 'tastings')).map(r => [String((r.wine as { name?: string } | null)?.name ?? r.title), r]))
const photoIds = async (page: Page) => (await readStore(page, 'photos')).map(p => p.id as string).sort()
const photoOf = (record: Record<string, unknown>) => record.photo as { kind: string; photoId?: string }

/** Everything about a tasting except its photo. */
const withoutPhoto = (record: Record<string, unknown>) => ({ ...record, photo: undefined })

test('a tasting without a photo gets one added: shown everywhere, nothing else changed', async () => {
  await withApp(async page => {
    await open(page)
    await createTasting(page, 1, { wine: 'Saltbush', notes: 'Salty air.', rating: true })
    await createTasting(page, 2, { photo: B, notes: 'Second one' })
    const before = await tastingByTitle(page)
    const photosBefore = await photoIds(page)

    await card(page, /^Saltbush Grenache, tasted/).click()
    // The photo area is a button with a clear label, and tapping the picture itself opens the same sheet.
    await expect(page.getByRole('button', { name: 'Add photo' })).toBeVisible()
    const box = (await page.getByRole('button', { name: 'Add photo' }).boundingBox())!
    await page.mouse.click(box.x + 20, box.y + 20)
    await expect(page.getByRole('dialog', { name: 'Label photo' })).toBeVisible()
    await expect(page.getByLabel('Camera viewfinder')).toBeVisible()

    // Preview first: nothing is saved until "Use photo".
    await choose(page, C)
    expect(await tastingByTitle(page)).toEqual(before)
    await tap(page, 'Use photo')
    await expect(page.getByRole('dialog', { name: 'Label photo' })).toHaveCount(0)

    await expect.poll(() => shown(page)).toEqual([C])
    await expect(page.getByRole('button', { name: 'Change photo' })).toBeVisible()
    await committed(page, 'tastings', 2)
    const after = await tastingByTitle(page)
    const saltbush = after['Saltbush Grenache']
    expect(photoOf(saltbush).kind).toBe('image')
    expect(await storedSize(page, photoOf(saltbush).photoId!)).toEqual(C)
    expect(withoutPhoto(saltbush)).toEqual(withoutPhoto(before['Saltbush Grenache'])) // wine, sensations, notes, rating
    expect(after['Unnamed wine']).toEqual(before['Unnamed wine']) // the other tasting is untouched
    expect((await photoIds(page)).length).toBe(photosBefore.length + 1)

    // Journal card and the comparison selection both show it straight away.
    await tap(page, 'Journal')
    await expect.poll(() => cardShows(page, /^Saltbush Grenache, tasted/)).toEqual([C])
    expect(await cardShows(page, /^Unnamed wine, tasted/)).toEqual([B])
    await tap(page, 'Compare')
    await page.getByRole('button', { name: /^Two saved tastings/ }).click()
    expect(await cardShows(page, /^Saltbush Grenache, tasted/)).toEqual([C])
    expect(await cardShows(page, /^Unnamed wine, tasted/)).toEqual([B])
  })
})

test('replacing a photo shows the new one everywhere and leaves a tasting that shares the old one alone', async () => {
  await withApp(async page => {
    await open(page)
    await createTasting(page, 1, { wine: 'Hollow Creek', photo: A, notes: 'Bright.', rating: true })
    // "Taste it again" gives the new tasting the same stored photo.
    await card(page, /^Hollow Creek Riesling, tasted/).click()
    await tap(page, 'Taste it again, blind')
    await tap(page, 'Sweetness: Some')
    await settle(page)
    await tap(page, 'Review tasting')
    await tap(page, /Save to journal/)
    await committed(page, 'tastings', 2)
    await tap(page, 'Journal')
    const records = (await readStore(page, 'tastings')).sort((x, y) => String(x.createdAt).localeCompare(String(y.createdAt)))
    const [older, newer] = records
    expect(photoOf(newer).photoId).toBe(photoOf(older).photoId)
    const shared = photoOf(older).photoId!

    // Replace the older tasting's photo (the last card; the journal is newest first).
    await page.getByRole('button', { name: /^Hollow Creek Riesling, tasted/ }).last().click()
    await tap(page, 'Change photo')
    await expect(page.getByRole('heading', { name: 'Keep, retake or remove.' })).toBeVisible()
    await expect(page.getByAltText('Label photo for this tasting')).toBeVisible()
    await tap(page, 'Retake')
    await choose(page, B)
    await expect(page.getByRole('heading', { name: 'Keep this photo?' })).toBeVisible()
    await tap(page, 'Use photo')
    await expect.poll(() => shown(page)).toEqual([B])

    await committed(page, 'tastings', 2)
    const after = Object.fromEntries((await readStore(page, 'tastings')).map(r => [r.id as string, r]))
    expect(photoOf(after[older.id as string]).photoId).not.toBe(shared)
    expect(await storedSize(page, photoOf(after[older.id as string]).photoId!)).toEqual(B)
    expect(withoutPhoto(after[older.id as string])).toEqual(withoutPhoto(older))
    expect(after[newer.id as string]).toEqual(newer) // the other tasting still points at the original photo
    expect(await photoIds(page)).toContain(shared) // still used, so not deleted

    await tap(page, 'Journal')
    expect(await page.getByRole('button', { name: /^Hollow Creek Riesling, tasted/ }).last().evaluate(el => el.isConnected)).toBe(true)
    await expect.poll(async () => dimsIn(page.getByRole('button', { name: /^Hollow Creek Riesling, tasted/ }).first())).toEqual([A])
    await expect.poll(async () => dimsIn(page.getByRole('button', { name: /^Hollow Creek Riesling, tasted/ }).last())).toEqual([B])

    // Once nothing else uses the original, replacing the other tasting's photo deletes it.
    await page.getByRole('button', { name: /^Hollow Creek Riesling, tasted/ }).first().click()
    await tap(page, 'Change photo')
    await tap(page, 'Retake')
    await choose(page, C)
    await tap(page, 'Use photo')
    await expect.poll(() => shown(page)).toEqual([C])
    await expect.poll(async () => (await photoIds(page)).includes(shared)).toBe(false)
    expect(await photoIds(page)).toHaveLength(2)
  })
})

test('a new photo can be taken with the camera when changing a saved photo', async () => {
  await withApp(async page => {
    await open(page)
    await createTasting(page, 1, { photo: A })
    const [original] = await readStore(page, 'tastings')
    await card(page, /^Unnamed wine, tasted/).click()
    await tap(page, 'Change photo')
    await tap(page, 'Retake')
    const video = page.getByLabel('Camera viewfinder')
    await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).videoWidth)).toBeGreaterThan(0)
    await tap(page, 'Take photo')
    await expect(page.getByAltText('Label photo preview')).toBeVisible()
    await tap(page, 'Use photo')
    // The record is written just after the sheet closes; wait for it to point at the new photo.
    await expect.poll(async () => photoOf((await readStore(page, 'tastings'))[0]).photoId).not.toBe(photoOf(original).photoId)
    const [record] = await readStore(page, 'tastings')
    const size = await storedSize(page, photoOf(record).photoId!)
    expect(size).not.toEqual(A)
    await expect.poll(() => shown(page)).toEqual([size])
  })
})

test('removing a photo asks first, and then clears it everywhere without touching anything else', async () => {
  await withApp(async page => {
    await open(page)
    await createTasting(page, 1, { wine: 'Hollow Creek', photo: A, notes: 'Bright.', rating: true })
    await createTasting(page, 2, { photo: B })
    const before = await tastingByTitle(page)

    await card(page, /^Hollow Creek Riesling, tasted/).click()
    await tap(page, 'Change photo')
    await tap(page, 'Remove photo')
    await expect(page.getByRole('heading', { name: 'Remove this photo?' })).toBeVisible()
    expect(await tastingByTitle(page)).toEqual(before) // asking removes nothing

    // Declining keeps the photo.
    await tap(page, 'Keep photo')
    await expect(page.getByRole('heading', { name: 'Keep, retake or remove.' })).toBeVisible()
    await tap(page, 'Keep it')
    await expect.poll(() => shown(page)).toEqual([A])
    expect(await tastingByTitle(page)).toEqual(before)

    // Confirming removes it.
    await tap(page, 'Change photo')
    await tap(page, 'Remove photo')
    await tap(page, 'Remove it')
    await expect(page.getByRole('dialog', { name: 'Label photo' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Add photo' })).toBeVisible()
    expect(await shown(page)).toEqual([])
    await committed(page, 'tastings', 2)
    const after = await tastingByTitle(page)
    expect(photoOf(after['Hollow Creek Riesling'])).toEqual({ kind: 'none' })
    expect(withoutPhoto(after['Hollow Creek Riesling'])).toEqual(withoutPhoto(before['Hollow Creek Riesling']))
    expect(after['Unnamed wine']).toEqual(before['Unnamed wine'])
    await expect.poll(() => photoIds(page)).toEqual([photoOf(before['Unnamed wine']).photoId!])

    // The card falls back to the existing placeholder, never an empty frame; the other card is unchanged.
    await tap(page, 'Journal')
    await expect(card(page, /^Hollow Creek Riesling, tasted/).getByText('No photo')).toBeVisible()
    expect(await cardShows(page, /^Unnamed wine, tasted/)).toEqual([B])
  })
})

test('cancelling at any point leaves the original photo exactly as it was', async () => {
  await withApp(async page => {
    await open(page)
    await createTasting(page, 1, { photo: A, notes: 'Keep me.' })
    const before = await readStore(page, 'tastings')
    const photosBefore = await photoIds(page)
    const unchanged = async () => {
      expect(await readStore(page, 'tastings')).toEqual(before)
      expect(await photoIds(page)).toEqual(photosBefore)
      expect(await shown(page)).toEqual([A])
    }

    await card(page, /^Unnamed wine, tasted/).click()
    // 1. Keep it.
    await tap(page, 'Change photo')
    await tap(page, 'Keep it')
    await expect(page.getByRole('dialog', { name: 'Label photo' })).toHaveCount(0)
    await unchanged()
    // 2. Pick a replacement, then back out through Retake and Cancel.
    await tap(page, 'Change photo')
    await tap(page, 'Retake')
    await choose(page, B)
    await tap(page, 'Retake')
    await tap(page, 'Cancel')
    await expect(page.getByRole('dialog', { name: 'Label photo' })).toHaveCount(0)
    await unchanged()
    // 3. Ask to remove, then decline.
    await tap(page, 'Change photo')
    await tap(page, 'Remove photo')
    await tap(page, 'Keep photo')
    await tap(page, 'Keep it')
    await unchanged()
  })
})

test('edits survive reloading and closing and reopening the browser', async () => {
  const profile = mkdtempSync(join(tmpdir(), 'anosmia-edit-profile-'))
  try {
    let context = await chromium.launchPersistentContext(profile, { baseURL: APP, args: FAKE_CAMERA, permissions: ['camera'], viewport: { width: 390, height: 844 } })
    let page = context.pages()[0] ?? (await context.newPage())
    await open(page)
    await createTasting(page, 1, { wine: 'Saltbush', notes: 'Salty air.' })
    await createTasting(page, 2, { photo: A })
    await card(page, /^Saltbush Grenache, tasted/).click()
    await tap(page, 'Add photo')
    await choose(page, C)
    await tap(page, 'Use photo')
    await committed(page, 'tastings', 2)
    await expect.poll(async () => photoOf((await tastingByTitle(page))['Saltbush Grenache']).kind).toBe('image')

    // Reopening resumes where the user was (this tasting's screen), and the new photo is already there.
    await page.reload()
    await expect.poll(() => shown(page)).toEqual([C])
    await tap(page, 'Journal')
    await expect.poll(() => cardShows(page, /^Saltbush Grenache, tasted/)).toEqual([C])
    await context.close()

    context = await chromium.launchPersistentContext(profile, { baseURL: APP, args: FAKE_CAMERA, permissions: ['camera'], viewport: { width: 390, height: 844 } })
    page = context.pages()[0] ?? (await context.newPage())
    await open(page)
    // It resumes on the journal, where the user left it.
    await expect.poll(() => cardShows(page, /^Saltbush Grenache, tasted/)).toEqual([C])
    expect(await cardShows(page, /^Unnamed wine, tasted/)).toEqual([A])
    const records = await tastingByTitle(page)
    expect(await storedSize(page, photoOf(records['Saltbush Grenache']).photoId!)).toEqual(C)
    expect(await photoIds(page)).toHaveLength(2)
    await context.close()
  } finally {
    rmSync(profile, { recursive: true, force: true })
  }
})

test.describe('when storing fails', () => {
  const failures = async (page: Page) => { await page.addInitScript(() => {
    const w = window as unknown as { __failPhotos?: boolean; __failTastings?: boolean }
    const put = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (this: IDBObjectStore, ...args: Parameters<IDBObjectStore['put']>) {
      if (w.__failPhotos && this.name === 'photos') throw new DOMException('Simulated: no space left', 'QuotaExceededError')
      const req = put.apply(this, args)
      if (w.__failTastings && this.name === 'tastings') this.transaction.abort()
      return req
    }
  }) }
  const fail = (page: Page, what: 'photos' | 'tastings', on: boolean) =>
    page.evaluate(([key, value]) => { (window as unknown as Record<string, boolean>)[key as string] = value as boolean }, [`__fail${what === 'photos' ? 'Photos' : 'Tastings'}`, on])

  test('a photo that can’t be stored is reported and the previous photo is kept', async () => {
    await withApp(async page => {
      await open(page)
      await createTasting(page, 1, { photo: A, notes: 'Keep me.' })
      const before = await readStore(page, 'tastings')
      const photosBefore = await photoIds(page)
      await card(page, /^Unnamed wine, tasted/).click()
      await tap(page, 'Change photo')
      await tap(page, 'Retake')
      await choose(page, B)
      await fail(page, 'photos', true)
      await tap(page, 'Use photo')
      await expect(page.getByRole('alert')).toHaveText('This device is out of space for photos.')
      expect(await readStore(page, 'tastings')).toEqual(before)
      expect(await photoIds(page)).toEqual(photosBefore)
      await fail(page, 'photos', false)
      await tap(page, 'Retake')
      await tap(page, 'Cancel')
      expect(await shown(page)).toEqual([A])
    }, failures)
  })

  test('a tasting that can’t be saved keeps its previous photo, cleans up, and works on retry', async () => {
    await withApp(async page => {
      await open(page)
      await createTasting(page, 1, { photo: A, notes: 'Keep me.' })
      const before = await readStore(page, 'tastings')
      const photosBefore = await photoIds(page)
      await card(page, /^Unnamed wine, tasted/).click()
      await tap(page, 'Change photo')
      await tap(page, 'Retake')
      await choose(page, B)
      await fail(page, 'tastings', true)
      await tap(page, 'Use photo')
      await expect(page.getByRole('alert')).toHaveText('The photo couldn’t be saved. Your previous photo is unchanged.')
      expect(await readStore(page, 'tastings')).toEqual(before)
      expect(await shown(page)).toEqual([A]) // the tasting behind the sheet still shows its previous photo
      // The photo that was stored for the failed attempt is removed again.
      await expect.poll(() => photoIds(page)).toEqual(photosBefore)

      // The sheet is still open on the preview, and trying again, once storage works, succeeds.
      await fail(page, 'tastings', false)
      await tap(page, 'Use photo')
      await expect(page.getByRole('dialog', { name: 'Label photo' })).toHaveCount(0)
      await expect.poll(() => shown(page)).toEqual([B])
      await committed(page, 'tastings', 1)
      const [record] = await readStore(page, 'tastings')
      expect(await storedSize(page, photoOf(record).photoId!)).toEqual(B)
      await expect.poll(async () => (await photoIds(page)).length).toBe(1)
    }, failures)
  })

  test('a photo that can’t be removed stays, and the sheet says so', async () => {
    await withApp(async page => {
      await open(page)
      await createTasting(page, 1, { photo: A })
      const before = await readStore(page, 'tastings')
      await card(page, /^Unnamed wine, tasted/).click()
      await tap(page, 'Change photo')
      await tap(page, 'Remove photo')
      await fail(page, 'tastings', true)
      await tap(page, 'Remove it')
      await expect(page.getByRole('alert')).toHaveText('The photo couldn’t be saved. Your previous photo is unchanged.')
      expect(await readStore(page, 'tastings')).toEqual(before)
      expect((await photoIds(page)).length).toBe(1)
      await tap(page, 'Keep it')
      expect(await shown(page)).toEqual([A])
    }, failures)
  })
})

test('a photo that is no longer on the device is explained, not shown as an empty frame', async () => {
  await withApp(async page => {
    await open(page)
    await createTasting(page, 1, { wine: 'Saltbush', photo: A })
    await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>(r => { const q = indexedDB.open('anosmia'); q.onsuccess = () => r(q.result) })
      const tx = db.transaction('photos', 'readwrite')
      tx.objectStore('photos').clear()
      await new Promise<void>(r => { tx.oncomplete = () => r() })
      db.close()
    })
    await page.reload()
    await expect(card(page, /^Saltbush Grenache, tasted/).getByText('No photo')).toBeVisible()
    await card(page, /^Saltbush Grenache, tasted/).click()
    await expect(page.getByText('No photo').first()).toBeVisible()
    await tap(page, 'Change photo')
    await expect(page.getByText('This photo is no longer on this device. You can add a new one.')).toBeVisible()
    // Removing clears the dangling reference.
    await tap(page, 'Remove photo')
    await tap(page, 'Remove it')
    await expect(page.getByRole('button', { name: 'Add photo' })).toBeVisible()
    const [record] = await readStore(page, 'tastings')
    expect(photoOf(record)).toEqual({ kind: 'none' })
  })
})
