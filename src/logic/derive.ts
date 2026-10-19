import { SCENARIOS } from '../data/scenarios'
import type { AppState } from '../state/actions'
import { estimate } from './estimate'
import { readiness } from './readiness'
import { deriveItems } from './status'
import { detectChanges } from './changes'
import { assembly, compareMapping, generateWizard } from './wizard'

/** Everything the UI shows, derived from the store in one place. */
export function derive(state: AppState) {
  const scenario = SCENARIOS[state.scenarioId]
  const items = deriveItems(scenario, state.answers)
  const wizard = generateWizard(scenario, state.answers, items, state.role)
  const compare = compareMapping(scenario, wizard)
  return {
    scenario,
    items,
    wizard,
    compare,
    changes: detectChanges(scenario),
    assembly: assembly(scenario, state.answers, compare),
    readiness: readiness(scenario, state.answers, items),
    estimate: estimate(scenario, items),
  }
}
