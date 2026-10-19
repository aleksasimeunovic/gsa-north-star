import type { Action, AppState } from '../state/actions'
import { initialState, reducer } from '../state/store'
import type { Crop, ScenarioId } from '../data/scenarios'
import { derive } from './derive'

export function play(scenarioId: ScenarioId, ...actions: Action[]): AppState {
  let state: AppState = { ...initialState(), scenarioId }
  for (const action of actions) state = reducer(state, { action, at: '2026-04-28T10:00:00Z' })
  return state
}

export const run = (scenarioId: ScenarioId, ...actions: Action[]) => derive(play(scenarioId, ...actions))

/** Split the river field across the middle, as Milan would. */
export const halfSplit = (crops: [Crop | null, Crop | null] = ['sunflower', 'wheat']): Action => ({
  type: 'set_split',
  split: { line: [{ x: 0, y: 60 }, { x: 200, y: 60 }], crops },
})
