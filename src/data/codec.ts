// Conversion between the prototype's in-memory values and the persisted model.
// Every function is exhaustive and throws CodecError on anything unexpected rather than coercing it:
// an observation is never silently reinterpreted on its way in or out of storage.
import type {
  AbDraft, AbValue, Entry, ObsValue, Obs, Pref, Screen, Session, SensKey, Slot, State, Wine,
} from '../anosmia/AnosmiaLogic'
import {
  SCHEMA_VERSION, type DraftRecord, type Observations, type RelativeAnswers, type SessionRecord,
  type StoredAbDraft, type StoredPhoto, type StoredRelative, type StoredSensory, type StoredSlot,
  type StoredWine, type TastingRecord,
} from './model'

export class CodecError extends Error {
  name = 'CodecError'
}

export const SENS_KEYS: readonly SensKey[] = ['sweet', 'acid', 'tannin', 'body', 'warm', 'finish']
const PREFS: readonly Pref[] = ['A', 'B', 'both', 'neither', 'undecided']
const SCREENS: readonly Screen[] = ['welcome', 'find', 'record', 'summary', 'journal', 'entry', 'compare',
  'abSetup', 'abRecord', 'abReview', 'abView']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const fail = (msg: string): never => {
  throw new CodecError(msg)
}
const isObject = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)
const str = (x: unknown, what: string): string => (typeof x === 'string' ? x : fail(`${what}: expected a string`))
const strOrNull = (x: unknown, what: string): string | null => (x === null ? null : str(x, what))

/** The journal's display date, in the same format the prototype's today() produces. */
export function displayDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) fail(`invalid date ${JSON.stringify(iso)}`)
  return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear()
}

// ---------- sensory observations ----------

export function sensoryToStored(v: ObsValue, what = 'observation'): StoredSensory {
  if (v === null) return { state: 'unanswered' }
  if (v === 'none') return { state: 'not_detected' }
  if (v === 'unsure') return { state: 'cant_tell' }
  if (v === 1 || v === 2 || v === 3 || v === 4) return { state: 'level', level: v }
  return fail(`${what}: unknown value ${JSON.stringify(v)}`)
}

export function sensoryFromStored(s: unknown, what = 'observation'): ObsValue {
  if (!isObject(s)) return fail(`${what}: expected an object`)
  switch (s.state) {
    case 'unanswered': return null
    case 'not_detected': return 'none'
    case 'cant_tell': return 'unsure'
    case 'level':
      if (s.level === 1 || s.level === 2 || s.level === 3 || s.level === 4) return s.level
      return fail(`${what}: level must be 1–4, got ${JSON.stringify(s.level)}`)
    default: return fail(`${what}: unknown state ${JSON.stringify(s.state)}`)
  }
}

export function observationsToStored(obs: Obs): Observations {
  return Object.fromEntries(SENS_KEYS.map(k => [k, sensoryToStored(obs[k], k)])) as Observations
}

export function observationsFromStored(o: unknown): Obs {
  if (!isObject(o)) return fail('observations: expected an object')
  return Object.fromEntries(SENS_KEYS.map(k => [k, sensoryFromStored(o[k], k)])) as Obs
}

// ---------- relative (A/B) answers ----------

export function relativeToStored(v: AbValue, what = 'answer'): StoredRelative {
  if (v === null) return 'unanswered'
  if (v === 'unsure') return 'cant_tell'
  if (v === 'A' || v === 'B' || v === 'same') return v
  return fail(`${what}: unknown value ${JSON.stringify(v)}`)
}

export function relativeFromStored(s: unknown, what = 'answer'): AbValue {
  if (s === 'unanswered') return null
  if (s === 'cant_tell') return 'unsure'
  if (s === 'A' || s === 'B' || s === 'same') return s
  return fail(`${what}: unknown state ${JSON.stringify(s)}`)
}

const answersToStored = (ans: Record<SensKey, AbValue>): RelativeAnswers =>
  Object.fromEntries(SENS_KEYS.map(k => [k, relativeToStored(ans[k], k)])) as RelativeAnswers

const answersFromStored = (o: unknown): Record<SensKey, AbValue> => {
  if (!isObject(o)) return fail('answers: expected an object')
  return Object.fromEntries(SENS_KEYS.map(k => [k, relativeFromStored(o[k], k)])) as Record<SensKey, AbValue>
}

// ---------- wines, photos, slots ----------

export function wineToStored(w: Wine | null): StoredWine | null {
  if (!w) return null
  return { id: w.id, name: w.name, short: w.short, producer: w.producer, variety: w.variety,
    vintage: w.vintage, region: w.region, source: w.custom ? 'manual' : 'catalogue' }
}

