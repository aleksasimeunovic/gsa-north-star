import { describe, expect, it } from 'vitest'
import type { Action } from '../state/actions'
import { daysLeft } from './readiness'
import { ready, run } from './testUtils'

describe('application state', () => {
  it('action required until every task is done', () => {
    const r = run('second_year').readiness
    expect(r.state).toBe('action_required')
    expect(r.counts.action_required).toBe(11)
    expect(r.canSubmit).toBe(false)
  })

  it('counts every thing left, across the parts', () => {
    // Cows that calved are the registry's record: reused, not asked (round 10, Aleksa).
    expect(run('second_year').list.todo).toHaveLength(11)
  })

  it('ready to submit once nothing needs his action', () => {
    expect(run('second_year', ...ready).readiness.state).toBe('ready_to_submit')
  })

  it('awaiting verification does not block (assumption to confirm with the ministry)', () => {
    const r = run('second_year', ...ready, { type: 'answer_herd', answer: 'no' }, { type: 'set_herd_count', count: 41 }).readiness
    expect(r.state).toBe('ready_to_submit')
    expect(r.awaiting.map((i) => i.id)).toEqual(['herd'])
  })

  it('payment impact never blocks', () => {
    const r = run('second_year', ...ready)
    expect(r.items.find((i) => i.id === 'field_road')!.paymentImpact).toBeDefined()
    expect(r.readiness.canSubmit).toBe(true)
  })

  it('a measure still needing something blocks until it is added', () => {
    const chosen: Action = { type: 'choose_measures', chosen: ['plant_production', 'insurance'] }
    expect(run('second_year', ...ready, chosen).readiness.state).toBe('action_required')
    const saved: Action = { type: 'save_measure', measureId: 'insurance', inputs: { 'insurance.insurer': 'DDOR', 'insurance.policy': 'policy.pdf' } }
    expect(run('second_year', ...ready, chosen, saved).readiness.state).toBe('ready_to_submit')
  })

  it('submitted after submit', () => {
    expect(run('second_year', ...ready, { type: 'sign_declarations', signed: true }, { type: 'submit' }).readiness.state).toBe('submitted')
  })

  it('days left counts the closing day', () => {
    expect(daysLeft('2026-04-28', '2026-05-26')).toBe(29)
    expect(daysLeft('2026-05-26', '2026-05-26')).toBe(1)
    expect(daysLeft('2026-06-01', '2026-05-26')).toBe(0)
  })
})

describe('readiness verdict', () => {
  it("work not done yet is to do, not an error, and still stops him submitting; only the blurry receipt is an error", () => {
    const r = run('second_year').report
    expect(r.verdict).toBe('blocked')
    expect(r.todo).toHaveLength(10)
    expect(r.errors).toEqual(['receipts'])
  })

  it('a ruled-out measure is an error', () => {
    const r = run('second_year', { type: 'choose_measures', chosen: ['breeding_cattle'], inputs: { 'breeding_cattle.herd_book': 'no' } }).report
    expect(r.errors).toContain('measures')
  })

  it('the road and the neighbour line lower the payment: ready, with two things to look at', () => {
    const r = run('second_year', ...ready).report
    expect(r.verdict).toBe('ready_with_warnings')
    expect(r.warnings.map((w) => w.id)).toEqual(['field_road', 'field_upper'])
  })

  it('warnings never stop him submitting: a check and a lower payment', () => {
    const r = run(
      'second_year',
      ...ready,
      { type: 'answer_herd', answer: 'no' },
      { type: 'set_herd_count', count: 41 },
      { type: 'answer_road', answer: 'yes' },
    ).report
    expect(r.verdict).toBe('ready_with_warnings')
    expect(r.errors).toEqual([])
    expect(r.warnings).toEqual(expect.arrayContaining([{ id: 'herd', why: 'waiting' }, { id: 'field_road', why: 'payment' }]))
  })

  it('a measure without a rate is good to know, not a warning', () => {
    const r = run('second_year', ...ready, { type: 'choose_measures', chosen: ['plant_production', 'fertiliser'] }).report
    expect(r.info).toContain('unpriced')
  })
})
