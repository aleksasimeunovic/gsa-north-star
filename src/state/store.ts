import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { Action, Actor, Answers, AppState } from './actions'
import { derive } from '../logic/derive'
import { submitCheck } from '../logic/submit'
import { loadState, saveState } from './persist'

export const emptyAnswers = (): Answers => ({
  herd: { answer: null, ownCount: null },
  river: { answer: null, noOption: null, redrawn: false, split: null },
  road: { answer: null, correctionRequested: false },
  confirmed: [],
  requests: [],
  attachedDocuments: [],
  renewed: false,
  declarationsSigned: false,
  submittedAt: null,
})

export const initialState = (): AppState => ({
  version: 5,
  scenarioId: 'second_year',
  role: 'farmer',
  prototype: { showNotes: false },
  advisor: { log: [] },
  answers: emptyAnswers(),
  history: [],
})

const addUnique = <T,>(list: T[], item: T) => (list.includes(item) ? list : [...list, item])

function reduceAnswers(a: Answers, action: Action, at: string): Answers {
  switch (action.type) {
    case 'answer_herd':
      // "No" always asks for his own number afresh.
      return { ...a, herd: { answer: action.answer, ownCount: action.answer === 'no' ? null : a.herd.ownCount } }
    case 'set_herd_count':
      return { ...a, herd: { ...a.herd, ownCount: action.count } }
    case 'send_to_jelena':
      return { ...a, requests: [...a.requests, { kind: 'jelena', itemId: action.itemId, note: action.note, at }] }
    case 'ask_record_check':
      if (a.requests.some((r) => r.kind === 'record_check' && r.itemId === action.itemId)) return a
      return { ...a, requests: [...a.requests, { kind: 'record_check', itemId: action.itemId, note: '', at }] }
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
    case 'confirm':
      return { ...a, confirmed: addUnique(a.confirmed, action.what) }
    case 'attach_document':
      // Uploading them is confirming them.
      return { ...a, attachedDocuments: addUnique(a.attachedDocuments, action.documentId), confirmed: addUnique(a.confirmed, 'receipts') }
    case 'renew':
      return { ...a, renewed: true }
    case 'sign_declarations':
      return { ...a, declarationsSigned: action.signed }
    case 'submit':
      return { ...a, submittedAt: at }
    case 'amend':
      return { ...a, submittedAt: null, declarationsSigned: false }
    default:
      return a
  }
}

type Stamped = { action: Action; at: string }

export function reducer(state: AppState, { action, at }: Stamped): AppState {
  // Prototype controls: keep role and notes, start the scenario fresh.
  const keep = { role: state.role, prototype: state.prototype }
  if (action.type === 'reset') return { ...initialState(), ...keep, scenarioId: state.scenarioId }
  if (action.type === 'set_scenario') return { ...initialState(), ...keep, scenarioId: action.scenarioId }
  if (action.type === 'set_role') return { ...state, role: action.role }
  if (action.type === 'set_notes') return { ...state, prototype: { showNotes: action.show } }
  if (action.type === 'advisor_act') {
    return { ...state, advisor: { log: [...state.advisor.log, { caseId: action.caseId, act: action.act, at }] } }
  }
  // Submission only goes through when nothing blocks it.
  if (action.type === 'submit') {
    const d = derive(state)
    if (!submitCheck(d.readiness, state.answers.declarationsSigned).canSubmit) return state
  }
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

  const arrived = useRef(state)

  useEffect(() => {
    const saved = saveState(state)
    // "Saved" appears once he has changed something, not on arrival.
    if (saved && state !== arrived.current) setSavedAt(new Date().toISOString())
  }, [state])

  const dispatch = useCallback((action: Action) => rawDispatch({ action, at: new Date().toISOString() }), [])
  return { state, dispatch, savedAt }
}
