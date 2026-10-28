import type { FieldId, Measure, Requirement, Scenario } from '../data/scenarios'
import type { Answers, MeasureValue } from '../state/actions'
import type { CaseState } from './advisor'
import { overlapHa, polygonAreaHa, roundHa, splitPolygon } from './geometry'

export type Status = 'complete' | 'action_required' | 'awaiting_verification'
export type ItemId =
  | 'bank'
  | 'details'
  | 'herd'
  | 'pigs'
  | 'calvings'
  | `field_${FieldId}`
  | 'fields_other'
  | 'measures'
  | 'receipts'

// Payment impact is separate from status: never colour or rank status by money.
export type ImpactReason = 'road_took_area' | 'road_pending_correction' | 'overlap_removed' | 'redrawn' | 'overlap_pending' | 'meadow_out'
export interface PaymentImpact {
  amountDinars: number // negative = less payment
  areaHa: number
  reason: ImpactReason
}

export type ItemDetail =
  | 'bank_unanswered'
  | 'bank_needs_account'
  | 'bank_new' // payments go to the new account the bank reported
  | 'bank_own' // he gave the account himself
  | 'calvings_to_confirm'
  | 'calvings_confirmed'
  | 'calvings_check' // he asked the registry to check
  | 'meadow_unanswered'
  | 'meadow_kept'
  | 'meadow_out'
  | 'herd_unanswered'
  | 'herd_needs_count'
  | 'herd_confirmed'
  | 'herd_differs' // his value and the registry's are both kept
  | 'herd_jelena_asks' // Jelena sent the problem back to him with a question
  | 'herd_settled' // the animal registry decided, and Jelena recorded its decision
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
  | 'details_correction' // he asked the record's owner to correct something unchanged since last year
  | 'measures_to_choose'
  | 'measures_chosen'
  | 'measures_incomplete' // a chosen measure still needs something, or an answer rules it out
  | 'receipts_to_confirm'
  | 'receipts_confirmed'
  | 'receipts_missing'
  | 'receipts_unreadable' // a receipt GSA can't read: he sends a clearer one before confirming

