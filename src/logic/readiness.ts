import type { Scenario } from '../data/scenarios'
import type { Answers } from '../state/actions'
import type { Item, Status } from './status'

export type ApplicationState = 'waiting_for_renewal' | 'action_required' | 'ready_to_submit' | 'submitted'

export interface Readiness {
  state: ApplicationState
  counts: Record<Status, number>
  /** Items that block submission (all action_required). */
  blockers: Item[]
  /** Kept for submission; only that part waits. */
  awaiting: Item[]
  renewalNeeded: boolean
  canSubmit: boolean
}

export const isRenewed = (s: Scenario, a: Answers) => s.renewed || a.renewed

/**
 * Derived, never stored.
 * - No renewal or any action_required item blocks (product decision).
 * - Payment impact never blocks.
 * - awaiting_verification does not block: ASSUMPTION TO CONFIRM WITH THE MINISTRY.
 * "Ready to submit" means nothing needs his action. It does not mean approved.
 */
export function readiness(s: Scenario, a: Answers, items: Item[]): Readiness {
  const counts: Record<Status, number> = { complete: 0, action_required: 0, awaiting_verification: 0 }
  for (const item of items) counts[item.status]++
  const blockers = items.filter((i) => i.status === 'action_required')
  const awaiting = items.filter((i) => i.status === 'awaiting_verification')
  const renewalNeeded = !isRenewed(s, a)

  let state: ApplicationState
  if (a.submittedAt) state = 'submitted'
  else if (renewalNeeded) state = 'waiting_for_renewal'
  else if (blockers.length > 0) state = 'action_required'
  else state = 'ready_to_submit'

  return { state, counts, blockers, awaiting, renewalNeeded, canSubmit: state === 'ready_to_submit' }
}

const DAY_MS = 86_400_000

/** Days left in the window, counting the closing day. 0 once it has closed. */
export function daysLeft(today: string, closes: string): number {
  const diff = Date.parse(`${closes}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)
  return Math.max(0, Math.round(diff / DAY_MS) + 1)
}
