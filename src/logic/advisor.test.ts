import { describe, expect, it } from 'vitest'
import { advisorQueue } from './advisor'
import { play } from './testUtils'

describe('advisor queue', () => {
  it('holds only the escalated problems, oldest open first', () => {
    const q = advisorQueue(play('second_year'))
    expect(q.map((c) => c.kind)).toEqual(['inherited_parcel', 'herd_discrepancy'])
    expect(q.every((c) => c.status === 'open')).toBe(true)
  })

  it("Milan's case carries his values, his note and his history", () => {
    const s = play(
      'second_year',
      { type: 'answer_herd', answer: 'no' },
      { type: 'set_herd_count', count: 41 },
      { type: 'send_to_jelena', itemId: 'herd', note: 'Sold four.' },
    )
    const milan = advisorQueue(s).find((c) => c.id === 'milan_herd')!
    expect(milan).toMatchObject({ live: true, note: 'Sold four.', values: { record: 38, his: 41 } })
    expect(milan.history.map((h) => h.action)).toEqual(['answer_herd', 'set_herd_count', 'send_to_jelena'])
  })

  it('handled cases move down; bulk handles several and logs each', () => {
    const s = play('second_year', { type: 'set_role', role: 'advisor' }, { type: 'advisor_handle_many', caseIds: ['neighbour_parcel'] })
    const q = advisorQueue(s)
    expect(q.map((c) => [c.id, c.status])).toEqual([
      ['milan_herd', 'open'],
      ['neighbour_parcel', 'handled'],
    ])
    expect(q[1].history[q[1].history.length - 1]).toMatchObject({ actor: 'Jelena', action: 'handled' })
  })

  it("Jelena's actions are kept per case", () => {
    const s = play('second_year', { type: 'advisor_act', caseId: 'milan_herd', act: 'asked_owner' })
    const milan = advisorQueue(s).find((c) => c.id === 'milan_herd')!
    expect(milan.lastAct).toBe('asked_owner')
  })
})
