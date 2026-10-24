import type { Crop, Scenario } from '../data/scenarios'
import type { Answers } from '../state/actions'
import { roundHa, splitPolygon } from './geometry'
import { fitting, riverSplitComplete, type Item, type ItemId } from './status'

/**
 * Where a line of his farm comes from: a government record he hasn't confirmed yet,
 * his own confirmation, or his answer and a record both kept until the record's owner checks.
 */
export type Source = 'records' | 'confirmed' | 'checking'

export interface FarmPicture {
  fields: {
    totalHa: number
    count: number
    /** Area per crop this year, largest first. */
    crops: { crop: Crop; ha: number }[]
    source: Source
    /** How many fields he has confirmed so far, while the rest still come from records. */
    confirmed: number
  }
  cattle: { count: number; registry: number; source: Source } | null
  pigs: { count: number; household: boolean | null; source: Source } | null
  measures: { chosen: number; fitting: number; source: Source }
}

const sourceOf = (items: (Item | undefined)[]): Source => {
  const known = items.filter((i): i is Item => !!i)
  if (known.some((i) => i.status === 'awaiting_verification' || i.conflict)) return 'checking'
  return known.length > 0 && known.every((i) => i.status === 'complete') ? 'confirmed' : 'records'
}

/**
 * The working picture of his farm as GSA knows it right now, updated by every answer, with where each
 * line comes from. Areas are what counts for payment: a field loses what its payment impact takes.
 */
export function farmPicture(s: Scenario, a: Answers, items: Item[]): FarmPicture {
  const item = (id: ItemId) => items.find((i) => i.id === id)
  const lost = (fieldId: string) => item(`field_${fieldId}` as ItemId)?.paymentImpact?.areaHa ?? 0
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

  // Each field is confirmed by its own question, or by "same as last year" for the unchanged ones.
  const fieldItems = s.fields.map((f) => (f.signal ? item(`field_${f.id}` as ItemId) : item('fields_other')))
  const herd = item('herd')
  const pigs = item('pigs')
  return {
    fields: {
      totalHa: roundHa(total),
      count: s.fields.length,
      crops: [...byCrop].map(([crop, ha]) => ({ crop, ha })).sort((x, y) => y.ha - x.ha),
      source: sourceOf(fieldItems),
      confirmed: fieldItems.filter((i) => i?.status === 'complete').length,
    },
    cattle: s.herd ? { count: herd?.conflict?.his ?? s.herd.registryCount, registry: s.herd.registryCount, source: sourceOf([herd]) } : null,
    pigs:
      s.pigs && s.pigs.registryCount > 0
        ? { count: s.pigs.registryCount, household: a.pigs.answer === null ? null : a.pigs.answer === 'yes', source: sourceOf([pigs]) }
        : null,
    measures: { chosen: a.measures.chosen.length, fitting: fitting(s).length, source: a.measures.confirmed ? 'confirmed' : 'records' },
  }
}
