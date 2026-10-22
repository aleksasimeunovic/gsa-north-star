import type { Crop, Point, ScenarioId } from '../data/scenarios'

export type YesNo = 'yes' | 'no'
export type Role = 'farmer' | 'advisor'
export type Actor = 'Milan' | 'Jelena' | 'GSA'

/** Things that haven't changed, confirmed by name. */
export type Confirmable = 'fields_other' | 'details' | 'measures' | 'receipts'

export interface Split {
  line: [Point, Point]
  crops: [Crop | null, Crop | null]
}

// Only what people answered. Tasks, statuses and the estimate are derived.
export interface Answers {
  herd: { answer: YesNo | null; ownCount: number | null }
  river: { answer: YesNo | null; noOption: 'redraw' | 'field_check' | null; redrawn: boolean; split: Split | null }
  road: { answer: YesNo | null; correctionRequested: boolean }
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
export type AdvisorAct = 'opened' | 'referred' | 'asked_farmer' | 'resolved'

export interface AdvisorLogEntry {
  caseId: string
  act: AdvisorAct
  at: string
}

export interface AppState {
  version: 5
  scenarioId: ScenarioId
  role: Role
  /** Prototype only, not part of GSA. */
  prototype: { showNotes: boolean }
  /** Jelena's work on escalated cases. */
  advisor: { log: AdvisorLogEntry[] }
  answers: Answers
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
  | { type: 'river_no_option'; option: 'redraw' | 'field_check' }
  | { type: 'river_redrawn' }
  | { type: 'set_split'; split: Split | null }
  | { type: 'answer_road'; answer: YesNo }
  | { type: 'request_road_correction' }
  | { type: 'confirm'; what: Confirmable }
  | { type: 'attach_document'; documentId: string }
  | { type: 'renew' }
  | { type: 'sign_declarations'; signed: boolean }
  | { type: 'submit' }
  | { type: 'amend' }
  | { type: 'reset' }
