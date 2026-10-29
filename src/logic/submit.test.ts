import { describe, expect, it } from 'vitest'
import { referenceNumber, submitCheck } from './submit'
import { play, ready, run } from './testUtils'

describe('submit', () => {
  it('blocked while a change needs action, and until declarations are signed', () => {
    expect(submitCheck(run('second_year').readiness, true).reasons).toEqual(['action_required'])
    expect(submitCheck(run('second_year', ...ready).readiness, false).reasons).toEqual(['declarations'])
    expect(submitCheck(run('second_year', ...ready).readiness, true).canSubmit).toBe(true)
  })

  it('awaiting verification does not block', () => {
    const r = run('second_year', ...ready, { type: 'answer_herd', answer: 'no' }, { type: 'set_herd_count', count: 41 }).readiness
    expect(submitCheck(r, true)).toEqual({ canSubmit: true, reasons: [] })
  })

  it('the reducer refuses a blocked submit and accepts a ready one', () => {
    expect(play('second_year', { type: 'submit' }).answers.submittedAt).toBeNull()
    expect(play('second_year', ...ready, { type: 'submit' }).answers.submittedAt).toBeNull()
    const s = play('second_year', ...ready, { type: 'sign_declarations', signed: true }, { type: 'submit' })
    expect(s.answers.submittedAt).not.toBeNull()
  })

  it('amend reopens and asks to sign again', () => {
    const s = play('second_year', ...ready, { type: 'sign_declarations', signed: true }, { type: 'submit' }, { type: 'amend' })
    expect(s.answers.submittedAt).toBeNull()
    expect(s.answers.declarationsSigned).toBe(false)
    expect(s.history[s.history.length - 1].action).toBe('amend')
  })

  it('reference number is stable', () => {
    expect(referenceNumber('2026-04-28T10:00:00Z')).toBe(referenceNumber('2026-04-28T10:00:00Z'))
    expect(referenceNumber('2026-04-28T10:00:00Z')).toMatch(/^GSA-2026-\d{6}$/)
  })
})
