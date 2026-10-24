import type { Action, AppState } from '../state/actions'
import { fresh, reducer } from '../state/store'
import type { Crop, ScenarioId } from '../data/scenarios'
import { derive } from './derive'

export function play(scenarioId: ScenarioId, ...actions: Action[]): AppState {
  let state: AppState = fresh(scenarioId)
  for (const action of actions) state = reducer(state, { action, at: '2026-04-28T10:00:00Z' })
  return state
}

export const run = (scenarioId: ScenarioId, ...actions: Action[]) => derive(play(scenarioId, ...actions))

/** Split the river field across the middle, as Milan would. */
export const halfSplit = (crops: [Crop | null, Crop | null] = ['sunflower', 'wheat']): Action => ({
  type: 'set_split',
  split: { line: [{ x: 0, y: 60 }, { x: 200, y: 60 }], crops },
})

/** Every part answered the simple way and the rest confirmed: nothing left before submitting. */
export const ready: Action[] = [
  { type: 'answer_bank', answer: 'yes' },
  { type: 'answer_household', answer: 'no' },
  { type: 'confirm', what: 'details' },
  { type: 'answer_herd', answer: 'yes' },
  { type: 'answer_pigs', answer: 'yes' },
  { type: 'confirm', what: 'calvings' },
  { type: 'answer_river', answer: 'yes' },
  halfSplit(),
  { type: 'answer_road', answer: 'yes' },
  { type: 'answer_upper', answer: 'yes' },
  { type: 'answer_meadow', answer: 'yes' },
  { type: 'confirm', what: 'fields_other' },
  { type: 'choose_measures', chosen: ['plant_production', 'cows_raising_calves'] },
  { type: 'attach_document', documentId: 'unreadable_receipt' },
  { type: 'confirm', what: 'receipts' },
]
