import { describe, expect, it } from 'vitest'
import { AnosmiaLogic, type Wine } from './AnosmiaLogic'
import { applyIdentity, identityForm, kindOf } from './identity'

const catalogue = (id: string) => new AnosmiaLogic({}).wineById(id)!
const typedIn: Wine = { id: 'm1', name: 'Dad’s red', short: 'Dad’s red', producer: 'Dad’s red', variety: 'Red wine', vintage: '', region: 'Added by you', custom: true }
const blank = { name: '', producer: '', variety: '', vintage: '' }
const newId = () => 'm-new'

describe('what the edit sheet starts with', () => {
  it('is empty for an unidentified tasting', () => {
    expect(identityForm(null, 'Unnamed wine')).toEqual(blank)
    expect(identityForm(null, 'Mystery red').name).toBe('Mystery red')
  })

  it('shows a catalogue wine’s own details', () => {
    expect(identityForm(catalogue('hollow23'))).toEqual({ name: 'Hollow Creek Riesling', producer: 'Hollow Creek', variety: 'Riesling', vintage: '2023' })
  })

  it('does not show a typed-in wine’s mirrored name as its producer', () => {
    expect(identityForm(typedIn)).toEqual({ name: 'Dad’s red', producer: '', variety: 'Red wine', vintage: '' })
    expect(identityForm({ ...typedIn, name: 'Untitled bottle', short: 'Untitled', producer: 'Unknown' }).name).toBe('')
  })
})

describe('applying the form', () => {
  it('names an unidentified tasting as the user’s own wine, like the Type it in form', () => {
    const r = applyIdentity(null, 'Unnamed wine', { name: ' Saltbush ', producer: 'Saltbush Co', variety: 'Grenache', vintage: '2023' }, newId)
    expect(r).toEqual({ changed: true, title: null, wine: { id: 'm-new', name: 'Saltbush', short: 'Saltbush', producer: 'Saltbush Co', variety: 'Grenache', vintage: '2023', region: 'Added by you', custom: true } })
  })

  it('allows incomplete details: a producer alone, or a kind alone, is enough', () => {
    expect(applyIdentity(null, null, { ...blank, producer: 'Penfolds' }, newId).wine).toMatchObject({ name: 'Untitled bottle', producer: 'Penfolds' })
    expect(applyIdentity(null, null, { ...blank, variety: 'Rosé wine' }, newId).wine).toMatchObject({ name: 'Untitled bottle', producer: 'Unknown', variety: 'Rosé wine' })
  })

  it('returns a tasting to unidentified when everything is cleared, which stays a valid tasting', () => {
    expect(applyIdentity(typedIn, null, blank, newId)).toEqual({ wine: null, title: 'Unnamed wine', changed: true })
    expect(applyIdentity(null, 'Unnamed wine', blank, newId)).toEqual({ wine: null, title: 'Unnamed wine', changed: false })
  })

  it('reports no change, and keeps the very same object, when nothing differs', () => {
    const wine = catalogue('hollow23')
    const r = applyIdentity(wine, null, identityForm(wine), newId)
    expect(r.changed).toBe(false)
    expect(r.wine).toBe(wine)
    const typed = applyIdentity(typedIn, null, identityForm(typedIn), newId)
    expect(typed.changed).toBe(false)
    expect(typed.wine).toBe(typedIn)
  })

  it('edits a typed-in wine without changing its id, and its producer follows its name', () => {
    const r = applyIdentity(typedIn, null, { ...identityForm(typedIn), name: 'Dad’s white', variety: 'White wine' }, newId)
    expect(r.wine).toEqual({ ...typedIn, name: 'Dad’s white', short: 'Dad’s white', producer: 'Dad’s white', variety: 'White wine' })
    expect(r.wine).not.toBe(typedIn)
  })

  it('turns an edited catalogue wine into the user’s own wine with a new id, so it keeps no catalogue links', () => {
    const grange = catalogue('grange16')
    const r = applyIdentity(grange, null, { ...identityForm(grange), name: 'Penfolds Bin 389' }, newId)
    expect(r.wine).toMatchObject({ id: 'm-new', custom: true, name: 'Penfolds Bin 389', producer: 'Penfolds', variety: 'Shiraz', region: grange.region })
    expect(grange.name).toBe('Penfolds Grange') // the catalogue object itself is never changed
  })

  it('does not mutate the wine it was given (tastings made with "Taste it again" share one)', () => {
    const before = JSON.stringify(typedIn)
    applyIdentity(typedIn, null, { ...identityForm(typedIn), name: 'Changed', vintage: '1999' }, newId)
    expect(JSON.stringify(typedIn)).toBe(before)
  })

  it('recognises which kind chip a variety came from', () => {
    expect(kindOf('Red wine')).toBe('Red')
    expect(kindOf('Rosé wine')).toBe('Rosé')
    expect(kindOf('Shiraz')).toBeNull()
    expect(kindOf('')).toBeNull()
  })
})
