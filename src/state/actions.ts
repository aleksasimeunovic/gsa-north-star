import type { Crop, MeasureId, Point, Polygon, ScenarioId } from '../data/scenarios'

export type YesNo = 'yes' | 'no'
export type Role = 'farmer' | 'advisor'
export type Actor = 'Milan' | 'Jelena' | 'GSA'

/** Things that haven't changed, confirmed by name. */
export type Confirmable = 'fields_other' | 'details' | 'receipts'

/** A measure input: text or a number as text, a choice, a list of fields, a ticked promise, or a file name. */
export type MeasureValue = string | string[] | boolean

export interface Split {
  line: [Point, Point]
  crops: [Crop | null, Crop | null]
}

// Only what people answered. Tasks, statuses and the estimate are derived.
export interface Answers {
  herd: { answer: YesNo | null; ownCount: number | null }
  river: { answer: YesNo | null; split: Split | null }
  /** No sends the correction: the land map's area counts until it is checked. */
  road: { answer: YesNo | null }
  /** Yes: GSA moves his edge back to the neighbour's line. No: he draws where his field ends. */
  upper: { answer: YesNo | null; drawn: Polygon | null }
  /** Yes: household only, nothing to declare. */
  pigs: { answer: YesNo | null }
  /** Chosen measures and what each needs, keyed `${measureId}.${requirementId}`. */
  measures: { chosen: MeasureId[]; confirmed: boolean; inputs: Record<string, MeasureValue> }
  confirmed: Confirmable[]
  /** One specific problem sent on: to Jelena, or to the record's owner to check. */
  requests: Request[]
  attachedDocuments: string[]
  renewed: boolean
  declarationsSigned: boolean
  submittedAt: string | null
}

export interface Request {
  kind: 'jelena' | 'record_check'
  itemId: string
  note: string
  at: string
}

export interface HistoryEntry {
  at: string
  actor: Actor
  action: Action['type']
}

/** Each act says who owns the next step: Jelena, another office, or the farmer. */
export type AdvisorAct = 'opened' | 'referred' | 'asked_farmer' | 'farmer_replied' | 'resolved'

export interface AdvisorLogEntry {
  caseId: string
  act: AdvisorAct
  at: string
  note?: string
}

export interface AppState {
  version: 7
  scenarioId: ScenarioId
  role: Role
  /** Prototype only, not part of GSA. */
  prototype: { showNotes: boolean }
  /** Jelena's work on escalated cases. */
  advisor: { log: AdvisorLogEntry[] }
  answers: Answers
  /** Earlier answers, newest last, so his last answer can be undone. */
  past: Answers[]
  history: HistoryEntry[]
}

export type Action =
  | { type: 'set_scenario'; scenarioId: ScenarioId }
  | { type: 'set_role'; role: Role }
  | { type: 'set_notes'; show: boolean }
  | { type: 'advisor_act'; caseId: string; act: AdvisorAct }
  | { type: 'answer_herd'; answer: YesNo }
  | { type: 'set_herd_count'; count: number | null }
  | { type: 'send_to_jelena'; itemId: string; note: string }
  | { type: 'ask_record_check'; itemId: string }
  | { type: 'answer_river'; answer: YesNo }
  | { type: 'set_split'; split: Split | null }
  | { type: 'answer_road'; answer: YesNo }
  | { type: 'answer_upper'; answer: YesNo }
  | { type: 'set_upper_drawing'; polygon: Polygon | null }
  | { type: 'answer_pigs'; answer: YesNo }
  | { type: 'choose_measures'; chosen: MeasureId[] }
  | { type: 'save_measure'; measureId: MeasureId; inputs: Record<string, MeasureValue> }
  | { type: 'reply_to_jelena'; note: string }
  | { type: 'undo' }
  | { type: 'confirm'; what: Confirmable }
  /** "Yes, all the same as last year": confirms every unchanged thing still to confirm. */
  | { type: 'confirm_same'; what: Confirmable[] }
  | { type: 'attach_document'; documentId: string }
  | { type: 'renew' }
  | { type: 'sign_declarations'; signed: boolean }
  | { type: 'submit' }
  | { type: 'amend' }
  | { type: 'reset' }
