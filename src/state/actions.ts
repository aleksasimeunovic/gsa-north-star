import type { Crop, MeasureId, Point, Polygon, ScenarioId } from '../data/scenarios'

export type YesNo = 'yes' | 'no'
export type Role = 'farmer' | 'advisor'
export type Actor = 'Milan' | 'Jelena' | 'GSA'

/** Things GSA already has, confirmed by name. */
export type Confirmable = 'fields_other' | 'receipts' | 'calvings'

/** A measure input: text or a number as text, a choice, a list of fields, a ticked promise, or a file name. */
export type MeasureValue = string | string[] | boolean

export interface Split {
  line: [Point, Point]
  crops: [Crop | null, Crop | null]
}

/**
 * A field he adds this year: the parcel he bought, or land he farms that isn't in his application yet.
 * Saved whole, once he has drawn it, named it, given its crop and chosen its measures.
 */
export interface NewField {
  id: string
  /** The registered farmland it sits on, or 'bought' for the parcel in his name. */
  landId: string
  polygon: Polygon
  name: string
  crop: Crop
  measures: MeasureId[]
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
  /** Yes: payments go to the new account the bank reported. No: he gives the account. */
  bank: { answer: YesNo | null; account: string | null }
  /** Yes: he will mow or graze it. No: the meadow is left out this year. */
  meadow: { answer: YesNo | null }
  /** Yes: he farms the parcel he bought, and adds it as a field. No: it stays out of this application. */
  bought: { answer: YesNo | null }
  newFields: NewField[]
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
  /** The value he says is right, when he typed one. */
  value?: string
  at: string
}

export interface HistoryEntry {
  at: string
  actor: Actor
  action: Action['type']
}

/**
 * Each act says who owns the next step: Jelena, another office, or the farmer. A referral moves
 * responsibility to the record's owner; only the owner's decision, recorded as the outcome, resolves a case.
 */
export type AdvisorAct = 'opened' | 'referred' | 'asked_farmer' | 'farmer_replied' | 'owner_decided'
/** The record owner's decision: the record changed to match the farmer, or it stays as it was. */
export type Outcome = 'changed' | 'kept'

export interface AdvisorLogEntry {
  caseId: string
  act: AdvisorAct
  at: string
  note?: string
  outcome?: Outcome
}

export interface AppState {
  version: 11
  scenarioId: ScenarioId
  role: Role
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
  | { type: 'advisor_act'; caseId: string; act: AdvisorAct; outcome?: Outcome }
  | { type: 'answer_herd'; answer: YesNo }
  | { type: 'set_herd_count'; count: number | null }
  | { type: 'send_to_jelena'; itemId: string; note: string }
  /** `what` names the record to correct, when the item holds several (his details). */
  | { type: 'ask_record_check'; itemId: string; what?: string; value?: string }
  | { type: 'answer_river'; answer: YesNo }
  | { type: 'set_split'; split: Split | null }
  | { type: 'answer_road'; answer: YesNo }
  | { type: 'answer_upper'; answer: YesNo }
  | { type: 'set_upper_drawing'; polygon: Polygon | null }
  | { type: 'answer_pigs'; answer: YesNo }
  | { type: 'answer_bank'; answer: YesNo }
  | { type: 'set_bank_account'; account: string }
  | { type: 'answer_meadow'; answer: YesNo }
  | { type: 'answer_bought'; answer: YesNo }
  | { type: 'save_field'; field: NewField }
  | { type: 'remove_field'; id: string }
  /** With what he already added for them, so choosing and filling in is one step. */
  | { type: 'choose_measures'; chosen: MeasureId[]; inputs?: Record<string, MeasureValue> }
  | { type: 'save_measure'; measureId: MeasureId; inputs: Record<string, MeasureValue> }
  | { type: 'reply_to_jelena'; note: string }
  | { type: 'undo' }
  | { type: 'confirm'; what: Confirmable }
  | { type: 'attach_document'; documentId: string }
  | { type: 'renew' }
  | { type: 'sign_declarations'; signed: boolean }
  | { type: 'submit' }
  | { type: 'amend' }
  | { type: 'reset' }
