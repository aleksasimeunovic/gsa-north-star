import type { MeasureId, Scenario } from '../data/scenarios'
import type { Answers } from '../state/actions'
import type { Item, ImpactReason, ItemId } from './status'

export interface EstimateLine {
  measureId: 'plant_production' | 'cows_raising_calves'
  quantity: number // hectares or cows that calved
  rateDinars: number
  amountDinars: number
}

export interface EstimateChange {
  reason: ImpactReason
  areaHa: number
  amountDinars: number // negative = less
  aboutDinars: number // rounded to the nearest 100 for copy
}

export interface Estimate {
  totalDinars: number
  /** "About" figure for display, nearest 1,000. */
  aboutDinars: number
  lines: EstimateLine[]
  changes: EstimateChange[]
  /** Chosen measures whose amount is only worked out after checks. */
  unpriced: MeasureId[]
  /** Unanswered things that could still change it: while there are any, the estimate is provisional. */
  pending: ItemId[]
  assumptions: { eligibleAreaHa: number; cowsCalved: number; rates: { perHa: number; perCow: number } }
}

const round = (n: number, to: number) => Math.round(n / to) * to

/** What can change the estimate: area (road, the neighbour's line, the meadow), the measures chosen, the receipts that justify them. */
const CAN_CHANGE: ItemId[] = ['field_road', 'field_upper', 'field_meadow', 'measures', 'receipts']

/**
 * Estimated subsidy based on current information, for this application only.
 * The payment still depends on inspection and final eligibility.
 * Splitting a field changes nothing here: same rate per hectare.
 */
export function estimate(s: Scenario, a: Answers, items: Item[]): Estimate {
  const chosen = (id: MeasureId) => a.measures.chosen.includes(id)
  const plant = s.measures.find((m) => m.id === 'plant_production')!
  const cows = s.measures.find((m) => m.id === 'cows_raising_calves')!
  const plantOn = plant.fits && chosen(plant.id)

  // Work in hundredths of a hectare to avoid floating point drift.
  const declaredCentiHa = s.fields.reduce((sum, f) => sum + Math.round(f.areaHa * 100), 0)
  const impacts = items.flatMap((i) => (i.paymentImpact ? [i.paymentImpact] : []))
  const lostCentiHa = impacts.reduce((sum, p) => sum + Math.round(p.areaHa * 100), 0)
  const eligibleCentiHa = plantOn ? declaredCentiHa - lostCentiHa : 0
  const plantRate = plant.rateDinars ?? 0
  const cowRate = cows.rateDinars ?? 0

  const cowsCalved = cows.fits && chosen(cows.id) && s.herd ? s.herd.cowsCalved : 0

  const lines: EstimateLine[] = []
  if (plantOn) {
    lines.push({
      measureId: 'plant_production',
      quantity: eligibleCentiHa / 100,
      rateDinars: plantRate,
      amountDinars: (eligibleCentiHa * plantRate) / 100,
    })
  }
  if (cowsCalved > 0) {
    lines.push({
      measureId: 'cows_raising_calves',
      quantity: cowsCalved,
      rateDinars: cowRate,
      amountDinars: cowsCalved * cowRate,
    })
  }

  const totalDinars = lines.reduce((sum, l) => sum + l.amountDinars, 0)
  return {
    totalDinars,
    aboutDinars: round(totalDinars, 1000),
    lines,
    changes: impacts.map((p) => ({
      reason: p.reason,
      areaHa: p.areaHa,
      amountDinars: p.amountDinars,
      aboutDinars: round(p.amountDinars, 100),
    })),
    unpriced: s.measures.filter((m) => m.fits && chosen(m.id) && m.rateDinars === undefined).map((m) => m.id),
    // Receipts that are there only need confirming; missing ones put plant production in doubt.
    pending: items
      .filter((i) => CAN_CHANGE.includes(i.id) && i.status === 'action_required' && (i.id !== 'receipts' || i.detail === 'receipts_missing'))
      .map((i) => i.id),
    assumptions: {
      eligibleAreaHa: eligibleCentiHa / 100,
      cowsCalved,
      rates: { perHa: plantRate, perCow: cowRate },
    },
  }
}
