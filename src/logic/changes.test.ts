import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import { detectChanges } from './changes'

describe('changes', () => {
  it('finds four things on the farm and land that may have changed in the second year', () => {
    expect(detectChanges(SCENARIOS.second_year)).toEqual(['herd', 'pigs', 'river', 'road'])
  })
  it('no animals: the two field changes', () =>
    expect(detectChanges({ ...SCENARIOS.second_year, herd: null, pigs: null })).toEqual(['river', 'road']))
})
