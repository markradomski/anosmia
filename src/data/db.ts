// Minimal IndexedDB access (no wrapper library). One database, versioned with explicit migrations.
import type { DraftRecord, PhotoRecord, SessionRecord, TastingRecord } from './model'

export const DB_NAME = 'anosmia'
export const DB_VERSION = 1

export type StoreName = 'tastings' | 'sessions' | 'drafts' | 'photos'

/** Each step upgrades from version (index) to version (index + 1). Never rewrite a shipped step. */
const MIGRATIONS: ((db: IDBDatabase, tx: IDBTransaction) => void)[] = [
  db => {
    db.createObjectStore('tastings', { keyPath: 'id' }).createIndex('createdAt', 'createdAt')
    db.createObjectStore('sessions', { keyPath: 'id' }).createIndex('createdAt', 'createdAt')
    db.createObjectStore('drafts', { keyPath: 'key' })
    db.createObjectStore('photos', { keyPath: 'id' })
  },
]

const done = <T>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

const committed = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new DOMException('Transaction aborted', 'AbortError'))
  })

export function openDb(name = DB_NAME): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser'))
      return
    }
    const req = indexedDB.open(name, DB_VERSION)
    req.onupgradeneeded = event => {
      const tx = req.transaction!
      for (let v = event.oldVersion; v < DB_VERSION; v++) MIGRATIONS[v](req.result, tx)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
    req.onblocked = () => reject(new Error('The database is open in another tab with an older version'))
  })
}

export class Db {
  private db: IDBDatabase

  constructor(db: IDBDatabase) {
    this.db = db
  }

  async getAll(store: 'tastings'): Promise<unknown[]>
  async getAll(store: 'sessions'): Promise<unknown[]>
  async getAll(store: StoreName): Promise<unknown[]> {
    return done(this.db.transaction(store).objectStore(store).getAll())
  }

  async keys(store: StoreName): Promise<string[]> {
    return done(this.db.transaction(store).objectStore(store).getAllKeys()) as Promise<string[]>
  }

  async get(store: StoreName, key: string): Promise<unknown> {
    return done(this.db.transaction(store).objectStore(store).get(key))
  }

  async put(store: 'tastings', value: TastingRecord): Promise<void>
  async put(store: 'sessions', value: SessionRecord): Promise<void>
  async put(store: 'drafts', value: DraftRecord): Promise<void>
  async put(store: 'photos', value: PhotoRecord): Promise<void>
  async put(store: StoreName, value: unknown): Promise<void> {
    const tx = this.db.transaction(store, 'readwrite')
    tx.objectStore(store).put(value)
    return committed(tx)
  }

  /** Write several records in one transaction: all of them are stored, or none. */
  async putAll(writes: { store: StoreName; value: TastingRecord | SessionRecord | DraftRecord | PhotoRecord }[]): Promise<void> {
    const tx = this.db.transaction([...new Set(writes.map(w => w.store))], 'readwrite')
    for (const w of writes) tx.objectStore(w.store).put(w.value)
    return committed(tx)
  }

  async delete(store: StoreName, key: string): Promise<void> {
    const tx = this.db.transaction(store, 'readwrite')
    tx.objectStore(store).delete(key)
    return committed(tx)
  }

  close() {
    this.db.close()
  }
}