export interface Item {
  id: ItemId
  status: Status
  detail: ItemDetail
  paymentImpact?: PaymentImpact
  /** Both values, when his answer differs from a record. */
  conflict?: { record: number; his: number; owner: 'animal_registry' | 'land_map' }
  /** For measures: the chosen ones that still need him. */
  missing?: string[]
  /** Something is wrong and he must fix it, as opposed to work he simply hasn't done. */
  problem?: true
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
  // Once the registry has decided, his part and theirs are done. If Jelena asks him something, it's his again.
  if (jelena === 'resolved') return { id, status: 'complete', detail: 'herd_settled' }
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
  if (signal?.kind === 'not_mown') {
    // Satellite only flags; he says whether he will look after it. No leaves the meadow out, with its payment.
    if (a.meadow.answer === null) return { id: itemId, status: 'action_required', detail: 'meadow_unanswered' }
    if (a.meadow.answer === 'yes') return { id: itemId, status: 'complete', detail: 'meadow_kept' }
    return { id: itemId, status: 'complete', detail: 'meadow_out', paymentImpact: impactOf(s, field.areaHa, 'meadow_out') }
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
 * Choosing measures and adding what each needs is one task. It is done only once every chosen measure
 * has everything it needs: a measure he ticked but didn't finish keeps the task open (and blocks
 * submission), however many he finished. `missing` lists the measures that still need him.
 */
export function measuresItem(s: Scenario, a: Answers): Item {
  const m = a.measures
  if (!m.confirmed) return { id: 'measures', status: 'action_required', detail: 'measures_to_choose' }
  const open = fitting(s).filter((x) => {
    if (!m.chosen.includes(x.id)) return false
    const g = measureGaps(x, m.inputs)
    return g.ruledOut || g.missing.length > 0
  })
  const ruledOut = open.some((x) => measureGaps(x, m.inputs).ruledOut)
  return open.length
    ? { id: 'measures', status: 'action_required', detail: 'measures_incomplete', missing: open.map((x) => x.id), ...(ruledOut ? { problem: true as const } : {}) }
    : { id: 'measures', status: 'complete', detail: 'measures_chosen' }
}

/** The bank closed the account payments go to and reported a new one: one question, his own account only if No. */
function bankItem(s: Scenario, a: Answers): Item | null {
  if (!s.generalData.account) return null
  const { answer, account } = a.bank
  if (answer === null) return { id: 'bank', status: 'action_required', detail: 'bank_unanswered' }
  if (answer === 'yes') return { id: 'bank', status: 'complete', detail: 'bank_new' }
  return account ? { id: 'bank', status: 'complete', detail: 'bank_own' } : { id: 'bank', status: 'action_required', detail: 'bank_needs_account' }
}

/** The calvings the cow payment is worked out on, from the registry: confirmed, or checked by the registry. */
function calvingsItem(s: Scenario, a: Answers): Item | null {
  if (!s.herd) return null
  if (a.requests.some((r) => r.kind === 'record_check' && r.itemId === 'calvings')) return { id: 'calvings', status: 'awaiting_verification', detail: 'calvings_check' }
  return confirmedItem('calvings', a.confirmed.includes('calvings'), 'calvings_to_confirm', 'calvings_confirmed')
}

function confirmedItem(id: ItemId, done: boolean, todo: ItemDetail, ok: ItemDetail): Item {
  return done ? { id, status: 'complete', detail: ok } : { id, status: 'action_required', detail: todo }
}

/** Unchanged since last year with nothing to declare: reused without asking, so never a task. */
export const UNCHANGED = ['holder', 'place', 'active'] as const
export type Unchanged = (typeof UNCHANGED)[number]
export const correctionAsked = (a: Answers, what: Unchanged) => a.requests.some((r) => r.kind === 'record_check' && r.itemId === 'details' && r.note === what)

/**
 * Every item gets a status. Pure: derived from scenario + answers, never stored.
 * A task exists only if it needs his input this year: a change a record shows, or something he declares
 * every year under liability (cows that calved, this year's crops, his receipts). What is unchanged and
 * declares nothing (name, address, active farmer) is reused without asking and isn't an item, unless he
 * asked for a correction, which then waits for the record's owner.
 */
export function deriveItems(s: Scenario, a: Answers, jelena: CaseState | null = null): Item[] {
  const items: Item[] = []
  const add = (i: Item | null) => i && items.push(i)

  // Your details
  add(bankItem(s, a))
  if (UNCHANGED.some((w) => correctionAsked(a, w))) add({ id: 'details', status: 'awaiting_verification', detail: 'details_correction' })

  // Animals
  add(herdItem(s, a, jelena))
  add(pigsItem(s, a))
  add(calvingsItem(s, a))

  // Land
  s.fields.forEach((f) => add(changedFieldItem(s, a, f.id)))
  if (s.fields.some((f) => !f.signal)) add(confirmedItem('fields_other', a.confirmed.includes('fields_other'), 'fields_same', 'fields_confirmed'))

  // Measures
  // GSA's suggestions sit at the top of choosing measures, so he sees them with the rest.
  items.push(measuresItem(s, a))

  // Documents: one task for his receipts. An unreadable one is an error inside it, fixed before he confirms.
  const missing = s.documents.some((d) => !d.attached && !a.attachedDocuments.includes(d.id))
  const unreadable = s.documents.some((d) => d.attached && d.unreadable) && !a.attachedDocuments.includes('unreadable_receipt')
  add(
    missing
      ? { id: 'receipts', status: 'action_required', detail: 'receipts_missing', problem: true }
      : unreadable
        ? { id: 'receipts', status: 'action_required', detail: 'receipts_unreadable', problem: true }
        : confirmedItem('receipts', a.confirmed.includes('receipts'), 'receipts_to_confirm', 'receipts_confirmed'),
  )
  return items
}

/** Fitting measures first, then the rest. The full list always stays. */
export function orderMeasures(measures: Measure[]): Measure[] {
  return [...measures].sort((x, y) => Number(y.fits) - Number(x.fits))
}