export function wineFromStored(w: unknown): Wine | null {
  if (w === null) return null
  if (!isObject(w)) return fail('wine: expected an object or null')
  if (w.source !== 'catalogue' && w.source !== 'manual') fail(`wine: unknown source ${JSON.stringify(w.source)}`)
  const wine: Wine = { id: str(w.id, 'wine.id'), name: str(w.name, 'wine.name'), short: str(w.short, 'wine.short'),
    producer: str(w.producer, 'wine.producer'), variety: str(w.variety, 'wine.variety'),
    vintage: str(w.vintage, 'wine.vintage'), region: str(w.region, 'wine.region') }
  if (w.source === 'manual') wine.custom = true
  return wine
}

/** The prototype only knows whether a photo was taken (its camera is simulated). */
export const photoToStored = (taken: boolean): StoredPhoto => (taken ? { kind: 'simulated' } : { kind: 'none' })

export function photoFromStored(p: unknown): boolean {
  if (!isObject(p)) return fail('photo: expected an object')
  if (p.kind === 'none') return false
  if (p.kind === 'simulated') return true
  if (p.kind === 'image') return (str(p.photoId, 'photo.photoId'), true)
  return fail(`photo: unknown kind ${JSON.stringify(p.kind)}`)
}

const slotToStored = (s: Slot): StoredSlot => ({ wine: wineToStored(s.wine), name: s.name, photo: photoToStored(s.photo) })

const slotFromStored = (s: unknown, what: string): Slot => {
  if (!isObject(s)) return fail(`${what}: expected an object`)
  return { wine: wineFromStored(s.wine), name: strOrNull(s.name, `${what}.name`), photo: photoFromStored(s.photo) }
}

const prefFromStored = (p: unknown): Pref | null =>
  p === null ? null : PREFS.includes(p as Pref) ? (p as Pref) : fail(`preference: unknown value ${JSON.stringify(p)}`)

const enjoymentToStored = (n: number | null): TastingRecord['enjoyment'] =>
  n === null || n === 1 || n === 2 || n === 3 || n === 4 || n === 5 ? n : fail(`enjoyment: must be 1–5 or null, got ${n}`)

const modeFromStored = (m: unknown): boolean =>
  m === 'blind' ? true : m === 'open' ? false : fail(`mode: unknown value ${JSON.stringify(m)}`)

const checkSchema = (r: Record<string, unknown>, what: string) => {
  if (r.schema !== SCHEMA_VERSION) fail(`${what}: unsupported schema ${JSON.stringify(r.schema)}`)
}

// ---------- saved tastings ----------

export function entryToRecord(e: Entry, createdAt: string): TastingRecord {
  return { schema: SCHEMA_VERSION, id: e.id, createdAt, wine: wineToStored(e.wine), title: e.title ?? null,
    photo: photoToStored(e.photo), observations: observationsToStored(e.obs), notes: e.notes,
    enjoyment: enjoymentToStored(e.enjoy), origin: e.sample ? 'sample' : 'user' }
}

export function recordToEntry(raw: unknown): Entry {
  if (!isObject(raw)) return fail('tasting: expected an object')
  checkSchema(raw, 'tasting')
  const id = str(raw.id, 'tasting.id')
  try {
    const createdAt = str(raw.createdAt, 'createdAt')
    if (raw.origin !== 'user' && raw.origin !== 'sample') fail(`origin: unknown value ${JSON.stringify(raw.origin)}`)
    const entry: Entry = { id, wine: wineFromStored(raw.wine), title: strOrNull(raw.title, 'title'),
      photo: photoFromStored(raw.photo), date: displayDate(createdAt), obs: observationsFromStored(raw.observations),
      notes: str(raw.notes, 'notes'), enjoy: enjoymentToStored(raw.enjoyment as number | null) }
    if (raw.origin === 'sample') entry.sample = true
    return entry
  } catch (err) {
    throw new CodecError(`tasting ${id}: ${(err as Error).message}`)
  }
}

// ---------- saved A/B sessions ----------

export function sessionToRecord(s: Session, createdAt: string): SessionRecord {
  return { schema: SCHEMA_VERSION, id: s.id, createdAt, a: slotToStored(s.a), b: slotToStored(s.b),
    mode: s.blind ? 'blind' : 'open', glassesPhoto: photoToStored(s.glassPhoto), answers: answersToStored(s.ans),
    preference: s.pref, notes: s.notes, repeatOf: s.repeatOf }
}

