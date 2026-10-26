// A saved tasting is a dated account of what someone perceived. Anosmia is a longitudinal journal,
// so that account is never rewritten: the six sensory observations, the enjoyment rating, the personal
// notes and the tasting date are fixed once saved. A new tasting (e.g. "Taste it again") is a new,
// independently dated record.
//
// What CAN be corrected after saving is what the wine was (its identity) and its photograph. Those are
// not part of the account, so they are not compared here.
import type { Entry, SensKey } from './AnosmiaLogic'

const SENSATIONS: readonly SensKey[] = ['sweet', 'acid', 'tannin', 'body', 'warm', 'finish']

export class HistoryError extends Error {
  name = 'HistoryError'
}

export const HISTORY_MESSAGE = 'A saved tasting’s original account can’t be changed. Taste it again to record a new one.'

/** True when `b` still carries exactly the original account of `a`. */
export function sameHistory(a: Entry, b: Entry): boolean {
  return a.id === b.id
    && a.date === b.date
    && a.notes === b.notes
    && a.enjoy === b.enjoy
    && !!a.sample === !!b.sample
    && SENSATIONS.every(k => a.obs[k] === b.obs[k])
}
