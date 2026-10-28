import type { Scenario } from '../data/scenarios'
import type { Answers } from '../state/actions'
import type { Task, TaskId } from './application'
import type { Item, ItemId, Status } from './status'

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

/**
 * How sure he can be about submitting, said as one verdict, from the same marks every screen shows:
 * - error: something wrong he must fix (red). Stops him submitting.
 * - todo: work he hasn't done (neutral). Stops him submitting, but is not an error.
 * - look: he can submit, but something waits for a check or lowers his payment (orange).
 * - info: good to know, nothing to do (what the state still checks).
 * So three things to look at still mean "ready to submit", and a single thing to do means he can't.
 */
export type Severity = 'error' | 'todo' | 'look' | 'info'
export type Verdict = 'renewal' | 'blocked' | 'ready_with_warnings' | 'ready' | 'submitted'
export interface Warning {
  id: ItemId
  why: 'waiting' | 'payment'
}
export type Info = 'state_checks' | 'unpriced'
export interface Report {
  verdict: Verdict
  /** Something wrong to fix, in the list's order. */
  errors: TaskId[]
  /** Work not done yet, in the list's order. */
  todo: TaskId[]
  warnings: Warning[]
  info: Info[]
}

export function readinessReport(s: Scenario, a: Answers, tasks: Task[]): Report {
  const errors = tasks.filter((t) => t.mark === 'error').map((t) => t.id)
  const todo = tasks.filter((t) => t.mark === 'todo').map((t) => t.id)
  const warnings: Warning[] = tasks.flatMap((t): Warning[] =>
    t.id !== 'renewal' && (t.mark === 'waiting' || t.mark === 'payment') ? [{ id: t.id, why: t.mark }] : [],
  )
  const unpriced = s.measures.some((m) => m.fits && !m.rateDinars && a.measures.chosen.includes(m.id))
  const info: Info[] = ['state_checks', ...(unpriced ? (['unpriced'] as const) : [])]
  const verdict: Verdict = a.submittedAt
    ? 'submitted'
    : !isRenewed(s, a)
      ? 'renewal'
      : todo.length || errors.length
        ? 'blocked'
        : warnings.length
          ? 'ready_with_warnings'
          : 'ready'
  return { verdict, errors, todo, warnings, info }
}

const DAY_MS = 86_400_000

/** Days left in the window, counting the closing day. 0 once it has closed. */
export function daysLeft(today: string, closes: string): number {
  const diff = Date.parse(`${closes}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)
  return Math.max(0, Math.round(diff / DAY_MS) + 1)
}
