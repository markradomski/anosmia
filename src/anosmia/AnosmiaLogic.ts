// Ported from the Anosmia prototype (references/prototype/logic.js).
// Behaviour is kept as-is; the changes are type annotations and the DCLogic host shim.
import type { ChangeEvent } from 'react'
import { DCLogic } from '../dc/DCLogic'

export type SensKey = 'sweet' | 'acid' | 'tannin' | 'body' | 'warm' | 'finish'
/** A level 1–4, 'none' (Not noticed), 'unsure' (Can’t tell) or null (Unanswered). */
export type ObsValue = number | 'none' | 'unsure' | null
export type Obs = Record<SensKey, ObsValue>
/** Relative A/B answer: never converted to a score. */
export type AbValue = 'A' | 'B' | 'same' | 'unsure' | null
export type AbAns = Record<SensKey, AbValue>
export type Pref = 'A' | 'B' | 'both' | 'neither' | 'undecided'
export type Screen = 'welcome' | 'find' | 'record' | 'summary' | 'journal' | 'entry' | 'compare'
  | 'abSetup' | 'abRecord' | 'abReview' | 'abView'
export type Device = '390 × 844' | '412 × 915' | '430 × 932'

export interface Sens {
  k: SensKey; name: string; sub: string; short: string; q: string; none: string | null
  levels: string[]; hints?: string[]; guide: string[]; foot: string; duration?: boolean
}
export interface Wine {
  id: string; name: string; short: string; producer: string; variety: string; vintage: string; region: string
  custom?: boolean
}
export interface Entry {
  id: string; wine: Wine | null; title?: string | null; photo: boolean; date: string
  obs: Obs; notes: string; enjoy: number | null
}
export interface Slot { wine: Wine | null; name: string | null; photo: boolean }
export interface AbDraft {
  a: Slot; b: Slot; blind: boolean; glassPhoto: boolean; ans: AbAns; focus: SensKey
  pref: Pref | null; notes: string; repeatOf: string | null; back: string
}
export interface Session {
  id: string; date: string; a: Slot; b: Slot; blind: boolean; glassPhoto: boolean
  ans: AbAns; pref: Pref | null; notes: string; repeatOf: string | null
}
interface Label {
  bg: string; card: string; ink: string; accent: string; font: 'ui' | 'disp' | 'mono'
  upper: boolean; italic?: boolean; rot: number
}
interface AbQuestion { q: string; more: string; noun: string; cue: string }

export interface State {
  screen: Screen | null
  wine: Wine | null; photo: boolean; title: string | null; query: string
  camera: boolean; camStage: 'aim' | 'found'
  manual: boolean; mName: string; mType: string | null
  obs: Obs
  focus: SensKey; guide: boolean; editing: boolean
  notes: string; enjoy: number | null
  returnTo: Screen | null; repeatOf: string | null; sample: boolean; confirmK: SensKey | null; liveMsg: string
  journal: Entry[] | null; entryId: string | null; reveal: boolean
  selecting: boolean; sel: string[]; cmp: string[] | null; lastSaved: string | null
  ab: AbDraft | null; abEditing: boolean; abGuide: boolean; abSlot: 'a' | 'b' | null; abSlotName: string
  sessions: Session[] | null; sessionId: string | null
  lbOpen: boolean; refsOpen: boolean; jTab: 'tastings' | 'sessions'; chooser: boolean; lastSession: string | null
  toast: string
}

export interface Props { device?: Device | string; startScreen?: Screen | string }

type Timer = ReturnType<typeof setTimeout>
type Change = ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
type LookLine = { t: string; tag: string; tagStyle: string }

export class AnosmiaLogic extends DCLogic<Props, State> {
  private _tt?: Timer
  private _adv?: Timer
  private _guard?: number
  private _pending?: { k: SensKey; wasNew?: boolean } | null

  state: State = {
    screen: null,
    wine: null, photo: false, title: null, query: '',
    camera: false, camStage: 'aim',
    manual: false, mName: '', mType: null,
    obs: { sweet: null, acid: null, tannin: null, body: null, warm: null, finish: null },
    focus: 'sweet', guide: false, editing: false,
    notes: '', enjoy: null,
    returnTo: null, repeatOf: null, sample: false, confirmK: null, liveMsg: '',
    journal: null, entryId: null, reveal: false,
    selecting: false, sel: [], cmp: null, lastSaved: null,
    ab: null, abEditing: false, abGuide: false, abSlot: null, abSlotName: '', sessions: null, sessionId: null,
    lbOpen: false, refsOpen: false, jTab: 'tastings', chooser: false, lastSession: null,
    toast: ''
  };

  componentDidMount() {
    const s = this.props.startScreen;
    if (s && s.indexOf('ab') === 0) this.demoAB(s);
    else if (s === 'summary') this.loadSample();
    else if (s && s !== 'welcome') this.setState({ screen: s as Screen });
  }
  componentWillUnmount() { clearTimeout(this._tt); clearTimeout(this._adv); }

  /* ---------- content ---------- */
  sens(): Sens[] {
    return [
      { k: 'sweet', name: 'Sweetness', sub: '', short: 'Sweetness', q: 'Is there any sugary roundness?', none: 'Not sweet',
        levels: ['A hint', 'Some', 'Sweet', 'Very sweet'],
        guide: ['Take a small sip and let it sit for a few seconds before swallowing.', 'Sweetness feels soft and rounded, a bit like weak cordial. No sweetness feels dry, almost bare.', 'Sip some water, then the wine again. The contrast makes it easier to judge.'],
        foot: 'Most table wines are dry. “Not sweet” is a real, useful answer.' },
      { k: 'acid', name: 'Acidity', sub: '', short: 'Acidity', q: 'Does your mouth water afterwards?', none: 'Not noticed',
        levels: ['Soft', 'Fresh', 'Zingy', 'Sharp'],
        guide: ['Swallow, then tip your chin down slightly.', 'Notice saliva pooling. The more your mouth waters, the more acidity you are probably feeling.', 'Sharper wines can feel like a squeeze or a tingle along the sides of your mouth.'],
        foot: 'You can feel acidity all over your mouth. There is no special “sour zone”.' },
      { k: 'tannin', name: 'Tannin', sub: 'Astringency', short: 'Tannin', q: 'Do your gums or teeth feel dry and grippy?', none: 'Not noticed',
        levels: ['Silky', 'Grippy', 'Drying', 'Furry'],
        guide: ['After swallowing, run your tongue over your gums and the backs of your teeth.', 'Tannin feels like over-steeped black tea: drying, rough, a little puckering.', 'It builds up with each sip, so the second or third sip is the honest one.'],
        foot: 'Most white wines have very little tannin. Not noticing it is normal.' },
      { k: 'body', name: 'Body', sub: '', short: 'Body', q: 'How heavy does it feel in your mouth?', none: null,
        levels: ['Watery', 'Light', 'Round', 'Heavy'], hints: ['like water', 'skim milk', 'full-cream', 'like cream'],
        guide: ['Roll a sip around your mouth as if you were weighing it.', 'Compare it with milk: skim, full-cream, or pouring cream.', 'Ignore flavour completely. This is only about weight and texture.'],
        foot: 'Every wine has some weight, so there is no “none” here. Only “can’t tell”.' },
      { k: 'warm', name: 'Alcohol warmth', sub: '', short: 'Warmth', q: 'Any heat as it goes down?', none: 'No heat',
        levels: ['Barely', 'Warm', 'Hot', 'Fiery'],
        guide: ['Swallow, then breathe out gently through your mouth.', 'Notice any warmth in your throat or chest.', 'Stronger wines can feel peppery or burning. That is alcohol, not spice.'],
        foot: 'Warmth is easy to miss with food. Taste it on its own if you can.' },
      { k: 'finish', name: 'Finish', sub: 'Duration', short: 'Finish', q: 'How long do the sensations last?', none: 'Not noticed', duration: true,
        levels: ['Brief', 'Medium', 'Long', 'Very long'], hints: ['disappears quickly', 'several seconds', 'persists noticeably', 'seems to keep going'],
        guide: ['Swallow, then simply pay attention to whatever remains: grip, warmth, tang or weight.', 'Notice roughly when it has faded. No timing or counting needed.', 'Brief disappears almost at once. Very long seems to keep going after you’ve stopped thinking about it.'],
        foot: 'This is about how long, not how strong. A faint sensation can still last a long time.' }
    ];
  }
  keys(): SensKey[] { return ['sweet', 'acid', 'tannin', 'body', 'warm', 'finish']; }
  wines(): Wine[] {
    return [
      { id: 'hollow23', name: 'Hollow Creek Riesling', short: 'Hollow Creek', producer: 'Hollow Creek', variety: 'Riesling', vintage: '2023', region: 'Clare Valley, SA' },
      { id: 'mallee21', name: 'Mallee & Sons Shiraz', short: 'Mallee & Sons', producer: 'Mallee & Sons', variety: 'Shiraz', vintage: '2021', region: 'Barossa Valley, SA' },
      { id: 'little22', name: 'Little Ferment Pinot Noir', short: 'Little Ferment', producer: 'Little Ferment Co.', variety: 'Pinot noir', vintage: '2022', region: 'Adelaide Hills, SA' },
      { id: 'grange16', name: 'Penfolds Grange', short: 'Grange', producer: 'Penfolds', variety: 'Shiraz', vintage: '2016', region: 'South Australia' },
      { id: 'salt23', name: 'Saltbush Grenache', short: 'Saltbush', producer: 'Saltbush', variety: 'Grenache', vintage: '2023', region: 'McLaren Vale, SA' },
      { id: 'moons', name: 'Two Moons Muscat', short: 'Two Moons', producer: 'Two Moons', variety: 'Muscat', vintage: 'NV', region: 'Rutherglen, VIC' },
      { id: 'kettle22', name: 'Kettle Rock Chardonnay', short: 'Kettle Rock', producer: 'Kettle Rock', variety: 'Chardonnay', vintage: '2022', region: 'Yarra Valley, VIC' },
      { id: 'pump23', name: 'Old Pump Nero d’Avola', short: 'Old Pump', producer: 'Old Pump', variety: 'Nero d’Avola', vintage: '2023', region: 'Riverland, SA' }
    ];
  }
  wineById(id: string) { return this.wines().find(w => w.id === id) || null; }
  labs(): Record<string, Label> {
    return {
      hollow23: { bg: '#2E3B2C', card: '#F3EEDC', ink: '#22302A', accent: '#6E8C5A', font: 'ui', upper: true, rot: -1.5 },
      mallee21: { bg: '#2A1216', card: '#E9C46A', ink: '#2A1216', accent: '#7E1F35', font: 'disp', upper: false, rot: 2 },
      little22: { bg: '#3A1D26', card: '#F7F1E6', ink: '#5A1427', accent: '#E58A6E', font: 'disp', italic: true, upper: false, rot: -3 },
      grange16: { bg: '#24161A', card: '#EFE6D2', ink: '#3A1B20', accent: '#3A1B20', font: 'disp', upper: true, rot: 0.5 },
      salt23: { bg: '#24282B', card: '#D9DCCB', ink: '#1F2A24', accent: '#9AA77A', font: 'ui', upper: true, rot: 1 },
      moons: { bg: '#3B1E0C', card: '#1E1416', ink: '#F2CF5B', accent: '#F2CF5B', font: 'disp', upper: true, rot: -1 },
      kettle22: { bg: '#3A3826', card: '#FBF6EA', ink: '#1E1416', accent: '#C98A1B', font: 'mono', upper: true, rot: 1.5 },
      pump23: { bg: '#1F1A2E', card: '#E9B9A6', ink: '#2B1A2E', accent: '#5A1427', font: 'ui', upper: false, rot: -2 },
      unknown: { bg: '#2B2522', card: '#E8DFC9', ink: '#4A3F3A', accent: '#8A7B70', font: 'disp', italic: true, upper: false, rot: 3 }
    };
  }
  enjoyLabels() { return ['Nope', 'Meh', 'Fine', 'Yes please', 'Hide the bottle']; }
  seed(): Entry[] {
    const w = (id: string) => this.wineById(id);
    return [
      { id: 'e6', wine: w('little22'), photo: true, date: '14 Oct 2026', obs: { sweet: 'none', acid: 3, tannin: 1, body: 2, warm: 'unsure', finish: 2 }, notes: 'Polite. Slightly nervous.', enjoy: 4 },
      { id: 'e5', wine: w('grange16'), photo: false, date: '12 Oct 2026', obs: { sweet: 'none', acid: 1, tannin: 1, body: 2, warm: 1, finish: 1 }, notes: 'Crushed ants.', enjoy: 3 },
      { id: 'e4', wine: w('hollow23'), photo: true, date: '3 Oct 2026', obs: { sweet: 1, acid: 4, tannin: 'none', body: 1, warm: 1, finish: 2 }, notes: 'Like licking a battery, politely.', enjoy: 4 },
      { id: 'e3', wine: null, title: 'Mystery red', photo: false, date: '27 Sep 2026', obs: { sweet: 'none', acid: 2, tannin: 2, body: 2, warm: 'unsure', finish: null }, notes: 'Mate’s bottle. No label, no regrets.', enjoy: 3 },
      { id: 'e2', wine: w('mallee21'), photo: true, date: '19 Sep 2026', obs: { sweet: 'unsure', acid: 2, tannin: 3, body: 4, warm: 3, finish: 3 }, notes: 'Wore a jumper on my tongue.', enjoy: 3 },
      { id: 'e1', wine: w('moons'), photo: true, date: '6 Sep 2026', obs: { sweet: 4, acid: 1, tannin: 'none', body: 4, warm: 3, finish: 4 }, notes: 'Syrup with a pension.', enjoy: 5 }
    ];
  }
  journalNow() { return this.state.journal || this.seed(); }
  emptyObs(): Obs { return { sweet: null, acid: null, tannin: null, body: null, warm: null, finish: null }; }
  blank(): Partial<State> {
    return { wine: null, photo: false, title: null, query: '', obs: this.emptyObs(), focus: 'sweet', guide: false, editing: false,
      notes: '', enjoy: null, confirmK: null, liveMsg: '', returnTo: null, repeatOf: null, sample: false,
      camera: false, camStage: 'aim', manual: false, mName: '', mType: null };
  }
  today() { const d = new Date(); const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return d.getDate() + ' ' + m[d.getMonth()] + ' ' + d.getFullYear(); }
  ident(e: Entry) {
    const w = e.wine;
    if (w) return { title: w.name, sub: [w.variety, w.vintage].filter(Boolean).join(' · '), long: [w.variety, w.vintage, w.region].filter(Boolean).join(' · '), short: w.short + (w.vintage && w.vintage !== 'NV' ? ' ’' + w.vintage.slice(2) : '') };
    return { title: e.title || 'Unnamed wine', sub: 'Not identified', long: 'Not identified. That’s allowed.', short: e.title || 'the unnamed one' };
  }

