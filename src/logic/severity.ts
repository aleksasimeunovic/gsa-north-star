import type { Item } from './status'

/**
 * The one status signal every screen shows (stepper, outline, readiness bar and drawer, check and submit,
 * "Your farm this year", Jelena's view of his item), so the same thing reads the same everywhere.
 * - todo: work he hasn't done. Neutral. Blocks submission, but is not an error.
 * - waiting: look at this (orange). Waiting for a check. Never blocks. A lower payment is a fact, not a mark.
 * - error: something is wrong and he must fix it (red): an unreadable receipt, a missing required
 *   document, a measure an answer rules out. Red never marks work he simply hasn't done.
 * - done.
 */
export type Mark = 'done' | 'todo' | 'waiting' | 'error'
export type Severity = 'todo' | 'look' | 'error'

export const severityOf = (m: Mark): Severity | null => (m === 'done' ? null : m === 'waiting' ? 'look' : m)

export function markOf(item: Pick<Item, 'status' | 'problem'>): Mark {
  if (item.status === 'action_required') return item.problem ? 'error' : 'todo'
  if (item.status === 'awaiting_verification') return 'waiting'
  return 'done'
}

/** Whether a mark stops him submitting: only work left to do or something to fix. */
export const blocks = (m: Mark) => m === 'todo' || m === 'error'
