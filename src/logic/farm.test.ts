import { describe, expect, it } from 'vitest'
import { SCENARIOS, type PartCrop } from '../data/scenarios'
import { carriedFields, fieldChoices, riverParts, splitEffects } from './farm'
import { halfSplit, lastYear, play, run } from './testUtils'

describe('farm picture', () => {
  it("starts from the records: 9.00 ha in 5 fields, 38 cattle, 3 pigs, 0 of 10 measures, nothing confirmed yet", () => {
    const f = run('second_year').farm
    expect(f.fields).toMatchObject({ totalHa: 9, count: 5, source: 'records', confirmed: 0 })
    expect(f.fields.crops).toEqual([
      { crop: 'wheat', ha: 4.4 },
      { crop: 'maize', ha: 3.1 },
      { crop: 'grassland', ha: 1.5 },
    ])
    expect(f.cattle).toEqual({ count: 38, registry: 38, source: 'records' })
    expect(f.pigs).toEqual({ count: 3, household: null, source: 'records' })
    expect(f.measures).toEqual({ chosen: 0, fitting: 10, source: 'records' })
  })

  it('every answer changes it: the road, the split, his own cattle count', () => {
    const f = run('second_year', { type: 'answer_road', answer: 'yes' }, { type: 'answer_river', answer: 'yes' }, halfSplit(['wheat', 'sunflower']), { type: 'answer_herd', answer: 'no' }, { type: 'set_herd_count', count: 41 }).farm
    expect(f.fields.totalHa).toBe(8.88)
    expect(f.fields.crops).toContainEqual({ crop: 'sunflower', ha: 1.2 })
    expect(f.fields.crops).toContainEqual({ crop: 'maize', ha: 2.98 })
    expect(f.cattle).toEqual({ count: 41, registry: 38, source: 'checking' })
  })

  it('says per line what he has confirmed: fields one by one, then all of them', () => {
    const some = run('second_year', { type: 'answer_road', answer: 'yes' }, { type: 'answer_herd', answer: 'yes' }, { type: 'answer_pigs', answer: 'yes' }).farm
    expect(some.fields).toMatchObject({ source: 'records', confirmed: 1 })
    expect(some.cattle?.source).toBe('confirmed')
    expect(some.pigs).toMatchObject({ household: true, source: 'confirmed' })

    const all = run(
      'second_year',
      { type: 'answer_road', answer: 'yes' },
      { type: 'answer_river', answer: 'no' },
      { type: 'answer_upper', answer: 'yes' },
      { type: 'answer_meadow', answer: 'yes' },
      { type: 'confirm', what: 'fields_other' },
      { type: 'choose_measures', chosen: ['plant_production'] },
    ).farm
    expect(all.fields).toMatchObject({ source: 'confirmed', confirmed: 5 })
    expect(all.measures.source).toBe('confirmed')
  })

  it('a correction asked for on the road keeps the fields waiting for a check', () => {
    expect(run('second_year', { type: 'answer_road', answer: 'no' }).farm.fields.source).toBe('checking')
  })
})

describe('a split carries through the application', () => {
  const s = SCENARIOS.second_year
  const river = { type: 'answer_river', answer: 'yes' } as const
  const edge = s.fields[0].signal?.kind === 'satellite_difference' ? s.fields[0].signal.edge : []
  const along = (crops: [PartCrop, PartCrop]) => ({ type: 'set_split', split: { line: edge, crops } }) as const

  it('the parts come top first, with their crops, whichever way the line runs', () => {
    const a = play('second_year', river, along(['wheat', 'sunflower'])).answers
    const parts = riverParts(s, a)!
    expect(parts.map((p) => [p.name, p.ha])).toHaveLength(2)
    expect(parts[0].name).toBe('top')
    expect(parts[0].ha + parts[1].ha).toBeCloseTo(2.4, 6)
    const back = play('second_year', river, { type: 'set_split', split: { line: [...edge].reverse(), crops: ['wheat', 'sunflower'] } }).answers
    expect(riverParts(s, back)![0].name).toBe('top')
  })

  it('no parts until the split is finished, or when he says one crop', () => {
    expect(riverParts(s, play('second_year', river).answers)).toBeNull()
    expect(riverParts(s, play('second_year', river, along(['wheat', 'sunflower']), { type: 'answer_river', answer: 'no' }).answers)).toBeNull()
  })

  it('farm picture: the crops follow the line, and the total stays', () => {
    const d = run('second_year', river, along(['sunflower', 'wheat']))
    const ha = (c: string) => d.farm.fields.crops.find((x) => x.crop === c)?.ha
    expect(d.farm.fields.totalHa).toBe(9)
    expect(ha('sunflower')).toBeGreaterThan(1)
    expect(ha('wheat')).toBeGreaterThan(3)
  })

  it('a part left unsown is land that stops counting, with the reason', () => {
    const sown = run('second_year', lastYear, river, along(['wheat', 'sunflower']))
    const empty = run('second_year', lastYear, river, along(['wheat', 'unsown']))
    const lost = riverParts(s, play('second_year', river, along(['wheat', 'unsown'])).answers)!.find((p) => p.crop === 'unsown')!
    expect(empty.items.find((i) => i.id === 'field_river')).toMatchObject({ status: 'complete', paymentImpact: { reason: 'river_unsown', areaHa: lost.ha } })
    expect(sown.estimate.totalDinars - empty.estimate.totalDinars).toBe(Math.round(lost.ha * 18_000))
    expect(empty.farm.fields.crops.some((c) => (c.crop as string) === 'unsown')).toBe(false)
  })

  it('moving the line moves the money, when a part is left unsown', () => {
    const lower = run('second_year', lastYear, river, { type: 'set_split', split: { line: [{ x: 0, y: 90 }, { x: 200, y: 90 }], crops: ['unsown', 'wheat'] } })
    const higher = run('second_year', lastYear, river, { type: 'set_split', split: { line: [{ x: 0, y: 30 }, { x: 200, y: 30 }], crops: ['unsown', 'wheat'] } })
    expect(lower.estimate.totalDinars).toBeGreaterThan(higher.estimate.totalDinars)
  })

  it('effects say what changes before he confirms, without declaring anything', () => {
    const a = play('second_year', lastYear, river).answers
    const same = splitEffects(s, a, { line: edge, crops: ['wheat', 'sunflower'] })!
    expect(same).toMatchObject({ totalHa: 2.4, lostHa: 0, lostDinars: 0, plantChosen: true, coverChosen: false })
    const unsown = splitEffects(s, a, { line: edge, crops: ['wheat', 'unsown'] })!
    expect(unsown.lostHa).toBeGreaterThan(1)
    expect(unsown.lostDinars).toBe(Math.round(unsown.lostHa * 18_000))
    expect(a.river.split).toBeNull()
  })

  it('a measure on the river field covers both parts after a split, and the field again if he takes it back', () => {
    const split = play('second_year', river, along(['wheat', 'sunflower'])).answers
    const undone = play('second_year', river, along(['wheat', 'sunflower']), { type: 'answer_river', answer: 'no' }).answers
    expect(fieldChoices(s, split).map((f) => f.id)).toEqual(['river:top', 'river:bottom', 'road', 'upper', 'house'])
    expect(carriedFields(['river', 'upper'], s, split)).toEqual(['river:top', 'river:bottom', 'upper'])
    expect(carriedFields(['river:bottom', 'upper'], s, split)).toEqual(['river:bottom', 'upper'])
    expect(carriedFields(['river:bottom', 'upper'], s, undone)).toEqual(['river', 'upper'])
    expect(carriedFields(['upper'], s, split)).toEqual(['upper'])
  })
})
