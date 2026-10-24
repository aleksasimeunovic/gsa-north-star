import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import { measureGaps, orderMeasures } from './status'
import { halfSplit, play, run } from './testUtils'

const item = (r: ReturnType<typeof run>, id: string) => r.items.find((i) => i.id === id)!
const split = halfSplit()

describe('status per item', () => {
  it('starts with every part needing action, in step order; nothing is complete before he sees it', () => {
    const r = run('second_year')
    expect(r.items.map((i) => [i.id, i.status])).toEqual([
      ['bank', 'action_required'],
      ['household', 'action_required'],
      ['details', 'action_required'],
      ['herd', 'action_required'],
      ['pigs', 'action_required'],
      ['calvings', 'action_required'],
      ['field_river', 'action_required'],
      ['field_road', 'action_required'],
      ['field_upper', 'action_required'],
      ['field_meadow', 'action_required'],
      ['fields_other', 'action_required'],
      ['suggest_green_cover', 'action_required'],
      ['suggest_insemination', 'action_required'],
      ['measures', 'action_required'],
      ['receipt_unreadable', 'action_required'],
      ['receipts', 'action_required'],
    ])
  })

  it('bank: yes pays into the new account; no asks for his account, then it is done', () => {
    expect(item(run('second_year', { type: 'answer_bank', answer: 'yes' }), 'bank')).toEqual({ id: 'bank', status: 'complete', detail: 'bank_new' })
    expect(item(run('second_year', { type: 'answer_bank', answer: 'no' }), 'bank').detail).toBe('bank_needs_account')
    expect(item(run('second_year', { type: 'answer_bank', answer: 'no' }, { type: 'set_bank_account', account: '160000000012345678' }), 'bank').status).toBe('complete')
  })

  it('household: one question, either answer completes it', () => {
    expect(item(run('second_year', { type: 'answer_household', answer: 'yes' }), 'household').detail).toBe('household_added')
    expect(item(run('second_year', { type: 'answer_household', answer: 'no' }), 'household').status).toBe('complete')
  })

  it('cows that calved: confirmed, or checked by the registry without blocking', () => {
    expect(item(run('second_year', { type: 'confirm', what: 'calvings' }), 'calvings').status).toBe('complete')
    expect(item(run('second_year', { type: 'ask_record_check', itemId: 'calvings' }), 'calvings').status).toBe('awaiting_verification')
  })

  it('meadow: yes keeps it; no leaves it out, complete but 1.50 ha less', () => {
    expect(item(run('second_year', { type: 'answer_meadow', answer: 'yes' }), 'field_meadow').detail).toBe('meadow_kept')
    const out = item(run('second_year', { type: 'answer_meadow', answer: 'no' }), 'field_meadow')
    expect(out.status).toBe('complete')
    expect(out.paymentImpact).toEqual({ amountDinars: -27_000, areaHa: 1.5, reason: 'meadow_out' })
  })

  it('a suggested measure: yes puts it among his measures, no leaves it out', () => {
    const yes = run('second_year', { type: 'answer_suggestion', measureId: 'green_cover', answer: 'yes' })
    expect(item(yes, 'suggest_green_cover').detail).toBe('suggestion_added')
    const added = play('second_year', { type: 'answer_suggestion', measureId: 'green_cover', answer: 'yes' }).answers.measures
    expect(added.chosen).toContain('green_cover')
    // The fields the satellite saw are filled in for him; only his promise is left.
    expect(added.inputs['green_cover.cover_fields']).toEqual(['river', 'upper'])
    const r = run('second_year', { type: 'answer_suggestion', measureId: 'green_cover', answer: 'yes' }, { type: 'choose_measures', chosen: ['plant_production', 'green_cover'] })
    expect(item(r, 'measure_green_cover').missing).toEqual(['cover_promise'])
    const no = play('second_year', { type: 'answer_suggestion', measureId: 'green_cover', answer: 'yes' }, { type: 'answer_suggestion', measureId: 'green_cover', answer: 'no' })
    expect(no.answers.measures.chosen).not.toContain('green_cover')
  })

  it('an unreadable receipt needs a new photo; sending it does not confirm the other receipts', () => {
    const r = run('second_year', { type: 'attach_document', documentId: 'unreadable_receipt' })
    expect(item(r, 'receipt_unreadable').status).toBe('complete')
    expect(item(r, 'receipts').status).toBe('action_required')
  })

  it('confirming an unchanged thing completes it', () => {
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

  it('river no: his declaration stands, complete, and the estimate does not change', () => {
    const r = run('second_year', { type: 'answer_river', answer: 'no' })
    expect(item(r, 'field_river')).toEqual({ id: 'field_river', status: 'complete', detail: 'river_one_crop' })
    expect(r.estimate.totalDinars).toBe(run('second_year').estimate.totalDinars)
  })

  it('road yes is complete but still lowers the payment', () => {
    const road = item(run('second_year', { type: 'answer_road', answer: 'yes' }), 'field_road')
    expect(road.status).toBe('complete')
    expect(road.paymentImpact).toEqual({ amountDinars: -2_160, areaHa: 0.12, reason: 'road_took_area' })
  })

  it('road no sends the correction: awaiting verification, the land map area counts until checked', () => {
    const r = item(run('second_year', { type: 'answer_road', answer: 'no' }), 'field_road')
    expect(r.status).toBe('awaiting_verification')
    expect(r.conflict).toEqual({ record: 1.68, his: 1.8, owner: 'land_map' })
    expect(r.paymentImpact?.reason).toBe('road_pending_correction')
  })

  it('missing receipts need action until uploaded; uploading confirms them', () => {
    expect(item(run('missing_document'), 'receipts').detail).toBe('receipts_missing')
    expect(item(run('missing_document', { type: 'attach_document', documentId: 'input_receipts' }), 'receipts').status).toBe('complete')
  })

  it('orders fitting measures first and keeps the full list: 10 fit, 2 do not', () => {
    const ordered = orderMeasures([...SCENARIOS.second_year.measures].reverse())
    expect(ordered.filter((m) => m.fits)).toHaveLength(10)
    expect(ordered.slice(-2).map((m) => m.fits)).toEqual([false, false])
  })

  it('pigs: household only or declared, both complete', () => {
    expect(item(run('second_year', { type: 'answer_pigs', answer: 'yes' }), 'pigs').detail).toBe('pigs_household')
    expect(item(run('second_year', { type: 'answer_pigs', answer: 'no' }), 'pigs').detail).toBe('pigs_declared')
  })

  it("upper yes: complete, the neighbour's strip lowers the payment", () => {
    const u = item(run('second_year', { type: 'answer_upper', answer: 'yes' }), 'field_upper')
    expect(u.status).toBe('complete')
    expect(u.paymentImpact).toEqual({ amountDinars: -1_800, areaHa: 0.1, reason: 'overlap_removed' })
  })

  it('upper no: needs his drawing; a line clear of the neighbour completes it, one still over it waits for a check', () => {
    expect(item(run('second_year', { type: 'answer_upper', answer: 'no' }), 'field_upper').detail).toBe('upper_needs_drawing')
    const rect = (h: number) => [{ x: 0, y: 140 }, { x: 200, y: 140 }, { x: 200, y: 140 + h }, { x: 0, y: 140 + h }]
    const clear = item(run('second_year', { type: 'answer_upper', answer: 'no' }, { type: 'set_upper_drawing', polygon: rect(95) }), 'field_upper')
    expect(clear).toMatchObject({ status: 'complete', detail: 'upper_drawn', paymentImpact: { areaHa: 0.1, reason: 'redrawn' } })
    const over = item(run('second_year', { type: 'answer_upper', answer: 'no' }, { type: 'set_upper_drawing', polygon: rect(100) }), 'field_upper')
    expect(over).toMatchObject({ status: 'awaiting_verification', detail: 'upper_drawn_overlaps', paymentImpact: { areaHa: 0.1, reason: 'overlap_pending' } })
  })

  it('a measure lists what he still has to add, including what an earlier answer makes needed', () => {
    const diesel = SCENARIOS.second_year.measures.find((m) => m.id === 'diesel')!
    expect(measureGaps(diesel, {}).missing).toEqual(['who_works'])
    expect(measureGaps(diesel, { 'diesel.who_works': 'own' }).missing).toEqual([])
    expect(measureGaps(diesel, { 'diesel.who_works': 'contractor' }).missing).toEqual(['contract'])
  })

  it('an answer that rules a measure out is said at once', () => {
    const r = run('second_year', { type: 'choose_measures', chosen: ['breeding_cattle'] }, { type: 'save_measure', measureId: 'breeding_cattle', inputs: { 'breeding_cattle.herd_book': 'no' } })
    expect(item(r, 'measure_breeding_cattle')).toMatchObject({ status: 'action_required', detail: 'measure_ruled_out' })
  })

  it('Jelena asking him something makes the herd his action again', () => {
    const r = run(
      'second_year',
      { type: 'answer_herd', answer: 'no' },
      { type: 'set_herd_count', count: 41 },
      { type: 'send_to_jelena', itemId: 'herd', note: '' },
      { type: 'advisor_act', caseId: 'milan_herd', act: 'asked_farmer' },
    )
    expect(item(r, 'herd')).toMatchObject({ status: 'action_required', detail: 'herd_jelena_asks' })
  })
})
