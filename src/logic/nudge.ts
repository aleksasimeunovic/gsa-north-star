import type { ApplicationList, TaskId } from './application'
import type { Item, ItemDetail } from './status'

export interface Nudge {
  /** The task it points to, or submit once nothing needs him. */
  to: TaskId | 'submit' | null
  /** What that task needs, so the words can be specific to his farm. */
  detail: ItemDetail | 'renewal' | 'same' | 'submit' | 'submitted'
  /** How many things are left before he can submit (the "same as last year" task counts as one). */
  left: number
  missing?: string[]
}

/**
 * One friendly line that points at the next step and says why, worked out from his own farm.
 * (Words come from copy; this only decides what to say.)
 */
export function nudge(list: ApplicationList, items: Item[]): Nudge {
  const to = list.next
  const left = list.todo.length
  if (to === null) return { to, detail: 'submitted', left }
  if (to === 'submit') return { to, detail: 'submit', left }
  if (to === 'renewal' || to === 'same') return { to, detail: to, left }
  const item = items.find((i) => i.id === to)!
  return { to, detail: item.detail, left, missing: item.missing }
}
