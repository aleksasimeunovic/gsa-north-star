import type { Scenario } from '../data/scenarios'
import type { Answers } from '../state/actions'
import type { TaskId } from './application'
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
 * How sure he can be about submitting, said as one verdict. Three severities, never mixed:
 * - error: stops him submitting (anything that needs his action, or no renewal)
 * - warning: he can submit, but something waits for a check or lowers his payment
 * - info: good to know, nothing to do (what the state still checks)
 * So three warnings still mean "ready to submit", and a single error means he can't.
 */
export type Severity = 'error' | 'warning' | 'info'
export type Verdict = 'renewal' | 'blocked' | 'ready_with_warnings' | 'ready' | 'submitted'
export interface Warning {
  id: ItemId
  why: 'waiting' | 'payment'
}
export type Info = 'state_checks' | 'unpriced'
export interface Report {
  verdict: Verdict
  /** Tasks that stop him submitting, in the list's order. */
  errors: TaskId[]
  warnings: Warning[]
  info: Info[]
}

export function readinessReport(s: Scenario, a: Answers, items: Item[], todo: TaskId[]): Report {
  const warnings: Warning[] = items.flatMap((i): Warning[] =>
    i.status === 'awaiting_verification' ? [{ id: i.id, why: 'waiting' }] : i.status === 'complete' && i.paymentImpact ? [{ id: i.id, why: 'payment' }] : [],
  )
  const unpriced = s.measures.some((m) => m.fits && !m.rateDinars && a.measures.chosen.includes(m.id))
  const info: Info[] = ['state_checks', ...(unpriced ? (['unpriced'] as const) : [])]
  const verdict: Verdict = a.submittedAt
    ? 'submitted'
    : !isRenewed(s, a)
      ? 'renewal'
      : todo.length
        ? 'blocked'
        : warnings.length
          ? 'ready_with_warnings'
          : 'ready'
  return { verdict, errors: todo, warnings, info }
}

const DAY_MS = 86_400_000

/** Days left in the window, counting the closing day. 0 once it has closed. */
export function daysLeft(today: string, closes: string): number {
  const diff = Date.parse(`${closes}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)
  return Math.max(0, Math.round(diff / DAY_MS) + 1)
}
