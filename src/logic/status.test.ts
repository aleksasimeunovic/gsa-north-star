import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import { goalGain, measureGaps, orderMeasures } from './status'
import { derive } from './derive'
import { halfSplit, play, run } from './testUtils'

const item = (r: ReturnType<typeof run>, id: string) => r.items.find((i) => i.id === id)!
const split = halfSplit()
const rect = (h: number) => [{ x: 0, y: 140 }, { x: 200, y: 140 }, { x: 200, y: 140 + h }, { x: 0, y: 140 + h }]

describe('status per item', () => {
  it('starts with every part needing action, in step order; nothing is complete before he sees it', () => {
    const r = run('second_year')
    expect(r.items.map((i) => [i.id, i.status])).toEqual([
      ['bank', 'action_required'],
      ['herd', 'action_required'],
      ['pigs', 'action_required'],
      ['field_river', 'action_required'],
      ['field_road', 'action_required'],
      ['field_upper', 'action_required'],
      ['field_meadow', 'action_required'],
      ['field_bought', 'action_required'],
      ['fields_other', 'action_required'],
      ['measures', 'action_required'],
      ['receipts', 'action_required'],
    ])
  })

  it('bank: yes pays into the new account; no asks for his account, then it is done', () => {
    expect(item(run('second_year', { type: 'answer_bank', answer: 'yes' }), 'bank')).toEqual({ id: 'bank', status: 'complete', detail: 'bank_new' })
    expect(item(run('second_year', { type: 'answer_bank', answer: 'no' }), 'bank').detail).toBe('bank_needs_account')
    expect(item(run('second_year', { type: 'answer_bank', answer: 'no' }, { type: 'set_bank_account', account: '160000000012345678' }), 'bank').status).toBe('complete')
  })

  it('cows that calved: confirmed, or checked by the registry without blocking', () => {
    expect(run('second_year').items.some((i) => i.id === 'calvings')).toBe(false)
    expect(item(run('second_year', { type: 'ask_record_check', itemId: 'calvings' }), 'calvings').status).toBe('awaiting_verification')
  })

  it('meadow: yes keeps it; no leaves it out, complete but 1.50 ha less', () => {
    expect(item(run('second_year', { type: 'answer_meadow', answer: 'yes' }), 'field_meadow').detail).toBe('meadow_kept')
    const out = item(run('second_year', { type: 'answer_meadow', answer: 'no' }), 'field_meadow')
    expect(out.status).toBe('complete')
    expect(out.paymentImpact).toEqual({ amountDinars: -27_000, areaHa: 1.5, reason: 'meadow_out' })
  })

  it('choosing a measure GSA suggested fills in nothing for him: only Milan declares', () => {
    const chosen = play('second_year', { type: 'choose_measures', chosen: ['plant_production', 'green_cover'] }).answers.measures
    expect(chosen.inputs['green_cover.cover_fields']).toBeUndefined()
    const r = run('second_year', { type: 'choose_measures', chosen: ['plant_production', 'green_cover'] })
    expect(measureGaps(SCENARIOS.second_year.measures.find((m) => m.id === 'green_cover')!, chosen.inputs).missing).toEqual(['cover_fields', 'cover_promise'])
    expect(item(r, 'measures')).toMatchObject({ status: 'action_required', detail: 'measures_incomplete', missing: ['green_cover'] })
  })

  it('what he lacks is worked out on his own numbers, for every measure that does not fit yet', () => {
    const goals = SCENARIOS.second_year.measures.filter((m) => !m.fits)
    expect(goals.map((m) => goalGain(m.goal!))).toEqual([120_000, 128_000, 50_000])
  })

  it('an unreadable receipt needs a new photo; sending it does not confirm the receipts for him', () => {
    expect(item(run('second_year', { type: 'confirm', what: 'receipts' }), 'receipts').detail).toBe('receipts_unreadable')
    const r = run('second_year', { type: 'attach_document', documentId: 'unreadable_receipt' })
    expect(item(r, 'receipts')).toMatchObject({ status: 'action_required', detail: 'receipts_to_confirm' })
  })

  it('confirming an unchanged thing completes it', () => {
    expect(item(run('second_year', { type: 'confirm', what: 'fields_other' }), 'fields_other').detail).toBe('fields_confirmed')
  })

  it('a correction to his details waits for the record owner and does not block', () => {
    expect(item(run('second_year', { type: 'ask_record_check', itemId: 'details', what: 'holder' }), 'details').status).toBe('awaiting_verification')
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

  it('orders fitting measures first and keeps the full list: 10 fit, 2 do not', () => {
    const ordered = orderMeasures([...SCENARIOS.second_year.measures].reverse())
    expect(ordered.filter((m) => m.fits)).toHaveLength(10)
    expect(ordered.slice(-3).map((m) => m.fits)).toEqual([false, false, false])
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

  it('upper no: both declarations are kept and it waits for a check, without blocking', () => {
    expect(item(run('second_year', { type: 'answer_upper', answer: 'no' }), 'field_upper')).toMatchObject({ status: 'awaiting_verification', detail: 'upper_disputed', paymentImpact: { areaHa: 0.1, reason: 'overlap_pending' } })
  })

  it('changing a measure after applying means applying again, and nothing he typed is lost', () => {
    const applied = play('second_year', { type: 'choose_measures', chosen: ['plant_production'] })
    const r = play('second_year', { type: 'choose_measures', chosen: ['plant_production'] }, { type: 'draft_measures', chosen: ['plant_production', 'insurance'], inputs: { 'insurance.insurer': 'DDOR' } })
    expect(applied.answers.measures.confirmed).toBe(true)
    expect(r.answers.measures).toEqual({ chosen: ['plant_production', 'insurance'], inputs: { 'insurance.insurer': 'DDOR' }, confirmed: false })
    expect(r.past).toHaveLength(applied.past.length)
    expect(item(derive(r), 'measures')).toMatchObject({ status: 'action_required', detail: 'measures_incomplete', missing: ['insurance'] })
  })

  it('a measure lists what he still has to add, including what an earlier answer makes needed', () => {
    const diesel = SCENARIOS.second_year.measures.find((m) => m.id === 'diesel')!
    expect(measureGaps(diesel, {}).missing).toEqual(['who_works'])
    expect(measureGaps(diesel, { 'diesel.who_works': 'own' }).missing).toEqual([])
    expect(measureGaps(diesel, { 'diesel.who_works': 'contractor' }).missing).toEqual(['contract'])
  })

  it('an answer that rules a measure out is said at once', () => {
    const r = run('second_year', { type: 'choose_measures', chosen: ['breeding_cattle'] }, { type: 'save_measure', measureId: 'breeding_cattle', inputs: { 'breeding_cattle.herd_book': 'no' } })
    expect(item(r, 'measures')).toMatchObject({ status: 'action_required', missing: ['breeding_cattle'] })
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

  it('the parcel he bought: a question; yes needs the field saved, no leaves it out', () => {
    expect(item(run('second_year'), 'field_bought').detail).toBe('bought_unanswered')
    expect(item(run('second_year', { type: 'answer_bought', answer: 'no' }), 'field_bought')).toEqual({ id: 'field_bought', status: 'complete', detail: 'bought_not_farmed' })
    expect(item(run('second_year', { type: 'answer_bought', answer: 'yes' }), 'field_bought').detail).toBe('bought_needs_field')
    const field = { id: 'bought', landId: 'bought', polygon: rect(60), name: 'Lower field', crop: 'maize' as const, measures: [] }
    const saved = run('second_year', { type: 'answer_bought', answer: 'yes' }, { type: 'save_field', field })
    expect(item(saved, 'field_bought').status).toBe('complete')
    // No takes the field out again.
    expect(play('second_year', { type: 'answer_bought', answer: 'yes' }, { type: 'save_field', field }, { type: 'answer_bought', answer: 'no' }).answers.newFields).toEqual([])
  })

  it('a field he adds is its own done task in Land, and removing it takes it out', () => {
    const field = { id: 'f1', landId: 'block_5', polygon: rect(60), name: 'Rented field', crop: 'wheat' as const, measures: [] }
    const r = run('second_year', { type: 'save_field', field })
    expect(item(r, 'added_f1')).toEqual({ id: 'added_f1', status: 'complete', detail: 'added_field' })
    expect(run('second_year', { type: 'save_field', field }, { type: 'remove_field', id: 'f1' }).items.some((i) => i.id === 'added_f1')).toBe(false)
  })

  it('a correction to a record keeps his value, and a new value replaces the old one', () => {
    const s = play('second_year', { type: 'ask_record_check', itemId: 'calvings', value: '12' }, { type: 'ask_record_check', itemId: 'calvings', value: '13' })
    expect(s.answers.requests.filter((r) => r.itemId === 'calvings').map((r) => r.value)).toEqual(['13'])
    expect(item(derive(s), 'calvings').status).toBe('awaiting_verification')
  })
})
