import { describe, expect, it } from 'vitest'
import type { Action } from '../state/actions'
import { daysLeft } from './readiness'
import { ready, run } from './testUtils'

describe('application state', () => {
  it('action required until every task is done', () => {
    const r = run('second_year').readiness
    expect(r.state).toBe('action_required')
    expect(r.counts.action_required).toBe(16)
    expect(r.canSubmit).toBe(false)
  })

  it('counts every thing left, across the parts', () => {
    expect(run('second_year').list.todo).toHaveLength(16)
    // Missing receipts replace the unreadable one and the confirmation.
    expect(run('missing_document').list.todo).toHaveLength(15)
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

  it('no renewal blocks, even when everything else is ready', () => {
    expect(run('second_year_not_renewed', ...ready).readiness.state).toBe('waiting_for_renewal')
    expect(run('second_year_not_renewed', ...ready, { type: 'renew' }).readiness.state).toBe('ready_to_submit')
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
