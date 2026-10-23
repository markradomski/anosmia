import { describe, expect, it } from 'vitest'
import { AnosmiaLogic, type Entry, type Session } from '../anosmia/AnosmiaLogic'
import {
  CodecError, displayDate, draftToState, entryToRecord, recordToEntry, recordToSession, relativeFromStored,
  relativeToStored, sensoryFromStored, sensoryToStored, sessionToRecord, stateToDraft,
} from './codec'

const logic = () => new AnosmiaLogic({ device: '390 × 844', startScreen: 'welcome' })

describe('sensory observations', () => {
  it('stores each in-memory value as its own explicit state', () => {
    expect(sensoryToStored(1)).toEqual({ state: 'level', level: 1 })
    expect(sensoryToStored(4)).toEqual({ state: 'level', level: 4 })
    expect(sensoryToStored('none')).toEqual({ state: 'not_detected' })
    expect(sensoryToStored('unsure')).toEqual({ state: 'cant_tell' })
    expect(sensoryToStored(null)).toEqual({ state: 'unanswered' })
  })

  it('round-trips every value without reinterpretation', () => {
    for (const v of [1, 2, 3, 4, 'none', 'unsure', null] as const) {
      expect(sensoryFromStored(sensoryToStored(v))).toBe(v)
    }
  })

  it('keeps not noticed, can’t tell and unanswered distinct from each other and from zero', () => {
    const stored = (['none', 'unsure', null] as const).map(v => JSON.stringify(sensoryToStored(v)))
    expect(new Set(stored).size).toBe(3)
    for (const s of stored) expect(s).not.toContain('0')
  })

  it('rejects values it cannot map unambiguously', () => {
    for (const bad of [0, 5, 2.5, -1, 'maybe', undefined, '1']) {
      expect(() => sensoryToStored(bad as never)).toThrow(CodecError)
    }
    for (const bad of [{ state: 'level', level: 0 }, { state: 'level', level: 5 }, { state: 'level' }, { state: 'zero' }, {}, null, 0, 'none']) {
      expect(() => sensoryFromStored(bad)).toThrow(CodecError)
    }
  })
})

describe('relative (A/B) answers', () => {
  it('round-trips each direction and never becomes a number', () => {
    for (const v of ['A', 'B', 'same', 'unsure', null] as const) {
      const stored = relativeToStored(v)
      expect(typeof stored).toBe('string')
      expect(relativeFromStored(stored)).toBe(v)
    }
    expect(relativeToStored('unsure')).toBe('cant_tell')
    expect(relativeToStored(null)).toBe('unanswered')
  })

  it('rejects anything else', () => {
    for (const bad of ['C', 'a', 1, 0, undefined, 'none']) expect(() => relativeToStored(bad as never)).toThrow(CodecError)
    for (const bad of ['C', 'unsure', null, 0]) expect(() => relativeFromStored(bad)).toThrow(CodecError)
  })
})

describe('saved tastings', () => {
  const l = logic()
  const manual = { id: 'm1', name: 'Cellar door red', short: 'Cellar door red', producer: 'Cellar door red', variety: 'Red wine', vintage: '', region: 'Added by you', custom: true }
  const cases: Entry[] = [
    { id: 'n1', wine: l.wineById('hollow23'), title: null, photo: true, date: '', obs: { sweet: 1, acid: 'none', tannin: 'unsure', body: null, warm: 4, finish: 2 }, notes: 'Crushed ants.', enjoy: 5 },
    { id: 'n2', wine: null, title: 'Unnamed wine', photo: false, date: '', obs: l.emptyObs(), notes: '', enjoy: null },
    { id: 'n3', wine: manual, title: null, photo: false, date: '', obs: { sweet: 'unsure', acid: 'unsure', tannin: 'none', body: 3, warm: null, finish: 'none' }, notes: '  verbatim  ', enjoy: 1, sample: true },
  ]

  it.each(cases)('round-trips $id exactly', e => {
    const at = '2026-10-23T09:30:00.000Z'
    const back = recordToEntry(JSON.parse(JSON.stringify(entryToRecord(e, at))))
    expect(back).toEqual({ ...e, date: displayDate(at) })
  })

  it('marks entries saved from the Sample tasting', () => {
    expect(entryToRecord(cases[2], new Date().toISOString()).origin).toBe('sample')
    expect(entryToRecord(cases[0], new Date().toISOString()).origin).toBe('user')
  })

  it('formats dates exactly as the prototype does', () => {
    expect(displayDate(new Date().toISOString())).toBe(l.today())
  })

  it('refuses records it does not understand', () => {
    const good = entryToRecord(cases[0], '2026-10-23T09:30:00.000Z')
    expect(() => recordToEntry({ ...good, schema: 2 })).toThrow(CodecError)
    expect(() => recordToEntry({ ...good, origin: 'imported' })).toThrow(CodecError)
    expect(() => recordToEntry({ ...good, enjoyment: 0 })).toThrow(CodecError)
    expect(() => recordToEntry({ ...good, observations: { ...good.observations, acid: { state: 'level', level: 0 } } })).toThrow(/tasting n1: acid/)
  })
})

describe('saved A/B sessions', () => {
  const l = logic()
  const sessions: Session[] = [
    l.seedSessions()[0],
    { id: 's2', date: '', a: { wine: null, name: 'The one with the bird', photo: false }, b: { wine: null, name: null, photo: true },
      blind: false, glassPhoto: false, ans: { sweet: null, acid: 'A', tannin: 'B', body: 'same', warm: 'unsure', finish: null }, pref: null, notes: '', repeatOf: 's1' },
  ]

  it.each(sessions)('round-trips $id exactly, keeping open vs blind', s => {
    const at = '2026-10-16T18:00:00.000Z'
    const record = sessionToRecord(s, at)
    expect(record.mode).toBe(s.blind ? 'blind' : 'open')
    expect(recordToSession(JSON.parse(JSON.stringify(record)))).toEqual({ ...s, date: displayDate(at) })
  })
})

describe('the resumable draft', () => {
  it('round-trips an in-progress tasting and A/B comparison', () => {
    const l = logic()
    l.setState({ screen: 'record', wine: l.wineById('salt23'), photo: true, obs: { sweet: 2, acid: 'none', tannin: 'unsure', body: null, warm: null, finish: null }, focus: 'body', notes: 'x', enjoy: 3, repeatOf: 'e4' })
    l.startAB(null, { wine: l.wineById('moons'), name: null, photo: false }, { blind: true })
    l.setState({ ab: { ...l.state.ab!, ans: { sweet: 'A', acid: 'same', tannin: 'unsure', body: null, warm: null, finish: null }, focus: 'body', pref: 'both' } })
    const back = draftToState(JSON.parse(JSON.stringify(stateToDraft(l.state, new Date().toISOString()))))
    for (const k of ['screen', 'wine', 'photo', 'obs', 'focus', 'notes', 'enjoy', 'repeatOf', 'ab'] as const) {
      expect(back[k], k).toEqual(l.state[k])
    }
  })

  it('does not keep transient UI that could re-expose hidden things', () => {
    const l = logic()
    l.setState({ reveal: true, lbOpen: true, refsOpen: true, guide: true, camera: true, abSlot: 'a' })
    const draft = stateToDraft(l.state, new Date().toISOString())
    const text = JSON.stringify(draft)
    for (const key of ['reveal', 'lbOpen', 'refsOpen', 'guide', 'camera', 'abSlot']) expect(text).not.toContain(`"${key}"`)
  })
})
