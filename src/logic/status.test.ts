import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import { orderMeasures } from './status'
import { halfSplit, run } from './testUtils'

const item = (r: ReturnType<typeof run>, id: string) => r.items.find((i) => i.id === id)!
const split = halfSplit()

describe('status per item', () => {
  it('starts with the three changes and the named confirmations needing action; nothing is complete before he sees it', () => {
    const r = run('second_year')
    expect(r.items.map((i) => [i.id, i.status])).toEqual([
      ['herd', 'action_required'],
      ['field_river', 'action_required'],
      ['field_road', 'action_required'],
      ['fields_other', 'action_required'],
      ['details', 'action_required'],
      ['measures', 'action_required'],
      ['receipts', 'action_required'],
    ])
  })

  it('confirming an unchanged thing completes it', () => {
    expect(item(run('second_year', { type: 'confirm', what: 'measures' }), 'measures').status).toBe('complete')
    expect(item(run('second_year', { type: 'confirm', what: 'fields_other' }), 'fields_other').detail).toBe('fields_confirmed')
  })

  it('a correction to his details waits for the record owner and does not block', () => {
    expect(item(run('second_year', { type: 'ask_record_check', itemId: 'details' }), 'details').status).toBe('awaiting_verification')
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

  it('a split with the same crop twice is not two crops', () => {
    expect(item(run('second_year', { type: 'answer_river', answer: 'yes' }, halfSplit(['wheat', 'wheat'])), 'field_river').status).toBe('action_required')
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

  it('missing receipts need action until uploaded; uploading confirms them', () => {
    expect(item(run('missing_document'), 'receipts').detail).toBe('receipts_missing')
    expect(item(run('missing_document', { type: 'attach_document', documentId: 'input_receipts' }), 'receipts').status).toBe('complete')
  })

  it('orders fitting measures first and keeps the full list', () => {
    const ordered = orderMeasures([...SCENARIOS.second_year.measures].reverse())
    expect(ordered.map((m) => m.fits)).toEqual([true, true, false])
    expect(ordered).toHaveLength(3)
  })
})
