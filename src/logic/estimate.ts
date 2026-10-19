import type { Scenario } from '../data/scenarios'
import type { Item, ImpactReason } from './status'

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
  assumptions: { eligibleAreaHa: number; cowsCalved: number; rates: { perHa: number; perCow: number } }
}

const round = (n: number, to: number) => Math.round(n / to) * to

/**
 * Estimated subsidy based on current information, for this application only.
 * The payment still depends on inspection and final eligibility.
 * Splitting a field changes nothing here: same rate per hectare.
 */
export function estimate(s: Scenario, items: Item[]): Estimate {
  const plant = s.measures.find((m) => m.id === 'plant_production')!
  const cows = s.measures.find((m) => m.id === 'cows_raising_calves')!

  // Work in hundredths of a hectare to avoid floating point drift.
  const declaredCentiHa = s.fields.reduce((sum, f) => sum + Math.round(f.areaHa * 100), 0)
  const impacts = items.flatMap((i) => (i.paymentImpact ? [i.paymentImpact] : []))
  const lostCentiHa = impacts.reduce((sum, p) => sum + Math.round(p.areaHa * 100), 0)
  const eligibleCentiHa = plant.fits ? declaredCentiHa - lostCentiHa : 0

  const cowsCalved = cows.fits && s.herd ? s.herd.cowsCalved : 0

  const lines: EstimateLine[] = []
  if (plant.fits) {
    lines.push({
      measureId: 'plant_production',
      quantity: eligibleCentiHa / 100,
      rateDinars: plant.rateDinars,
      amountDinars: (eligibleCentiHa * plant.rateDinars) / 100,
    })
  }
  if (cowsCalved > 0) {
    lines.push({
      measureId: 'cows_raising_calves',
      quantity: cowsCalved,
      rateDinars: cows.rateDinars,
      amountDinars: cowsCalved * cows.rateDinars,
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
    assumptions: {
      eligibleAreaHa: eligibleCentiHa / 100,
      cowsCalved,
      rates: { perHa: plant.rateDinars, perCow: cows.rateDinars },
    },
  }
}
