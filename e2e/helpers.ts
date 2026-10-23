import { expect, type Page } from '@playwright/test'

/** Click a control inside the app frame by its accessible name. */
export async function tap(page: Page, name: string | RegExp) {
  await page.getByRole('button', { name, exact: typeof name === 'string' }).first().click()
}

/** Wait out the ~420 ms auto-advance and the 300 ms double-tap guard after a new answer. */
export const settle = (page: Page) => page.waitForTimeout(800)

/** The heading of the sensation currently in the thumb dock. */
export const dockSensation = (page: Page) => page.locator('section[aria-label="Sensation controls"] h2')

export async function readStore(page: Page, store: 'tastings' | 'sessions' | 'drafts' | 'photos') {
  return page.evaluate(async name => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('anosmia')
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    if (!db.objectStoreNames.contains(name)) {
      db.close()
      return []
    }
    const rows = await new Promise<unknown[]>((resolve, reject) => {
      const req = db.transaction(name).objectStore(name).getAll()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return rows as Record<string, unknown>[]
  }, store)
}

/**
 * Wait until `store` holds `count` records and return how long that took. IndexedDB commits
 * asynchronously, so reloading or closing within that window aborts the write.
 */
export async function committed(page: Page, store: 'tastings' | 'sessions', count: number) {
  const start = Date.now()
  await expect.poll(async () => (await readStore(page, store)).length, { intervals: [10], timeout: 5000 }).toBe(count)
  return Date.now() - start
}

export async function databaseNames(page: Page) {
  return page.evaluate(async () => (await indexedDB.databases()).map(d => d.name))
}

/** Open the app and wait until it has rendered (it loads IndexedDB before the first render). */
export async function open(page: Page, path = '/') {
  await page.goto(path)
  await expect(page.locator('.f-ui.grain')).toBeVisible()
}

/**
 * Parity harness: serialises the rendered prototype frame (tags, attributes, inline cssText,
 * text, and each element's box relative to the frame) so the port can be compared with the
 * original export. The export's runtime wraps interpolations in <span class="sc-interp">, which
 * have no styles; they are flattened.
 */
export function installHarness() {
  const w = window as unknown as Record<string, unknown>
  const getRoot = () => {
    const f = document.querySelector('iframe')
    const d = f ? f.contentDocument! : document
    return d.querySelector('.f-ui.grain') as HTMLElement
  }
  const ser = () => {
    const root = getRoot()
    const R = root.getBoundingClientRect()
    const out: string[] = []
    const walk = (n: Node, depth: number) => {
      if (n.nodeType === 3) {
        const t = (n.nodeValue ?? '').replace(/\s+/g, ' ').trim()
        if (t) out.push(depth + '#' + t)
        return
      }
      if (n.nodeType !== 1) return
      const el = n as HTMLElement
      if (el.classList.contains('sc-interp')) {
        el.childNodes.forEach(c => walk(c, depth))
        return
      }
      // A field's value is compared as the live property. Whether React also mirrors it into a
      // value="" attribute differs between React versions (18 in the export, 19 here) and has no effect.
      const field = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA'
      const attrs = [...el.attributes].filter(a => a.name !== 'style' && !a.name.startsWith('data-') && !(field && a.name === 'value'))
        .map(a => a.name + '=' + a.value).sort().join(' ')
      const r = el.getBoundingClientRect()
      const box = [r.left - R.left, r.top - R.top, r.width, r.height].map(x => Math.round(x * 2) / 2).join(',')
      const val = field ? ' value=' + (el as HTMLInputElement).value : ''
      out.push(depth + '<' + el.tagName.toLowerCase() + ' ' + attrs + val + ' [' + box + '] ' + (el.getAttribute('style') ? el.style.cssText : ''))
      el.childNodes.forEach(c => walk(c, depth + 1))
    }
    walk(root, 0)
    return out
  }
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim()
  const find = (label: string) => {
    const els = [...getRoot().querySelectorAll('button, [role=tab]')] as HTMLElement[]
    return els.find(e => e.getAttribute('aria-label') === label) || els.find(e => norm(e.textContent ?? '') === label)
      || els.find(e => norm(e.textContent ?? '').startsWith(label))
  }
  const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
  w.__parity = async (checkpoints: string[][][]) => {
    const snaps: string[] = []
    for (const cp of checkpoints) {
      for (const [kind, a, b] of cp) {
        if (kind === 'click') {
          const el = find(a)
          if (!el) throw new Error('not found: ' + a)
          el.click()
        } else if (kind === 'type') {
          const el = getRoot().querySelector(a) as HTMLInputElement | HTMLTextAreaElement
          const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
          Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, b)
          el.dispatchEvent(new Event('input', { bubbles: true }))
        }
        await wait(30)
      }
      await wait(700)
      snaps.push(ser().join('\n'))
    }
    return snaps
  }
}
