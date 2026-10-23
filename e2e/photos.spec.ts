// Label-photo storage, exercised in a real browser (IndexedDB, Blob, canvas). Modules are imported
// from the dev server because the storage layer is not wired into the UI until Phase 3.
import { expect, test } from '@playwright/test'
import { DEV } from '../playwright.config.ts'

// Shapes of the browser-side modules (imported by URL inside page.evaluate).
interface DbModule { Db: new (db: IDBDatabase) => Store; openDb(name: string): Promise<IDBDatabase> }
interface Store { close(): void }
interface PhotosModule {
  savePhoto(db: Store, blob: Blob): Promise<string>
  loadPhoto(db: Store, id: string): Promise<Blob | null>
  deletePhoto(db: Store, id: string): Promise<void>
  prepareLabelPhoto(blob: Blob): Promise<Blob>
}

test.beforeEach(async ({ page }) => {
  await page.goto(`${DEV}/?demo`)
})

test('stores a downscaled JPEG that survives a reload, and deletes it', async ({ page }) => {
  const id = await page.evaluate(async () => {
    const db = (await import(/* @vite-ignore */ '/src/data/db.ts' as string)) as DbModule
    const photos = (await import(/* @vite-ignore */ '/src/data/photos.ts' as string)) as PhotosModule
    const canvas = new OffscreenCanvas(4000, 3000)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#7E1F35'
    ctx.fillRect(0, 0, 4000, 3000)
    const png = await canvas.convertToBlob({ type: 'image/png' })
    const store = new db.Db(await db.openDb('anosmia-photo-test'))
    const photoId = await photos.savePhoto(store, png)
    store.close()
    return photoId
  })

  await page.reload()
  const stored = await page.evaluate(async photoId => {
    const db = (await import(/* @vite-ignore */ '/src/data/db.ts' as string)) as DbModule
    const photos = (await import(/* @vite-ignore */ '/src/data/photos.ts' as string)) as PhotosModule
    const store = new db.Db(await db.openDb('anosmia-photo-test'))
    const blob = await photos.loadPhoto(store, photoId)
    const bitmap = await createImageBitmap(blob!)
    const result = { type: blob!.type, width: bitmap.width, height: bitmap.height, bytes: blob!.size }
    await photos.deletePhoto(store, photoId)
    const after = await photos.loadPhoto(store, photoId)
    store.close()
    return { ...result, deleted: after === null }
  }, id)

  expect(stored).toMatchObject({ type: 'image/jpeg', width: 1600, height: 1200, deleted: true })
  expect(stored.bytes).toBeLessThan(1_000_000)
})

test('refuses files that are not images', async ({ page }) => {
  const kind = await page.evaluate(async () => {
    const photos = (await import(/* @vite-ignore */ '/src/data/photos.ts' as string)) as PhotosModule
    try {
      await photos.prepareLabelPhoto(new Blob(['not an image'], { type: 'text/plain' }))
      return 'accepted'
    } catch (err) {
      return (err as { kind?: string }).kind
    }
  })
  expect(kind).toBe('not_image')
})

test('keeps a small JPEG as it is', async ({ page }) => {
  const same = await page.evaluate(async () => {
    const photos = (await import(/* @vite-ignore */ '/src/data/photos.ts' as string)) as PhotosModule
    const canvas = new OffscreenCanvas(800, 600)
    canvas.getContext('2d')!.fillRect(0, 0, 800, 600)
    const jpeg = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 })
    return (await photos.prepareLabelPhoto(jpeg)) === jpeg
  })
  expect(same).toBe(true)
})
