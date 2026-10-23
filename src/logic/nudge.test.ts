import { describe, expect, it } from 'vitest'
import { ready, run } from './testUtils'

describe('next-step line', () => {
  it('points at the next task and what it needs', () => {
    expect(run('second_year').nudge).toMatchObject({ to: 'herd', detail: 'herd_unanswered', left: 7 })
    expect(run('second_year', { type: 'answer_herd', answer: 'no' }).nudge).toMatchObject({ to: 'herd', detail: 'herd_needs_count' })
  })

  it('names what a measure still needs', () => {
    const r = run('second_year', ...ready, { type: 'choose_measures', chosen: ['irrigation'] })
    expect(r.nudge).toMatchObject({ to: 'measure_irrigation', detail: 'measure_needs_input', missing: ['water_permit', 'how_water'] })
  })

  it('says submit once nothing is left, and nothing once submitted', () => {
    expect(run('second_year', ...ready).nudge.detail).toBe('submit')
    expect(run('second_year', ...ready, { type: 'sign_declarations', signed: true }, { type: 'submit' }).nudge.detail).toBe('submitted')
  })
})
