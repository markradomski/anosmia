// Connects the ported logic to IndexedDB without changing how the logic works.
// Records are loaded before the first render. Afterwards the connector watches state:
// - an entry or session that appears in the journal is written together with the updated draft, in
//   one transaction, so a reopened app can never resume a tasting that is already saved;
// - other draft changes are written as soon as possible, coalesced while a write is in flight.
import type { AnosmiaLogic, Entry, Session, State } from '../anosmia/AnosmiaLogic'
import { draftToState, entryToRecord, recordToEntry, recordToSession, sessionToRecord, stateToDraft } from './codec'
import { Db, openDb } from './db'
import { PhotoLibrary } from './photos'

export interface Persistence {
  /** State to start the logic with: the real journal and sessions, plus any restored draft. */
  initial: Partial<State>
  /** Start writing changes. Returns a cleanup function. */
  attach(logic: AnosmiaLogic): () => void
  photos: PhotoLibrary
}

/** Photos that saved records or the current unsaved work refer to. */
export function referencedPhotoIds(st: State): Set<string> {
  const ids = new Set<string>()
  const add = (id: string | null | undefined) => id && ids.add(id)
  for (const e of st.journal ?? []) add(e.photoId)
  for (const s of st.sessions ?? []) [s.a.photoId, s.b.photoId, s.glassPhotoId].forEach(add)
  add(st.photoId)
  if (st.ab) [st.ab.a.photoId, st.ab.b.photoId, st.ab.glassPhotoId].forEach(add)
  return ids
}

/** Every photo id mentioned anywhere in stored data, including records that can't be decoded. */
function photoIdsIn(raw: unknown, out: Set<string>) {
  if (Array.isArray(raw)) raw.forEach(x => photoIdsIn(x, out))
  else if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw)) {
      if (k === 'photoId' && typeof v === 'string') out.add(v)
      else photoIdsIn(v, out)
    }
  }
}

/** Orphans are photos nothing refers to, e.g. from a tasting that was abandoned. Recent ones are
 *  kept in case another open tab has just taken them. */
const ORPHAN_AGE_MS = 60 * 60 * 1000

async function removeOrphanPhotos(db: Db, referenced: Set<string>) {
  const ids = await db.keys('photos')
  for (const id of ids) {
    if (referenced.has(id)) continue
    const record = (await db.get('photos', id)) as { createdAt?: string } | undefined
    const age = record?.createdAt ? Date.now() - Date.parse(record.createdAt) : Infinity
    if (age > ORPHAN_AGE_MS) await db.delete('photos', id)
  }
}

export const MESSAGES = {
  unavailable: 'This browser isn’t letting Anosmia save. Tastings will be lost when you close it.',
  writeFailed: 'Couldn’t save to this device. Storage may be full or blocked.',
  unreadable: (n: number) => (n === 1 ? '1 saved record couldn’t be read and is hidden.' : `${n} saved records couldn’t be read and are hidden.`),
}

const byNewest = (a: { createdAt: string }, b: { createdAt: string }) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0)

/** Only reopen a screen whose data still exists; otherwise fall back to a safe screen. */
export function restorableDraft(patch: Partial<State>, journal: Entry[], sessions: Session[]): Partial<State> {
  const hasEntry = (id: string | null | undefined) => !!id && journal.some(e => e.id === id)
  let screen = patch.screen ?? 'welcome'
  if (screen === 'entry' && !hasEntry(patch.entryId)) screen = 'journal'
  if (screen === 'compare' && !(patch.cmp && patch.cmp.every(hasEntry))) screen = 'journal'
  if (screen === 'abView' && !(patch.sessionId && sessions.some(s => s.id === patch.sessionId))) screen = 'journal'
  if ((screen === 'abSetup' || screen === 'abRecord' || screen === 'abReview') && !patch.ab) screen = 'welcome'
  return { ...patch, screen }
}

function decodeAll<T>(raws: unknown[], decode: (raw: unknown) => T, problems: string[]) {
  const out: { createdAt: string; value: T }[] = []
  for (const raw of raws) {
    try {
      out.push({ createdAt: (raw as { createdAt: string }).createdAt, value: decode(raw) })
    } catch (err) {
      // Left untouched in the database; only hidden from the journal.
      problems.push((err as Error).message)
    }
  }
  return out.sort(byNewest)
}

function memoryOnly(reason: unknown): Persistence {
  console.error('[anosmia] persistence unavailable:', reason)
  return {
    initial: { journal: [], sessions: [] },
    photos: new PhotoLibrary(null),
    attach(logic) {
      logic.toast(MESSAGES.unavailable)
      // Nothing reaches the device, so a save must never be confirmed as saved.
      logic.saveAnnouncer = () => logic.toast(MESSAGES.unavailable)
      return () => {
        logic.saveAnnouncer = undefined
      }
    },
  }
}

