import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import { detectChanges } from './changes'

describe('changes', () => {
  it('finds five things that may have changed in the second year', () => {
    expect(detectChanges(SCENARIOS.second_year)).toEqual(['herd', 'pigs', 'river', 'road', 'upper'])
  })
  it('no animals: the three field changes', () =>
    expect(detectChanges({ ...SCENARIOS.second_year, herd: null, pigs: null })).toEqual(['river', 'road', 'upper']))
})
