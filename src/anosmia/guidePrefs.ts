// The record-screen guidance's one small per-device preference: whether the one-time first-tasting
// introduction has been shown. It is a UI preference, not journal data, so it lives in localStorage rather
// than IndexedDB. Storage can be unavailable (private browsing, blocked site data); then the introduction
// may repeat. (Guidance itself always starts closed, so the choice of the 'what can you feel?' list is never
// hidden behind it on arrival.)

export const GUIDE_INTRO = 'Read, sip, then tap an answer below. The guide follows you; hide it any time.'

const INTRO = 'anosmia.guide.introSeen'

export interface GuidePrefs { introSeen?: boolean }

export function readGuidePrefs(): GuidePrefs {
  try {
    return { introSeen: localStorage.getItem(INTRO) === '1' }
  } catch { return {} }
}

export function writeGuidePrefs(p: GuidePrefs) {
  try {
    if (p.introSeen) localStorage.setItem(INTRO, '1')
  } catch { /* preference only */ }
}
