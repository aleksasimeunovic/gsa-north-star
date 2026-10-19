import { useCallback, useEffect, useReducer, useState } from 'react'
import type { Action, Actor, Answers, AppState } from './actions'
import { loadState, saveState } from './persist'

export const emptyAnswers = (): Answers => ({
  herd: { answer: null, ownCount: null, followUps: [] },
  river: { answer: null, noOption: null, redrawn: false, split: null },
  road: { answer: null, correctionRequested: false },
  confirmedSteps: [],
  attachedDocuments: [],
  renewed: false,
  declarationsSigned: false,
  submittedAt: null,
})

export const initialState = (): AppState => ({
  version: 1,
  scenarioId: 'second_year',
  role: 'farmer',
  answers: emptyAnswers(),
  history: [],
})

const addUnique = <T,>(list: T[], item: T) => (list.includes(item) ? list : [...list, item])

function reduceAnswers(a: Answers, action: Action, at: string): Answers {
  switch (action.type) {
    case 'answer_herd':
      return { ...a, herd: { ...a.herd, answer: action.answer } }
    case 'set_herd_count':
      return { ...a, herd: { ...a.herd, ownCount: action.count } }
    case 'herd_follow_up':
      return { ...a, herd: { ...a.herd, followUps: addUnique(a.herd.followUps, action.followUp) } }
    case 'answer_river':
      return { ...a, river: { ...a.river, answer: action.answer } }
    case 'river_no_option':
      return { ...a, river: { ...a.river, noOption: action.option } }
    case 'river_redrawn':
      return { ...a, river: { ...a.river, redrawn: true } }
    case 'set_split':
      return { ...a, river: { ...a.river, split: action.split } }
    case 'answer_road':
      return { ...a, road: { ...a.road, answer: action.answer } }
    case 'request_road_correction':
      return { ...a, road: { ...a.road, correctionRequested: true } }
    case 'confirm_step':
      return { ...a, confirmedSteps: addUnique(a.confirmedSteps, action.stepId) }
    case 'attach_document':
      return { ...a, attachedDocuments: addUnique(a.attachedDocuments, action.documentId) }
    case 'renew':
      return { ...a, renewed: true }
    case 'sign_declarations':
      return { ...a, declarationsSigned: action.signed }
    case 'submit':
      return { ...a, submittedAt: at }
    default:
      return a
  }
}

type Stamped = { action: Action; at: string }

export function reducer(state: AppState, { action, at }: Stamped): AppState {
  if (action.type === 'reset') return { ...initialState(), scenarioId: state.scenarioId, role: state.role }
  if (action.type === 'set_scenario') return { ...initialState(), scenarioId: action.scenarioId, role: state.role }
  if (action.type === 'set_role') return { ...state, role: action.role }
  const actor: Actor = state.role === 'advisor' ? 'Jelena' : 'Milan'
  return {
    ...state,
    answers: reduceAnswers(state.answers, action, at),
    history: [...state.history, { at, actor, action: action.type }],
  }
}

export function useStore() {
  const [state, rawDispatch] = useReducer(reducer, undefined, () => loadState() ?? initialState())
  const [savedAt, setSavedAt] = useState<string | null>(null)

  useEffect(() => {
    if (saveState(state)) setSavedAt(new Date().toISOString())
  }, [state])

  const dispatch = useCallback((action: Action) => rawDispatch({ action, at: new Date().toISOString() }), [])
  return { state, dispatch, savedAt }
}
