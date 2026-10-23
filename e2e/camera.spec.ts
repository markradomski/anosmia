// Label photography: live camera, image-file fallback, preview/replace/remove, local persistence,
// reopening from the journal, permission denied, no camera, and blind concealment.
// Chromium's fake camera stands in for a phone camera; real camera behaviour needs the device.
import { chromium, expect, test, type Browser, type Page } from '@playwright/test'
import { APP } from '../playwright.config.ts'
import { committed, open, readStore, settle, tap } from './helpers.ts'

const FAKE_CAMERA = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']

async function withBrowser(args: string[], permissions: string[], run: (page: Page) => Promise<void>) {
  const browser: Browser = await chromium.launch({ args })
  try {
    const context = await browser.newContext({ baseURL: APP, viewport: { width: 390, height: 844 }, permissions })
    await run(await context.newPage())
  } finally {
    await browser.close()
  }
}

/** The CSS background image of the label tile inside the button with this accessible name. */
const tileImage = (page: Page, button: string | RegExp) =>
  page.getByRole('button', { name: button }).first().evaluate(el =>
    [...el.querySelectorAll('span, div')].map(s => getComputedStyle(s).backgroundImage).find(b => b.startsWith('url(')) ?? 'none')

async function takePhoto(page: Page) {
  const video = page.getByLabel('Camera viewfinder')
  await expect(video).toBeVisible()
  await expect.poll(() => video.evaluate(v => (v as HTMLVideoElement).videoWidth)).toBeGreaterThan(0)
  await tap(page, 'Take photo')
  await expect(page.getByRole('heading', { name: 'Keep this photo?' })).toBeVisible()
  await expect(page.getByAltText('Label photo preview')).toBeVisible()
  await tap(page, 'Use photo')
  await expect(page.getByRole('dialog', { name: 'Label photo' })).toHaveCount(0)
}

async function pngFile(page: Page) {
  const base64 = await page.evaluate(() => {
    const c = document.createElement('canvas')
    c.width = 2400
    c.height = 1800
    const g = c.getContext('2d')!
    g.fillStyle = '#E8DFC9'
    g.fillRect(0, 0, 2400, 1800)
    return c.toDataURL('image/png').split(',')[1]
  })
  return { name: 'label.png', mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') }
}

test('a camera photo is stored, saved with the tasting, and reopens from the journal after a reload', async () => {
  await withBrowser(FAKE_CAMERA, ['camera'], async page => {
    await open(page)
    await tap(page, 'Start tasting')
    await tap(page, 'Snap the label')
    await takePhoto(page)
    await expect(page.getByRole('button', { name: 'Retake photo' })).toBeVisible()
    await expect(page.getByText('Label photo saved · name it later')).toBeVisible()

    await tap(page, /Taste without naming/)
    await tap(page, 'Sweetness: Some')
    await settle(page)
    await tap(page, 'Review tasting')
    await tap(page, /Save to journal/)
    await committed(page, 'tastings', 1)
    const [record] = await readStore(page, 'tastings')
    const photo = record.photo as { kind: string; photoId: string }
    expect(photo.kind).toBe('image')
    const photos = await readStore(page, 'photos')
    expect(photos.map(p => p.id)).toEqual([photo.photoId])
    expect(photos[0].type).toBe('image/jpeg')

    // Reopening returns to the journal, where the photo loads from local storage.
    await page.reload()
    await expect(page.getByRole('tab', { name: 'Tastings · 1' })).toBeVisible()
    await expect.poll(() => tileImage(page, /^Unnamed wine, tasted/)).toMatch(/^url\("blob:/)
    await tap(page, /^Unnamed wine, tasted/)
    await expect.poll(async () => page.locator('.f-ui.grain').evaluate(root =>
      [...root.querySelectorAll('span, div')].some(s => getComputedStyle(s).backgroundImage.startsWith('url("blob:')))).toBe(true)
  })
})

test('a photo can be previewed, replaced and removed; unused photos are deleted', async () => {
  await withBrowser(FAKE_CAMERA, ['camera'], async page => {
    await open(page)
    await tap(page, 'Start tasting')
    await tap(page, 'Snap the label')
    await takePhoto(page)
    const [first] = await readStore(page, 'photos')

    await tap(page, 'Retake photo')
    await expect(page.getByRole('heading', { name: 'Keep, retake or remove.' })).toBeVisible()
    await expect(page.getByAltText('Label photo for this tasting')).toBeVisible()
    await tap(page, 'Retake')
    await takePhoto(page)
    await expect.poll(async () => (await readStore(page, 'photos')).map(p => p.id)).not.toContain(first.id)
    expect(await readStore(page, 'photos')).toHaveLength(1)

    await tap(page, 'Retake photo')
    await tap(page, 'Remove photo')
    await expect(page.getByRole('button', { name: 'Snap the label' })).toBeVisible()
    await expect.poll(async () => (await readStore(page, 'photos')).length).toBe(0)
  })
})

test('with no camera, the user is told and can choose an image file instead', async () => {
  await withBrowser([], ['camera'], async page => {
    await open(page)
    await tap(page, 'Start tasting')
    await tap(page, 'Snap the label')
    await expect(page.getByRole('alert')).toHaveText('No camera is available here. You can choose a photo instead.')
    await page.getByTestId('label-photo-file').setInputFiles(await pngFile(page))
    await expect(page.getByAltText('Label photo preview')).toBeVisible()
    await tap(page, 'Use photo')
    await expect(page.getByRole('button', { name: 'Retake photo' })).toBeVisible()
    const photos = await readStore(page, 'photos')
    expect(photos).toHaveLength(1)
    // Large images are downscaled before they are stored.
    const size = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>(r => { const q = indexedDB.open('anosmia'); q.onsuccess = () => r(q.result) })
      const rec = await new Promise<{ blob: Blob }>(r => { const q = db.transaction('photos').objectStore('photos').getAll(); q.onsuccess = () => r(q.result[0]) })
      const bmp = await createImageBitmap(rec.blob)
      return [bmp.width, bmp.height]
    })
    expect(size).toEqual([1600, 1200])
  })
})

test('with camera permission denied, the user is told and can choose an image file instead', async () => {
  // Headless Chromium can't show a permission prompt, so this injects the error Chrome gives a page
  // after the user blocks the camera. The real prompt and site setting need checking on the device.
  await withBrowser(FAKE_CAMERA, [], async page => {
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError'))
    })
    await open(page)
    await tap(page, 'Start tasting')
    await tap(page, 'Snap the label')
    await expect(page.getByRole('alert')).toContainText('Camera access is blocked for Anosmia.')
    await expect(page.getByRole('button', { name: 'Choose photo' })).toBeVisible()
    await tap(page, 'Cancel')
    await expect(page.getByRole('button', { name: 'Snap the label' })).toBeVisible()
  })
})

test('a blind glass’s label photo is never shown before the comparison is saved', async () => {
  await withBrowser(FAKE_CAMERA, ['camera'], async page => {
    await open(page)
    await tap(page, 'Two glasses?')
    await tap(page, /Someone else/)
    await tap(page, 'Glass A: Unnamed. Tap to name.')
    await tap(page, 'Snap the label')
    await takePhoto(page)
    await expect(page.getByText('Label photo saved to glass A.')).toBeVisible()

    await tap(page, /^Glass A:/)
    await tap(page, 'Photo saved')
    await expect(page.getByText('This photo stays hidden until the comparison is saved.')).toBeVisible()
    await expect(page.locator('section[aria-label="Label photo"] img')).toHaveCount(0)
  })
})
