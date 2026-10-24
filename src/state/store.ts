import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import type { Action, Actor, Answers, AppState } from './actions'
import { derive } from '../logic/derive'
import { submitCheck } from '../logic/submit'
import { loadState, saveState } from './persist'
import { MILAN_CASE, SCENARIOS, type ScenarioId, type Scenario } from '../data/scenarios'

export const emptyAnswers = (): Answers => ({
  herd: { answer: null, ownCount: null },
  river: { answer: null, split: null },
  road: { answer: null },
  upper: { answer: null, drawn: null },
  pigs: { answer: null },
  bank: { answer: null, account: null },
  household: { answer: null },
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
  version: 8,
  scenarioId: 'second_year',
  role: 'farmer',
  prototype: { showNotes: false },
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
  'answer_bank', 'set_bank_account', 'answer_household', 'answer_meadow',
])
const PAST_LIMIT = 20

const addUnique = <T,>(list: T[], item: T) => (list.includes(item) ? list : [...list, item])

function reduceAnswers(a: Answers, action: Action, at: string, s: Scenario): Answers {
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
    case 'answer_household':
      return { ...a, household: { answer: action.answer } }
    case 'answer_meadow':
      return { ...a, meadow: { answer: action.answer } }
    case 'choose_measures': {
      // A measure GSA suggested comes with the fields its evidence was about filled in.
      const fill: Record<string, string[]> = {}
      for (const g of s.suggestions) {
        const pick = s.measures.find((m) => m.id === g.measureId)?.requirements.find((r) => r.kind === 'fields')
        const key = pick && `${g.measureId}.${pick.id}`
        if (key && g.fields && action.chosen.includes(g.measureId) && a.measures.inputs[key] === undefined) fill[key] = g.fields
      }
      return { ...a, measures: { ...a.measures, chosen: action.chosen, confirmed: true, inputs: { ...a.measures.inputs, ...fill } } }
    }
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
  const keep = { role: state.role, prototype: state.prototype }
  if (action.type === 'reset') return { ...fresh(state.scenarioId), ...keep }
  if (action.type === 'set_scenario') return { ...fresh(action.scenarioId), ...keep }
  if (action.type === 'set_role') return { ...state, role: action.role }
  if (action.type === 'set_notes') return { ...state, prototype: { showNotes: action.show } }
  if (action.type === 'advisor_act') {
    return { ...state, advisor: { log: [...state.advisor.log, { caseId: action.caseId, act: action.act, at }] } }
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
  const answers = reduceAnswers(state.answers, action, at, SCENARIOS[state.scenarioId])
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
