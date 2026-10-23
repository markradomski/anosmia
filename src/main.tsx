import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'
import './styles/prototype.css'
import './styles/app.css'
import { Anosmia } from './anosmia/Anosmia'
import { startPersistence } from './data/persistence'

// URL parameters:
//   (none)           the app, filling the screen, with the real journal saved on this device
//   ?device=430x932  the prototype's fixed device frame, as in its editor props
//   ?demo            the prototype's sample journal in its fixed frame, kept in memory only (nothing is saved)
//   ?demo&screen=abReview  demo only: open one of the prototype's demo states
const params = new URLSearchParams(location.search)
const device = params.get('device')?.replace(/\s*[x×]\s*/, ' × ') ?? undefined
const demo = params.has('demo')
const startScreen = demo ? params.get('screen') ?? undefined : undefined
const fill = !demo && !device

async function boot() {
  const persistence = demo ? undefined : await startPersistence()
  const app = <Anosmia device={device} startScreen={startScreen} demo={demo} fill={fill} persistence={persistence} />
  createRoot(document.getElementById('root')!).render(
    <StrictMode>{fill ? <div className="app-shell">{app}</div> : app}</StrictMode>,
  )
}

void boot()
