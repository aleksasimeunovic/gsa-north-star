import type { Crop, Point, ScenarioId } from '../data/scenarios'

export type YesNo = 'yes' | 'no'
export type Role = 'farmer' | 'advisor'
export type Actor = 'Milan' | 'Jelena' | 'GSA'

export interface Split {
  line: [Point, Point]
  crops: [Crop | null, Crop | null]
}

// Only what people answered. Steps, statuses and the estimate are derived.
export interface Answers {
  herd: { answer: YesNo | null; ownCount: number | null }
  river: { answer: YesNo | null; noOption: 'redraw' | 'field_check' | null; redrawn: boolean; split: Split | null }
  road: { answer: YesNo | null; correctionRequested: boolean }
  confirmedSteps: string[]
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

export type AdvisorAct = 'opened' | 'asked_owner' | 'replied' | 'handled'

export interface AdvisorLogEntry {
  caseId: string
  act: AdvisorAct
  at: string
}

export interface AppState {
  version: 4
  scenarioId: ScenarioId
  role: Role
  /** Prototype only, not part of GSA. */
  prototype: { showNotes: boolean }
  /** Jelena's work on escalated cases. */
  advisor: { handled: string[]; log: AdvisorLogEntry[] }
  answers: Answers
  history: HistoryEntry[]
}

export type Action =
  | { type: 'set_scenario'; scenarioId: ScenarioId }
  | { type: 'set_role'; role: Role }
  | { type: 'set_notes'; show: boolean }
  | { type: 'advisor_act'; caseId: string; act: AdvisorAct }
  | { type: 'advisor_handle_many'; caseIds: string[] }
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
  | { type: 'confirm_step'; stepId: string }
  | { type: 'attach_document'; documentId: string }
  | { type: 'renew' }
  | { type: 'sign_declarations'; signed: boolean }
  | { type: 'submit' }
  | { type: 'amend' }
  | { type: 'reset' }
