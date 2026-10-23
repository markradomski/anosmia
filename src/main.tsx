import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'
import './styles/prototype.css'
import { Anosmia } from './anosmia/Anosmia'
import { startPersistence } from './data/persistence'

// URL parameters:
//   ?device=430x932  frame size, as in the prototype's editor props
//   ?demo            the prototype's sample journal, kept in memory only (nothing is saved)
//   ?demo&screen=abReview  demo only: open one of the prototype's demo states
const params = new URLSearchParams(location.search)
const device = params.get('device')?.replace(/\s*[x×]\s*/, ' × ') ?? undefined
const demo = params.has('demo')
const startScreen = demo ? params.get('screen') ?? undefined : undefined

async function boot() {
  const persistence = demo ? undefined : await startPersistence()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Anosmia device={device} startScreen={startScreen} demo={demo} persistence={persistence} />
    </StrictMode>,
  )
}

void boot()
