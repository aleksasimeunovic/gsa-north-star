import { SCENARIOS } from '../data/scenarios'
import type { AppState } from '../state/actions'
import { applicationList } from './application'
import { estimate } from './estimate'
import { readiness } from './readiness'
import { deriveItems } from './status'
import { detectChanges } from './changes'

/** Everything the UI shows, derived from the store in one place. */
export function derive(state: AppState) {
  const scenario = SCENARIOS[state.scenarioId]
  const items = deriveItems(scenario, state.answers)
  return {
    scenario,
    items,
    list: applicationList(scenario, state.answers, items, state.role),
    changes: detectChanges(scenario),
    readiness: readiness(scenario, state.answers, items),
    estimate: estimate(scenario, items),
  }
}
