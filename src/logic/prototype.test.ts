import { describe, expect, it } from 'vitest'
import { play } from './testUtils'

describe('prototype controls (reducer)', () => {
  it('reset keeps the persona and clears answers', () => {
    const s = play('second_year', { type: 'set_role', role: 'advisor' }, { type: 'attach_document', documentId: 'unreadable_receipt' }, { type: 'reset' })
    expect(s.role).toBe('advisor')
    expect(s.answers.attachedDocuments).toEqual([])
  })

  it('undo takes back his last answer, one at a time', () => {
    const s = play('second_year', { type: 'answer_herd', answer: 'yes' }, { type: 'answer_pigs', answer: 'yes' }, { type: 'undo' })
    expect(s.answers.pigs.answer).toBeNull()
    expect(s.answers.herd.answer).toBe('yes')
    const t = play('second_year', { type: 'answer_herd', answer: 'yes' }, { type: 'undo' }, { type: 'undo' })
    expect(t.answers.herd.answer).toBeNull()
  })

  it('starts with no measures chosen, last year\'s included', () => {
    expect(play('second_year').answers.measures.chosen).toEqual([])
  })
})
