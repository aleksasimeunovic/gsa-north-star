import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import { orderMeasures } from './status'
import { halfSplit, run } from './testUtils'

const item = (r: ReturnType<typeof run>, id: string) => r.items.find((i) => i.id === id)!
const split = halfSplit()

describe('status per item', () => {
  it('starts with three changes needing action, everything else complete', () => {
    const r = run('second_year')
    expect(r.items.filter((i) => i.status === 'action_required').map((i) => i.id)).toEqual(['herd', 'field_river', 'field_road'])
    expect(item(r, 'field_upper').status).toBe('complete')
    expect(item(r, 'general_data').status).toBe('complete')
  })

  it('herd yes is complete', () => {
    expect(item(run('second_year', { type: 'answer_herd', answer: 'yes' }), 'herd').status).toBe('complete')
  })

  it('herd no: asks for his count, then keeps both values awaiting verification', () => {
    expect(item(run('second_year', { type: 'answer_herd', answer: 'no' }), 'herd').detail).toBe('herd_needs_count')
    const h = item(run('second_year', { type: 'answer_herd', answer: 'no' }, { type: 'set_herd_count', count: 41 }), 'herd')
    expect(h.status).toBe('awaiting_verification')
    expect(h.conflict).toEqual({ record: 38, his: 41, owner: 'animal_registry' })
  })

  it('herd no with the registry number is simply complete', () => {
    const h = item(run('second_year', { type: 'answer_herd', answer: 'no' }, { type: 'set_herd_count', count: 38 }), 'herd')
    expect(h.status).toBe('complete')
  })

  it('river yes needs a split and two crops', () => {
    expect(item(run('second_year', { type: 'answer_river', answer: 'yes' }), 'field_river').status).toBe('action_required')
    const half = halfSplit(['sunflower', null])
    expect(item(run('second_year', { type: 'answer_river', answer: 'yes' }, half), 'field_river').status).toBe('action_required')
    expect(item(run('second_year', { type: 'answer_river', answer: 'yes' }, split), 'field_river').status).toBe('complete')
  })

  it('river no: redraw or field check (flagged part may not count)', () => {
    const no = { type: 'answer_river', answer: 'no' } as const
    expect(item(run('second_year', no), 'field_river').detail).toBe('river_needs_choice')
    expect(item(run('second_year', no, { type: 'river_no_option', option: 'redraw' }), 'field_river').status).toBe('action_required')
    expect(item(run('second_year', no, { type: 'river_no_option', option: 'redraw' }, { type: 'river_redrawn' }), 'field_river').status).toBe('complete')
    const check = item(run('second_year', no, { type: 'river_no_option', option: 'field_check' }), 'field_river')
    expect(check.status).toBe('awaiting_verification')
    expect(check.paymentImpact).toEqual({ amountDinars: -21_600, areaHa: 1.2, reason: 'field_check_pending' })
  })

  it('road yes is complete but still lowers the payment', () => {
    const road = item(run('second_year', { type: 'answer_road', answer: 'yes' }), 'field_road')
    expect(road.status).toBe('complete')
    expect(road.paymentImpact).toEqual({ amountDinars: -2_160, areaHa: 0.12, reason: 'road_took_area' })
  })

  it('road no: action until a correction is requested, then awaiting verification', () => {
    const no = { type: 'answer_road', answer: 'no' } as const
    expect(item(run('second_year', no), 'field_road').status).toBe('action_required')
    const r = item(run('second_year', no, { type: 'request_road_correction' }), 'field_road')
    expect(r.status).toBe('awaiting_verification')
    expect(r.conflict).toEqual({ record: 1.68, his: 1.8, owner: 'land_map' })
  })

  it('a missing document needs action until attached', () => {
    expect(item(run('missing_document'), 'documents').status).toBe('action_required')
    expect(item(run('missing_document', { type: 'attach_document', documentId: 'input_receipts' }), 'documents').status).toBe('complete')
  })

  it('no animals: no herd item', () => {
    expect(run('no_animals').items.some((i) => i.id === 'herd')).toBe(false)
  })

  it('first year: registry headcount is a question; fields and measures need doing', () => {
    const r = run('first_year')
    expect(item(r, 'herd').status).toBe('action_required')
    expect(item(r, 'field_river').detail).toBe('field_to_draw')
    expect(item(r, 'measures').status).toBe('action_required')
  })

  it('orders fitting measures first and keeps the full list', () => {
    const ordered = orderMeasures([...SCENARIOS.second_year.measures].reverse())
    expect(ordered.map((m) => m.fits)).toEqual([true, true, false])
    expect(ordered).toHaveLength(3)
  })
})
