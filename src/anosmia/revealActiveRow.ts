// Keeps the active sensation row visible in the record overview, above the fixed thumb dock.
// Scrolls only the overview's own scroll container, only by as much as needed, and only when the
// row is not already fully visible. Never touches the dock, the answers or the timing.

/** Breathing room kept between the row and the edge it is scrolled to. */
const MARGIN_PX = 8

export function revealActiveRow(root: ParentNode, animate: boolean) {
  const row = root.querySelector<HTMLElement>('[data-active="true"]')
  const scroller = row?.closest<HTMLElement>('.scroll')
  if (!row || !scroller) return

  const view = scroller.getBoundingClientRect()
  // The overview already ends where the dock begins; measure the dock too, in case they ever differ.
  const dock = root.querySelector<HTMLElement>('[data-dock]')
  const visibleBottom = Math.min(view.bottom, dock ? dock.getBoundingClientRect().top : view.bottom)
  // The pinned top row (Back, progress) covers the top of the overview; rows must land below it.
  const pin = scroller.querySelector<HTMLElement>('[data-pin]')
  const visibleTop = pin ? Math.max(view.top, pin.getBoundingClientRect().bottom) : view.top
  const box = row.getBoundingClientRect()

  let delta = 0
  if (box.top < visibleTop) delta = box.top - visibleTop - MARGIN_PX
  else if (box.bottom > visibleBottom) delta = box.bottom - visibleBottom + MARGIN_PX
  if (!delta) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  scroller.scrollBy({ top: delta, behavior: animate && !reduceMotion ? 'smooth' : 'auto' })
}
