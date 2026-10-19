import { describe, expect, it } from 'vitest'
import type { Action } from '../state/actions'
import { TESTED_STEPS } from './wizard'
import { halfSplit, run } from './testUtils'

const steps = (r: ReturnType<typeof run>) => r.wizard.steps.map((s) => `${s.id}:${s.mode}`)
const split = halfSplit()

describe('wizard generator', () => {
  it('second year: 8 tested steps become 4', () => {
    const r = run('second_year')
    expect(r.wizard.steps.map((s) => s.id)).toEqual(['herd', 'land', 'everything_else', 'submit'])
    expect(r.wizard.progress.total).toBe(4)
    expect(TESTED_STEPS).toHaveLength(8)
  })

  it('open changes open their step on the change', () => {
    const r = run('second_year')
    expect(steps(r)).toEqual(['herd:open_on_change', 'land:open_on_change', 'everything_else:confirm', 'submit:full'])
    expect(r.wizard.steps[1].focusItemId).toBe('field_river')
  })

  it('herd yes shrinks the herd step to one confirmation', () => {
    expect(steps(run('second_year', { type: 'answer_herd', answer: 'yes' }))[0]).toBe('herd:confirm')
  })

  it('river yes keeps land open on the river field; road is still there', () => {
    const land = run('second_year', { type: 'answer_river', answer: 'yes' }).wizard.steps[1]
    expect(land.mode).toBe('open_on_change')
    expect(land.focusItemId).toBe('field_river')
    expect(land.itemIds).toHaveLength(5)
  })

  it('after the river is split, land opens on the road', () => {
    const land = run('second_year', { type: 'answer_river', answer: 'yes' }, split).wizard.steps[1]
    expect(land.focusItemId).toBe('field_road')
  })

  it('re-runs when an answer changes', () => {
    const yes = run('second_year', { type: 'answer_herd', answer: 'yes' })
    const changed = run('second_year', { type: 'answer_herd', answer: 'yes' }, { type: 'answer_herd', answer: 'no' })
    expect(yes.wizard.steps[0].mode).toBe('confirm')
    expect(changed.wizard.steps[0].mode).toBe('open_on_change')
  })

  it('no animals: no herd step, progress counts 3', () => {
    const r = run('no_animals')
    expect(r.wizard.steps.map((s) => s.id)).toEqual(['land', 'everything_else', 'submit'])
    expect(r.wizard.progress.total).toBe(3)
  })

  it('missing document opens everything else on documents', () => {
    const ee = run('missing_document').wizard.steps.find((s) => s.id === 'everything_else')!
    expect(ee.mode).toBe('open_on_change')
    expect(ee.focusItemId).toBe('documents')
  })

  it('first year: steps asked in full', () => {
    expect(steps(run('first_year'))).toEqual(['herd:full', 'land:full', 'everything_else:full', 'submit:full'])
  })

  it('progress counts confirmed steps only', () => {
    const actions: Action[] = [{ type: 'answer_herd', answer: 'yes' }, { type: 'confirm_step', stepId: 'herd' }]
    expect(run('second_year', ...actions).wizard.progress).toEqual({ total: 4, done: 1 })
  })

  it('advisor: same steps, compact, action required first', () => {
    const r = run('second_year', { type: 'set_role', role: 'advisor' }, { type: 'answer_herd', answer: 'yes' })
    expect(r.wizard.density).toBe('compact')
    expect(r.wizard.steps.map((s) => s.id)).toEqual(['land', 'herd', 'everything_else', 'submit'])
  })

  it('compare view maps every tested step', () => {
    const fates = Object.fromEntries(run('second_year', { type: 'answer_herd', answer: 'yes' }).compare.map((c) => [c.tested, [c.becomes, c.fate]]))
    expect(fates).toEqual({
      general_data: ['everything_else', 'folded_read_only'],
      measures: ['everything_else', 'kept_fitting_first'],
      parcels: ['land', 'opens_on_change'],
      animal_measures: ['herd', 'one_confirmation'],
      attachments: ['everything_else', 'asked_only_if_missing'],
      declarations: ['submit', 'signed_once'],
      conditionality: [null, 'left_out'],
      summary: [null, 'replaced_by_readiness'],
    })
  })

  it('compare view: no animals hides animal measures', () => {
    const row = run('no_animals').compare.find((c) => c.tested === 'animal_measures')!
    expect(row).toEqual({ tested: 'animal_measures', becomes: null, fate: 'hidden_no_animals' })
  })
})
