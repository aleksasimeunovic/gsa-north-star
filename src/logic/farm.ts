import type { Crop, Scenario } from '../data/scenarios'
import type { Answers } from '../state/actions'
import { roundHa, splitPolygon } from './geometry'
import { fitting, riverSplitComplete, type Item } from './status'

export interface FarmPicture {
  totalHa: number
  fieldCount: number
  /** Area per crop this year, largest first. */
  crops: { crop: Crop; ha: number }[]
  cattle: { count: number; registry: number; checking: boolean } | null
  pigs: { count: number; household: boolean | null } | null
  measures: { chosen: number; fitting: number }
}

/**
 * The working picture of his farm as GSA knows it right now, updated by every answer.
 * Areas are what counts for payment: a field loses what its payment impact takes.
 */
export function farmPicture(s: Scenario, a: Answers, items: Item[]): FarmPicture {
  const lost = (fieldId: string) => items.find((i) => i.id === `field_${fieldId}`)?.paymentImpact?.areaHa ?? 0
  const byCrop = new Map<Crop, number>()
  const add = (crop: Crop, ha: number) => byCrop.set(crop, roundHa((byCrop.get(crop) ?? 0) + ha))
  let total = 0

  for (const f of s.fields) {
    const ha = roundHa(f.areaHa - lost(f.id))
    total += ha
    const split = f.id === 'river' && a.river.answer === 'yes' && riverSplitComplete(s, a) ? a.river.split : null
    const r = split && splitPolygon(f.polygon, split.line[0], split.line[1])
    if (split && r) {
      add(split.crops[0]!, r.areasHa[0])
      add(split.crops[1]!, r.areasHa[1])
    } else add(f.cropLastYear, ha)
  }

  const herd = items.find((i) => i.id === 'herd')
  return {
    totalHa: roundHa(total),
    fieldCount: s.fields.length,
    crops: [...byCrop].map(([crop, ha]) => ({ crop, ha })).sort((x, y) => y.ha - x.ha),
    cattle: s.herd
      ? { count: herd?.conflict?.his ?? s.herd.registryCount, registry: s.herd.registryCount, checking: !!herd?.conflict }
      : null,
    pigs: s.pigs && s.pigs.registryCount > 0 ? { count: s.pigs.registryCount, household: a.pigs.answer === null ? null : a.pigs.answer === 'yes' } : null,
    measures: { chosen: a.measures.chosen.length, fitting: fitting(s).length },
  }
}
