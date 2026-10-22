import { describe, expect, it } from 'vitest'
import { play } from './testUtils'

describe('requests (reducer)', () => {
  it('keeps one specific problem for Jelena with his note, and logs who did it', () => {
    const s = play('second_year', { type: 'send_to_jelena', itemId: 'herd', note: '4 sold, 2 slaughtered, 3 calves born' })
    expect(s.answers.requests).toEqual([{ kind: 'jelena', itemId: 'herd', note: '4 sold, 2 slaughtered, 3 calves born', at: '2026-04-28T10:00:00Z' }])
    expect(s.history[s.history.length - 1]).toMatchObject({ actor: 'Milan', action: 'send_to_jelena' })
  })
  it('asks the record owner to check only once', () => {
    const s = play('second_year', { type: 'ask_record_check', itemId: 'details' }, { type: 'ask_record_check', itemId: 'details' })
    expect(s.answers.requests).toHaveLength(1)
  })
})
