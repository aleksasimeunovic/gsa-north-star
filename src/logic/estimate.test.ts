import { describe, expect, it } from 'vitest'
import { halfSplit, run } from './testUtils'

const split = halfSplit()

describe('estimate', () => {
  it('starts at 9.00 × 18,000 + 14 × 20,000 = 442,000', () => {
    const e = run('second_year').estimate
    expect(e.totalDinars).toBe(442_000)
    expect(e.assumptions).toEqual({ eligibleAreaHa: 9, cowsCalved: 14, rates: { perHa: 18_000, perCow: 20_000 } })
  })

  it('the road takes 0.12 ha: 439,840, about 440,000, about 2,200 less', () => {
    const e = run('second_year', { type: 'answer_road', answer: 'yes' }).estimate
    expect(e.totalDinars).toBe(439_840)
    expect(e.aboutDinars).toBe(440_000)
    expect(e.assumptions.eligibleAreaHa).toBe(8.88)
    expect(e.changes).toEqual([{ reason: 'road_took_area', areaHa: 0.12, amountDinars: -2_160, aboutDinars: -2_200 }])
  })

  it('splitting the river field does not change the estimate', () => {
    const before = run('second_year', { type: 'answer_road', answer: 'yes' }).estimate.totalDinars
    const after = run('second_year', { type: 'answer_road', answer: 'yes' }, { type: 'answer_river', answer: 'yes' }, split).estimate.totalDinars
    expect(after).toBe(before)
  })

  it('herd disagreement does not change the cow measure (14 cows calved)', () => {
    const e = run('second_year', { type: 'answer_herd', answer: 'no' }, { type: 'set_herd_count', count: 41 }).estimate
    expect(e.totalDinars).toBe(442_000)
  })
})
