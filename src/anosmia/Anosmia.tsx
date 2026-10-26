import { useEffect, useLayoutEffect, useRef } from 'react'
import { LabelCamera } from '../camera/LabelCamera'
import { useDCLogic } from '../dc/DCLogic'
import { WineDetailsSheet, SAVE_FAILED } from '../edit/WineDetailsSheet'
import { PhotoError } from '../data/photos'
import { referencedPhotoIds, type Persistence } from '../data/persistence'
import { AnosmiaLogic, type PhotoTarget, type Props } from './AnosmiaLogic'
import { AnosmiaView } from './AnosmiaView'
import { revealActiveRow } from './revealActiveRow'

// Defaults match the prototype's declared props.
const DEFAULTS: Props = { device: '390 × 844', startScreen: 'welcome' }

const SUBJECT: Record<PhotoTarget, string> = { tasting: 'this tasting', a: 'glass A', b: 'glass B', glasses: 'the glasses', entry: 'this tasting' }

export function Anosmia({ persistence, ...props }: Props & { persistence?: Persistence }) {
  const photos = persistence?.photos
  const logic = useDCLogic(() => {
    const created = new AnosmiaLogic({ ...DEFAULTS, ...props, photos })
    if (persistence) created.state = { ...created.state, ...persistence.initial }
    return created
  })
  useEffect(() => persistence?.attach(logic), [logic, persistence])
  useEffect(() => photos?.subscribe(() => logic.setState({})), [logic, photos])

  const st = logic.state

  // Keep the active sensation visible above the thumb dock whenever it changes (auto-advance,
  // Previous/Next, tapping a row) or the record screen opens. Instant on arrival, smooth within it.
  const activeRow = st.screen === 'record' ? 'record:' + st.focus : st.screen === 'abRecord' ? 'ab:' + st.ab?.focus : null
  const lastScreen = useRef<string | null>(null)
  useLayoutEffect(() => {
    const screen = activeRow && activeRow.split(':')[0]
    if (activeRow) revealActiveRow(document, lastScreen.current === screen)
    lastScreen.current = screen
  }, [activeRow])
  useEffect(() => {
    if (!activeRow) return
    // The usable height can change under the user (browser toolbars, rotation).
    const onResize = () => revealActiveRow(document, false)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [activeRow])

  let overlay = null
  if (photos && st.camera) {
    const target = st.camTarget
    const current = logic.photoForTarget()
    // Replacing or removing a photo deletes the old one unless a saved record still uses it.
    const release = (id: string | null) => {
      if (id) photos.release(id, referencedPhotoIds(logic.state)).catch(err => console.error('[anosmia] photo not released:', err))
    }
    // A saved tasting changes only once the new photo is stored and the tasting's record is on the
    // device. If either fails, the tasting keeps its previous photo and the sheet says so.
    const changeEntryPhoto = async (photoId: string | null) => {
      const entryId = logic.currentEntry()?.id
      if (!entryId) throw new PhotoError('failed', 'This tasting couldn’t be found.')
      const { ok, previous } = await logic.changeEntryPhoto(entryId, photoId)
      if (!ok) {
        release(photoId)
        throw new PhotoError('failed', 'The photo couldn’t be saved. Your previous photo is unchanged.')
      }
      logic.setState({ camera: false })
      release(previous)
    }
    overlay = (
      <LabelCamera
        key={target}
        subject={SUBJECT[target]}
        hasExisting={!!current}
        existingUrl={current ? photos.url(current) : null}
        existingMissing={!!current && photos.photo(current) === 'missing'}
        confirmRemove={target === 'entry'}
        // Before a blind comparison is saved, its label and glasses photos are never shown.
        hideExisting={(target === 'a' || target === 'b' || target === 'glasses') && !!st.ab?.blind}
        onUse={async blob => {
          const id = await photos.add(blob)
          if (target === 'entry') return changeEntryPhoto(id)
          logic.applyPhoto(id)
          release(current)
        }}
        onRemove={() => {
          if (target === 'entry') return changeEntryPhoto(null)
          logic.applyPhoto(null)
          release(current)
        }}
        onClose={() => logic.setState({ camera: false })}
      />
    )
  }
  // Correcting what the wine was on a saved tasting. The change counts as done only once it is on the
  // device; if it can't be stored the tasting keeps its previous details and the sheet offers a retry.
  if (!overlay && photos && st.editingWine && st.screen === 'entry') {
    const entry = logic.currentEntry()
    if (entry) {
      overlay = (
        <WineDetailsSheet
          key={entry.id}
          entry={entry}
          onSave={async edit => {
            if (!(await logic.editWineDetails(entry.id, edit))) throw new Error(SAVE_FAILED)
            logic.setState({ editingWine: false })
            logic.toast('Wine details saved.')
          }}
          onClose={() => logic.setState({ editingWine: false })}
        />
      )
    }
  }
  return <AnosmiaView v={logic.renderVals()} overlay={overlay} />
}
