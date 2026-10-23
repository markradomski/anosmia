import { useEffect } from 'react'
import { LabelCamera } from '../camera/LabelCamera'
import { useDCLogic } from '../dc/DCLogic'
import { referencedPhotoIds, type Persistence } from '../data/persistence'
import { AnosmiaLogic, type PhotoTarget, type Props } from './AnosmiaLogic'
import { AnosmiaView } from './AnosmiaView'

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
