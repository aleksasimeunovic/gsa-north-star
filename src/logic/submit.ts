import type { Readiness } from './readiness'

export type BlockReason = 'renewal' | 'action_required' | 'declarations'

/**
 * What stops submission. Awaiting verification and payment impact never do
 * (awaiting not blocking is an ASSUMPTION TO CONFIRM WITH THE MINISTRY).
 */
export function submitCheck(r: Readiness, declarationsSigned: boolean): { canSubmit: boolean; reasons: BlockReason[] } {
  if (r.state === 'submitted') return { canSubmit: false, reasons: [] }
  const reasons: BlockReason[] = []
  if (r.renewalNeeded) reasons.push('renewal')
  if (r.blockers.length > 0) reasons.push('action_required')
  if (!declarationsSigned) reasons.push('declarations')
  return { canSubmit: reasons.length === 0, reasons }
}

/** Prototype reference number, stable for a given submission time. */
export function referenceNumber(submittedAt: string): string {
  let h = 0
  for (const ch of submittedAt) h = (h * 31 + ch.charCodeAt(0)) % 1_000_000
  return `GSA-${submittedAt.slice(0, 4)}-${String(h).padStart(6, '0')}`
}

/** What the state still checks after a "Ready to submit" application is sent. */
export const STATE_CHECKS = ['eligibility', 'records', 'inspection', 'payment'] as const
export type StateCheck = (typeof STATE_CHECKS)[number]