  /* ---------- visual helpers ---------- */
  tileFor(w: Wine | null, hasPhoto: boolean, size: number) {
    const small = size < 60;
    if (!hasPhoto) {
      return { hasPhoto: false, noPhoto: true,
        blankStyle: 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;background-color:#EADFC6;background-image:repeating-linear-gradient(-45deg, rgba(30,20,22,.07) 0 1px, transparent 1px 7px);color:#5A1427;text-align:center;padding:6px;box-sizing:border-box;',
        blankText: w ? (small ? w.short.charAt(0) : w.short) : '?',
        blankTextStyle: "font-family:'Fraunces',serif;font-weight:800;line-height:.95;letter-spacing:-.02em;font-size:" + (w ? (small ? 18 : Math.round(size * 0.15)) : Math.round(size * 0.42)) + 'px;' + (w ? '' : 'font-style:italic;'),
        blankSub: small ? '' : (w ? 'No photo' : 'Unidentified'),
        blankSubStyle: "font-family:'DM Mono',monospace;font-size:" + (size > 200 ? 11 : 9) + 'px;letter-spacing:.12em;text-transform:uppercase;color:#5E4E49;' + (small ? 'display:none;' : '') };
    }
    const L = (w && this.labs()[w.id]) || this.labs().unknown;
    const s = size / 170;
    const fam = { ui: "'Bricolage Grotesque',sans-serif", disp: "'Fraunces',serif", mono: "'DM Mono',monospace" }[L.font];
    return { hasPhoto: true, noPhoto: false,
      back: 'position:relative;width:100%;height:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;background:radial-gradient(90% 70% at 28% 16%, rgba(255,255,255,.2), transparent 55%), radial-gradient(70% 50% at 50% 115%, rgba(0,0,0,.55), transparent 70%), ' + L.bg + ';',
      card: 'width:64%;box-sizing:border-box;padding:' + Math.round(12 * s) + 'px ' + Math.round(7 * s) + 'px;background:' + L.card + ';color:' + L.ink + ';transform:rotate(' + L.rot + 'deg);box-shadow:0 ' + Math.round(8 * s) + 'px ' + Math.round(18 * s) + 'px rgba(0,0,0,.45);display:flex;flex-direction:column;align-items:center;gap:' + Math.max(2, Math.round(6 * s)) + 'px;text-align:center;border-top:' + Math.max(2, Math.round(4 * s)) + 'px solid ' + L.accent + ';',
      prod: small ? '' : (w ? w.producer : 'Producer unknown'),
      title: w ? (small ? w.variety.charAt(0) : w.variety) : (small ? '?' : 'Illegible'),
      vin: small ? '' : (w ? w.vintage : ''),
      prodStyle: "font-family:'DM Mono',monospace;font-size:" + Math.max(6, Math.round(8 * s)) + 'px;letter-spacing:.14em;text-transform:uppercase;opacity:.85;line-height:1.15;' + (small ? 'display:none;' : ''),
      titleStyle: 'font-family:' + fam + ';font-size:' + Math.max(9, Math.round(19 * s)) + 'px;line-height:1;' + (L.italic ? 'font-style:italic;' : '') + (L.upper ? 'text-transform:uppercase;letter-spacing:.03em;font-weight:800;' : 'font-weight:650;'),
      vinStyle: "font-family:'DM Mono',monospace;font-size:" + Math.max(6, Math.round(9 * s)) + 'px;letter-spacing:.1em;' + (small ? 'display:none;' : '') };
  }
  cells(v: ObsValue | undefined, color: string, reverse: boolean, w?: number) {
    w = w || 18;
    const arr = [0, 1, 2, 3].map(j => {
      let st = 'display:block;width:' + w + 'px;height:14px;border-radius:3px;box-sizing:border-box;';
      if (v === null || v === undefined) st += 'border:1.5px dashed rgba(30,20,22,.35);';
      else if (v === 'unsure') st += 'border:1px solid rgba(30,20,22,.45);background-image:repeating-linear-gradient(135deg, rgba(30,20,22,.45) 0 1.5px, transparent 1.5px 5px);';
      else if (v === 'none') st += 'background:rgba(30,20,22,.07);';
      else st += j < v ? 'background:' + color + ';' : 'background:rgba(30,20,22,.08);';
      return { style: st };
    });
    return reverse ? arr.reverse() : arr;
  }
  fp(o: Obs, color: string, sc?: number) {
    sc = sc || 1;
    return this.keys().map(k => {
      const v = o[k]; const w = Math.round(7 * sc);
      let s = 'display:block;width:' + w + 'px;border-radius:2px;box-sizing:border-box;flex:none;';
      if (typeof v === 'number') s += 'height:' + Math.round((8 + v * 9) * sc) + 'px;background:' + color + ';';
      else if (v === 'none') s += 'height:' + w + 'px;border-radius:50%;border:1.5px solid ' + color + ';';
      else if (v === 'unsure') s += 'height:' + Math.round(22 * sc) + 'px;border:1px solid ' + color + ';background-image:repeating-linear-gradient(135deg, ' + color + ' 0 1.5px, transparent 1.5px 4.5px);';
      else s += 'height:' + Math.round(22 * sc) + 'px;border:1.5px dashed rgba(30,20,22,.35);';
      return { style: s };
    });
  }
  valOf(s: Sens, v: ObsValue | undefined) { if (v === null || v === undefined) return 'Unanswered'; if (v === 'none') return s.none || 'Not noticed'; if (v === 'unsure') return 'Can’t tell'; return s.levels[v - 1]; }
  valStyle(v: ObsValue | undefined) {
    const b = 'font-size:13px;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    if (v === null || v === undefined) return b + 'color:#7A6A64;font-style:italic;';
    if (v === 'unsure') return b + 'color:#1E1416;font-weight:600;';
    if (v === 'none') return b + 'color:#5A1427;font-weight:600;';
    return b + 'color:#5A1427;font-weight:700;';
  }
  numTxt(v: ObsValue | undefined) { if (typeof v === 'number') return String(v); if (v === 'none') return '0'; if (v === 'unsure') return '?'; return '–'; }
  chip(s: Sens, v: ObsValue) {
    const base = 'display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px;border-radius:15px;font-size:13px;font-weight:650;white-space:nowrap;box-sizing:border-box;flex:none;';
    if (v === null) return { text: 'Unanswered', style: base + 'color:#6B5A55;font-weight:500;font-style:italic;border:1.5px dashed rgba(30,20,22,.35);', bars: [] };
    if (v === 'none') return { text: s.none, style: base + 'border:1.5px solid #5A1427;color:#5A1427;', bars: [] };
    if (v === 'unsure') return { text: 'Can’t tell', style: base + 'color:#1E1416;border:1.5px solid rgba(30,20,22,.55);background-image:repeating-linear-gradient(135deg, rgba(30,20,22,.16) 0 2px, transparent 2px 6px);', bars: [] };
    return { text: s.levels[v - 1], style: base + 'background:#5A1427;color:#FBF6EA;',
      bars: [0, 1, 2, 3].map(j => ({ style: 'display:block;border-radius:1px;' + (s.duration ? 'width:5px;height:4px;align-self:center;' : 'width:3px;height:' + [5, 8, 11, 14][j] + 'px;') + 'background:' + (j < v ? '#FBF6EA' : 'rgba(251,246,234,.3)') })) };
  }

