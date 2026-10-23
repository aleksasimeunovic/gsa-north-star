import { describe, expect, it } from 'vitest'
import { advisorQueue, milanCaseState } from './advisor'
import { play } from './testUtils'

const sendHerd = [
  { type: 'answer_herd', answer: 'no' },
  { type: 'set_herd_count', count: 41 },
  { type: 'send_to_jelena', itemId: 'herd', note: 'Sold four.' },
] as const

describe('advisor queue', () => {
  it('holds only problems farmers sent; Milan appears once he sends his', () => {
    expect(advisorQueue(play('second_year')).map((c) => c.id)).toEqual(['neighbour_parcel'])
    expect(advisorQueue(play('second_year', ...sendHerd)).map((c) => c.id)).toEqual(['neighbour_parcel', 'milan_herd'])
  })

  it("Milan's case carries his values, his note and his history", () => {
    const milan = advisorQueue(play('second_year', ...sendHerd)).find((c) => c.id === 'milan_herd')!
    expect(milan).toMatchObject({ state: 'assigned', note: 'Sold four.', values: { record: 38, his: 41 } })
    expect(milan.history.map((h) => h.action)).toEqual(['answer_herd', 'set_herd_count', 'send_to_jelena'])
  })

  it('blocks submission comes first among her cases', () => {
    const q = advisorQueue(play('second_year', ...sendHerd))
    expect(q[0]).toMatchObject({ id: 'neighbour_parcel', blocksSubmission: true })
  })

  it('referring to another office is waiting, not resolved, and moves below her own cases', () => {
    const s = play('second_year', ...sendHerd, { type: 'advisor_act', caseId: 'neighbour_parcel', act: 'referred' })
    const q = advisorQueue(s)
    expect(q.map((c) => [c.id, c.state])).toEqual([
      ['milan_herd', 'assigned'],
      ['neighbour_parcel', 'waiting_office'],
    ])
    expect(q[1].history[q[1].history.length - 1]).toMatchObject({ actor: 'Jelena', action: 'referred' })
  })

  it('opening a case does not change who owns it; resolved goes last', () => {
    const s = play('second_year', ...sendHerd, { type: 'advisor_act', caseId: 'neighbour_parcel', act: 'opened' })
    expect(advisorQueue(s)[0].state).toBe('assigned')
    const r = play('second_year', ...sendHerd, { type: 'advisor_act', caseId: 'neighbour_parcel', act: 'resolved' })
    expect(advisorQueue(r).map((c) => c.state)).toEqual(['assigned', 'resolved'])
  })

  it('Milan sees the same state on his item', () => {
    expect(milanCaseState(play('second_year'))).toBeNull()
    expect(milanCaseState(play('second_year', ...sendHerd))).toBe('assigned')
    expect(milanCaseState(play('second_year', ...sendHerd, { type: 'advisor_act', caseId: 'milan_herd', act: 'referred' }))).toBe('waiting_office')
    expect(milanCaseState(play('second_year', ...sendHerd, { type: 'advisor_act', caseId: 'milan_herd', act: 'asked_farmer' }))).toBe('waiting_farmer')
  })

  it("his reply hands the next step back to Jelena, and she sees it", () => {
    const s = play('second_year', ...sendHerd, { type: 'advisor_act', caseId: 'milan_herd', act: 'asked_farmer' }, { type: 'reply_to_jelena', note: 'Sold in March.' })
    const milan = advisorQueue(s).find((c) => c.id === 'milan_herd')!
    expect(milan).toMatchObject({ state: 'assigned', reply: 'Sold in March.' })
    expect(milanCaseState(s)).toBe('assigned')
  })
})
