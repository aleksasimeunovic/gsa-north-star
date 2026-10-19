import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import { detectChanges } from './changes'
import { run } from './testUtils'

const waiting = (r: ReturnType<typeof run>) =>
  Object.fromEntries(r.assembly.filter((x) => x.waitingOn.length).map((x) => [x.tested, x.waitingOn]))

describe('changes', () => {
  it('finds three things that may have changed in the second year', () => {
    expect(detectChanges(SCENARIOS.second_year)).toEqual(['herd', 'river', 'road'])
  })
  it('no animals: two', () => expect(detectChanges(SCENARIOS.no_animals)).toEqual(['river', 'road']))
  it('first year: none', () => expect(detectChanges(SCENARIOS.first_year)).toEqual([]))
})

describe('live preview assembly', () => {
  it('starts with parcels and animal measures waiting on answers', () => {
    expect(waiting(run('second_year'))).toEqual({ parcels: ['river', 'road'], animal_measures: ['herd'] })
  })
  it('reassembles as he answers', () => {
    expect(waiting(run('second_year', { type: 'answer_herd', answer: 'yes' }, { type: 'answer_road', answer: 'yes' }))).toEqual({
      parcels: ['river'],
    })
  })
  it('nothing waits once every change is answered', () => {
    const r = run('second_year', { type: 'answer_herd', answer: 'no' }, { type: 'answer_river', answer: 'no' }, { type: 'answer_road', answer: 'no' })
    expect(waiting(r)).toEqual({})
  })
})
