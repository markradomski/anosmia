// Correct what the wine was on a saved tasting: name, producer, variety, vintage and the "kind" chips.
// These are the fields a Wine already has (the chips write the same `variety: "Red wine"` the Type it
// in form does), so nothing new is stored. Only identity can be edited here; what the person
// experienced (sensations, enjoyment, notes, date) is the original account and is never editable.
// Same sheet look as the prototype's "Type it in" sheet.
import { useEffect, useState, type CSSProperties } from 'react'
import { WINE_TYPES, typeChipStyle } from '../anosmia/formStyles'
import { applyIdentity, identityForm, kindOf, type IdentityForm } from '../anosmia/identity'
import type { Entry, IdentityEdit } from '../anosmia/AnosmiaLogic'
import { css } from '../dc/css'

export const SAVE_FAILED = 'The changes couldn’t be saved. Your previous details are unchanged.'

export interface WineDetailsSheetProps {
  entry: Entry
  /** Store the change. Throw an Error with a message the user can read if it couldn't be saved; the sheet stays open to retry. */
  onSave: (edit: IdentityEdit) => Promise<void>
  onClose: () => void
}

const S = {
  backdrop: { position: 'absolute', inset: 0, border: 0, padding: 0, background: 'rgba(30,20,22,.45)', zIndex: 40 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 41, background: '#FBF6EA', borderRadius: '22px 22px 0 0', maxHeight: '92%', display: 'flex', flexDirection: 'column' },
  // Fields scroll when the keyboard shrinks the screen; the buttons below them never do.
  body: { overflowY: 'auto', padding: '20px 16px 8px', display: 'flex', flexDirection: 'column', gap: '12px' },
  footer: { padding: '10px 16px calc(18px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(30,20,22,.18)' },
  label: { fontSize: '13px', fontWeight: 600 },
  // flexShrink 0: inside the scrolling body, a height-limited sheet must scroll, not squash the fields.
  input: { flexShrink: 0, height: '52px', borderRadius: '14px', border: '1.5px solid #1E1416', background: '#F5ECD7', padding: '0 14px', fontSize: '16px' },
  primary: { height: '58px', borderRadius: '18px', border: '1.5px solid #1E1416', background: '#F2CF5B', fontWeight: 700, fontSize: '16px' },
  secondary: { height: '52px', borderRadius: '18px', border: '1.5px solid #1E1416', background: 'transparent', fontWeight: 600, fontSize: '15px' },
  error: { margin: 0, fontSize: '13px', color: '#7E1F35', fontWeight: 600 },
} satisfies Record<string, CSSProperties>

export function WineDetailsSheet({ entry, onSave, onClose }: WineDetailsSheetProps) {
  const [form, setForm] = useState<IdentityForm>(() => identityForm(entry.wine, entry.title))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (key: keyof IdentityForm) => (value: string) => setForm(f => ({ ...f, [key]: value }))

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  const save = async () => {
    if (busy) return
    const result = applyIdentity(entry.wine, entry.title, form, () => 'm' + Date.now())
    if (!result.changed) return onClose() // nothing to store
    setBusy(true)
    setError('')
    try {
      await onSave({ wine: result.wine, title: result.title })
    } catch (err) {
      setError(err instanceof Error ? err.message : SAVE_FAILED)
      setBusy(false)
    }
  }

  // When the on-screen keyboard opens the screen gets shorter; once it has settled, keep the field being typed in visible.
  const keepInView = (el: HTMLElement) => { window.setTimeout(() => el.scrollIntoView({ block: 'center' }), 300) }

  const field = (id: string, label: string, key: keyof IdentityForm, placeholder: string) => (
    <>
      <label htmlFor={id} style={S.label}>{label}</label>
      <input id={id} value={form[key]} onChange={e => set(key)(e.target.value)} onFocus={e => keepInView(e.currentTarget)}
        placeholder={placeholder} autoComplete="off" style={S.input} />
    </>
  )

  return (
    <>
      <button type="button" aria-label="Close" className="fade" onClick={onClose} disabled={busy} style={S.backdrop} />
      <section className="rise" role="dialog" aria-label="Edit wine details" style={S.sheet}>
        <div style={S.body}>
          <div className="f-mono" style={{ fontSize: '10.5px', color: '#5A1427' }}>Wine details</div>
          <h2 className="f-disp" style={{ margin: 0, fontSize: '25px', lineHeight: 1.08, fontWeight: 800 }}>What does the label say?</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#5E4E49' }}>
            Fix what the wine was. Everything is optional, and your sensations, notes, rating and date stay exactly as you recorded them.
          </p>
          {field('edit-name', 'Wine name', 'name', 'e.g. Dad’s cellar, bottom shelf')}
          {field('edit-producer', 'Producer', 'producer', 'e.g. Penfolds')}
          {field('edit-variety', 'Variety', 'variety', 'e.g. Shiraz')}
          {field('edit-vintage', 'Vintage', 'vintage', 'e.g. 2021 or NV')}
          <div style={{ ...S.label, marginTop: '2px' }}>Roughly what kind? <span style={{ fontWeight: 400, color: '#5E4E49' }}>Optional</span></div>
          <div role="group" aria-label="Kind of wine" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', flexShrink: 0 }}>
            {WINE_TYPES.map(kind => {
              const selected = kindOf(form.variety) === kind
              return (
                <button key={kind} type="button" aria-pressed={selected} ref={css(typeChipStyle(selected))}
                  onClick={() => set('variety')(selected ? '' : kind + ' wine')}>{kind}</button>
              )
            })}
          </div>
        </div>
        <div style={S.footer}>
          {error && <p role="alert" style={S.error}>{error}</p>}
          <button type="button" className="press" onClick={() => void save()} disabled={busy} style={S.primary}>{busy ? 'Saving…' : 'Save changes'}</button>
          <button type="button" onClick={onClose} disabled={busy} style={S.secondary}>Cancel</button>
        </div>
      </section>
    </>
  )
}
