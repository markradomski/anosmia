// Editing a saved tasting's wine identity, using the fields a Wine already has (name, producer,
// variety, vintage). Nothing new is stored. Rules follow the existing "Type it in" form:
//   - a blank name falls back to "Untitled bottle", and a blank producer mirrors the name ("Unknown" if none);
//   - clearing every field returns the tasting to unidentified, which is a valid saved tasting.
import type { Wine } from './AnosmiaLogic'

export interface IdentityForm { name: string; producer: string; variety: string; vintage: string }

export const UNNAMED = 'Unnamed wine'
const UNTITLED = 'Untitled bottle'

/** What the edit sheet starts with. A typed-in wine mirrors its name into producer, which isn't shown as a producer. */
export function identityForm(wine: Wine | null, title?: string | null): IdentityForm {
  if (!wine) return { name: title && title !== UNNAMED ? title : '', producer: '', variety: '', vintage: '' }
  const mirrored = !!wine.custom && (wine.producer === wine.name || wine.producer === 'Unknown')
  return {
    name: wine.custom && wine.name === UNTITLED && wine.producer === 'Unknown' ? '' : wine.name,
    producer: mirrored ? '' : wine.producer,
    variety: wine.variety,
    vintage: wine.vintage,
  }
}

export interface IdentityResult {
  wine: Wine | null
  title: string | null
  /** False when the form describes the identity the tasting already has, so nothing needs writing. */
  changed: boolean
}

/**
 * The saved tasting's identity after applying the form. Always builds new objects (a Wine object can
 * be shared by tastings made with "Taste it again", so it is never edited in place).
 *
 * A catalogue wine whose details are changed becomes the user's own wine with a new id: it is no
 * longer the catalogue wine, so it must not keep that wine's earlier-notes links. A typed-in wine
 * keeps its id.
 */
export function applyIdentity(prevWine: Wine | null, prevTitle: string | null | undefined, form: IdentityForm, newId: () => string): IdentityResult {
  const f = { name: form.name.trim(), producer: form.producer.trim(), variety: form.variety.trim(), vintage: form.vintage.trim() }
  if (!f.name && !f.producer && !f.variety && !f.vintage) {
    return prevWine
      ? { wine: null, title: prevTitle || UNNAMED, changed: true }
      : { wine: null, title: prevTitle ?? UNNAMED, changed: false }
  }
  const name = f.name || UNTITLED
  const fields = { name, short: f.name || 'Untitled', producer: f.producer || f.name || 'Unknown', variety: f.variety, vintage: f.vintage }
  if (prevWine && prevWine.name === fields.name && prevWine.producer === fields.producer
    && prevWine.variety === fields.variety && prevWine.vintage === fields.vintage) {
    return { wine: prevWine, title: null, changed: false }
  }
  const wine: Wine = prevWine?.custom
    ? { ...prevWine, ...fields }
    : { id: newId(), ...fields, region: prevWine ? prevWine.region : 'Added by you', custom: true }
  return { wine, title: null, changed: true }
}

/** The "kind" chip a variety corresponds to, if it was set from a chip ("Red wine" → "Red"). */
export const kindOf = (variety: string) => variety.endsWith(' wine') ? variety.slice(0, -5) : null
