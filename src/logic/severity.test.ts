import { describe, expect, it } from 'vitest'
import { blocks, markOf, severityOf } from './severity'
import { run } from './testUtils'

describe('one status signal', () => {
  it('to do is neutral and blocks; look at this never blocks; an error blocks', () => {
    expect(markOf({ status: 'action_required' })).toBe('todo')
    expect(markOf({ status: 'action_required', problem: true })).toBe('error')
    expect(markOf({ status: 'awaiting_verification' })).toBe('waiting')
    expect(markOf({ status: 'complete', paymentImpact: { amountDinars: -2160, areaHa: 0.12, reason: 'road_took_area' } })).toBe('payment')
    expect(markOf({ status: 'complete' })).toBe('done')
    expect(['todo', 'error', 'waiting', 'payment', 'done'].map((m) => blocks(m as never))).toEqual([true, true, false, false, false])
    expect(severityOf('waiting')).toBe('look')
    expect(severityOf('payment')).toBe('look')
  })

  it('animals waiting for a check read the same in the list, the stepper and the readiness report', () => {
    const r = run('second_year', { type: 'answer_herd', answer: 'no' }, { type: 'set_herd_count', count: 41 })
    const herd = r.list.waiting.find((t) => t.id === 'herd')!
    expect(herd.mark).toBe('waiting')
    expect(r.list.steps.find((s) => s.id === 'animals')!.look).toBe(1)
    expect(r.report.warnings).toContainEqual({ id: 'herd', why: 'waiting' })
  })
})
