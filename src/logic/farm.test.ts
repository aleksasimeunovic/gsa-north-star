import { describe, expect, it } from 'vitest'
import { halfSplit, run } from './testUtils'

describe('farm picture', () => {
  it("starts from last year: 9.00 ha in 5 fields, 38 cattle, 3 pigs, 2 of 10 measures", () => {
    const f = run('second_year').farm
    expect(f).toMatchObject({ totalHa: 9, fieldCount: 5, cattle: { count: 38, checking: false }, pigs: { count: 3, household: null }, measures: { chosen: 2, fitting: 10 } })
    expect(f.crops).toEqual([
      { crop: 'wheat', ha: 4.4 },
      { crop: 'maize', ha: 3.1 },
      { crop: 'grassland', ha: 1.5 },
    ])
  })

  it('every answer changes it: the road, the split, his own cattle count', () => {
    const f = run('second_year', { type: 'answer_road', answer: 'yes' }, { type: 'answer_river', answer: 'yes' }, halfSplit(['wheat', 'sunflower']), { type: 'answer_herd', answer: 'no' }, { type: 'set_herd_count', count: 41 }).farm
    expect(f.totalHa).toBe(8.88)
    expect(f.crops).toContainEqual({ crop: 'sunflower', ha: 1.2 })
    expect(f.crops).toContainEqual({ crop: 'maize', ha: 2.98 })
    expect(f.cattle).toEqual({ count: 41, registry: 38, checking: true })
  })
})
