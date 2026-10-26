import { describe, expect, it } from 'vitest'
import { AnosmiaLogic, type Entry, type SensKey } from './AnosmiaLogic'
import { sameHistory } from './history'

const entry = (): Entry => new AnosmiaLogic({}).seed()[0]

describe('the original account of a saved tasting', () => {
  it('is the same for the same tasting, including a fresh copy of it', () => {
    const e = entry()
    expect(sameHistory(e, e)).toBe(true)
    expect(sameHistory(e, { ...e, obs: { ...e.obs } })).toBe(true)
  })

  it('does not include what can be corrected: the wine, its title and its photo', () => {
    const e = entry()
    expect(sameHistory(e, { ...e, wine: null, title: 'Something else' })).toBe(true)
    expect(sameHistory(e, { ...e, photo: true, photoId: 'p1' })).toBe(true)
  })

  it.each([
    ['notes', (e: Entry): Entry => ({ ...e, notes: e.notes + ' (edited)' })],
    ['notes cleared', (e: Entry): Entry => ({ ...e, notes: '' })],
    ['enjoyment', (e: Entry): Entry => ({ ...e, enjoy: e.enjoy === 5 ? 1 : 5 })],
    ['enjoyment cleared', (e: Entry): Entry => ({ ...e, enjoy: null })],
    ['date', (e: Entry): Entry => ({ ...e, date: '1 Jan 2020' })],
    ['id', (e: Entry): Entry => ({ ...e, id: 'other' })],
    ['sample flag', (e: Entry): Entry => ({ ...e, sample: !e.sample })],
  ])('is changed by editing the %s', (_name, change) => {
    const e = entry()
    expect(sameHistory(e, change(e))).toBe(false)
  })

  it.each<SensKey>(['sweet', 'acid', 'tannin', 'body', 'warm', 'finish'])('is changed by editing the %s observation', key => {
    const e = entry()
    for (const value of [1, 2, 3, 4, 'none', 'unsure', null] as const) {
      if (value === e.obs[key]) continue
      expect(sameHistory(e, { ...e, obs: { ...e.obs, [key]: value } }), String(value)).toBe(false)
    }
  })

  it('tells not noticed, can’t tell and unanswered apart (none of them is a zero or a blank)', () => {
    const e = entry()
    const as = (value: Entry['obs'][SensKey]) => ({ ...e, obs: { ...e.obs, sweet: value } })
    expect(sameHistory(as('none'), as('unsure'))).toBe(false)
    expect(sameHistory(as('none'), as(null))).toBe(false)
    expect(sameHistory(as('unsure'), as(null))).toBe(false)
  })
})
