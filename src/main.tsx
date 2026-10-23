import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'
import './styles/prototype.css'
import { Anosmia } from './anosmia/Anosmia'

// The prototype's editor props, exposed as URL parameters: ?device=430x932&screen=abReview
const params = new URLSearchParams(location.search)
const device = params.get('device')?.replace(/\s*[x×]\s*/, ' × ') ?? undefined
const startScreen = params.get('screen') ?? undefined

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Anosmia device={device} startScreen={startScreen} />
  </StrictMode>,
)
