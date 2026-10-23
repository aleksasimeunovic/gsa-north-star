import type { FieldId, Measure, Scenario } from '../data/scenarios'
import type { Answers } from '../state/actions'
import { roundHa, splitPolygon } from './geometry'

export type Status = 'complete' | 'action_required' | 'awaiting_verification'
export type ItemId = 'herd' | `field_${FieldId}` | 'fields_other' | 'details' | 'measures' | 'receipts'

// Payment impact is separate from status: never colour or rank status by money.
export type ImpactReason = 'road_took_area' | 'road_pending_correction'
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
  | 'river_one_crop'
  | 'road_unanswered'
  | 'road_confirmed'
  | 'road_correction_requested'
  | 'fields_same'
  | 'fields_confirmed'
  | 'details_to_confirm'
  | 'details_confirmed'
  | 'details_correction'
  | 'measures_to_confirm'
  | 'measures_confirmed'
  | 'receipts_to_confirm'
  | 'receipts_confirmed'
  | 'receipts_missing'

export interface Item {
  id: ItemId
  status: Status
  detail: ItemDetail
  paymentImpact?: PaymentImpact
  /** Both values, when his answer differs from a record. */
  conflict?: { record: number; his: number; owner: 'animal_registry' | 'land_map' }
}

const plantRate = (s: Scenario) => s.measures.find((m) => m.id === 'plant_production')?.rateDinars ?? 0
export const impactOf = (s: Scenario, areaHa: number, reason: ImpactReason): PaymentImpact => ({
  amountDinars: -Math.round(areaHa * plantRate(s)),
  areaHa,
  reason,
})

function herdItem(s: Scenario, a: Answers): Item | null {
  if (!s.herd) return null
  const id = 'herd' as const
  const { answer, ownCount } = a.herd
  if (answer === null) return { id, status: 'action_required', detail: 'herd_unanswered' }
  if (answer === 'yes') return { id, status: 'complete', detail: 'herd_confirmed' }
  if (ownCount === null || ownCount < 0) return { id, status: 'action_required', detail: 'herd_needs_count' }
  if (ownCount === s.herd.registryCount) return { id, status: 'complete', detail: 'herd_confirmed' }
  // A record never overwrites his answer, and his answer never overwrites the record.
  return {
    id,
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

/** A field with a detected change gets its own item. */
function changedFieldItem(s: Scenario, a: Answers, id: FieldId): Item | null {
  const field = s.fields.find((f) => f.id === id)!
  const signal = field.signal
  const itemId = `field_${id}` as const
  if (signal?.kind === 'satellite_difference') {
    // Satellite only flags. Milan decides what he planted.
    const r = a.river
    if (r.answer === null) return { id: itemId, status: 'action_required', detail: 'river_unanswered' }
    if (r.answer === 'yes') {
      return riverSplitComplete(s, a)
        ? { id: itemId, status: 'complete', detail: 'river_split_done' }
        : { id: itemId, status: 'action_required', detail: 'river_needs_split' }
    }
    // No: his declaration stands. The satellite never decides what he planted.
    return { id: itemId, status: 'complete', detail: 'river_one_crop' }
  }
  if (signal?.kind === 'road_strip') {
    const r = a.road
    if (r.answer === null) return { id: itemId, status: 'action_required', detail: 'road_unanswered' }
    if (r.answer === 'yes') {
      return { id: itemId, status: 'complete', detail: 'road_confirmed', paymentImpact: impactOf(s, signal.stripHa, 'road_took_area') }
    }
    // No sends the correction. The land map stays the official record until the correction is checked.
    return {
      id: itemId,
      status: 'awaiting_verification',
      detail: 'road_correction_requested',
      paymentImpact: impactOf(s, signal.stripHa, 'road_pending_correction'),
      conflict: { record: roundHa(field.areaHa - signal.stripHa), his: field.areaHa, owner: 'land_map' },
    }
  }
  return null
}

const confirmedItem = (id: ItemId, done: boolean, todo: ItemDetail, ok: ItemDetail): Item =>
  done ? { id, status: 'complete', detail: ok } : { id, status: 'action_required', detail: todo }

/**
 * Every item gets a status. Pure: derived from scenario + answers, never stored.
 * Unchanged things are named confirmations, not complete by default: he hasn't seen them yet.
 */
export function deriveItems(s: Scenario, a: Answers): Item[] {
  const herd = herdItem(s, a)
  const changed = s.fields.flatMap((f) => changedFieldItem(s, a, f.id) ?? [])
  const unchanged = s.fields.filter((f) => !f.signal)
  const items: Item[] = [...(herd ? [herd] : []), ...changed]

  if (unchanged.length) items.push(confirmedItem('fields_other', a.confirmed.includes('fields_other'), 'fields_same', 'fields_confirmed'))

  const correction = a.requests.some((r) => r.kind === 'record_check' && r.itemId === 'details')
  items.push(
    correction
      ? { id: 'details', status: 'awaiting_verification', detail: 'details_correction' }
      : confirmedItem('details', a.confirmed.includes('details'), 'details_to_confirm', 'details_confirmed'),
  )
  items.push(confirmedItem('measures', a.confirmed.includes('measures'), 'measures_to_confirm', 'measures_confirmed'))

  const missing = s.documents.some((d) => !d.attached && !a.attachedDocuments.includes(d.id))
  items.push(
    missing
      ? { id: 'receipts', status: 'action_required', detail: 'receipts_missing' }
      : confirmedItem('receipts', a.confirmed.includes('receipts'), 'receipts_to_confirm', 'receipts_confirmed'),
  )
  return items
}

/** Fitting measures first, then the rest. The full list always stays. */
export function orderMeasures(measures: Measure[]): Measure[] {
  return [...measures].sort((x, y) => Number(y.fits) - Number(x.fits))
}
