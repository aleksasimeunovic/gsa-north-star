import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import { detectChanges } from './changes'

describe('changes', () => {
  it('finds three things that may have changed in the second year', () => {
    expect(detectChanges(SCENARIOS.second_year)).toEqual(['herd', 'river', 'road'])
  })
  it('no animals: two', () => expect(detectChanges({ ...SCENARIOS.second_year, herd: null })).toEqual(['river', 'road']))
})
