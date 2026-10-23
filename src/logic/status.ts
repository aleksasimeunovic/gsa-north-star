import type { FieldId, Measure, MeasureId, Requirement, Scenario } from '../data/scenarios'
import type { Answers, MeasureValue } from '../state/actions'
import type { CaseState } from './advisor'
import { overlapHa, polygonAreaHa, roundHa, splitPolygon } from './geometry'

export type Status = 'complete' | 'action_required' | 'awaiting_verification'
export type ItemId = 'herd' | 'pigs' | `field_${FieldId}` | 'fields_other' | 'details' | 'measures' | `measure_${MeasureId}` | 'receipts'

// Payment impact is separate from status: never colour or rank status by money.
export type ImpactReason = 'road_took_area' | 'road_pending_correction' | 'overlap_removed' | 'redrawn' | 'overlap_pending'
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
  | 'herd_jelena_asks' // Jelena sent the problem back to him with a question
  | 'river_unanswered'
  | 'river_needs_split'
  | 'river_split_done'
  | 'river_one_crop'
  | 'road_unanswered'
  | 'road_confirmed'
  | 'road_correction_requested'
  | 'upper_unanswered'
  | 'upper_moved'
  | 'upper_needs_drawing'
  | 'upper_drawn'
  | 'upper_drawn_overlaps' // his line and the neighbour's both kept
  | 'pigs_unanswered'
  | 'pigs_household'
  | 'pigs_declared'
  | 'fields_same'
  | 'fields_confirmed'
  | 'details_to_confirm'
  | 'details_confirmed'
  | 'details_correction'
  | 'measures_to_choose'
  | 'measures_chosen'
  | 'measure_needs_input'
  | 'measure_ruled_out' // an answer means the measure can't be paid; he leaves it out
  | 'measure_ready'
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
  /** For a measure: what he still has to add. */
  missing?: string[]
}

const plantRate = (s: Scenario) => s.measures.find((m) => m.id === 'plant_production')?.rateDinars ?? 0

function pigsItem(s: Scenario, a: Answers): Item | null {
  if (!s.pigs || s.pigs.registryCount === s.pigs.lastYearDeclared) return null
  if (a.pigs.answer === null) return { id: 'pigs', status: 'action_required', detail: 'pigs_unanswered' }
  return { id: 'pigs', status: 'complete', detail: a.pigs.answer === 'yes' ? 'pigs_household' : 'pigs_declared' }
}
export const impactOf = (s: Scenario, areaHa: number, reason: ImpactReason): PaymentImpact => ({
  amountDinars: -Math.round(areaHa * plantRate(s)),
  areaHa,
  reason,
})

