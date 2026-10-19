import { SCENARIOS } from '../data/scenarios'
import type { AppState } from '../state/actions'
import { estimate } from './estimate'
import { readiness } from './readiness'
import { deriveItems } from './status'
import { compareMapping, generateWizard } from './wizard'

/** Everything the UI shows, derived from the store in one place. */
export function derive(state: AppState) {
  const scenario = SCENARIOS[state.scenarioId]
  const items = deriveItems(scenario, state.answers)
  const wizard = generateWizard(scenario, state.answers, items, state.role)
  return {
    scenario,
    items,
    wizard,
    compare: compareMapping(scenario, wizard),
    readiness: readiness(scenario, state.answers, items),
    estimate: estimate(scenario, items),
  }
}
