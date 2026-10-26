import { SCENARIOS } from '../data/scenarios'
import type { AppState } from '../state/actions'
import { applicationList } from './application'
import { estimate } from './estimate'
import { readiness, readinessReport } from './readiness'
import { deriveItems } from './status'
import { milanCaseState } from './advisor'
import { detectChanges } from './changes'
import { farmPicture } from './farm'

/** Everything the UI shows, derived from the store in one place. */
export function derive(state: AppState) {
  const scenario = SCENARIOS[state.scenarioId]
  const items = deriveItems(scenario, state.answers, milanCaseState(state))
  const list = applicationList(scenario, state.answers, items, state.role)
  return {
    scenario,
    items,
    list,
    changes: detectChanges(scenario),
    readiness: readiness(scenario, state.answers, items),
    report: readinessReport(scenario, state.answers, items, list.todo.map((t) => t.id)),
    estimate: estimate(scenario, state.answers, items),
    farm: farmPicture(scenario, state.answers, items),
  }
}