export async function startPersistence(dbName?: string): Promise<Persistence> {
  let db: Db
  try {
    db = new Db(await openDb(dbName))
  } catch (err) {
    return memoryOnly(err)
  }

  const problems: string[] = []
  let tastings, sessions, draftRaw
  try {
    ;[tastings, sessions, draftRaw] = await Promise.all([db.getAll('tastings'), db.getAll('sessions'), db.get('drafts', 'current')])
  } catch (err) {
    return memoryOnly(err)
  }
  const entries = decodeAll(tastings, recordToEntry, problems)
  const sess = decodeAll(sessions, recordToSession, problems)
  const journal = entries.map(x => x.value)
  const sessionList = sess.map(x => x.value)

  let draft: Partial<State> = {}
  if (draftRaw !== undefined) {
    try {
      draft = restorableDraft(draftToState(draftRaw), journal, sessionList)
    } catch (err) {
      // A malformed draft is dropped rather than half-restored; saved records are unaffected.
      console.error('[anosmia] draft could not be restored:', err)
    }
  }
  if (problems.length) console.error('[anosmia] unreadable records:', problems)

  const referenced = new Set<string>()
  photoIdsIn([tastings, sessions, draftRaw], referenced)
  removeOrphanPhotos(db, referenced).catch(err => console.error('[anosmia] photo cleanup failed:', err))

  // What is already stored, by id, so only new or changed objects are written.
  const createdAt = new Map<string, string>([...entries, ...sess].map(x => [(x.value as { id: string }).id, x.createdAt]))
  const writtenEntries = new Map<string, Entry>(journal.map(e => [e.id, e]))
  const writtenSessions = new Map<string, Session>(sessionList.map(s => [s.id, s]))

  return {
    initial: { journal, sessions: sessionList, ...draft },
    photos: new PhotoLibrary(db),
    attach(logic) {
      let queue = Promise.resolve()
      let pending = 0
      let lastDraft = ''
      /** Draft key when a record write last failed: retry only once the user's work has changed. */
      let failedAt: string | null = null
      let draftQueued = false
      let detached = false
      /** The most recent write that contained saved records; resolves to whether it committed. */
      let recordWrite: Promise<boolean> | null = null

      const report = (err: unknown) => {
        console.error('[anosmia] save failed:', err)
        if (!detached) logic.toast(MESSAGES.writeFailed)
      }
      /** Run writes one at a time, in order. Resolves to whether this write committed. */
      const enqueue = (write: () => Promise<void>, onFail: () => void) => {
        pending++
        const step = queue.then(write).then(
          () => true,
          err => {
            onFail()
            report(err)
            return false
          },
        ).finally(() => pending--)
        queue = step.then(() => undefined)
        return step
      }

      const currentDraft = () => {
        const record = stateToDraft(logic.state, new Date().toISOString())
        return { record, key: JSON.stringify({ ...record, savedAt: '' }) }
      }
      /** The current draft, or null when it is unchanged since the last write. */
      const changedDraft = () => {
        const { record, key } = currentDraft()
        if (key === lastDraft) return null
        lastDraft = key
        return record
      }

      const hasUnsaved = () =>
        (logic.state.journal ?? []).some(e => writtenEntries.get(e.id) !== e)
        || (logic.state.sessions ?? []).some(s => writtenSessions.get(s.id) !== s)

      const onChange = () => {
        const st = logic.state
        const records: Parameters<Db['putAll']>[0] = []
        const entries: Entry[] = []
        const sessions: Session[] = []
        try {
          for (const e of st.journal ?? []) {
            if (writtenEntries.get(e.id) === e) continue
            const at = createdAt.get(e.id) ?? new Date().toISOString()
            records.push({ store: 'tastings', value: entryToRecord(e, at) })
            entries.push(e)
            createdAt.set(e.id, at)
          }
          for (const s of st.sessions ?? []) {
            if (writtenSessions.get(s.id) === s) continue
            const at = createdAt.get(s.id) ?? new Date().toISOString()
            records.push({ store: 'sessions', value: sessionToRecord(s, at) })
            sessions.push(s)
            createdAt.set(s.id, at)
          }
        } catch (err) {
          report(err)
          return
        }
        if (records.length) {
          const { record: draft, key } = currentDraft()
          // After a failure, wait for the user's work to change before retrying (an error toast alone
          // must not trigger another attempt). Draft-only writes also wait, so the stored draft keeps
          // holding the unsaved work.
          if (failedAt === key) return
          entries.forEach(e => writtenEntries.set(e.id, e))
          sessions.forEach(s => writtenSessions.set(s.id, s))
          lastDraft = key
          records.push({ store: 'drafts', value: draft })
          // One transaction: if it fails, nothing in it was stored and records already on the device
          // are untouched. Forget these records so a later change retries them.
          recordWrite = enqueue(() => db.putAll(records).then(() => { failedAt = null }), () => {
            entries.forEach(e => writtenEntries.delete(e.id))
            sessions.forEach(s => writtenSessions.delete(s.id))
            lastDraft = ''
            failedAt = key
          })
          return
        }
        if (draftQueued) return
        draftQueued = true
        void enqueue(async () => {
          draftQueued = false
          // While a saved record hasn't reached the device, the stored draft must keep the unsaved work.
          if (hasUnsaved()) return
          const draft = changedDraft()
          if (draft) await db.put('drafts', draft)
        }, () => {
          lastDraft = ''
        })
      }

      // Confirm a save only once it has committed; a failed write shows the error instead.
      logic.saveAnnouncer = message => {
        const write = recordWrite
        if (!write) return logic.toast(message)
        void write.then(ok => {
          if (ok && !detached) logic.toast(message)
        })
      }

      // A write commits within milliseconds, but leaving the page during that window would abort it.
      const onBeforeUnload = (event: BeforeUnloadEvent) => {
        if (pending > 0) event.preventDefault()
      }

      const unsubscribe = logic.subscribe(onChange)
      window.addEventListener('beforeunload', onBeforeUnload)
      if (problems.length) logic.toast(MESSAGES.unreadable(problems.length))

      return () => {
        detached = true
        unsubscribe()
        window.removeEventListener('beforeunload', onBeforeUnload)
        if (logic.saveAnnouncer) logic.saveAnnouncer = undefined
      }
    },
  }
}
