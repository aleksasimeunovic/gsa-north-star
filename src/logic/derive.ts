import { SCENARIOS } from '../data/scenarios'
import type { AppState } from '../state/actions'
import { applicationList } from './application'
import { estimate } from './estimate'
import { readiness, readinessReport } from './readiness'
import { deriveItems } from './status'
import { milanCaseState } from './advisor'
import { detectChanges } from './changes'
import { farmAsAnswered, farmPicture } from './farm'

/** Everything the UI shows, derived from the store in one place. */
export function derive(state: AppState) {
  const base = SCENARIOS[state.scenarioId]
  const scenario = farmAsAnswered(base, state.answers)
  const items = deriveItems(scenario, state.answers, milanCaseState(state))
  const list = applicationList(scenario, state.answers, items)
  return {
    base,
    scenario,
    items,
    list,
    changes: detectChanges(scenario),
    readiness: readiness(scenario, state.answers, items),
    report: readinessReport(scenario, state.answers, [...list.todo, ...list.waiting, ...list.done]),
    estimate: estimate(scenario, state.answers, items),
    farm: farmPicture(scenario, state.answers, items),
  }
}
