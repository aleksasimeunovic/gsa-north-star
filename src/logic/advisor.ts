import { MILAN_CASE, NEIGHBOUR_CASE, type AdvisorCaseSeed } from '../data/scenarios'
import type { AdvisorAct, AppState } from '../state/actions'

export interface HistoryLine {
  at: string
  actor: string
  action: string // action type or advisor act, turned into words by copy
}

export interface AdvisorCase extends AdvisorCaseSeed {
  status: 'open' | 'handled'
  /** True when it came from Milan in this session, not the example. */
  live: boolean
  lastAct: AdvisorAct | null
  history: HistoryLine[]
}

/**
 * Jelena's queue: only problems a farmer sent her, each with its context.
 * Milan's case uses his own request and note when he has sent one.
 */
export function advisorQueue(state: AppState): AdvisorCase[] {
  const sent = [...state.answers.requests].reverse().find((r) => r.kind === 'jelena' && r.itemId === 'herd')
  const herd = state.answers.herd
  const milan: AdvisorCaseSeed = sent
    ? {
        ...MILAN_CASE,
        sentAt: sent.at,
        note: sent.note,
        values: herd.ownCount !== null ? { record: MILAN_CASE.values!.record, his: herd.ownCount } : MILAN_CASE.values,
        history: state.history.map((h) => ({ at: h.at, actor: h.actor, action: h.action })),
      }
    : MILAN_CASE

  const cases = [milan, NEIGHBOUR_CASE].map((c): AdvisorCase => {
    const log = state.advisor.log.filter((l) => l.caseId === c.id)
    return {
      ...c,
      live: c.id === MILAN_CASE.id && !!sent,
      status: state.advisor.handled.includes(c.id) ? 'handled' : 'open',
      lastAct: log.length ? log[log.length - 1].act : null,
      history: [...c.history, ...log.map((l) => ({ at: l.at, actor: 'Jelena', action: l.act }))].sort((x, y) => x.at.localeCompare(y.at)),
    }
  })
  // Open first, then oldest first: hard cases waiting longest come up first.
  return cases.sort((x, y) => (x.status === y.status ? x.sentAt.localeCompare(y.sentAt) : x.status === 'open' ? -1 : 1))
}