export function recordToSession(raw: unknown): Session {
  if (!isObject(raw)) return fail('session: expected an object')
  checkSchema(raw, 'session')
  const id = str(raw.id, 'session.id')
  try {
    return { id, date: displayDate(str(raw.createdAt, 'createdAt')), a: slotFromStored(raw.a, 'a'),
      b: slotFromStored(raw.b, 'b'), blind: modeFromStored(raw.mode), glassPhoto: photoFromStored(raw.glassesPhoto),
      ans: answersFromStored(raw.answers), pref: prefFromStored(raw.preference), notes: str(raw.notes, 'notes'),
      repeatOf: strOrNull(raw.repeatOf, 'repeatOf') }
  } catch (err) {
    throw new CodecError(`session ${id}: ${(err as Error).message}`)
  }
}

// ---------- the resumable draft ----------

const abDraftToStored = (ab: AbDraft): StoredAbDraft => ({ a: slotToStored(ab.a), b: slotToStored(ab.b),
  mode: ab.blind ? 'blind' : 'open', glassesPhoto: photoToStored(ab.glassPhoto), answers: answersToStored(ab.ans),
  focus: ab.focus, preference: ab.pref, notes: ab.notes, repeatOf: ab.repeatOf, back: ab.back })

const sensKey = (k: unknown, what: string): SensKey =>
  SENS_KEYS.includes(k as SensKey) ? (k as SensKey) : fail(`${what}: unknown sensation ${JSON.stringify(k)}`)

const abDraftFromStored = (d: unknown): AbDraft | null => {
  if (d === null) return null
  if (!isObject(d)) return fail('ab: expected an object or null')
  return { a: slotFromStored(d.a, 'ab.a'), b: slotFromStored(d.b, 'ab.b'), blind: modeFromStored(d.mode),
    glassPhoto: photoFromStored(d.glassesPhoto), ans: answersFromStored(d.answers), focus: sensKey(d.focus, 'ab.focus'),
    pref: prefFromStored(d.preference), notes: str(d.notes, 'ab.notes'), repeatOf: strOrNull(d.repeatOf, 'ab.repeatOf'),
    back: str(d.back, 'ab.back') }
}

export function stateToDraft(st: State, savedAt: string): DraftRecord {
  return {
    key: 'current', schema: SCHEMA_VERSION, savedAt, screen: st.screen ?? 'welcome',
    nav: { entryId: st.entryId, compare: st.cmp ? [st.cmp[0], st.cmp[1]] : null, sessionId: st.sessionId,
      journalTab: st.jTab, returnTo: st.returnTo },
    tasting: { wine: wineToStored(st.wine), title: st.title, photo: photoToStored(st.photo), query: st.query,
      observations: observationsToStored(st.obs), focus: st.focus, notes: st.notes, enjoyment: enjoymentToStored(st.enjoy),
      repeatOf: st.repeatOf, sample: st.sample },
    ab: st.ab ? abDraftToStored(st.ab) : null,
  }
}

const screen = (s: unknown, what: string): Screen =>
  SCREENS.includes(s as Screen) ? (s as Screen) : fail(`${what}: unknown screen ${JSON.stringify(s)}`)

/** Decode a stored draft into a state patch. Throws CodecError if anything is malformed. */
export function draftToState(raw: unknown): Partial<State> {
  if (!isObject(raw)) return fail('draft: expected an object')
  checkSchema(raw, 'draft')
  const nav = isObject(raw.nav) ? raw.nav : fail('draft.nav: expected an object')
  const t = isObject(raw.tasting) ? raw.tasting : fail('draft.tasting: expected an object')
  const cmp = nav.compare === null ? null
    : Array.isArray(nav.compare) && nav.compare.length === 2 ? nav.compare.map(x => str(x, 'nav.compare')) : fail('nav.compare: expected a pair')
  if (nav.journalTab !== 'tastings' && nav.journalTab !== 'sessions') fail('nav.journalTab: unknown tab')
  if (typeof t.sample !== 'boolean') fail('tasting.sample: expected a boolean')
  return {
    screen: screen(raw.screen, 'draft.screen'),
    entryId: strOrNull(nav.entryId, 'nav.entryId'), cmp, sessionId: strOrNull(nav.sessionId, 'nav.sessionId'),
    jTab: nav.journalTab as State['jTab'], returnTo: nav.returnTo === null ? null : screen(nav.returnTo, 'nav.returnTo'),
    wine: wineFromStored(t.wine), title: strOrNull(t.title, 'tasting.title'), photo: photoFromStored(t.photo),
    query: str(t.query, 'tasting.query'), obs: observationsFromStored(t.observations), focus: sensKey(t.focus, 'tasting.focus'),
    notes: str(t.notes, 'tasting.notes'), enjoy: enjoymentToStored(t.enjoyment as number | null),
    repeatOf: strOrNull(t.repeatOf, 'tasting.repeatOf'), sample: t.sample as boolean,
    ab: abDraftFromStored(raw.ab),
  }
}
