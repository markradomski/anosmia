// Label photography. Replaces the prototype's simulated camera in normal mode, keeping its look:
// the same dark full-screen sheet, viewfinder, corner guides, shutter and bottom sheet.
// Uses the phone camera when the browser allows it, and always offers choosing an image instead.
// Nothing leaves the device; there is no label recognition.
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { PhotoError } from '../data/photos'

type Stage =
  | { kind: 'existing' }
  | { kind: 'live' }
  | { kind: 'review'; blob: Blob; url: string }
  | { kind: 'problem'; reason: 'denied' | 'unavailable' }

export interface LabelCameraProps {
  /** What is being photographed, e.g. "this tasting" or "glass A". */
  subject: string
  /** The current photo's URL, when one exists and may be shown. */
  existingUrl: string | null
  /** A photo exists (it may be hidden or still loading). */
  hasExisting: boolean
  /** Blind comparison before the reveal: never show an existing photo. */
  hideExisting: boolean
  onUse: (blob: Blob) => Promise<void>
  onRemove: () => void
  onClose: () => void
}

const S = {
  section: { position: 'absolute', inset: 0, zIndex: 50, background: '#120D0E', color: '#FBF6EA', display: 'flex', flexDirection: 'column' },
  header: { padding: '18px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  viewfinder: { flex: 1, position: 'relative', margin: '0 20px', borderRadius: '20px', overflow: 'hidden', background: 'radial-gradient(80% 60% at 50% 38%, #4A342C, #120D0E)' },
  fill: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' },
  hint: { position: 'absolute', left: 0, right: 0, bottom: '14px', margin: 0, textAlign: 'center', fontSize: '13px', color: '#EADFC6' },
  message: { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '24px', textAlign: 'center', fontSize: '15px', lineHeight: 1.4, color: '#EADFC6' },
  controls: { height: '150px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0 24px env(safe-area-inset-bottom, 0px)' },
  textButton: { height: '48px', border: 0, background: 'transparent', color: '#FBF6EA', fontWeight: 600, fontSize: '15px' },
  shutter: { width: '80px', height: '80px', borderRadius: '50%', border: '4px solid #FBF6EA', background: '#F2CF5B', boxShadow: 'inset 0 0 0 4px #120D0E' },
  sheet: { marginTop: '14px', background: '#FBF6EA', color: '#1E1416', padding: '18px 16px calc(18px + env(safe-area-inset-bottom, 0px))', borderRadius: '22px 22px 0 0', display: 'flex', flexDirection: 'column', gap: '10px' },
  sheetLabel: { fontSize: '10.5px', color: '#5A1427' },
  sheetTitle: { margin: 0, fontSize: '23px', lineHeight: 1.1, fontWeight: 800 },
  sheetText: { margin: 0, fontSize: '13px', color: '#5E4E49' },
  primary: { height: '58px', borderRadius: '18px', border: '1.5px solid #1E1416', background: '#F2CF5B', fontWeight: 700, fontSize: '16px' },
  secondary: { height: '52px', borderRadius: '18px', border: '1.5px solid #1E1416', background: 'transparent', fontWeight: 600, fontSize: '15px' },
  error: { margin: 0, fontSize: '13px', color: '#7E1F35', fontWeight: 600 },
} satisfies Record<string, CSSProperties>

const corner = (pos: CSSProperties, sides: CSSProperties): CSSProperties => ({ position: 'absolute', width: '26px', height: '26px', ...pos, ...sides })
const LINE = '3px solid #F2CF5B'

const PROBLEM = {
  denied: 'Camera access is blocked for Anosmia. You can allow it in your browser’s site settings, or choose a photo instead.',
  unavailable: 'No camera is available here. You can choose a photo instead.',
}

/** The live viewfinder, or straight to "unavailable" when the browser has no camera API (e.g. not HTTPS). */
const liveStage = (): Stage =>
  typeof (navigator.mediaDevices as MediaDevices | undefined)?.getUserMedia === 'function' ? { kind: 'live' } : { kind: 'problem', reason: 'unavailable' }

function problemFor(err: unknown): 'denied' | 'unavailable' {
  const name = err instanceof DOMException ? err.name : ''
  return name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable'
}

export function LabelCamera({ subject, existingUrl, hasExisting, hideExisting, onUse, onRemove, onClose }: LabelCameraProps) {
  const [stage, setStage] = useState<Stage>(() => (hasExisting ? { kind: 'existing' } : liveStage()))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const video = useRef<HTMLVideoElement>(null)
  const file = useRef<HTMLInputElement>(null)

  // Start the camera while the live viewfinder is showing; always release it afterwards.
  useEffect(() => {
    if (stage.kind !== 'live') return
    let stream: MediaStream | null = null
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false })
      .then(s => {
        if (cancelled) return s.getTracks().forEach(t => t.stop())
        stream = s
        if (video.current) video.current.srcObject = s
      })
      .catch(err => {
        if (!cancelled) setStage({ kind: 'problem', reason: problemFor(err) })
      })
    return () => {
      cancelled = true
      stream?.getTracks().forEach(t => t.stop())
    }
  }, [stage.kind])

  // Free the preview's object URL when it is replaced or the camera closes.
  useEffect(() => (stage.kind === 'review' ? () => URL.revokeObjectURL(stage.url) : undefined), [stage])

  const review = (blob: Blob) => {
    setError('')
    setStage({ kind: 'review', blob, url: URL.createObjectURL(blob) })
  }

  const capture = () => {
    const v = video.current
    if (!v || !v.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth
    canvas.height = v.videoHeight
    canvas.getContext('2d')!.drawImage(v, 0, 0)
    canvas.toBlob(blob => blob && review(blob), 'image/jpeg', 0.92)
  }

  const chosen = (files: FileList | null) => {
    const f = files?.[0]
    if (file.current) file.current.value = ''
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('That file isn’t an image.')
      return
    }
    review(f)
  }

  const use = async () => {
    if (stage.kind !== 'review' || busy) return
    setBusy(true)
    setError('')
    try {
      await onUse(stage.blob)
    } catch (err) {
      setError(err instanceof PhotoError ? err.message : 'The photo couldn’t be saved.')
      setBusy(false)
    }
  }

  const chooseButton = (
    <button type="button" onClick={() => file.current?.click()} style={{ ...S.textButton, justifySelf: 'end' }}>
      Choose photo
    </button>
  )

  return (
    <section className="fade" role="dialog" aria-label="Label photo" style={S.section}>
      <input ref={file} type="file" accept="image/*" hidden onChange={e => chosen(e.target.files)} data-testid="label-photo-file" />
      <div style={S.header}>
        <span className="f-mono" style={{ fontSize: '10.5px' }}>Label photo</span>
        <span className="f-mono" style={{ fontSize: '9.5px', color: '#CDBFA6' }}>Stays on this device</span>
      </div>

      <div style={S.viewfinder}>
        {stage.kind === 'live' && (
          <>
            <video ref={video} autoPlay playsInline muted aria-label="Camera viewfinder" style={S.fill} />
            <span aria-hidden="true" style={corner({ left: '22%', top: '30%' }, { borderLeft: LINE, borderTop: LINE })} />
            <span aria-hidden="true" style={corner({ right: '22%', top: '30%' }, { borderRight: LINE, borderTop: LINE })} />
            <span aria-hidden="true" style={corner({ left: '22%', top: 'calc(34% + 186px)' }, { borderLeft: LINE, borderBottom: LINE })} />
            <span aria-hidden="true" style={corner({ right: '22%', top: 'calc(34% + 186px)' }, { borderRight: LINE, borderBottom: LINE })} />
            <p style={S.hint}>Fill the frame with the front label.</p>
          </>
        )}
        {stage.kind === 'review' && <img src={stage.url} alt="Label photo preview" style={{ ...S.fill, objectFit: 'contain' }} />}
        {stage.kind === 'existing' && (hideExisting
          ? <p style={S.message}>This photo stays hidden until the comparison is saved.</p>
          : existingUrl ? <img src={existingUrl} alt={`Label photo for ${subject}`} style={{ ...S.fill, objectFit: 'contain' }} /> : null)}
        {stage.kind === 'problem' && <p role="alert" style={S.message}>{PROBLEM[stage.reason]}</p>}
      </div>

      {(stage.kind === 'live' || stage.kind === 'problem') && (
        <div style={S.controls}>
          <button type="button" onClick={onClose} style={{ ...S.textButton, justifySelf: 'start' }}>Cancel</button>
          {stage.kind === 'live'
            ? <button type="button" aria-label="Take photo" onClick={capture} className="press" style={S.shutter} />
            : <span />}
          {chooseButton}
        </div>
      )}

      {stage.kind === 'review' && (
        <div className="rise" style={S.sheet}>
          <span className="f-mono" style={S.sheetLabel}>Label photo · {subject}</span>
          <h2 className="f-disp" style={S.sheetTitle}>Keep this photo?</h2>
          <p style={S.sheetText}>It stays on this device. Nothing is uploaded.</p>
          {error && <p role="alert" style={S.error}>{error}</p>}
          <button type="button" className="press" onClick={use} disabled={busy} style={S.primary}>{busy ? 'Saving…' : 'Use photo'}</button>
          <button type="button" onClick={() => setStage(liveStage())} disabled={busy} style={S.secondary}>Retake</button>
        </div>
      )}

      {stage.kind === 'existing' && (
        <div className="rise" style={S.sheet}>
          <span className="f-mono" style={S.sheetLabel}>Label photo · {subject}</span>
          <h2 className="f-disp" style={S.sheetTitle}>Keep, retake or remove.</h2>
          {error && <p role="alert" style={S.error}>{error}</p>}
          <button type="button" className="press" onClick={onClose} style={S.primary}>Keep it</button>
          <button type="button" onClick={() => setStage(liveStage())} style={S.secondary}>Retake</button>
          <button type="button" onClick={onRemove} style={S.secondary}>Remove photo</button>
        </div>
      )}
      {error && stage.kind !== 'review' && stage.kind !== 'existing' && <p role="alert" style={{ ...S.error, color: '#F2CF5B', textAlign: 'center', margin: '0 0 8px' }}>{error}</p>}
    </section>
  )
}
