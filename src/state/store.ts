import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { Action, Actor, Answers, AppState } from './actions'
import { derive } from '../logic/derive'
import { caseState } from '../logic/advisor'
import { submitCheck } from '../logic/submit'
import { loadState, saveState } from './persist'
import { MILAN_CASE, type ScenarioId } from '../data/scenarios'

export const emptyAnswers = (): Answers => ({
  herd: { answer: null, ownCount: null },
  river: { answer: null, split: null },
  road: { answer: null },
  upper: { answer: null, drawn: null },
  pigs: { answer: null },
  bank: { answer: null, account: null },
  meadow: { answer: null },
  measures: { chosen: [], confirmed: false, inputs: {} },
  confirmed: [],
  requests: [],
  attachedDocuments: [],
  renewed: false,
  declarationsSigned: false,
  submittedAt: null,
})

export const initialState = (): AppState => ({
  version: 10,
  scenarioId: 'second_year',
  role: 'farmer',
  advisor: { log: [] },
  answers: emptyAnswers(),
  past: [],
  history: [],
})


export const fresh = (scenarioId: ScenarioId): AppState => ({ ...initialState(), scenarioId, answers: emptyAnswers() })

/** Answers that can be taken back with Undo. Prototype, advisor and submit actions can't. */
const UNDOABLE = new Set<Action['type']>([
  'answer_herd', 'set_herd_count', 'answer_river', 'set_split', 'answer_road', 'answer_upper', 'set_upper_drawing',
  'answer_pigs', 'confirm', 'attach_document', 'ask_record_check', 'choose_measures', 'save_measure',
  'answer_bank', 'set_bank_account', 'answer_meadow',
])
const PAST_LIMIT = 20

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
      if (a.requests.some((r) => r.kind === 'record_check' && r.itemId === action.itemId && r.note === (action.what ?? ''))) return a
      return { ...a, requests: [...a.requests, { kind: 'record_check', itemId: action.itemId, note: action.what ?? '', at }] }
    case 'answer_river':
      return { ...a, river: { ...a.river, answer: action.answer } }
    case 'set_split':
      return { ...a, river: { ...a.river, split: action.split } }
    case 'answer_road':
      return { ...a, road: { ...a.road, answer: action.answer } }
    case 'answer_upper':
      // "No" always asks him to draw afresh.
      return { ...a, upper: { answer: action.answer, drawn: action.answer === 'no' ? a.upper.drawn : null } }
    case 'set_upper_drawing':
      return { ...a, upper: { ...a.upper, drawn: action.polygon } }
    case 'answer_pigs':
      return { ...a, pigs: { answer: action.answer } }
    case 'answer_bank':
      // "No" always asks for the account afresh.
      return { ...a, bank: { answer: action.answer, account: action.answer === 'no' ? null : a.bank.account } }
    case 'set_bank_account':
      return { ...a, bank: { ...a.bank, account: action.account } }
    case 'answer_meadow':
      return { ...a, meadow: { answer: action.answer } }
    case 'choose_measures':
      // Nothing is filled in for him: GSA prepares, only Milan declares. A suggestion's fields are one tap away.
      return { ...a, measures: { ...a.measures, chosen: action.chosen, confirmed: true, inputs: { ...a.measures.inputs, ...action.inputs } } }
    case 'save_measure':
      return { ...a, measures: { ...a.measures, inputs: { ...a.measures.inputs, ...action.inputs } } }
    case 'reply_to_jelena':
      return a
    case 'confirm':
      return { ...a, confirmed: addUnique(a.confirmed, action.what) }
    case 'attach_document':
      // Uploading them is confirming them.
      return {
        ...a,
        attachedDocuments: addUnique(a.attachedDocuments, action.documentId),
        confirmed: action.documentId === 'input_receipts' ? addUnique(a.confirmed, 'receipts') : a.confirmed,
      }
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
  const keep = { role: state.role }
  if (action.type === 'reset') return { ...fresh(state.scenarioId), ...keep }
  if (action.type === 'set_scenario') return { ...fresh(action.scenarioId), ...keep }
  if (action.type === 'set_role') return { ...state, role: action.role }
  if (action.type === 'advisor_act') {
    // Resolved needs the record owner's decision, and only after the case was referred to that owner.
    if (action.act === 'owner_decided' && (!action.outcome || caseState(state.advisor.log, action.caseId) !== 'waiting_office')) return state
    const entry = { caseId: action.caseId, act: action.act, at, ...(action.outcome ? { outcome: action.outcome } : {}) }
    return { ...state, advisor: { log: [...state.advisor.log, entry] } }
  }
  // His reply goes back to Jelena: the next action is hers again.
  if (action.type === 'reply_to_jelena') {
    return {
      ...state,
      advisor: { log: [...state.advisor.log, { caseId: MILAN_CASE.id, act: 'farmer_replied', at, note: action.note }] },
      history: [...state.history, { at, actor: 'Milan', action: action.type }],
    }
  }
  if (action.type === 'undo') {
    const prev = state.past[state.past.length - 1]
    if (!prev) return state
    return { ...state, answers: prev, past: state.past.slice(0, -1), history: [...state.history, { at, actor: 'Milan', action: 'undo' }] }
  }
  // Submission only goes through when nothing blocks it.
  if (action.type === 'submit') {
    const d = derive(state)
    if (!submitCheck(d.readiness, state.answers.declarationsSigned).canSubmit) return state
  }
  const actor: Actor = state.role === 'advisor' ? 'Jelena' : 'Milan'
  const answers = reduceAnswers(state.answers, action, at)
  return {
    ...state,
    answers,
    past: UNDOABLE.has(action.type) && answers !== state.answers ? [...state.past, state.answers].slice(-PAST_LIMIT) : state.past,
    history: [...state.history, { at, actor, action: action.type }],
  }
}

export function useStore() {
  const [state, rawDispatch] = useReducer(reducer, undefined, () => loadState() ?? fresh('second_year'))
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
