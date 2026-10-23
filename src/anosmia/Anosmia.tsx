import { useEffect, useLayoutEffect, useRef } from 'react'
import { LabelCamera } from '../camera/LabelCamera'
import { useDCLogic } from '../dc/DCLogic'
import { referencedPhotoIds, type Persistence } from '../data/persistence'
import { AnosmiaLogic, type PhotoTarget, type Props } from './AnosmiaLogic'
import { AnosmiaView } from './AnosmiaView'
import { revealActiveRow } from './revealActiveRow'

// Defaults match the prototype's declared props.
const DEFAULTS: Props = { device: '390 × 844', startScreen: 'welcome' }

const SUBJECT: Record<PhotoTarget, string> = { tasting: 'this tasting', a: 'glass A', b: 'glass B', glasses: 'the glasses' }

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
    overlay = (
      <LabelCamera
        key={target}
        subject={SUBJECT[target]}
        hasExisting={!!current}
        existingUrl={current ? photos.url(current) : null}
        // Before a blind comparison is saved, its label and glasses photos are never shown.
        hideExisting={target !== 'tasting' && !!st.ab?.blind}
        onUse={async blob => {
          const id = await photos.add(blob)
          logic.applyPhoto(id)
          release(current)
        }}
        onRemove={() => {
          logic.applyPhoto(null)
          release(current)
        }}
        onClose={() => logic.setState({ camera: false })}
      />
    )
  }
  return <AnosmiaView v={logic.renderVals()} overlay={overlay} />
}
