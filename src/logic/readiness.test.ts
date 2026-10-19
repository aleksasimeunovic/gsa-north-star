import { describe, expect, it } from 'vitest'
import type { Action } from '../state/actions'
import { daysLeft } from './readiness'
import { halfSplit, run } from './testUtils'

const allYes: Action[] = [
  { type: 'answer_herd', answer: 'yes' },
  { type: 'answer_river', answer: 'yes' },
  halfSplit(),
  { type: 'answer_road', answer: 'yes' },
]

describe('application state', () => {
  it('action required until every change is answered', () => {
    const r = run('second_year').readiness
    expect(r.state).toBe('action_required')
    expect(r.counts.action_required).toBe(3)
    expect(r.canSubmit).toBe(false)
  })

  it('ready to submit once nothing needs his action', () => {
    expect(run('second_year', ...allYes).readiness.state).toBe('ready_to_submit')
  })

  it('awaiting verification does not block (assumption to confirm with the ministry)', () => {
    const r = run(
      'second_year',
      { type: 'answer_herd', answer: 'no' },
      { type: 'set_herd_count', count: 41 },
      ...allYes.slice(1),
    ).readiness
    expect(r.state).toBe('ready_to_submit')
    expect(r.awaiting.map((i) => i.id)).toEqual(['herd'])
  })

  it('payment impact never blocks', () => {
    const r = run('second_year', ...allYes)
    expect(r.items.find((i) => i.id === 'field_road')!.paymentImpact).toBeDefined()
    expect(r.readiness.canSubmit).toBe(true)
  })

  it('no renewal blocks, even when everything else is ready', () => {
    expect(run('second_year_not_renewed', ...allYes).readiness.state).toBe('waiting_for_renewal')
    expect(run('second_year_not_renewed', ...allYes, { type: 'renew' }).readiness.state).toBe('ready_to_submit')
  })

  it('submitted after submit', () => {
    expect(run('second_year', ...allYes, { type: 'submit' }).readiness.state).toBe('submitted')
  })

  it('days left counts the closing day', () => {
    expect(daysLeft('2026-04-28', '2026-05-26')).toBe(29)
    expect(daysLeft('2026-05-26', '2026-05-26')).toBe(1)
    expect(daysLeft('2026-06-01', '2026-05-26')).toBe(0)
  })
})
