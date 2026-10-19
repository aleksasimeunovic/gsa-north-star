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
  herd: { answer: YesNo | null; ownCount: number | null; followUps: ('registry_check' | 'jelena')[] }
  river: { answer: YesNo | null; noOption: 'redraw' | 'field_check' | null; redrawn: boolean; split: Split | null }
  road: { answer: YesNo | null; correctionRequested: boolean }
  confirmedSteps: string[]
  attachedDocuments: string[]
  renewed: boolean
  declarationsSigned: boolean
  submittedAt: string | null
}

export interface HistoryEntry {
  at: string
  actor: Actor
  action: Action['type']
}

export interface AppState {
  version: 1
  scenarioId: ScenarioId
  role: Role
  answers: Answers
  history: HistoryEntry[]
}

export type Action =
  | { type: 'set_scenario'; scenarioId: ScenarioId }
  | { type: 'set_role'; role: Role }
  | { type: 'answer_herd'; answer: YesNo }
  | { type: 'set_herd_count'; count: number | null }
  | { type: 'herd_follow_up'; followUp: 'registry_check' | 'jelena' }
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
  | { type: 'reset' }
