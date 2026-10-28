import { MILAN_CASE, NEIGHBOUR_CASE, type AdvisorCaseSeed } from '../data/scenarios'
import type { AdvisorAct, AdvisorLogEntry, AppState, Outcome } from '../state/actions'

export interface HistoryLine {
  at: string
  actor: string
  action: string // action type or advisor act, turned into words by copy
}

/**
 * Who owns the next action: needs Jelena, referred to the record's owner (awaiting its response: one state,
 * since both say the same thing), needs the farmer, resolved (with the owner's decision as the outcome).
 */
export type CaseState = 'assigned' | 'waiting_office' | 'waiting_farmer' | 'resolved'

export interface AdvisorCase extends AdvisorCaseSeed {
  state: CaseState
  history: HistoryLine[]
  /** The farmer's latest reply to her question. */
  reply?: string
  /** The record owner's decision, once there is one. */
  outcome?: Outcome
  /** When she should chase the office, once referred. */
  followUp?: string
}

const STATE_OF: Partial<Record<AdvisorAct, CaseState>> = {
  referred: 'waiting_office',
  asked_farmer: 'waiting_farmer',
  farmer_replied: 'assigned',
  owner_decided: 'resolved',
}

const DAY_MS = 86_400_000
/**
 * When to chase the record's owner: halfway between the referral and the application deadline, so an answer
 * still leaves the farmer time to act. Worked out from the deadline, not from a policy number.
 */
export function followUpDate(referredOn: string, deadline: string): string {
  const from = Date.parse(`${referredOn}T00:00:00Z`)
  const to = Date.parse(`${deadline}T00:00:00Z`)
  return new Date(from + Math.floor((to - from) / DAY_MS / 2) * DAY_MS).toISOString().slice(0, 10)
}

/** A case is Jelena's until an act hands the next step to someone else. Opening it changes nothing. */
export function caseState(log: AdvisorLogEntry[], caseId: string): CaseState {
  const acts = log.filter((l) => l.caseId === caseId && STATE_OF[l.act])
  return acts.length ? STATE_OF[acts[acts.length - 1].act]! : 'assigned'
}

/** The record owner's decision on Milan's herd, once Jelena has recorded it. */
export function milanOutcome(state: AppState): Outcome | null {
  return [...state.advisor.log].reverse().find((l) => l.caseId === MILAN_CASE.id && l.act === 'owner_decided')?.outcome ?? null
}

/** What Milan sees on his item: the same state as Jelena's queue, or null if he hasn't sent it. */
export function milanCaseState(state: AppState): CaseState | null {
  const sent = state.answers.requests.some((r) => r.kind === 'jelena' && r.itemId === 'herd')
  return sent ? caseState(state.advisor.log, MILAN_CASE.id) : null
}

const STATE_RANK: Record<CaseState, number> = { assigned: 0, waiting_farmer: 1, waiting_office: 2, resolved: 3 }

/** Hers first; among hers, what blocks submission, then the nearest deadline, then the oldest. Waiting on others after. */
export function byPriority(x: AdvisorCase, y: AdvisorCase): number {
  return (
    STATE_RANK[x.state] - STATE_RANK[y.state] ||
    Number(y.blocksSubmission) - Number(x.blocksSubmission) ||
    x.deadline.localeCompare(y.deadline) ||
    x.sentAt.localeCompare(y.sentAt)
  )
}

/**
 * Jelena's queue: only problems a farmer sent her, each with its context.
 * Milan's case appears once he has sent it, with his own values, note and history.
 */
export function advisorQueue(state: AppState): AdvisorCase[] {
  const sent = [...state.answers.requests].reverse().find((r) => r.kind === 'jelena' && r.itemId === 'herd')
  const herd = state.answers.herd
  const seeds: AdvisorCaseSeed[] = [NEIGHBOUR_CASE]
  if (sent) {
    seeds.push({
      ...MILAN_CASE,
      sentAt: sent.at,
      note: sent.note,
      values: herd.ownCount !== null ? { record: MILAN_CASE.values!.record, his: herd.ownCount } : MILAN_CASE.values,
      history: state.history.map((h) => ({ at: h.at, actor: h.actor, action: h.action })),
    })
  }

  return seeds
    .map((c): AdvisorCase => {
      const log = state.advisor.log.filter((l) => l.caseId === c.id)
      const st = caseState(state.advisor.log, c.id)
      const referred = [...log].reverse().find((l) => l.act === 'referred')
      return {
        ...c,
        state: st,
        reply: [...log].reverse().find((l) => l.act === 'farmer_replied')?.note,
        outcome: [...log].reverse().find((l) => l.act === 'owner_decided')?.outcome,
        // Dates follow the prototype clock: a referral made today counts from the scenario's today.
        ...(st === 'waiting_office' && referred ? { followUp: followUpDate(c.today, c.deadline) } : {}),
        history: [...c.history, ...log.filter((l) => l.act !== 'farmer_replied').map((l) => ({ at: l.at, actor: 'Jelena', action: l.act }))].sort((x, y) => x.at.localeCompare(y.at)),
      }
    })
    .sort(byPriority)
}
