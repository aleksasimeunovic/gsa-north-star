import { describe, expect, it } from 'vitest'
import { estimateState } from './estimate'
import { halfSplit, lastYear, ready, run } from './testUtils'

const split = halfSplit()

describe('estimate state', () => {
  it('has no basis before he chooses a measure, so no number (never about 0 dinars)', () => {
    expect(estimateState(run('second_year').estimate)).toBe('none')
    expect(estimateState(run('second_year', { type: 'choose_measures', chosen: ['fertiliser'] }).estimate)).toBe('none')
  })
  it('is provisional while something that could change it is unanswered, then current', () => {
    expect(estimateState(run('second_year', lastYear).estimate)).toBe('provisional')
    expect(estimateState(run('second_year', ...ready).estimate)).toBe('current')
  })
})

describe('estimate', () => {
  it('starts at 9.00 × 18,000 + 14 × 20,000 = 442,000', () => {
    const e = run('second_year', lastYear).estimate
    expect(e.totalDinars).toBe(442_000)
    expect(e.assumptions).toEqual({ eligibleAreaHa: 9, cowsCalved: 14, rates: { perHa: 18_000, perCow: 20_000 } })
  })

  it('the road takes 0.12 ha: 439,840, about 440,000, about 2,200 less', () => {
    const e = run('second_year', lastYear, { type: 'answer_road', answer: 'yes' }).estimate
    expect(e.totalDinars).toBe(439_840)
    expect(e.aboutDinars).toBe(440_000)
    expect(e.assumptions.eligibleAreaHa).toBe(8.88)
    expect(e.changes).toEqual([{ reason: 'road_took_area', areaHa: 0.12, amountDinars: -2_160, aboutDinars: -2_200 }])
  })

  it('splitting the river field does not change the estimate', () => {
    const before = run('second_year', lastYear, { type: 'answer_road', answer: 'yes' }).estimate.totalDinars
    const after = run('second_year', lastYear, { type: 'answer_road', answer: 'yes' }, { type: 'answer_river', answer: 'yes' }, split).estimate.totalDinars
    expect(after).toBe(before)
  })

  it("the neighbour's line takes 0.10 ha more: 8.78 ha, 438,040", () => {
    const e = run('second_year', lastYear, { type: 'answer_road', answer: 'yes' }, { type: 'answer_upper', answer: 'yes' }).estimate
    expect(e.assumptions.eligibleAreaHa).toBe(8.78)
    expect(e.totalDinars).toBe(438_040)
  })

  it('only chosen measures count; ones without a known rate are named, not guessed', () => {
    const e = run('second_year', lastYear, { type: 'choose_measures', chosen: ['cows_raising_calves', 'insurance'] }).estimate
    expect(e.totalDinars).toBe(280_000)
    expect(e.unpriced).toEqual(['insurance'])
  })

  it('herd disagreement does not change the cow measure (14 cows calved)', () => {
    const e = run('second_year', lastYear, { type: 'answer_herd', answer: 'no' }, { type: 'set_herd_count', count: 41 }).estimate
    expect(e.totalDinars).toBe(442_000)
  })

  it('is provisional while the road, the upper field or the measures are unanswered, and says which', () => {
    expect(run('second_year').estimate.pending).toEqual(['field_road', 'field_upper', 'field_meadow', 'measures'])
    const e = run('second_year', lastYear, { type: 'answer_road', answer: 'yes' }, { type: 'answer_upper', answer: 'yes' }, { type: 'answer_meadow', answer: 'yes' }, { type: 'choose_measures', chosen: ['plant_production'] }).estimate
    expect(e.pending).toEqual([])
  })

  it('missing receipts keep it provisional too', () => {
    expect(run('missing_document', lastYear).estimate.pending).toContain('receipts')
  })

  it('leaving the meadow out takes 1.50 ha: 7.50 ha × 18,000 + 280,000 = 415,000', () => {
    expect(run('second_year', lastYear, { type: 'answer_meadow', answer: 'no' }).estimate.totalDinars).toBe(415_000)
  })
})
