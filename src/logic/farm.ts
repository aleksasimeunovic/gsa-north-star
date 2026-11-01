import type { Crop, Field, PartCrop, Polygon, Scenario } from '../data/scenarios'
import type { Answers } from '../state/actions'
import { partNames, roundHa, splitField, type PartName, type SplitLine } from './geometry'
import { fitting, riverSplitComplete, type Item, type ItemId } from './status'

/**
 * Where a line of his farm stands: not confirmed by him yet, confirmed by him, or his answer
 * and a record both kept until the record's owner checks.
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

export interface RiverPart {
  id: string
  name: PartName
  ha: number
  crop: PartCrop
  polygon: Polygon
}

/** The two parts of the river field once he has split it, top first, as on the map. Null until then. */
export function riverParts(s: Scenario, a: Answers): RiverPart[] | null {
  const field = s.fields.find((f) => f.id === 'river')
  const split = a.river.split
  if (!field || !split || a.river.answer !== 'yes' || !riverSplitComplete(s, a)) return null
  return partsOf(field, split.line, split.crops as [PartCrop, PartCrop])
}

function partsOf({ polygon, areaHa }: Field, line: SplitLine, crops: [PartCrop, PartCrop]): RiverPart[] | null {
  const r = splitField(polygon, line, areaHa)
  if (!r) return null
  const names = partNames(r.parts)
  const parts = ([0, 1] as const).map((i) => ({ id: `river:${names[i]}`, name: names[i], ha: r.areasHa[i], crop: crops[i], polygon: r.parts[i] }))
  return names[0] === 'top' || names[0] === 'left' ? parts : parts.reverse()
}

/**
 * The fields a measure can be applied for on. Once he splits the river field its two parts stand in for it;
 * a choice he made before the split carries over to both, and comes back together if he undoes it.
 */
export function fieldChoices(s: Scenario, a: Answers): { id: string; ha: number; part?: PartName }[] {
  const parts = riverParts(s, a)
  return s.fields
    .filter((f) => f.arable)
    .flatMap((f) => (f.id === 'river' && parts ? parts.map((p) => ({ id: p.id, ha: p.ha, part: p.name })) : [{ id: f.id as string, ha: f.areaHa }]))
}

export function carriedFields(chosen: string[], s: Scenario, a: Answers): string[] {
  const parts = riverParts(s, a)?.map((p) => p.id)
  const wasRiver = chosen.some((id) => id === 'river' || id.startsWith('river:'))
  const rest = chosen.filter((id) => id !== 'river' && !id.startsWith('river:'))
  if (!wasRiver) return rest
  if (!parts) return ['river', ...rest]
  const kept = chosen.filter((id) => parts.includes(id))
  return [...(kept.length ? kept : parts), ...rest]
}

/** What a split does to the rest of his application, said before he confirms it. Worked out, never stored. */
export interface SplitEffects {
  parts: RiverPart[]
  totalHa: number
  /** Land that stops counting for plant production, and what that takes off the payment. */
  lostHa: number
  lostDinars: number
  /** The measures it touches, so he hears about the ones he has chosen. */
  plantChosen: boolean
  coverChosen: boolean
}

export function splitEffects(s: Scenario, a: Answers, split: NonNullable<Answers['river']['split']>): SplitEffects | null {
  const field = s.fields.find((f) => f.id === 'river')!
  const parts = partsOf(field, split.line, split.crops as [PartCrop, PartCrop])
  if (!parts) return null
  const lostHa = parts.find((p) => p.crop === 'unsown')?.ha ?? 0
  const rate = s.measures.find((m) => m.id === 'plant_production')?.rateDinars ?? 0
  return {
    parts,
    totalHa: field.areaHa,
    lostHa,
    lostDinars: Math.round(lostHa * rate),
    plantChosen: a.measures.chosen.includes('plant_production'),
    coverChosen: a.measures.chosen.includes('green_cover'),
  }
}

/**
 * The working picture of his farm as GSA knows it right now, updated by every answer, with where each
 * line stands. Areas are what counts for payment: a field loses what its payment impact takes.
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
    const parts = f.id === 'river' ? riverParts(s, a) : null
    if (parts) parts.forEach((p) => p.crop !== 'unsown' && add(p.crop, p.ha))
    else add(f.cropLastYear, ha)
  }

  // Fields he added this year, the parcel he bought among them.
  for (const f of a.newFields) {
    const ha = roundHa(f.areaHa)
    total += ha
    add(f.crop, ha)
  }

  // A field with a change is confirmed by its own question; the unchanged ones are reused without asking.
  const fieldItems = s.fields.filter((f) => f.signal).map((f) => item(`field_${f.id}` as ItemId))
  const herd = item('herd')
  const pigs = item('pigs')
  return {
    fields: {
      totalHa: roundHa(total),
      count: s.fields.length + a.newFields.length,
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
