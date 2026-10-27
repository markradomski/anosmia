import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AnosmiaLogic } from './AnosmiaLogic'
import { GUIDE_INTRO, readGuidePrefs } from './guidePrefs'

const store = new Map<string, string>()
const fake = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) }
const g = globalThis as { localStorage?: unknown }
beforeEach(() => { store.clear(); g.localStorage = fake })
afterEach(() => { delete g.localStorage })

const app = () => {
  const l = new AnosmiaLogic({ photos: { photo: () => 'loading' } })
  l.state = { ...l.state, journal: [], sessions: [], screen: 'record' }
  return l
}

describe('record-screen guidance', () => {
  it('always starts closed, even on the first real tasting, so the overview is never hidden on arrival', () => {
    const l = app()
    l.resolveGuide()
    expect(l.state).toMatchObject({ guideReady: true, guideOpen: false, guideIntro: false })
    expect(l.renderVals()).toMatchObject({ guideOpen: false, guideIntro: false })
  })

  it('carries the one-time introduction the first time it is opened in a first real tasting', () => {
    const l = app()
    l.resolveGuide()
    l.setGuideOpen(true)
    expect(l.state).toMatchObject({ guideOpen: true, guideIntro: true })
    expect(l.renderVals()).toMatchObject({ guideOpen: true, guideIntro: true, guideIntroText: GUIDE_INTRO })
    expect(readGuidePrefs().introSeen).toBe(true)
    // Closing retires it; opening again (or in a later tasting) does not repeat it.
    l.setGuideOpen(false)
    l.setGuideOpen(true)
    expect(l.state.guideIntro).toBe(false)
    const again = app()
    again.resolveGuide()
    again.setGuideOpen(true)
    expect(again.state).toMatchObject({ guideOpen: true, guideIntro: false })
  })

  it('shows the introduction on Sweetness only', () => {
    const l = app()
    l.resolveGuide()
    l.setGuideOpen(true)
    expect(l.renderVals().guideIntro).toBe(true)
    l.setState({ focus: 'acid' })
    expect(l.renderVals().guideIntro).toBe(false)
  })

  it('does not treat the sample tasting as a first real one', () => {
    const l = app()
    l.setState({ sample: true })
    l.resolveGuide()
    l.setGuideOpen(true)
    expect(l.state).toMatchObject({ guideOpen: true, guideIntro: false })
  })

  it('every later tasting starts closed too, whatever it was left as', () => {
    const l = app()
    l.resolveGuide()
    l.setGuideOpen(true)
    const next = app()
    next.resolveGuide()
    expect(next.state).toMatchObject({ guideOpen: false, guideIntro: false })
  })

  it('names the bar for every sensation', () => {
    const l = app()
    const labels = l.keys().map(k => { l.setState({ focus: k }); return l.renderVals().guideBarLabel })
    expect(labels).toEqual(['sweetness', 'acidity', 'tannin', 'body', 'alcohol warmth', 'finish'].map(n => 'How to recognise ' + n))
  })

  it('opening and closing never answer or advance, and cancel a pending advance', () => {
    const l = app()
    l.setObs('sweet', 2)
    expect(l.state.confirmK).toBe('sweet')
    l.setGuideOpen(true)
    expect(l.state).toMatchObject({ focus: 'sweet', confirmK: null })
    l.setGuideOpen(false)
    expect(l.state.focus).toBe('sweet')
    expect(l.state.obs.sweet).toBe(2)
    expect(l.state.obs.acid).toBeNull()
  })

  it('an open guide does not block advancing after a new answer', () => {
    const l = app()
    l.setGuideOpen(true)
    l.setObs('sweet', 3)
    l.advance('sweet')
    expect(l.state.focus).toBe('acid')
    expect(l.state.guideOpen).toBe(true)
  })

  it('degrades to closed, with no error, when storage is unavailable', () => {
    delete g.localStorage
    const l = app()
    expect(() => l.setGuideOpen(true)).not.toThrow()
    const next = app()
    expect(() => next.resolveGuide()).not.toThrow()
  })

  it('demo mode has no guidance bar and keeps the How? control', () => {
    const l = new AnosmiaLogic({ demo: true })
    l.state = { ...l.state, screen: 'record' }
    expect(l.renderVals()).toMatchObject({ guideBar: false, showHow: true })
  })
})