  /* ---------- actions ---------- */
  toast(t: string) { clearTimeout(this._tt); this.setState({ toast: t }); this._tt = setTimeout(() => this.setState({ toast: '' }), 2600); }
  start() { this.setState(Object.assign(this.blank(), { screen: 'find', selecting: false, sel: [] })); }
  loadSample() {
    this.setState(Object.assign(this.blank(), { screen: 'summary', sample: true, wine: this.wineById('grange16'),
      obs: { sweet: 'none', acid: 1, tannin: 1, body: 2, warm: 1, finish: 1 }, notes: 'Crushed ants.' }));
  }
  /* The user decides when to answer; the app moves to the next question.
     - Advances only when a sensation goes from unanswered to answered (never on revisions, clears or idle time).
     - ~420 ms confirmation first; one pending timer at a time; any manual navigation cancels it.
     - A 300 ms input guard after each advance stops a double tap landing on the next sensation.
     - In the summary sheet, any change updates the value and returns to the summary. */
  cancelAdvance() { clearTimeout(this._adv); this._adv = undefined; this._pending = null; }
  setObs(k: SensKey, v: Exclude<ObsValue, null>) {
    if (Date.now() < (this._guard || 0)) return;
    const st = this.state; const S = this.sens().find(x => x.k === k)!;
    const cur = st.obs[k]; const nv = cur === v ? null : v;
    const obs = Object.assign({}, st.obs); obs[k] = nv;
    const wasNew = this._pending && this._pending.k === k ? this._pending.wasNew : cur === null;
    this.cancelAdvance();
    const said = S.name + ': ' + this.valOf(S, nv);
    if (st.editing) {
      this._pending = { k: k };
      this.setState({ obs: obs, confirmK: nv === null ? null : k, liveMsg: said + '. Returning to summary.' });
      this._adv = setTimeout(() => { this._pending = null; this.setState({ editing: false, confirmK: null }); }, 420);
      return;
    }
    if (nv !== null && wasNew) {
      this._pending = { k: k, wasNew: true };
      this.setState({ obs: obs, confirmK: k, liveMsg: said + ' recorded.' });
      this._adv = setTimeout(() => this.advance(k), 420);
    } else {
      this.setState({ obs: obs, confirmK: null, liveMsg: said + '.' });
    }
  }
  advance(k: SensKey) {
    this._adv = undefined; this._pending = null;
    const st = this.state;
    if (st.focus !== k || st.guide || st.screen !== 'record') { this.setState({ confirmK: null }); return; }
    const K = this.keys(); const i = K.indexOf(k);
    for (let j = 1; j < K.length; j++) {
      const kk = K[(i + j) % K.length];
      if (st.obs[kk] === null) {
        this._guard = Date.now() + 300;
        const n = this.sens().find(x => x.k === kk)!.name;
        this.setState({ focus: kk, confirmK: null, liveMsg: 'Next: ' + n + '.' });
        return;
      }
    }
    this.setState({ confirmK: null, liveMsg: 'All six answered. Review tasting when you are ready.' });
  }
  clearObs(k: SensKey) { this.cancelAdvance(); const obs = Object.assign({}, this.state.obs); obs[k] = null; this.setState({ obs: obs, confirmK: null }); }
  step(d: number) { this.cancelAdvance(); const K = this.keys(); const i = K.indexOf(this.state.focus); this.setState({ focus: K[(i + d + K.length) % K.length], confirmK: null }); }
  pickWine(w: Wine) {
    const st = this.state;
    if (st.wine && st.wine.id === w.id) { this.setState({ wine: null }); return; }
    if (st.returnTo === 'summary') { this.setState({ wine: w, screen: 'summary', returnTo: null }); this.toast('Named. Your sensations stay as they were.'); return; }
    this.setState({ wine: w });
  }
  useManual() {
    const st = this.state; const n = st.mName.trim();
    const w = { id: 'm' + Date.now(), name: n || 'Untitled bottle', short: n || 'Untitled', producer: n || 'Unknown', variety: st.mType ? st.mType + ' wine' : '', vintage: '', region: 'Added by you', custom: true };
    const patch: Partial<State> = { wine: w, manual: false, mName: '', mType: null };
    if (st.returnTo === 'summary') { patch.screen = 'summary'; patch.returnTo = null; }
    this.setState(patch);
  }
  save() {
    const st = this.state; const J = this.journalNow(); const id = 'n' + Date.now();
    const e: Entry = { id: id, wine: st.wine, title: st.wine ? null : (st.title || 'Unnamed wine'), photo: st.photo, date: this.today(), obs: Object.assign({}, st.obs), notes: st.notes.trim(), enjoy: st.enjoy };
    const rep = st.repeatOf;
    this.setState(Object.assign(this.blank(), { journal: [e].concat(J), lastSaved: id, screen: rep ? 'compare' : 'journal', cmp: rep ? [rep, id] : st.cmp, selecting: false, sel: [] }));
    this.toast(rep ? 'Saved. Then and now, side by side.' : 'Saved. Your palate has been noted.');
  }
  tapCard(id: string) {
    const st = this.state;
    if (st.selecting) {
      const sel = st.sel.slice(); const i = sel.indexOf(id);
      if (i >= 0) sel.splice(i, 1); else { if (sel.length >= 2) sel.shift(); sel.push(id); }
      this.setState({ sel: sel });
    } else this.setState({ entryId: id, reveal: false, screen: 'entry' });
  }

