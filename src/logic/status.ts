import type { FieldId, Measure, Scenario } from '../data/scenarios'
import type { Answers } from '../state/actions'
import { roundHa, splitPolygon } from './geometry'

export type Status = 'complete' | 'action_required' | 'awaiting_verification'
export type StepId = 'herd' | 'land' | 'everything_else' | 'submit'
export type ItemId = 'herd' | `field_${FieldId}` | 'general_data' | 'measures' | 'documents'

// Payment impact is separate from status: never colour or rank status by money.
export type ImpactReason = 'road_took_area' | 'road_pending_correction' | 'field_check_pending'
export interface PaymentImpact {
  amountDinars: number // negative = less payment
  areaHa: number
  reason: ImpactReason
}

export type ItemDetail =
  | 'herd_unanswered'
  | 'herd_needs_count'
  | 'herd_confirmed'
  | 'herd_differs' // his value and the registry's are both kept
  | 'river_unanswered'
  | 'river_needs_split'
  | 'river_split_done'
  | 'river_needs_choice'
  | 'river_needs_redraw'
  | 'river_redrawn'
  | 'river_field_check'
  | 'road_unanswered'
  | 'road_confirmed'
  | 'road_needs_correction'
  | 'road_correction_requested'
  | 'field_unchanged'
  | 'field_to_draw'
  | 'records_from_registry'
  | 'measures_kept'
  | 'measures_to_choose'
  | 'documents_attached'
  | 'documents_missing'

export interface Item {
  id: ItemId
  stepId: StepId
  status: Status
  detail: ItemDetail
  paymentImpact?: PaymentImpact
  /** Both values, when his answer differs from a record. */
  conflict?: { record: number; his: number; owner: 'animal_registry' | 'land_map' }
}

const plantRate = (s: Scenario) => s.measures.find((m) => m.id === 'plant_production')?.rateDinars ?? 0
const impact = (s: Scenario, areaHa: number, reason: ImpactReason): PaymentImpact => ({
  amountDinars: -Math.round(areaHa * plantRate(s)),
  areaHa,
  reason,
})

function herdItem(s: Scenario, a: Answers): Item | null {
  if (!s.herd) return null
  const base = { id: 'herd' as const, stepId: 'herd' as const }
  const { answer, ownCount } = a.herd
  if (answer === null) return { ...base, status: 'action_required', detail: 'herd_unanswered' }
  if (answer === 'yes') return { ...base, status: 'complete', detail: 'herd_confirmed' }
  if (ownCount === null || ownCount < 0) return { ...base, status: 'action_required', detail: 'herd_needs_count' }
  if (ownCount === s.herd.registryCount) return { ...base, status: 'complete', detail: 'herd_confirmed' }
  // A record never overwrites his answer, and his answer never overwrites the record.
  return {
    ...base,
    status: 'awaiting_verification',
    detail: 'herd_differs',
    conflict: { record: s.herd.registryCount, his: ownCount, owner: 'animal_registry' },
  }
}

export function riverSplitComplete(s: Scenario, a: Answers): boolean {
  const field = s.fields.find((f) => f.id === 'river')
  const split = a.river.split
  if (!field || !split || !split.crops[0] || !split.crops[1]) return false
  // Two crops means two different crops.
  if (split.crops[0] === split.crops[1]) return false
  return splitPolygon(field.polygon, split.line[0], split.line[1]) !== null
}

function fieldItem(s: Scenario, a: Answers, id: FieldId): Item {
  const base = { id: `field_${id}` as const, stepId: 'land' as const }
  const field = s.fields.find((f) => f.id === id)!
  if (s.firstYear) {
    const drawn = a.confirmedSteps.includes('land')
    return { ...base, status: drawn ? 'complete' : 'action_required', detail: drawn ? 'field_unchanged' : 'field_to_draw' }
  }
  const signal = field.signal
  if (signal?.kind === 'satellite_difference') {
    // Satellite only flags. Milan decides what he planted.
    const r = a.river
    if (r.answer === null) return { ...base, status: 'action_required', detail: 'river_unanswered' }
    if (r.answer === 'yes') {
      return riverSplitComplete(s, a)
        ? { ...base, status: 'complete', detail: 'river_split_done' }
        : { ...base, status: 'action_required', detail: 'river_needs_split' }
    }
    if (r.noOption === null) return { ...base, status: 'action_required', detail: 'river_needs_choice' }
    if (r.noOption === 'redraw') {
      return r.redrawn
        ? { ...base, status: 'complete', detail: 'river_redrawn' }
        : { ...base, status: 'action_required', detail: 'river_needs_redraw' }
    }
    return {
      ...base,
      status: 'awaiting_verification',
      detail: 'river_field_check',
      paymentImpact: impact(s, signal.flagHa, 'field_check_pending'),
    }
  }
  if (signal?.kind === 'road_strip') {
    const r = a.road
    if (r.answer === null) return { ...base, status: 'action_required', detail: 'road_unanswered' }
    if (r.answer === 'yes') {
      return { ...base, status: 'complete', detail: 'road_confirmed', paymentImpact: impact(s, signal.stripHa, 'road_took_area') }
    }
    if (!r.correctionRequested) return { ...base, status: 'action_required', detail: 'road_needs_correction' }
    // The land map stays the official record until the correction is checked.
    return {
      ...base,
      status: 'awaiting_verification',
      detail: 'road_correction_requested',
      paymentImpact: impact(s, signal.stripHa, 'road_pending_correction'),
      conflict: { record: roundHa(field.areaHa - signal.stripHa), his: field.areaHa, owner: 'land_map' },
    }
  }
  return { ...base, status: 'complete', detail: 'field_unchanged' }
}

function everythingElseItems(s: Scenario, a: Answers): Item[] {
  const base = { stepId: 'everything_else' as const }
  const items: Item[] = [{ ...base, id: 'general_data', status: 'complete', detail: 'records_from_registry' }]
  const chosen = !s.firstYear || a.confirmedSteps.includes('everything_else')
  items.push({
    ...base,
    id: 'measures',
    status: chosen ? 'complete' : 'action_required',
    detail: s.firstYear ? 'measures_to_choose' : 'measures_kept',
  })
  const missing = s.documents.some((d) => !d.attached && !a.attachedDocuments.includes(d.id))
  items.push({
    ...base,
    id: 'documents',
    status: missing ? 'action_required' : 'complete',
    detail: missing ? 'documents_missing' : 'documents_attached',
  })
  return items
}

/** Every item gets a status. Pure: derived from scenario + answers, never stored. */
export function deriveItems(s: Scenario, a: Answers): Item[] {
  const herd = herdItem(s, a)
  return [
    ...(herd ? [herd] : []),
    ...s.fields.map((f) => fieldItem(s, a, f.id)),
    ...everythingElseItems(s, a),
  ]
}

const SEVERITY: Record<Status, number> = { complete: 0, awaiting_verification: 1, action_required: 2 }

/** A step's status is its most pressing item. */
export function worstStatus(statuses: Status[]): Status {
  return statuses.reduce<Status>((w, s) => (SEVERITY[s] > SEVERITY[w] ? s : w), 'complete')
}

/** Fitting measures first, then the rest. The full list always stays. */
export function orderMeasures(measures: Measure[]): Measure[] {
  return [...measures].sort((x, y) => Number(y.fits) - Number(x.fits))
}
