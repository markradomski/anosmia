// The prototype computes many styles as CSS strings ('height:100px;border-radius:14px;…').
// Its runtime applied them by replacing the element's whole cssText whenever the string changed,
// rather than diffing individual properties. That matters: removing an override such as
// `border-color` must restore the colour from the `border` shorthand, not reset it.
// `css(text)` returns a ref callback that does the same. Callbacks are cached per string, so
// React only re-runs one when the element's style string actually changes.
type StyledElement = HTMLElement | SVGElement

const refs = new Map<string, (el: StyledElement | null) => void>()

export function css(text: string | null | undefined) {
  const value = text ?? ''
  let ref = refs.get(value)
  if (!ref) {
    ref = (el: StyledElement | null) => {
      if (el) el.style.cssText = value
    }
    refs.set(value, ref)
  }
  return ref
}
