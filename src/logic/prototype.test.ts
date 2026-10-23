import { describe, expect, it } from 'vitest'
import { play } from './testUtils'

describe('prototype controls (reducer)', () => {
  it('switching scenario keeps role and notes and starts fresh', () => {
    const s = play(
      'second_year',
      { type: 'set_role', role: 'advisor' },
      { type: 'set_notes', show: true },
      { type: 'answer_herd', answer: 'yes' },
      { type: 'set_scenario', scenarioId: 'missing_document' },
    )
    expect(s).toMatchObject({ scenarioId: 'missing_document', role: 'advisor', prototype: { showNotes: true } })
    expect(s.answers.herd.answer).toBeNull()
    expect(s.history).toEqual([])
  })

  it('reset keeps the scenario and clears answers', () => {
    const s = play('missing_document', { type: 'attach_document', documentId: 'input_receipts' }, { type: 'reset' })
    expect(s.scenarioId).toBe('missing_document')
    expect(s.answers.attachedDocuments).toEqual([])
  })

  it('notes are not part of the farm history', () => {
    expect(play('second_year', { type: 'set_notes', show: true }).history).toEqual([])
  })

  it('undo takes back his last answer, one at a time', () => {
    const s = play('second_year', { type: 'answer_herd', answer: 'yes' }, { type: 'answer_pigs', answer: 'yes' }, { type: 'undo' })
    expect(s.answers.pigs.answer).toBeNull()
    expect(s.answers.herd.answer).toBe('yes')
    const t = play('second_year', { type: 'answer_herd', answer: 'yes' }, { type: 'undo' }, { type: 'undo' })
    expect(t.answers.herd.answer).toBeNull()
  })

  it("starts with last year's measures chosen", () => {
    expect(play('second_year').answers.measures.chosen).toEqual(['plant_production', 'cows_raising_calves'])
  })
})
