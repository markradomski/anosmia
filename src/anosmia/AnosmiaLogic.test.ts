import { describe, expect, it } from 'vitest'
import { restorableDraft } from '../data/persistence'
import { AnosmiaLogic, type Screen } from './AnosmiaLogic'

const SCREENS: Screen[] = ['welcome', 'find', 'record', 'summary', 'journal', 'entry', 'compare', 'abSetup', 'abRecord', 'abReview', 'abView']

describe('real journal (empty on first run)', () => {
  it.each(SCREENS)('renders %s without entries or sessions', screen => {
    const l = new AnosmiaLogic({ device: '390 × 844' })
    l.state = { ...l.state, journal: [], sessions: [], screen, ab: screen.startsWith('ab') ? l.newAB() : null }
    const v = l.renderVals()
    expect(v.jN).toBe(0)
    expect(v.sN).toBe(0)
    expect(v.isDemo).toBe(false)
  })

  it('never falls back to the sample journal once it has a real one', () => {
    const l = new AnosmiaLogic({})
    l.state = { ...l.state, journal: [], sessions: [] }
    expect(l.journalNow()).toEqual([])
    expect(l.sessionsNow()).toEqual([])
  })
})

describe('demo mode', () => {
  it('keeps the prototype’s six sample tastings and one sample session, identified as demo', () => {
    const l = new AnosmiaLogic({ demo: true })
    const v = l.renderVals()
    expect(v.jN).toBe(6)
    expect(v.sN).toBe(1)
    expect(v.isDemo).toBe(true)
  })
})

describe('restoring a draft', () => {
  const entry = new AnosmiaLogic({}).seed()[0]
  const session = new AnosmiaLogic({}).seedSessions()[0]

  it('reopens screens whose data still exists', () => {
    expect(restorableDraft({ screen: 'entry', entryId: entry.id }, [entry], []).screen).toBe('entry')
    expect(restorableDraft({ screen: 'abView', sessionId: session.id }, [], [session]).screen).toBe('abView')
    expect(restorableDraft({ screen: 'record' }, [], []).screen).toBe('record')
  })

  it('falls back when the data is gone', () => {
    expect(restorableDraft({ screen: 'entry', entryId: 'missing' }, [entry], []).screen).toBe('journal')
    expect(restorableDraft({ screen: 'compare', cmp: [entry.id, 'missing'] }, [entry], []).screen).toBe('journal')
    expect(restorableDraft({ screen: 'abView', sessionId: 'missing' }, [], []).screen).toBe('journal')
    expect(restorableDraft({ screen: 'abRecord', ab: null }, [], []).screen).toBe('welcome')
  })
})
