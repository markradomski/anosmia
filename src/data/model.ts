// Persisted data model (IndexedDB, schema version 1).
//
// The ported logic keeps the prototype's in-memory values (see AnosmiaLogic.ts). What is stored is
// explicit instead: every sensory and relative answer names its state, so "not noticed",
// "can't tell" and "unanswered" can never collapse into 0 or null. Conversion lives in codec.ts.
import type { Pref, Screen, SensKey } from '../anosmia/AnosmiaLogic'

export const SCHEMA_VERSION = 1

/** One single-wine observation. */
export type StoredSensory =
  | { state: 'level'; level: 1 | 2 | 3 | 4 }
  | { state: 'not_detected' }
  | { state: 'cant_tell' }
  | { state: 'unanswered' }

/** One A/B answer: a direction, never a magnitude. */
export type StoredRelative = 'A' | 'B' | 'same' | 'cant_tell' | 'unanswered'

export type Observations = Record<SensKey, StoredSensory>
export type RelativeAnswers = Record<SensKey, StoredRelative>

/** A snapshot of the wine as it was identified when the record was made. */
export interface StoredWine {
  id: string
  name: string
  short: string
  producer: string
  variety: string
  vintage: string
  region: string
  /** 'catalogue' = picked from the in-app sample cellar; 'manual' = typed in by the user. */
  source: 'catalogue' | 'manual'
}

/**
 * Label photo. The prototype's camera is simulated, so today a photo is only a flag ('simulated').
 * 'image' points at a Blob in the photos store.
 */
export type StoredPhoto = { kind: 'none' } | { kind: 'simulated' } | { kind: 'image'; photoId: string }

export interface TastingRecord {
  schema: typeof SCHEMA_VERSION
  id: string
  /** ISO 8601 timestamp. The journal's display date is derived from it. */
  createdAt: string
  wine: StoredWine | null
  /** Display title for an unnamed wine (e.g. 'Unnamed wine'); null when a wine is identified. */
  title: string | null
  photo: StoredPhoto
  observations: Observations
  /** Verbatim user text. */
  notes: string
  /** "Would you pour another?" 1–5, kept apart from observations; null = not rated. */
  enjoyment: 1 | 2 | 3 | 4 | 5 | null
  /** 'sample' = saved from the built-in Sample tasting rather than tasted by the user. */
  origin: 'user' | 'sample'
}

export interface StoredSlot {
  wine: StoredWine | null
  /** Name typed for the glass when no catalogue wine was picked. */
  name: string | null
  photo: StoredPhoto
}

export interface SessionRecord {
  schema: typeof SCHEMA_VERSION
  id: string
  createdAt: string
  /** Glass A is on the left, glass B on the right. */
  a: StoredSlot
  b: StoredSlot
  /** 'blind' = someone else poured and named the glasses; 'open' = the taster knew which was which. */
  mode: 'open' | 'blind'
  glassesPhoto: StoredPhoto
  answers: RelativeAnswers
  preference: Pref | null
  notes: string
  /** The earlier session this one repeats, if any. */
  repeatOf: string | null
}

/** In-progress A/B comparison. */
export interface StoredAbDraft {
  a: StoredSlot
  b: StoredSlot
  mode: 'open' | 'blind'
  glassesPhoto: StoredPhoto
  answers: RelativeAnswers
  focus: SensKey
  preference: Pref | null
  notes: string
  repeatOf: string | null
  /** Screen to return to when leaving setup. */
  back: string
}

/**
 * The single resumable draft: the unsaved tasting, any unsaved A/B comparison, and where the user
 * was. Transient UI (open sheets, camera, guidance, reveal toggles) is deliberately not kept, so
 * reopening never re-exposes something the user had hidden.
 */
export interface DraftRecord {
  key: 'current'
  schema: typeof SCHEMA_VERSION
  savedAt: string
  screen: Screen
  nav: {
    entryId: string | null
    compare: [string, string] | null
    sessionId: string | null
    journalTab: 'tastings' | 'sessions'
    returnTo: Screen | null
  }
  tasting: {
    wine: StoredWine | null
    title: string | null
    photo: StoredPhoto
    query: string
    observations: Observations
    focus: SensKey
    notes: string
    enjoyment: 1 | 2 | 3 | 4 | 5 | null
    repeatOf: string | null
    sample: boolean
  }
  ab: StoredAbDraft | null
}

/** A locally stored label photo. */
export interface PhotoRecord {
  id: string
  createdAt: string
  blob: Blob
  type: string
}
