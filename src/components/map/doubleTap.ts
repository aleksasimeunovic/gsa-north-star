/**
 * Whether this press on a handle is the second one soon after the first, by mouse or finger: the way to take
 * a point out. Browsers don't send a double click for a finger reliably, so it is counted here.
 */
const last = new WeakMap<EventTarget, number>()
export function isDoubleTap(el: EventTarget, e: PointerEvent, ms = 350): boolean {
  const before = last.get(el) ?? -Infinity
  if (e.timeStamp - before < ms) {
    last.delete(el)
    return true
  }
  last.set(el, e.timeStamp)
  return false
}
