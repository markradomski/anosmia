// Connects the ported logic to IndexedDB without changing how the logic works.
// Records are loaded before the first render. Afterwards the connector watches state:
// - an entry or session that appears in the journal is written together with the updated draft, in
//   one transaction, so a reopened app can never resume a tasting that is already saved;
// - other draft changes are written as soon as possible, coalesced while a write is in flight.
import type { AnosmiaLogic, Entry, Session, State } from '../anosmia/AnosmiaLogic'
import { draftToState, entryToRecord, recordToEntry, recordToSession, sessionToRecord, stateToDraft } from './codec'
import { Db, openDb } from './db'

export interface Persistence {
  /** State to start the logic with: the real journal and sessions, plus any restored draft. */
  initial: Partial<State>
  /** Start writing changes. Returns a cleanup function. */
  attach(logic: AnosmiaLogic): () => void
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
    attach(logic) {
      logic.toast(MESSAGES.unavailable)
      return () => {}
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

  // What is already stored, by id, so only new or changed objects are written.
  const createdAt = new Map<string, string>([...entries, ...sess].map(x => [(x.value as { id: string }).id, x.createdAt]))
  const writtenEntries = new Map<string, Entry>(journal.map(e => [e.id, e]))
  const writtenSessions = new Map<string, Session>(sessionList.map(s => [s.id, s]))

  return {
    initial: { journal, sessions: sessionList, ...draft },
    attach(logic) {
      let queue = Promise.resolve()
      let lastDraft = ''
      let draftQueued = false
      let detached = false

      const report = (err: unknown) => {
        console.error('[anosmia] save failed:', err)
        if (!detached) logic.toast(MESSAGES.writeFailed)
      }
      const enqueue = (write: () => Promise<void>) => {
        queue = queue.then(write).catch(report)
      }

      /** The current draft, or null when it is unchanged since the last write. */
      const changedDraft = () => {
        const record = stateToDraft(logic.state, new Date().toISOString())
        const key = JSON.stringify({ ...record, savedAt: '' })
        if (key === lastDraft) return null
        lastDraft = key
        return record
      }

      const onChange = () => {
        const st = logic.state
        const records: Parameters<Db['putAll']>[0] = []
        try {
          for (const e of st.journal ?? []) {
            if (writtenEntries.get(e.id) === e) continue
            const at = createdAt.get(e.id) ?? new Date().toISOString()
            records.push({ store: 'tastings', value: entryToRecord(e, at) })
            writtenEntries.set(e.id, e)
            createdAt.set(e.id, at)
          }
          for (const s of st.sessions ?? []) {
            if (writtenSessions.get(s.id) === s) continue
            const at = createdAt.get(s.id) ?? new Date().toISOString()
            records.push({ store: 'sessions', value: sessionToRecord(s, at) })
            writtenSessions.set(s.id, s)
            createdAt.set(s.id, at)
          }
        } catch (err) {
          report(err)
          return
        }
        if (records.length) {
          const draft = changedDraft()
          if (draft) records.push({ store: 'drafts', value: draft })
          enqueue(() => db.putAll(records))
          return
        }
        if (draftQueued) return
        draftQueued = true
        enqueue(async () => {
          draftQueued = false
          const draft = changedDraft()
          if (draft) await db.put('drafts', draft)
        })
      }

      const unsubscribe = logic.subscribe(onChange)
      if (problems.length) logic.toast(MESSAGES.unreadable(problems.length))

      return () => {
        detached = true
        unsubscribe()
      }
    },
  }
}
