// Local label-photo storage. Photos never leave the device.
// Not wired into the UI yet: the prototype's camera is simulated, and real capture/upload is Phase 3.
// A tasting or A/B slot refers to a stored photo with { kind: 'image', photoId } (see model.ts).
import type { Db } from './db'

/** Longest edge kept for a label photo; enough to read a label, small enough to store many. */
export const MAX_EDGE_PX = 1600
/** Inputs larger than this are refused outright rather than decoded. */
export const MAX_INPUT_BYTES = 25 * 1024 * 1024
const JPEG_QUALITY = 0.85

export type PhotoErrorKind = 'not_image' | 'too_large' | 'quota' | 'failed'

export class PhotoError extends Error {
  name = 'PhotoError'
  kind: PhotoErrorKind
  constructor(kind: PhotoErrorKind, message: string) {
    super(message)
    this.kind = kind
  }
}

/** Downscale to MAX_EDGE_PX and re-encode as JPEG. Small images are kept as they are. */
export async function prepareLabelPhoto(input: Blob): Promise<Blob> {
  if (!input.type.startsWith('image/')) throw new PhotoError('not_image', 'That file isn’t an image.')
  if (input.size > MAX_INPUT_BYTES) throw new PhotoError('too_large', 'That photo is too large to keep.')
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(input)
  } catch {
    throw new PhotoError('not_image', 'That image couldn’t be read.')
  }
  try {
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && input.type === 'image/jpeg') return input
    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)
    const canvas = new OffscreenCanvas(width, height)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
    return await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY })
  } finally {
    bitmap.close()
  }
}

const isQuotaError = (err: unknown) =>
  err instanceof DOMException && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')

/** Prepare and store a photo; returns its id. */
export async function savePhoto(db: Db, input: Blob): Promise<string> {
  const blob = await prepareLabelPhoto(input)
  const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  try {
    await db.put('photos', { id, createdAt: new Date().toISOString(), blob, type: blob.type })
  } catch (err) {
    if (isQuotaError(err)) throw new PhotoError('quota', 'This device is out of space for photos.')
    throw new PhotoError('failed', 'The photo couldn’t be saved.')
  }
  return id
}

export async function loadPhoto(db: Db, id: string): Promise<Blob | null> {
  const record = (await db.get('photos', id)) as { blob?: unknown } | undefined
  return record && record.blob instanceof Blob ? record.blob : null
}

export function deletePhoto(db: Db, id: string): Promise<void> {
  return db.delete('photos', id)
}
