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

describe('blind comparisons', () => {
  const named = () => {
    const l = new AnosmiaLogic({})
    l.state = { ...l.state, journal: [], sessions: [] }
    l.startAB()
    l.abSetSlot('a', { wine: l.wineById('mallee21'), name: null })
    return l
  }

  it('switching to blind clears names that were already shown', () => {
    const l = named()
    l.setBlind()
    expect(l.state.ab!.blind).toBe(true)
    expect(l.state.ab!.a).toEqual(l.emptySlot())
  })

  it('choosing blind before naming keeps the pourer’s names, and the naming sheet never shows them', () => {
    const l = new AnosmiaLogic({})
    l.state = { ...l.state, journal: [], sessions: [] }
    l.startAB()
    l.setBlind()
    l.abSetSlot('a', { wine: l.wineById('mallee21'), name: null })
    l.setState({ screen: 'abReview', abSlot: 'a' })
    const v = l.renderVals()
    expect(l.state.ab!.a.wine?.id).toBe('mallee21')
    expect(v.abWineOpts.filter(o => o.pressed === 'true')).toEqual([])
    expect(v.abSlotBlind).toBe(true)
  })

  it('repeating a saved blind pair starts open', () => {
    const l = new AnosmiaLogic({})
    l.state = { ...l.state, journal: [], sessions: l.seedSessions().map(s => ({ ...s, blind: true })), screen: 'abView', sessionId: 's1' }
    l.renderVals().repeatAB()
    expect(l.state.ab!.blind).toBe(false)
    expect(l.state.ab!.repeatOf).toBe('s1')
  })
})

describe('sample tasting', () => {
  it('is never saved into a real journal', () => {
    const l = new AnosmiaLogic({})
    l.state = { ...l.state, journal: [], sessions: [] }
    l.loadSample()
    l.save()
    expect(l.state.journal).toEqual([])
    expect(l.state.screen).toBe('journal')
  })

  it('is saved as before in demo mode', () => {
    const l = new AnosmiaLogic({ demo: true })
    l.loadSample()
    l.save()
    expect(l.journalNow()).toHaveLength(7)
  })
})

describe('changing the photo of a saved tasting', () => {
  const setup = () => {
    const l = new AnosmiaLogic({ photos: { photo: () => 'loading' } })
    const [a, b] = l.seed()
    const withPhoto = { ...a, photo: true, photoId: 'pA' }
    const other = { ...b, photo: true, photoId: 'pB' }
    l.state = { ...l.state, journal: [withPhoto, other], sessions: [], entryId: withPhoto.id, screen: 'entry' }
    return { l, withPhoto, other }
  }

  it('replaces the photo and changes nothing else about that tasting or any other', async () => {
    const { l, withPhoto, other } = setup()
    const result = await l.changeEntryPhoto(withPhoto.id, 'pNew')
    expect(result).toEqual({ ok: true, previous: 'pA' })
    expect(l.state.journal![0]).toEqual({ ...withPhoto, photo: true, photoId: 'pNew' })
    expect(l.state.journal![1]).toBe(other)
  })

  it('adds a photo to a tasting that has none, and removes one', async () => {
    const { l, other } = setup()
    const bare = { ...other, id: 'bare', photo: false, photoId: null }
    l.state = { ...l.state, journal: [bare, ...l.state.journal!] }
    expect((await l.changeEntryPhoto('bare', 'pNew')).previous).toBeNull()
    expect(l.state.journal![0]).toMatchObject({ id: 'bare', photo: true, photoId: 'pNew' })
    expect((await l.changeEntryPhoto('bare', null)).previous).toBe('pNew')
    expect(l.state.journal![0]).toMatchObject({ photo: false, photoId: null })
  })

  it('waits for the change to be on the device, and puts the tasting back exactly if it is not', async () => {
    const { l, withPhoto } = setup()
    let release: (ok: boolean) => void = () => {}
    l.savedStatus = () => new Promise<boolean>(resolve => { release = resolve })
    const pending = l.changeEntryPhoto(withPhoto.id, 'pNew')
    expect(l.state.journal![0].photoId).toBe('pNew')
    release(false)
    expect(await pending).toEqual({ ok: false, previous: 'pA' })
    expect(l.state.journal![0]).toBe(withPhoto)
  })

  it('does nothing for a tasting that does not exist', async () => {
    const { l, other } = setup()
    expect((await l.changeEntryPhoto('nope', 'pNew')).ok).toBe(false)
    expect(l.state.journal![1]).toBe(other)
  })

  it('opens the camera on the tasting being viewed, falling back to the newest as the screen does', () => {
    const { l, withPhoto } = setup()
    l.setState({ camTarget: 'entry', entryId: null })
    expect(l.currentEntry()).toBe(withPhoto)
    expect(l.photoForTarget()).toBe('pA')
  })

  it('offers the action in the app but not in demo mode, so demo matches the original', () => {
    const { l } = setup()
    const v = l.renderVals()
    expect(v.entPhotoEdit).toBe(true)
    expect(v.entPhotoLabel).toBe('Change photo')
    const demo = new AnosmiaLogic({ demo: true }).renderVals()
    expect(demo.entPhotoEdit).toBe(false)
    expect(demo.entFrameStyle).toBe('height: 300px; border-radius: 14px; overflow: hidden; border: 1.5px solid #1E1416; margin-top: 6px')
  })
})