function herdItem(s: Scenario, a: Answers, jelena: CaseState | null): Item | null {
  if (!s.herd) return null
  const id = 'herd' as const
  const { answer, ownCount } = a.herd
  if (answer === null) return { id, status: 'action_required', detail: 'herd_unanswered' }
  if (answer === 'yes') return { id, status: 'complete', detail: 'herd_confirmed' }
  if (ownCount === null || ownCount < 0) return { id, status: 'action_required', detail: 'herd_needs_count' }
  if (ownCount === s.herd.registryCount) return { id, status: 'complete', detail: 'herd_confirmed' }
  // A record never overwrites his answer, and his answer never overwrites the record.
  // If Jelena asks him something, the next action is his again.
  const asked = jelena === 'waiting_farmer'
  return {
    id,
    status: asked ? 'action_required' : 'awaiting_verification',
    detail: asked ? 'herd_jelena_asks' : 'herd_differs',
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
  if (signal?.kind === 'overlap') {
    const u = a.upper
    if (u.answer === null) return { id: itemId, status: 'action_required', detail: 'upper_unanswered' }
    if (u.answer === 'yes') {
      return { id: itemId, status: 'complete', detail: 'upper_moved', paymentImpact: impactOf(s, signal.overlapHa, 'overlap_removed') }
    }
    if (!u.drawn) return { id: itemId, status: 'action_required', detail: 'upper_needs_drawing' }
    const drawnHa = roundHa(polygonAreaHa(u.drawn))
    const lost = roundHa(field.areaHa - drawnHa)
    // His line still runs into the neighbour's: both declarations are kept until the payments office checks.
    const still = overlapHa(u.drawn, signal.neighbourPolygon)
    if (still >= 0.01) {
      return { id: itemId, status: 'awaiting_verification', detail: 'upper_drawn_overlaps', paymentImpact: impactOf(s, roundHa(lost + still), 'overlap_pending') }
    }
    return { id: itemId, status: 'complete', detail: 'upper_drawn', ...(lost !== 0 ? { paymentImpact: impactOf(s, lost, 'redrawn') } : {}) }
  }
  return null
}

const empty = (v: MeasureValue | undefined) => v === undefined || v === '' || v === false || (Array.isArray(v) && v.length === 0)

/** A requirement he sees: always, or once another answer makes it needed. */
export const shown = (m: Measure, r: Requirement, inputs: Answers['measures']['inputs']) =>
  !r.when || inputs[`${m.id}.${r.when.id}`] === r.when.value

/** What he still has to add for a measure, and whether an answer rules it out. */
export function measureGaps(m: Measure, inputs: Answers['measures']['inputs']): { missing: string[]; ruledOut: boolean } {
  const visible = m.requirements.filter((r) => r.kind !== 'auto' && shown(m, r, inputs))
  return {
    missing: visible.filter((r) => empty(inputs[`${m.id}.${r.id}`])).map((r) => r.id),
    ruledOut: visible.some((r) => r.blocks !== undefined && inputs[`${m.id}.${r.id}`] === r.blocks),
  }
}

/** Measures that fit his farm. */
export const fitting = (s: Scenario) => s.measures.filter((m) => m.fits)

/**
 * Choosing measures is its own task. Once chosen, every measure that needs something from him
 * becomes its own task; measures GSA can fill in from records need nothing more.
 */
function measureItems(s: Scenario, a: Answers): Item[] {
  const m = a.measures
  const items: Item[] = [m.confirmed ? { id: 'measures', status: 'complete', detail: 'measures_chosen' } : { id: 'measures', status: 'action_required', detail: 'measures_to_choose' }]
  if (!m.confirmed) return items
  for (const measure of fitting(s).filter((x) => m.chosen.includes(x.id) && x.requirements.some((r) => r.kind !== 'auto'))) {
    const { missing, ruledOut } = measureGaps(measure, m.inputs)
    const id = `measure_${measure.id}` as const
    if (ruledOut) items.push({ id, status: 'action_required', detail: 'measure_ruled_out' })
    else if (missing.length) items.push({ id, status: 'action_required', detail: 'measure_needs_input', missing })
    else items.push({ id, status: 'complete', detail: 'measure_ready' })
  }
  return items
}

const confirmedItem = (id: ItemId, done: boolean, todo: ItemDetail, ok: ItemDetail): Item =>
  done ? { id, status: 'complete', detail: ok } : { id, status: 'action_required', detail: todo }

/**
 * Every item gets a status. Pure: derived from scenario + answers, never stored.
 * Unchanged things are named confirmations, not complete by default: he hasn't seen them yet.
 */
export function deriveItems(s: Scenario, a: Answers, jelena: CaseState | null = null): Item[] {
  const herd = herdItem(s, a, jelena)
  const pigs = pigsItem(s, a)
  const changed = s.fields.flatMap((f) => changedFieldItem(s, a, f.id) ?? [])
  const unchanged = s.fields.filter((f) => !f.signal)
  const items: Item[] = [...(herd ? [herd] : []), ...(pigs ? [pigs] : []), ...changed]

  if (unchanged.length) items.push(confirmedItem('fields_other', a.confirmed.includes('fields_other'), 'fields_same', 'fields_confirmed'))

  const correction = a.requests.some((r) => r.kind === 'record_check' && r.itemId === 'details')
  items.push(
    correction
      ? { id: 'details', status: 'awaiting_verification', detail: 'details_correction' }
      : confirmedItem('details', a.confirmed.includes('details'), 'details_to_confirm', 'details_confirmed'),
  )
  items.push(...measureItems(s, a))

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
