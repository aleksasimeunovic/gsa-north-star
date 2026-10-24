import { describe, expect, it } from 'vitest'
import { halfSplit, run } from './testUtils'

describe('farm picture', () => {
  it("starts from the records: 9.00 ha in 5 fields, 38 cattle, 3 pigs, 2 of 10 measures, nothing confirmed yet", () => {
    const f = run('second_year').farm
    expect(f.fields).toMatchObject({ totalHa: 9, count: 5, source: 'records', confirmed: 0 })
    expect(f.fields.crops).toEqual([
      { crop: 'wheat', ha: 4.4 },
      { crop: 'maize', ha: 3.1 },
      { crop: 'grassland', ha: 1.5 },
    ])
    expect(f.cattle).toEqual({ count: 38, registry: 38, source: 'records' })
    expect(f.pigs).toEqual({ count: 3, household: null, source: 'records' })
    expect(f.measures).toEqual({ chosen: 2, fitting: 10, source: 'records' })
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
      { type: 'confirm_same', what: ['fields_other'] },
      { type: 'choose_measures', chosen: ['plant_production'] },
    ).farm
    expect(all.fields).toMatchObject({ source: 'confirmed', confirmed: 5 })
    expect(all.measures.source).toBe('confirmed')
  })

  it('a correction asked for on the road keeps the fields waiting for a check', () => {
    expect(run('second_year', { type: 'answer_road', answer: 'no' }).farm.fields.source).toBe('checking')
  })
})
