// Parity with the original export, with the sample Penfolds Grange update applied to the export itself.
//
// The port intentionally differs from the export in exactly these ways: the sample Grange is vintage 1986
// (was 2016), its note reads "Tastes like crushed ants..." (was "Crushed ants."), and its label is a
// photograph of the bottle (it had none in the journal, and a drawn label elsewhere). One more difference is not
// about the sample: the landing page's "Fig. 1" caption was removed on purpose (commit 4c6e30f). Rather than loosen the
// comparison, the same edits are applied to a copy of the export in memory as the test loads it (the file in
// references/ is never changed), so every other pixel, style and box is still compared exactly.
import { gunzipSync, gzipSync } from 'node:zlib'

const PHOTO_STYLE = 'display:block;position:relative;width:100%;height:100%;overflow:hidden;background:#24161A url("/images/penfolds-grange-1986.jpg") center / cover no-repeat;'

/** The export keeps its logic as a quoted string, so new code must be escaped the same way. */
const inString = (code: string) => code.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')

/** Applied where present; `optional` edits apply only to the copy of the export that holds that markup. */
const EDITS: [from: string, to: string, optional?: boolean][] = [
  ["vintage: '2016', region: 'South Australia' }", "vintage: '1986', region: 'South Australia' }"],
  ["{ id: 'e5', wine: w('grange16'), photo: false,", "{ id: 'e5', wine: w('grange16'), photo: true,"],
  ["wine: this.wineById('grange16'),", "wine: this.wineById('grange16'), photo: true,"],
  ["notes: 'Crushed ants.'", "notes: 'Tastes like crushed ants...'"],
  // Not about the sample: the landing page's "Fig. 1" caption was removed on purpose in commit 4c6e30f.
  [inString('<div class="f-mono" style="position: absolute; right: 0; bottom: 0; font-size: 9.5px; color: #5E4E49">Fig. 1 — A nose, or a glass. Both work.</div>').replace(/\//g, '\\u002F'), '', true],
  // The label of the sample Grange is the photograph, in the same tile structure as a stored photo.
  ['tileFor(w, hasPhoto, size) {', inString(`tileFor(w, hasPhoto, size) { const t0 = this.tileFor0(w, hasPhoto, size); if (hasPhoto && w && w.id === 'grange16') return Object.assign({}, t0, { back: '${PHOTO_STYLE}', card: 'display:none;' }); return t0; }\n  tileFor0(w, hasPhoto, size) {`)],
]

function count(text: string, needle: string) {
  return text.split(needle).length - 1
}

/** The export's HTML with the sample edits applied inside its packed copies of the logic. */
export function withUpdatedSample(html: string): string {
  const open = '<script type="__bundler/manifest">'
  const start = html.indexOf(open) + open.length
  const end = html.indexOf('</script>', start)
  const manifest = JSON.parse(html.slice(start, end)) as Record<string, { mime: string; compressed?: boolean; data: string }>
  let patched = 0
  for (const entry of Object.values(manifest)) {
    const raw = Buffer.from(entry.data, 'base64')
    let text = (entry.compressed ? gunzipSync(raw) : raw).toString('utf8')
    if (!text.includes("grange16")) continue
    for (const [from, to, optional] of EDITS) {
      if (count(text, from) === 0) {
        if (optional) continue
        throw new Error(`reference edit did not apply: ${from}`)
      }
      text = text.split(from).join(to)
    }
    const out = Buffer.from(text, 'utf8')
    entry.data = (entry.compressed ? gzipSync(out) : out).toString('base64')
    patched++
  }
  if (!patched) throw new Error('no copy of the logic found in the reference export')
  return html.slice(0, start) + JSON.stringify(manifest) + html.slice(end)
}