  /* ---------- A/B comparison sessions (relative judgements; never converted to scores) ---------- */
  abQ(): Record<SensKey, AbQuestion> {
    return {
      sweet: { q: 'Which wine seems sweeter?', more: 'sweeter', noun: 'sweetness', cue: 'Notice any sugary roundness. A dry wine feels bare by comparison.' },
      acid: { q: 'Which feels sharper or more mouth-watering?', more: 'sharper', noun: 'sharpness', cue: 'Notice sharpness, sourness or how much your mouth waters afterwards.' },
      tannin: { q: 'Which leaves your mouth feeling drier?', more: 'drier', noun: 'drying', cue: 'After each sip, run your tongue over your gums. Which feels drier or grippier?' },
      body: { q: 'Which feels fuller or heavier?', more: 'fuller', noun: 'weight', cue: 'Weigh each sip in your mouth, as if comparing skim and full-cream milk.' },
      warm: { q: 'Which produces more warmth?', more: 'warmer', noun: 'warmth', cue: 'After swallowing, breathe out gently. Which leaves more heat in your throat or chest?' },
      finish: { q: 'Which leaves sensations lingering longer?', more: 'longer', noun: 'length', cue: 'After swallowing, notice which one stays with you longer. No counting needed.' }
    };
  }
  refs(): Record<string, Record<SensKey, string>> {
    return {
      mallee21: { sweet: 'Dry', acid: 'Medium', tannin: 'Firm', body: 'Full', warm: '14.5% alc.', finish: 'Long' },
      little22: { sweet: 'Dry', acid: 'Medium-high', tannin: 'Light', body: 'Light–medium', warm: '13% alc.', finish: 'Medium' },
      hollow23: { sweet: 'Dry', acid: 'High', tannin: '—', body: 'Light', warm: '11.5% alc.', finish: 'Medium' },
      salt23: { sweet: 'Dry', acid: 'Medium', tannin: 'Fine', body: 'Medium', warm: '14% alc.', finish: 'Medium' },
      moons: { sweet: 'Very sweet', acid: 'Low', tannin: '—', body: 'Full', warm: '18% alc.', finish: 'Very long' },
      kettle22: { sweet: 'Dry', acid: 'Medium', tannin: '—', body: 'Medium', warm: '13% alc.', finish: 'Medium' }
    };
  }
  emptySlot(): Slot { return { wine: null, name: null, photo: false }; }
  newAB(a?: Slot | null, b?: Slot | null, extra?: Partial<AbDraft>): AbDraft {
    return Object.assign({ a: a || this.emptySlot(), b: b || this.emptySlot(), blind: false, glassPhoto: false,
      ans: this.emptyObs(), focus: 'sweet', pref: null, notes: '', repeatOf: null, back: 'journal' }, extra || {});
  }
  seedSessions(): Session[] {
    const w = (id: string) => this.wineById(id);
    return [{ id: 's1', date: '16 Oct 2026', a: { wine: w('mallee21'), name: null, photo: true }, b: { wine: w('little22'), name: null, photo: true },
      blind: false, glassPhoto: true, ans: { sweet: 'same', acid: 'B', tannin: 'A', body: 'A', warm: 'unsure', finish: 'B' },
      pref: 'both', notes: 'B was the polite one again.', repeatOf: null }];
  }
  sessionsNow() { return this.state.sessions || this.seedSessions(); }
  slotLabel(sl: Slot | null, reveal: boolean, blind: boolean) {
    const named = sl && sl.wine ? sl.wine.name + (sl.wine.vintage ? ' ' + sl.wine.vintage : '') : (sl && sl.name) || null;
    if (!named) return 'Unnamed';
    if (blind && !reveal) return 'Named · hidden';
    return named;
  }
  markStyle(letter: string, size: number, inverse: boolean | null) {
    const A = letter === 'A'; const c = A ? '#5A1427' : '#8A5608';
    return 'width:' + size + 'px;height:' + size + 'px;flex:none;display:flex;align-items:center;justify-content:center;font-family:Fraunces,serif;font-weight:800;line-height:1;font-size:' + Math.round(size * 0.56) + 'px;'
      + 'border-radius:' + (A ? '50%' : Math.round(size * 0.16) + 'px') + ';' + (inverse ? 'background:#FBF6EA;color:' + c + ';' : 'background:' + c + ';color:#FBF6EA;');
  }
  abVal(k: SensKey, v: AbValue) {
    const m = this.abQ()[k].more;
    if (v === 'A') return 'A ' + m; if (v === 'B') return 'B ' + m;
    if (v === 'same') return 'About the same'; if (v === 'unsure') return 'Can’t tell'; return 'Unanswered';
  }
  lean(k: SensKey, v: AbValue) {
    const bar = "display:flex;align-items:center;height:16px;box-sizing:border-box;font-family:'DM Mono',monospace;font-size:9.5px;letter-spacing:.06em;color:#FBF6EA;white-space:nowrap;overflow:hidden;transition:width .25s cubic-bezier(.2,.8,.2,1);";
    const midBase = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);height:18px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;';
    const r = { aBar: bar + 'width:0;', bBar: bar + 'width:0;', aTxt: '', bTxt: '', mid: 'display:none', midText: '',
      axis: 'width:2px;align-self:stretch;flex:none;background:#1E1416;',
      track: 'position:relative;display:flex;align-items:center;flex:1;min-width:0;height:24px;',
      label: this.abVal(k, v), labelStyle: 'width:84px;flex:none;font-size:12.5px;line-height:1.15;text-align:left;' };
    if (v === 'A') { r.aBar = bar + 'width:90%;background:#5A1427;border-radius:8px 0 0 8px;padding-left:6px;justify-content:flex-start;'; r.aTxt = '◂ A'; r.labelStyle += 'color:#5A1427;font-weight:700;'; }
    else if (v === 'B') { r.bBar = bar + 'width:90%;background:#A66A0A;border-radius:0;padding-right:6px;justify-content:flex-end;'; r.bTxt = 'B ▸'; r.labelStyle += 'color:#8A5608;font-weight:700;'; }
    else if (v === 'same') { r.mid = midBase + 'padding:0 12px;border-radius:9px;background:#FBF6EA;border:1.5px solid #1E1416;font-weight:800;font-size:13px;color:#1E1416;'; r.midText = '='; r.labelStyle += 'color:#1E1416;font-weight:600;'; }
    else if (v === 'unsure') { r.mid = midBase + "width:52px;border-radius:4px;background-color:#F5ECD7;background-image:repeating-linear-gradient(135deg, rgba(30,20,22,.45) 0 1.5px, transparent 1.5px 5px);border:1px solid rgba(30,20,22,.55);font-family:'DM Mono',monospace;font-size:11px;font-weight:500;color:#1E1416;"; r.midText = '?'; r.labelStyle += 'color:#1E1416;font-weight:600;'; }
    else { r.track += 'border:1.5px dashed rgba(30,20,22,.35);border-radius:12px;'; r.axis = 'width:1px;align-self:stretch;flex:none;background:rgba(30,20,22,.2);'; r.labelStyle += 'color:#6B5A55;font-style:italic;'; }
    return r;
  }
  miniLean(v: AbValue) {
    const r = { aS: 'display:block;height:5px;width:0;', bS: 'display:block;height:5px;width:0;', mS: 'display:none', tS: '' };
    if (v === 'A') r.aS = 'display:block;height:5px;width:85%;background:#5A1427;border-radius:3px 0 0 3px;';
    else if (v === 'B') r.bS = 'display:block;height:5px;width:85%;background:#A66A0A;';
    else if (v === 'same') r.mS = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:10px;height:5px;border-top:1.5px solid #1E1416;border-bottom:1.5px solid #1E1416;box-sizing:border-box;';
    else if (v === 'unsure') r.mS = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:14px;height:6px;box-shadow:inset 0 0 0 1px rgba(30,20,22,.5);background-image:repeating-linear-gradient(135deg, rgba(30,20,22,.55) 0 1px, transparent 1px 3px);';
    else r.tS = 'outline:1px dashed rgba(30,20,22,.35);outline-offset:1px;';
    return r;
  }
  abSentence(ans: AbAns) {
    const Q = this.abQ(); const g: Record<'A' | 'B' | 'same' | 'unsure' | 'none', string[]> = { A: [], B: [], same: [], unsure: [], none: [] };
    this.keys().forEach(k => { const v = ans[k]; (v ? g[v] : g.none).push(Q[k].noun); });
    const j = (a: string[]) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
    const cl = [];
    const diff = [];
    if (g.A.length) diff.push('more ' + j(g.A) + ' in A');
    if (g.B.length) diff.push('more ' + j(g.B) + ' in B');
    if (diff.length) cl.push('noticed ' + diff.join(' and '));
    if (g.same.length) cl.push('found their ' + j(g.same) + ' about the same');
    if (g.unsure.length) cl.push('couldn’t tell their ' + j(g.unsure) + ' apart');
    let s = cl.length ? 'You ' + (cl.length < 2 ? cl[0] : cl.slice(0, -1).join(', ') + ', and ' + cl[cl.length - 1]) + '.' : 'Nothing answered yet. Short story.';
    if (cl.length && g.none.length) s += ' Unanswered: ' + j(g.none) + '.';
    return s;
  }
  latestEntryFor(w: Wine | null) { if (!w || w.custom) return null; return this.journalNow().find(e => e.wine && e.wine.id === w.id) || null; }
  lookBack(sess: Session) {
    const S = this.sens(); const Q = this.abQ(); const groups: { title: string; lines: LookLine[]; sum: string }[] = [];
    const num = (v: ObsValue) => typeof v === 'number' ? v : (v === 'none' ? 0 : null);
    const ea = this.latestEntryFor(sess.a.wine), eb = this.latestEntryFor(sess.b.wine);
    const tag = (same: boolean) => ({ tag: same ? 'Same way' : 'Different', tagStyle: "flex:none;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.08em;text-transform:uppercase;padding:3px 6px;border-radius:6px;margin-top:1px;" + (same ? 'background:#1E1416;color:#FBF6EA;' : 'border:1.5px solid #1E1416;color:#1E1416;') });
    const today = (k: SensKey, v: AbValue) => v === 'same' ? 'they felt about the same' : (v === 'A' || v === 'B') ? v + ' felt ' + Q[k].more : null;
    if (ea && eb && ea.id !== eb.id) {
      const lines: LookLine[] = []; let agree = 0, n = 0;
      S.forEach(s => {
        const t = today(s.k, sess.ans[s.k]); const a = num(ea.obs[s.k]), b = num(eb.obs[s.k]);
        if (!t || a === null || b === null) return;
        const dir = a > b ? 'A' : b > a ? 'B' : 'same'; const same = dir === sess.ans[s.k]; n++; if (same) agree++;
        lines.push(Object.assign({ t: s.name + ': today ' + t + '. Your separate tastings rated ' + (dir === 'same' ? 'them level (' + a + ' and ' + b + ')' : dir + ' higher (' + (dir === 'A' ? a + ' vs ' + b : b + ' vs ' + a) + ')') + '.' }, tag(same)));
      });
      if (lines.length) groups.push({ title: 'Against your single tastings (' + ea.date + ', ' + eb.date + ')', lines: lines, sum: agree + ' of ' + n + ' comparable sensations pointed the same way.' });
    }
    if (sess.repeatOf) {
      const p = this.sessionsNow().find(x => x.id === sess.repeatOf);
      if (p) {
        const lines: LookLine[] = []; let agree = 0, n = 0;
        S.forEach(s => {
          const v0 = p.ans[s.k], v1 = sess.ans[s.k]; if (v0 === null || v1 === null) return;
          const same = v0 === v1; n++; if (same) agree++;
          lines.push(Object.assign({ t: s.name + ': before, ' + this.abVal(s.k, v0).toLowerCase() + '. Today, ' + this.abVal(s.k, v1).toLowerCase() + '.' }, tag(same)));
        });
        if (lines.length) groups.push({ title: 'Against your earlier session (' + p.date + ')', lines: lines, sum: agree + ' of ' + n + ' answers matched last time.' });
      }
    }
    return groups;
  }
  startAB(a?: Slot | null, b?: Slot | null, extra?: Partial<AbDraft>) {
    this.cancelAdvance();
    const back = this.state.screen || 'welcome';
    this.setState({ ab: this.newAB(a, b, Object.assign({ back: back }, extra || {})), screen: 'abSetup', abEditing: false, abGuide: false, abSlot: null, chooser: false, selecting: false, sel: [], confirmK: null });
  }
  setAbPatch(p: Partial<AbDraft>) { this.setState({ ab: Object.assign({}, this.state.ab, p) }); }
  setAB(k: SensKey, v: Exclude<AbValue, null>) {
    if (Date.now() < (this._guard || 0)) return;
    const st = this.state; const ab = st.ab; if (!ab) return;
    const cur = ab.ans[k]; const nv = cur === v ? null : v;
    const ans = Object.assign({}, ab.ans); ans[k] = nv;
    const wasNew = this._pending && this._pending.k === k ? this._pending.wasNew : cur === null;
    this.cancelAdvance();
    const said = this.sens().find(x => x.k === k)!.name + ': ' + this.abVal(k, nv);
    const nab = Object.assign({}, ab, { ans: ans });
    if (st.abEditing) {
      this._pending = { k: k };
      this.setState({ ab: nab, confirmK: nv === null ? null : k, liveMsg: said + '. Returning to review.' });
      this._adv = setTimeout(() => { this._pending = null; this.setState({ abEditing: false, confirmK: null }); }, 420);
      return;
    }
    if (nv !== null && wasNew) {
      this._pending = { k: k, wasNew: true };
      this.setState({ ab: nab, confirmK: k, liveMsg: said + ' recorded.' });
      this._adv = setTimeout(() => this.abAdvance(k), 420);
    } else this.setState({ ab: nab, confirmK: null, liveMsg: said + '.' });
  }
  abAdvance(k: SensKey) {
    this._adv = undefined; this._pending = null;
    const st = this.state; const ab = st.ab;
    if (!ab || ab.focus !== k || st.abGuide || st.screen !== 'abRecord') { this.setState({ confirmK: null }); return; }
    const K = this.keys(); const i = K.indexOf(k);
    for (let j = 1; j < K.length; j++) {
      const kk = K[(i + j) % K.length];
      if (ab.ans[kk] === null) {
        this._guard = Date.now() + 300;
        this.setState({ ab: Object.assign({}, ab, { focus: kk }), confirmK: null, liveMsg: 'Next: ' + this.sens().find(x => x.k === kk)!.name + '.' });
        return;
      }
    }
    this.setState({ confirmK: null, liveMsg: 'All six answered. Review when you are ready.' });
  }
  abStep(d: number) { this.cancelAdvance(); const K = this.keys(); const i = K.indexOf(this.state.ab!.focus); this.setState({ ab: Object.assign({}, this.state.ab, { focus: K[(i + d + K.length) % K.length] }), confirmK: null }); }
  abSetSlot(which: 'a' | 'b', patch: Partial<Slot>) {
    const ab = this.state.ab!; const sl = Object.assign({}, ab[which], patch);
    const p: Partial<AbDraft> = {}; p[which] = sl;
    this.setState({ ab: Object.assign({}, ab, p), abSlot: null, abSlotName: '' });
  }
  saveAB() {
    const st = this.state; const ab = st.ab!; const id = 's' + Date.now();
    const sess = { id: id, date: this.today(), a: ab.a, b: ab.b, blind: ab.blind, glassPhoto: ab.glassPhoto, ans: Object.assign({}, ab.ans), pref: ab.pref, notes: ab.notes.trim(), repeatOf: ab.repeatOf };
    this.cancelAdvance();
    this.setState({ sessions: [sess].concat(this.sessionsNow()), ab: null, screen: 'abView', sessionId: id, lastSession: id, lbOpen: false, refsOpen: false, abEditing: false, confirmK: null, jTab: 'sessions' });
    this.toast(ab.blind ? 'Saved. Names revealed below.' : 'Saved. Your tongue has entered the chat.');
  }
  demoAB(which: string) {
    if (which === 'abSetup') { this.startAB(); return; }
    if (which === 'abRecord') { this.setState({ screen: 'abRecord', ab: this.newAB(null, null, { ans: { sweet: 'same', acid: 'B', tannin: null, body: null, warm: null, finish: null }, focus: 'tannin' }) }); return; }
    if (which === 'abReview') { this.setState({ screen: 'abReview', ab: this.newAB(null, null, { ans: { sweet: 'same', acid: 'B', tannin: 'A', body: 'A', warm: 'unsure', finish: 'B' }, focus: 'warm' }) }); return; }
    if (which === 'abView') this.setState({ screen: 'abView', sessionId: 's1', lbOpen: true, refsOpen: false });
  }

  /* ---------- render ---------- */
  renderVals() {
    const st = this.state;
    const S = this.sens(); const K = this.keys(); const J = this.journalNow();
    const scr = st.screen || 'welcome';
    const obs = st.obs; const f = st.focus;
    const fsD = S.find(s => s.k === f)!; const fv = obs[f];
    const w = st.wine;
    const answered = K.filter(k => obs[k] !== null).length;
    const sheet = scr === 'summary' && st.editing;
    const dims = ({ '390 × 844': [390, 844], '412 × 915': [412, 915], '430 × 932': [430, 932] } as Record<string, number[]>)[this.props.device as string] || [390, 844];

    /* dock: levels */
    const lvBase = 'height:100px;width:100%;box-sizing:border-box;border-radius:14px;border:1.5px solid #1E1416;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;padding:10px 4px 9px;transition:background .15s,color .15s;';
    const levels = fsD.levels.map((label, i) => {
      const n = i + 1; const sel = fv === n;
      return { label: label, hint: fsD.hints ? fsD.hints[i] : '',
        hintStyle: fsD.hints ? 'font-size:10.5px;line-height:1.1;opacity:.8;text-align:center;padding:0 2px' : 'display:none',
        pressed: sel ? 'true' : 'false', cls: sel ? (st.confirmK === f ? 'press confirm' : 'press') : 'press',
        style: lvBase + (sel ? 'background:#5A1427;color:#FBF6EA;border-color:#5A1427;' : 'background:#FBF6EA;color:#1E1416;'),
        bars: [0, 1, 2, 3].map(j => ({ style: 'display:block;border-radius:1.5px;' + (fsD.duration ? 'width:9px;height:6px;' : 'width:6px;height:' + [8, 13, 19, 26][j] + 'px;') + 'background:' + (j < n ? (sel ? '#FBF6EA' : '#1E1416') : (sel ? 'rgba(251,246,234,.28)' : 'rgba(30,20,22,.15)')) })),
        pick: () => this.setObs(f, n), aria: fsD.name + ': ' + label };
    });
    const altBase = 'height:54px;width:100%;box-sizing:border-box;border-radius:14px;border:1.5px solid #1E1416;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:650;font-size:15px;';

    const fs = { name: fsD.name, sub: fsD.sub, q: fsD.q, none: fsD.none || '', hasNone: !!fsD.none,
      clearAria: 'Clear ' + fsD.name.toLowerCase() + ' answer',
      steps: fsD.guide.map((t, i) => ({ n: i + 1, t: t })), foot: fsD.foot,
      guideAria: 'How to notice ' + fsD.name.toLowerCase(), levelAria: fsD.name + ' level',
      iSweet: f === 'sweet', iAcid: f === 'acid', iTannin: f === 'tannin', iBody: f === 'body', iWarm: f === 'warm', iFinish: f === 'finish' };

    /* record rows */
    const rows = S.map((s, i) => {
      const v = obs[s.k]; const foc = s.k === f; const c = this.chip(s, v);
      return { num: '0' + (i + 1), name: s.name, chip: c.text, chipStyle: c.style, bars: c.bars,
        aria: s.name + ': ' + this.valOf(s, v) + '. Tap to make this the active sensation.',
        tap: () => { this.cancelAdvance(); this.setState({ focus: s.k, confirmK: null }); },
        style: 'display:flex;align-items:center;gap:10px;width:100%;height:50px;box-sizing:border-box;padding:0 8px 0 10px;border:0;border-bottom:1px solid rgba(30,20,22,.2);text-align:left;transition:background .2s;' + (foc ? 'background:#F2CF5B;border-radius:10px;' : 'background:transparent;') };
    });

    /* summary */
    const sum = { date: this.today(), title: w ? w.name : (st.title || 'Unnamed wine'),
      sub: w ? [w.variety, w.vintage, w.region].filter(Boolean).join(' · ') : 'Not identified. That’s allowed.',
      identifyLabel: w ? 'Change wine' : 'Name this wine', noPhoto: !st.photo };
    const sumRows = S.map((s, i) => {
      const v = obs[s.k];
      return { num: '0' + (i + 1), name: s.name, cells: this.cells(v, '#5A1427', false, 18), val: this.valOf(s, v), valStyle: this.valStyle(v),
        aria: s.name + ': ' + this.valOf(s, v) + '. Tap to change.', edit: () => { this.cancelAdvance(); this.setState({ focus: s.k, editing: true, guide: false, confirmK: null }); } };
    });
    const enjoyOpts = this.enjoyLabels().map((label, i) => {
      const n = i + 1; const sel = st.enjoy === n;
      return { label: label, pressed: sel ? 'true' : 'false', cls: sel ? 'press pop' : 'press',
        style: 'height:74px;width:100%;box-sizing:border-box;border-radius:14px;border:1.5px solid #1E1416;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;padding:8px 2px;font-size:11.5px;font-weight:650;line-height:1.1;text-align:center;' + (sel ? 'background:#1E1416;color:#FBF6EA;' : 'background:#FBF6EA;color:#1E1416;'),
        glass: 'position:relative;display:block;width:14px;height:20px;border:1.5px solid currentColor;border-top:0;border-radius:0 0 7px 7px;overflow:hidden;',
        fill: 'position:absolute;left:0;right:0;bottom:0;height:' + (n * 20) + '%;background:' + (sel ? '#F2CF5B' : '#7E1F35') + ';',
        pick: () => this.setState({ enjoy: st.enjoy === n ? null : n }) };
    });

    /* find */
    const q = st.query.trim().toLowerCase();
    let R = this.wines();
    if (q) R = R.filter(x => [x.name, x.producer, x.variety, x.vintage, x.region].join(' ').toLowerCase().indexOf(q) >= 0);
    const results = R.map(x => {
      const sel = !!(w && w.id === x.id);
      return { title: x.name, sub: [x.variety, x.vintage, x.region].join(' · '), tag: sel ? 'Selected' : '', pressed: sel ? 'true' : 'false',
        style: 'display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:64px;padding:10px 12px;box-sizing:border-box;border:0;border-bottom:1px solid rgba(30,20,22,.2);text-align:left;' + (sel ? 'background:#F2CF5B;' : 'background:transparent;'),
        pick: () => this.pickWine(x) };
    });
    const guessW = w || this.wineById('hollow23')!;

    /* journal */
    const T = J.length || 1;
    const palate = S.map(s => {
      let n = 0, z = 0, u = 0, x = 0;
      J.forEach(e => { const v = e.obs[s.k]; if (typeof v === 'number') n++; else if (v === 'none') z++; else if (v === 'unsure') u++; else x++; });
      return { name: s.name, n: n, u: u, count: n + '/' + J.length,
        segN: 'display:block;height:100%;width:' + (n / T * 100) + '%;background:#5A1427;',
        segZ: 'display:block;height:100%;width:' + (z / T * 100) + '%;background:#CDBFA6;',
        segU: 'display:block;height:100%;width:' + (u / T * 100) + '%;background-image:repeating-linear-gradient(135deg, rgba(30,20,22,.55) 0 1.5px, transparent 1.5px 4.5px);',
        segX: 'display:block;height:100%;box-sizing:border-box;width:' + (x / T * 100) + '%;' + (x ? 'border:1.5px dashed rgba(30,20,22,.4);border-radius:0 5px 5px 0;' : '') };
    });
    const mostN = palate.reduce((a, b) => b.n > a.n ? b : a);
    const mostU = palate.reduce((a, b) => b.u > a.u ? b : a);
    const lc = (x: { name: string }) => x.name.toLowerCase();
    const ins1 = mostN.n === 0 ? 'No levels reported yet.' : mostN.n === J.length ? 'You’ve reported ' + lc(mostN) + ' in all ' + J.length + ' tastings.' : 'You’ve reported ' + lc(mostN) + ' most often: ' + mostN.n + ' of ' + J.length + ' tastings.';
    const ins2 = mostU.u > 0 ? '“Can’t tell” came up most for ' + lc(mostU) + ' (' + mostU.u + ' of ' + J.length + '). That records uncertainty, not inability.' : 'No “can’t tell” answers yet. Suspicious, but fine.';
    const cards = J.map(e => {
      const id = this.ident(e); const si = st.sel.indexOf(e.id);
      return { tile: this.tileFor(e.wine, e.photo, 171), date: e.date, title: id.title, sub: id.sub,
        note: e.notes ? '“' + e.notes + '”' : '', enjoy: e.enjoy ? this.enjoyLabels()[e.enjoy - 1] : '',
        fp: this.fp(e.obs, '#5A1427', 1), tap: () => this.tapCard(e.id), selecting: st.selecting,
        checkText: si >= 0 ? (si === 0 ? 'A' : 'B') : '',
        checkStyle: 'position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;border:2px solid #FBF6EA;' + (si >= 0 ? 'background:' + (si === 0 ? '#5A1427' : '#A66A0A') + ';color:#FBF6EA;' : 'background:rgba(30,20,22,.4);color:#FBF6EA;'),
        isNew: e.id === st.lastSaved, pressed: si >= 0 ? 'true' : 'false', aria: id.title + ', tasted ' + e.date,
        style: 'display:flex;flex-direction:column;align-items:stretch;text-align:left;padding:0;border:0;background:transparent;border-radius:12px;' + (si >= 0 ? 'outline:3px solid ' + (si === 0 ? '#5A1427' : '#A66A0A') + ';outline-offset:4px;' : '') };
    });

    /* entry */
    const E = J.find(e => e.id === st.entryId) || J[0];
    const eid = this.ident(E);
    const ent = { tile: this.tileFor(E.wine, E.photo, 358), title: eid.title, sub: eid.long, date: E.date, notes: E.notes, hasNotes: !!E.notes,
      enjoy: E.enjoy ? this.enjoyLabels()[E.enjoy - 1] : 'Not rated', hidden: !st.reveal, shown: !!st.reveal,
      rows: S.map(s => ({ name: s.name, cells: this.cells(E.obs[s.k], '#5A1427', false, 18), val: this.valOf(s, E.obs[s.k]), valStyle: this.valStyle(E.obs[s.k]) })) };

    /* compare */
    const CA = '#5A1427', CB = '#A66A0A';
    const pair = st.cmp || ['e2', 'e4'];
    const A = J.find(e => e.id === pair[0]) || J[0];
    const B = J.find(e => e.id === pair[1]) || J[1];
    const ia = this.ident(A), ib = this.ident(B);
    const head = (e: Entry, id: ReturnType<AnosmiaLogic['ident']>, color: string, side: string) => ({ tile: this.tileFor(e.wine, e.photo, 54), fp: this.fp(e.obs, color, 0.8), title: id.title, sub: id.sub, date: e.date, side: side,
      key: this.markStyle(side, 18, false), enjoy: e.enjoy ? this.enjoyLabels()[e.enjoy - 1] : 'Not rated',
      boxStyle: 'border-top:4px solid ' + color + ';padding-top:10px;min-width:0;' });
    const cmpHeads = [head(A, ia, CA, 'A'), head(B, ib, CB, 'B')];
    const num = (v: ObsValue) => typeof v === 'number' ? v : (v === 'none' ? 0 : null);
    const cmpRows = S.map(s => ({ name: s.short, aCells: this.cells(A.obs[s.k], CA, true, 22), bCells: this.cells(B.obs[s.k], CB, false, 22), aNum: this.numTxt(A.obs[s.k]), bNum: this.numTxt(B.obs[s.k]) }));
    const diffs: { d: number; t: string }[] = [], unsure: string[] = [], skipped: string[] = []; let close = 0;
    S.forEach(s => {
      const va = A.obs[s.k], vb = B.obs[s.k]; const a = num(va), b = num(vb);
      if (a !== null && b !== null) {
        const d = b - a;
        if (Math.abs(d) >= 2) diffs.push({ d: Math.abs(d), t: s.name + ': you reported ' + (d > 0 ? 'a higher' : 'a lower') + ' level for ' + ib.short + ' (' + b + ' vs ' + a + ').' });
        else close++;
      } else if (va === 'unsure' || vb === 'unsure') unsure.push(s.name.toLowerCase());
      else skipped.push(s.name.toLowerCase());
    });
    diffs.sort((x, y) => y.d - x.d);
    const standOut = diffs.slice(0, 3).map(x => ({ t: x.t }));
    if (!standOut.length) standOut.push({ t: 'No big gaps. You rated these two similarly.' });
    if (close) standOut.push({ t: close + ' of 6 sensations were rated within one step of each other.' });
    if (unsure.length) standOut.push({ t: 'Not compared: ' + unsure.join(', ') + '. You marked “can’t tell” on at least one glass, and that’s fine.' });
    if (A.enjoy && B.enjoy) standOut.push({ t: A.enjoy === B.enjoy ? 'Pour another: the same answer for both (“' + this.enjoyLabels()[A.enjoy - 1] + '”). Liking is separate from what you noticed.' : 'Pour another: “' + this.enjoyLabels()[A.enjoy - 1] + '” for ' + ia.short + ', “' + this.enjoyLabels()[B.enjoy - 1] + '” for ' + ib.short + '. Liking is separate from what you noticed.' });
    else standOut.push({ t: 'Pour another: not rated for ' + (A.enjoy ? ib.short : B.enjoy ? ia.short : 'either') + ', so no preference to compare.' });
    if (skipped.length) standOut.push({ t: 'Not compared: ' + skipped.join(', ') + '. Unanswered on at least one glass.' });

    const selLen = st.sel.length;
    /* ---------- A/B comparison ---------- */
    const Q = this.abQ();
    const ab = st.ab;
    const abF0 = ab ? ab.focus : 'sweet';
    const abV = ab ? ab.ans[abF0] : null;
    const abAnswered = ab ? K.filter(k => ab.ans[k] !== null).length : 0;
    const abSheet = scr === 'abReview' && !!st.abEditing;
    const abSD = S.find(s => s.k === abF0)!;
    const abBig = 'height:104px;width:100%;box-sizing:border-box;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:8px 8px;min-width:0;transition:background .15s,color .15s;';
    const abAlt = 'height:54px;width:100%;box-sizing:border-box;border-radius:14px;border:1.5px solid #1E1416;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:650;font-size:15px;';
    const cnf = (v: AbValue) => abV === v ? (st.confirmK === abF0 ? 'press confirm' : 'press') : 'press';
    const abName = (which: 'a' | 'b') => ab ? this.slotLabel(ab[which], false, ab.blind) : 'Unnamed';
    const abRows = S.map((s) => {
      const v = ab ? ab.ans[s.k] : null; const L = this.lean(s.k, v); const foc = ab && ab.focus === s.k && scr === 'abRecord';
      return Object.assign(L, { name: s.short, aria: s.name + ': ' + this.abVal(s.k, v) + '. Tap to make this the active sensation.', editAria: s.name + ': ' + this.abVal(s.k, v) + '. Tap to change.',
        tap: () => { this.cancelAdvance(); this.setState({ ab: Object.assign({}, this.state.ab, { focus: s.k }), confirmK: null }); },
        edit: () => { this.cancelAdvance(); this.setState({ ab: Object.assign({}, this.state.ab, { focus: s.k }), abEditing: true, abGuide: false, confirmK: null }); },
        rowStyle: 'display:flex;align-items:center;gap:8px;width:100%;height:48px;box-sizing:border-box;padding:0 8px;border:0;border-bottom:1px solid rgba(30,20,22,.2);text-align:left;transition:background .2s;' + (foc ? 'background:#F2CF5B;border-radius:10px;' : 'background:transparent;') });
    });
    const strip = (which: 'a' | 'b') => ({ letter: which.toUpperCase(), mark: this.markStyle(which.toUpperCase(), 28, false), name: abName(which),
      identify: () => this.setState({ abSlot: which, abSlotName: '' }), identifyLabel: ab && (ab[which].wine || ab[which].name) ? 'Change' : 'Name ' + which.toUpperCase() });
    const slotTile = (which: 'a' | 'b') => {
      const sl = ab ? ab[which] : this.emptySlot(); const L = which.toUpperCase();
      return { letter: L, mark: this.markStyle(L, 46, false), side: 'Glass ' + L + (L === 'A' ? ' · left' : ' · right'), name: abName(which),
        sub: (sl.photo ? 'Label photo saved · ' : '') + (sl.wine || sl.name ? 'Tap to change' : 'Tap to name it. Or don’t.'),
        aria: 'Glass ' + L + ': ' + abName(which) + '. Tap to name.', tap: () => this.setState({ abSlot: which, abSlotName: '' }) };
    };
    const segBtn = (on: boolean) => 'height:62px;border-radius:14px;border:1.5px solid #1E1416;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-weight:700;font-size:15px;' + (on ? 'background:#1E1416;color:#FBF6EA;' : 'background:transparent;color:#1E1416;');
    const prefDefs: [Pref, string][] = [['A', 'A'], ['B', 'B'], ['both', 'Both'], ['neither', 'Neither'], ['undecided', 'Can’t decide']];
    const prefOpts = prefDefs.map(d => {
      const sel = ab && ab.pref === d[0];
      const mark = d[0] === 'A' || d[0] === 'B' ? this.markStyle(d[0], 24, sel) : 'display:flex;align-items:center;justify-content:center;width:24px;height:24px;font-weight:800;font-size:15px;';
      return { label: d[1], markText: d[0] === 'A' || d[0] === 'B' ? d[0] : (d[0] === 'both' ? '+' : d[0] === 'neither' ? '×' : '?'), mark: mark,
        pressed: sel ? 'true' : 'false', cls: sel ? 'press pop' : 'press',
        style: 'height:74px;width:100%;box-sizing:border-box;border-radius:14px;border:1.5px solid #1E1416;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;padding:8px 2px;font-size:11.5px;font-weight:650;line-height:1.1;text-align:center;' + (sel ? 'background:#1E1416;color:#FBF6EA;' : 'background:#FBF6EA;color:#1E1416;'),
        pick: () => this.setAbPatch({ pref: ab!.pref === d[0] ? null : d[0] }) };
    });
    const prefLabel = (p: Pref | null) => { const d = prefDefs.find(x => x[0] === p); return d ? (p === 'A' || p === 'B' ? 'Wine ' + p : d[1]) : 'Not answered'; };

    /* slot sheet */
    const slotW = st.abSlot && ab ? ab[st.abSlot] : null;
    const tastedIds = J.filter(e => e.wine).map(e => e.wine!.id);
    const abWineOpts = this.wines().slice().sort((x, y) => Number(tastedIds.indexOf(y.id) >= 0) - Number(tastedIds.indexOf(x.id) >= 0)).map(x => {
      const sel = !!(slotW && slotW.wine && slotW.wine.id === x.id);
      return { title: x.name, sub: [x.variety, x.vintage].join(' · '), tag: sel ? 'Selected' : (tastedIds.indexOf(x.id) >= 0 ? 'In journal' : ''), pressed: sel ? 'true' : 'false',
        style: 'display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;min-height:54px;padding:6px 8px;box-sizing:border-box;border:0;border-bottom:1px solid rgba(30,20,22,.18);text-align:left;' + (sel ? 'background:#F2CF5B;' : 'background:transparent;'),
        pick: () => this.abSetSlot(st.abSlot!, { wine: x, name: null }) };
    });

    /* saved session view */
    const SS = this.sessionsNow();
    const SV = SS.find(x => x.id === st.sessionId) || SS[0];
    let sv = null;
    if (SV) {
      const lb = this.lookBack(SV);
      const ra = SV.a.wine && this.refs()[SV.a.wine.id], rb = SV.b.wine && this.refs()[SV.b.wine.id];
      const g = (which: 'a' | 'b') => { const sl = SV[which]; const L = which.toUpperCase(); const e = this.latestEntryFor(sl.wine);
        return { letter: L, mark: this.markStyle(L, 30, false), side: 'Glass ' + L + (SV.blind ? ' · revealed' : ''), name: this.slotLabel(sl, true, false),
          sub: sl.wine ? [sl.wine.variety, sl.wine.region].filter(Boolean).join(' · ') : (sl.name ? 'Added by you' : 'Not identified'),
          hasEntry: !!e, open: () => this.setState({ entryId: e ? e.id : null, reveal: false, screen: 'entry' }) }; };
      sv = { date: SV.date, kind: SV.blind ? 'A/B session · blind (someone else poured)' : 'A/B session · open (you knew which was which)',
        glasses: [g('a'), g('b')], rows: S.map(s => Object.assign(this.lean(s.k, SV.ans[s.k]), { name: s.short })),
        sentence: this.abSentence(SV.ans), pref: prefLabel(SV.pref), notes: SV.notes, hasNotes: !!SV.notes,
        lbNone: !lb.length, lbClosed: lb.length > 0 && !st.lbOpen, lbOpen: lb.length > 0 && !!st.lbOpen, lbGroups: lb,
        lbIntro: 'You have earlier notes on these wines. They stay tucked away unless you ask.',
        lbCaveat: 'Matching earlier notes suggests you’re consistent with yourself. It isn’t proof of accuracy: those notes are your impressions too' + (SV.blind ? '.' : ', and you knew which wine was which.'),
        hasRefs: !!(ra && rb), refsOpen: !!st.refsOpen, refsBtn: st.refsOpen ? 'Hide' : 'Show',
        refs: ra && rb ? S.map(s => ({ name: s.short, a: ra[s.k], b: rb[s.k] })) : [] };
    }

    /* journal: sessions tab */
    const sessPal = S.map(s => {
      let d = 0, same = 0, u = 0, x = 0;
      SS.forEach(e => { const v = e.ans[s.k]; if (v === 'A' || v === 'B') d++; else if (v === 'same') same++; else if (v === 'unsure') u++; else x++; });
      const T2 = SS.length || 1;
      return { name: s.name, count: d + '/' + SS.length,
        segD: 'display:block;height:100%;width:' + (d / T2 * 100) + '%;background:#5A1427;',
        segS: 'display:block;height:100%;width:' + (same / T2 * 100) + '%;background:#CDBFA6;',
        segU: 'display:block;height:100%;width:' + (u / T2 * 100) + '%;background-image:repeating-linear-gradient(135deg, rgba(30,20,22,.55) 0 1.5px, transparent 1.5px 4.5px);',
        segX: 'display:block;height:100%;box-sizing:border-box;width:' + (x / T2 * 100) + '%;' + (x ? 'border:1.5px dashed rgba(30,20,22,.4);' : '') };
    });
    const sessCards = SS.map(e => ({
      aMark: this.markStyle('A', 24, false), bMark: this.markStyle('B', 24, false),
      aName: this.slotLabel(e.a, true, false), bName: this.slotLabel(e.b, true, false),
      meta: e.date + ' · ' + (e.blind ? 'Blind' : 'Open') + (e.pref ? ' · Pour again: ' + prefLabel(e.pref) : ''),
      mini: K.map(k => this.miniLean(e.ans[k])), isNew: e.id === st.lastSession,
      aria: 'A/B session, ' + e.date + ': ' + this.slotLabel(e.a, true, false) + ' versus ' + this.slotLabel(e.b, true, false),
      tap: () => this.setState({ screen: 'abView', sessionId: e.id, lbOpen: false, refsOpen: false }) }));
    const abInProgress = !!(ab && scr !== 'abView');
    const jTab = st.jTab || 'tastings';

    return {
      isWelcome: scr === 'welcome', isFind: scr === 'find', isRecord: scr === 'record', isSummary: scr === 'summary',
      isJournal: scr === 'journal', isEntry: scr === 'entry', isCompare: scr === 'compare',

      start: () => this.start(), sample: () => this.loadSample(),
      goJournal: () => this.setState({ screen: 'journal', selecting: false, sel: [] }),
      goWelcome: () => this.setState({ screen: 'welcome' }),

      /* find */
      query: st.query, onQuery: (e: Change) => this.setState({ query: e.target.value }),
      results: results, noResults: !!q && R.length === 0,
      resultsHeading: q ? R.length + (R.length === 1 ? ' match' : ' matches') : 'Sample cellar',
      findBack: () => this.setState({ screen: st.returnTo === 'summary' ? 'summary' : 'welcome', returnTo: null }),
      findPrimary: () => this.setState({ screen: st.returnTo === 'summary' ? 'summary' : 'record', returnTo: null }),
      findPrimaryLabel: st.returnTo === 'summary' ? 'Back to summary' : (w ? 'Start tasting' : 'Taste without naming'),
      findPrimarySub: w ? w.name + (w.vintage ? ' ' + w.vintage : '') + (st.photo ? ' · photo saved' : '') : (st.photo ? 'Label photo saved · name it later' : 'You can name it later, or never'),
      cameraLabel: st.photo ? 'Retake photo' : 'Snap the label',
      openCamera: () => this.setState({ camera: true, camStage: 'aim' }),
      closeCamera: () => this.setState({ camera: false, camStage: 'aim' }),
      capture: () => this.setState({ camStage: 'found' }),
      acceptGuess: () => { const patch: Partial<State> = { wine: guessW, photo: true, camera: false, camStage: 'aim' }; this.setState(patch); },
      rejectGuess: () => this.setState({ photo: true, camera: false, camStage: 'aim', wine: st.wine && st.wine.id === guessW.id && !st.wine.custom ? st.wine : st.wine }),
      camera: st.camera, camAim: st.camStage === 'aim', camFound: st.camStage === 'found',
      guessName: guessW.name + (guessW.vintage ? ' ' + guessW.vintage : ''),
      camProd: guessW.producer, camTitle: guessW.variety, camVin: guessW.vintage,
      openManual: () => this.setState({ manual: true }), closeManual: () => this.setState({ manual: false }),
      manual: st.manual, mName: st.mName, onMName: (e: Change) => this.setState({ mName: e.target.value }),
      types: ['Red', 'White', 'Rosé', 'Sparkling', 'Orange', 'Sweet'].map(t => ({ t: t, pressed: st.mType === t ? 'true' : 'false',
        style: 'height:48px;border-radius:14px;border:1.5px solid #1E1416;font-weight:650;font-size:14px;' + (st.mType === t ? 'background:#5A1427;color:#FBF6EA;border-color:#5A1427;' : 'background:transparent;'),
        pick: () => this.setState({ mType: st.mType === t ? null : t }) })),
      useManual: () => this.useManual(),

      /* record */
      tastingNo: 'Tasting No. ' + String(J.length + 1).padStart(2, '0'),
      answeredText: answered + ' of 6 answered',
      changeWine: () => this.setState({ screen: 'find' }),
      recTile: this.tileFor(w, st.photo, 34), sum: sum, rows: rows,

      /* dock */
      showDock: scr === 'record' || sheet, dockSheet: sheet,
      dockCls: sheet ? 'rise' : '',
      dockStyle: 'position:absolute;left:0;right:0;bottom:0;height:calc(348px + env(safe-area-inset-bottom, 0px));box-sizing:border-box;padding:12px 16px calc(18px + env(safe-area-inset-bottom, 0px));display:flex;flex-direction:column;z-index:21;' + (sheet ? 'background:#FBF6EA;border-radius:22px 22px 0 0;box-shadow:0 -14px 40px rgba(30,20,22,.28);' : 'background:#F5ECD7;border-top:1.5px solid #1E1416;'),
      notches: K.map(k => ({ style: 'display:block;flex:1;height:' + (k === f ? 6 : 4) + 'px;border-radius:3px;transition:all .2s;background:' + (obs[k] !== null ? '#5A1427' : (k === f ? '#1E1416' : 'rgba(30,20,22,.15)')) + ';' })),
      fs: fs, levels: levels,
      altCols: fs.hasNone ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)',
      pickNone: () => this.setObs(f, 'none'), nonePressed: fv === 'none' ? 'true' : 'false', noneCls: fv === 'none' ? (st.confirmK === f ? 'press confirm' : 'press') : 'press',
      noneStyle: altBase + (fv === 'none' ? 'background:#5A1427;color:#FBF6EA;border-color:#5A1427;' : 'background:transparent;color:#1E1416;'),
      pickUnsure: () => this.setObs(f, 'unsure'), unsurePressed: fv === 'unsure' ? 'true' : 'false', unsureCls: fv === 'unsure' ? (st.confirmK === f ? 'press confirm' : 'press') : 'press',
      unsureStyle: altBase + (fv === 'unsure' ? 'background:#1E1416;color:#FBF6EA;' : 'background:transparent;color:#1E1416;'),
      clearCur: () => this.clearObs(f), clearDisabled: fv === null,
      clearStyle: 'height:44px;padding:0 6px;border:0;background:transparent;font-weight:650;font-size:13px;text-decoration:underline;text-underline-offset:3px;flex:none;' + (fv === null ? 'visibility:hidden;' : ''),
      barAlign: fsD.duration ? 'center' : 'flex-end',
      prev: () => this.step(-1), next: () => this.step(1),
      openGuide: () => { this.cancelAdvance(); this.setState({ guide: true, confirmK: null }); },
      closeGuide: () => this.setState({ guide: false }), guide: st.guide,
      dockPrimaryLabel: sheet ? 'Done' : (answered === 6 ? 'All six. Review tasting' : 'Review tasting'),
      dockPrimaryCls: 'press' + (!sheet && answered === 6 && st.confirmK === null ? ' ready' : ''),
      dockPrimaryStyle: 'flex:1;height:56px;border-radius:16px;font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center;gap:8px;transition:background .2s,color .2s;' + (!sheet && answered === 6 ? 'background:#5A1427;color:#FBF6EA;border:1.5px solid #5A1427;' : 'background:#F2CF5B;color:#1E1416;border:1.5px solid #1E1416;'),
      liveMsg: st.liveMsg,
      dockPrimary: sheet ? () => { this.cancelAdvance(); this.setState({ editing: false, confirmK: null }); } : () => { this.cancelAdvance(); this.setState({ screen: 'summary', editing: false, guide: false, confirmK: null }); },
      closeEdit: () => { this.cancelAdvance(); this.setState({ editing: false, confirmK: null }); },

      /* summary */
      summaryTag: st.sample ? 'Sample · illustrative' : 'Summary', sumTile: this.tileFor(w, st.photo, 104),
      sumRows: sumRows, sumFp: this.fp(obs, '#5A1427', 1),
      notes: st.notes, onNotes: (e: Change) => this.setState({ notes: e.target.value }),
      enjoyOpts: enjoyOpts,
      identify: () => this.setState({ screen: 'find', returnTo: 'summary' }),
      keepTasting: () => { this.cancelAdvance(); this.setState({ screen: 'record', editing: false, confirmK: null }); },
      saveHint: st.repeatOf ? 'Last time stays hidden until you save' : (answered < 6 ? (6 - answered) + ' unanswered. Saving is still fine.' : 'All six answered'),
      save: () => this.save(),

      /* journal */
      jCountText: J.length + ' tastings', palate: palate, ins1: ins1, ins2: ins2, cards: cards,
      selecting: st.selecting, notSelecting: !st.selecting,
      startSelect: () => this.setState({ screen: 'journal', selecting: true, sel: [] }),
      cancelSelect: () => this.setState({ selecting: false, sel: [] }),
      doCompare: () => { if (st.sel.length === 2) this.setState({ cmp: st.sel.slice(), screen: 'compare', selecting: false, sel: [] }); },
      cmpDisabled: selLen < 2,
      selText: selLen === 0 ? 'Pick two' : selLen === 1 ? 'Pick one more' : 'A vs B',
      cmpBtnStyle: 'height:60px;border-radius:18px;border:1.5px solid #1E1416;background:#F2CF5B;font-weight:700;font-size:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;' + (selLen < 2 ? 'opacity:.5;cursor:not-allowed;' : ''),

      /* entry */
      ent: ent, toggleReveal: () => this.setState({ reveal: !st.reveal }),
      tasteAgain: () => this.setState(Object.assign(this.blank(), { wine: E.wine, title: E.title || null, photo: E.photo, repeatOf: E.id, screen: 'record' })),
      compareFromEntry: () => this.setState({ screen: 'journal', selecting: true, sel: [E.id] }),

      /* compare */
      cmpHeads: cmpHeads, cmpRows: cmpRows, standOut: standOut,
      swapCmp: () => this.setState({ cmp: [B.id, A.id] }),
      tasteSideBySide: () => this.startAB({ wine: A.wine, name: A.wine ? null : A.title ?? null, photo: A.photo }, { wine: B.wine, name: B.wine ? null : B.title ?? null, photo: B.photo }),

      /* A/B screens */
      isAbSetup: scr === 'abSetup', isAbRecord: scr === 'abRecord', isAbReview: scr === 'abReview', isAbView: scr === 'abView',
      abSetupBack: () => { this.cancelAdvance(); this.setState({ screen: (ab && ab.back && ab.back.indexOf('ab') !== 0 ? ab.back : 'journal') as Screen }); },
      abSlots: [slotTile('a'), slotTile('b')],
      abGlassPhoto: !!(ab && ab.glassPhoto), abGlassPhotoLabel: ab && ab.glassPhoto ? 'Retake photo of the glasses' : 'Photograph the glasses (optional)',
      toggleGlassPhoto: () => { this.setAbPatch({ glassPhoto: true }); this.toast('Glasses photographed. A left, B right.'); },
      setOpen: () => this.setAbPatch({ blind: false }), setBlind: () => this.setAbPatch({ blind: true }),
      abOpenPressed: ab && !ab.blind ? 'true' : 'false', abBlindPressed: ab && ab.blind ? 'true' : 'false',
      abOpenStyle: segBtn(!!(ab && !ab.blind)), abBlindStyle: segBtn(!!(ab && ab.blind)),
      abModeNote: ab && ab.blind ? 'Hand the phone to whoever poured so they can name A and B. Names stay hidden from you until you save.' : 'An open comparison: you know which is which. Perfectly useful, just not blind.',
      abBegin: () => this.setState({ screen: 'abRecord', confirmK: null }),
      abToSetup: () => { this.cancelAdvance(); this.setState({ screen: 'abSetup', confirmK: null }); },
      abAnsweredText: abAnswered + ' of 6 answered',
      abStrip: [strip('a'), strip('b')], abRows: abRows,

      /* A/B dock */
      abShowDock: scr === 'abRecord' || abSheet, abSheetMode: abSheet, abDockCls: abSheet ? 'rise' : '',
      abDockStyle: 'position:absolute;left:0;right:0;bottom:0;height:calc(348px + env(safe-area-inset-bottom, 0px));box-sizing:border-box;padding:12px 16px calc(18px + env(safe-area-inset-bottom, 0px));display:flex;flex-direction:column;z-index:21;' + (abSheet ? 'background:#FBF6EA;border-radius:22px 22px 0 0;box-shadow:0 -14px 40px rgba(30,20,22,.28);' : 'background:#F5ECD7;border-top:1.5px solid #1E1416;'),
      abNotches: K.map(k => ({ style: 'display:block;flex:1;height:' + (k === abF0 ? 6 : 4) + 'px;border-radius:3px;transition:all .2s;background:' + (ab && ab.ans[k] !== null ? '#5A1427' : (k === abF0 ? '#1E1416' : 'rgba(30,20,22,.15)')) + ';' })),
      abF: { name: abSD.name, pos: (K.indexOf(abF0) + 1) + ' / 6', q: Q[abF0].q, aLabel: 'A ' + Q[abF0].more, bLabel: 'B ' + Q[abF0].more,
        clearAria: 'Clear ' + abSD.name.toLowerCase() + ' answer', guideAria: 'What to notice: ' + abSD.name.toLowerCase(),
        steps: [{ n: 1, t: 'Take a small sip of A, then the same size sip of B.' }, { n: 2, t: Q[abF0].cue }, { n: 3, t: 'Go back and forth as often as you like. A sip of water between helps. There’s no timer.' }] },
      abNameA: abName('a'), abNameB: abName('b'),
      abPickA: () => this.setAB(abF0, 'A'), abPickB: () => this.setAB(abF0, 'B'), abPickSame: () => this.setAB(abF0, 'same'), abPickUnsure: () => this.setAB(abF0, 'unsure'),
      abAPressed: abV === 'A' ? 'true' : 'false', abBPressed: abV === 'B' ? 'true' : 'false', abSamePressed: abV === 'same' ? 'true' : 'false', abUnsurePressed: abV === 'unsure' ? 'true' : 'false',
      abACls: cnf('A'), abBCls: cnf('B'), abSameCls: cnf('same'), abUnsureCls: cnf('unsure'),
      abAStyle: abBig + (abV === 'A' ? 'background:#5A1427;color:#FBF6EA;border:1.5px solid #5A1427;' : 'background:#FBF6EA;color:#1E1416;border:1.5px solid #1E1416;'),
      abBStyle: abBig + (abV === 'B' ? 'background:#8A5608;color:#FBF6EA;border:1.5px solid #8A5608;' : 'background:#FBF6EA;color:#1E1416;border:1.5px solid #1E1416;'),
      abAMark: this.markStyle('A', 36, abV === 'A'), abBMark: this.markStyle('B', 36, abV === 'B'),
      abSameStyle: abAlt + (abV === 'same' ? 'background:#1E1416;color:#FBF6EA;' : 'background:transparent;color:#1E1416;'),
      abUnsureStyle: abAlt + (abV === 'unsure' ? 'background:#1E1416;color:#FBF6EA;' : 'background:transparent;color:#1E1416;'),
      abClearCur: () => { this.cancelAdvance(); const ans = Object.assign({}, this.state.ab!.ans); ans[abF0] = null; this.setState({ ab: Object.assign({}, this.state.ab, { ans: ans }), confirmK: null }); },
      abClearDisabled: abV === null,
      abClearStyle: 'height:44px;padding:0 6px;border:0;background:transparent;font-weight:650;font-size:13px;text-decoration:underline;text-underline-offset:3px;flex:none;' + (abV === null ? 'visibility:hidden;' : ''),
      abOpenGuide: () => { this.cancelAdvance(); this.setState({ abGuide: true, confirmK: null }); },
      abCloseGuide: () => this.setState({ abGuide: false }), abGuide: !!st.abGuide,
      abPrev: () => this.abStep(-1), abNext: () => this.abStep(1),
      abPrimaryLabel: abSheet ? 'Done' : (abAnswered === 6 ? 'All six. Review' : 'Review comparison'),
      abPrimaryCls: 'press' + (!abSheet && abAnswered === 6 && st.confirmK === null ? ' ready' : ''),
      abPrimaryStyle: 'flex:1;height:56px;border-radius:16px;font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center;gap:8px;' + (!abSheet && abAnswered === 6 ? 'background:#5A1427;color:#FBF6EA;border:1.5px solid #5A1427;' : 'background:#F2CF5B;color:#1E1416;border:1.5px solid #1E1416;'),
      abPrimary: abSheet ? () => { this.cancelAdvance(); this.setState({ abEditing: false, confirmK: null }); } : () => { this.cancelAdvance(); this.setState({ screen: 'abReview', abGuide: false, confirmK: null }); },
      abCloseEdit: () => { this.cancelAdvance(); this.setState({ abEditing: false, confirmK: null }); },

      /* A/B review */
      abKeepGoing: () => { this.cancelAdvance(); this.setState({ screen: 'abRecord', abEditing: false, confirmK: null }); },
      abReviewTag: ab && ab.blind ? 'Blind · names hidden' : 'Review',
      abSentence: ab ? this.abSentence(ab.ans) : '', prefOpts: prefOpts,
      abNotes: ab ? ab.notes : '', onAbNotes: (e: Change) => this.setAbPatch({ notes: e.target.value }),
      abSaveHint: ab && ab.repeatOf ? 'Last time stays hidden until you save' : (abAnswered < 6 ? (6 - abAnswered) + ' unanswered. Saving is still fine.' : 'All six answered'),
      saveAB: () => this.saveAB(),

      /* slot sheet */
      abSlotOpen: !!(st.abSlot && ab), abSlotLetter: st.abSlot ? st.abSlot.toUpperCase() : 'A',
      abSlotMark: this.markStyle(st.abSlot === 'b' ? 'B' : 'A', 34, false),
      abSlotTitle: 'What’s in glass ' + (st.abSlot ? st.abSlot.toUpperCase() : 'A') + '?', abSlotBlind: !!(ab && ab.blind && scr === 'abSetup'),
      abWineOpts: abWineOpts, abSlotName: st.abSlotName || '', onAbSlotName: (e: Change) => this.setState({ abSlotName: e.target.value }),
      useAbName: () => { const n = (this.state.abSlotName || '').trim(); if (n) this.abSetSlot(st.abSlot!, { wine: null, name: n }); },
      abSnapLabelText: slotW && slotW.photo ? 'Photo saved' : 'Snap the label',
      abSnapLabel: () => { this.abSetSlot(st.abSlot!, { photo: true }); this.toast('Label photo saved to glass ' + st.abSlot!.toUpperCase() + '.'); },
      abLeaveUnnamed: () => this.abSetSlot(st.abSlot!, { wine: null, name: null }),
      abCloseSlot: () => this.setState({ abSlot: null }),

      /* saved session */
      sv: sv || { glasses: [], rows: [], refs: [], lbGroups: [] },
      toggleLookBack: () => this.setState({ lbOpen: !st.lbOpen }), toggleRefs: () => this.setState({ refsOpen: !st.refsOpen }),
      goJournalSessions: () => this.setState({ screen: 'journal', jTab: 'sessions', selecting: false, sel: [] }),
      repeatAB: () => { if (!SV) return; this.startAB({ wine: SV.a.wine, name: SV.a.name, photo: SV.a.photo }, { wine: SV.b.wine, name: SV.b.name, photo: SV.b.photo }, { blind: SV.blind, repeatOf: SV.id, back: 'abView' }); },

      /* chooser + journal tabs */
      chooser: !!st.chooser, openChooser: () => this.setState({ chooser: true }), closeChooser: () => this.setState({ chooser: false }),
      chooseAB: () => this.startAB(), chooseSaved: () => this.setState({ chooser: false, screen: 'journal', jTab: 'tastings', selecting: true, sel: [] }),
      startABwelcome: () => this.startAB(),
      jTabT: jTab === 'tastings', jTabS: jTab === 'sessions', jTabTSel: jTab === 'tastings' ? 'true' : 'false', jTabSSel: jTab === 'sessions' ? 'true' : 'false',
      tabTStyle: 'height:48px;border:0;font-weight:650;font-size:14px;' + (jTab === 'tastings' ? 'background:#1E1416;color:#FBF6EA;' : 'background:transparent;color:#1E1416;'),
      tabSStyle: 'height:48px;border:0;border-left:1.5px solid #1E1416;font-weight:650;font-size:14px;' + (jTab === 'sessions' ? 'background:#1E1416;color:#FBF6EA;' : 'background:transparent;color:#1E1416;'),
      setTabT: () => this.setState({ jTab: 'tastings' }), setTabS: () => this.setState({ jTab: 'sessions', selecting: false, sel: [] }),
      jN: J.length, sN: SS.length, sessPal: sessPal, sessCards: sessCards, noSessions: SS.length === 0,
      resumeAB: abInProgress && scr === 'journal', resumeText: 'Unfinished A vs B · ' + abAnswered + ' of 6 answered',
      resume: () => this.setState({ screen: abAnswered === 0 ? 'abSetup' : 'abRecord' }),
      hasToast: !!st.toast, toast: st.toast,
      frameW: dims[0], frameH: dims[1]
    };
  }
}

export type Vals = ReturnType<AnosmiaLogic['renderVals']>
