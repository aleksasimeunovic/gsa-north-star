import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import type { Action } from '../state/actions'
import { initialState } from '../state/store'
import { allTasks, applicationList, newlyRemoved, type WorkId } from './application'
import { deriveItems } from './status'
import { halfSplit, run } from './testUtils'

type R = ReturnType<typeof run>
const work = (r: R, id: WorkId) => allTasks(r.list).flatMap((t) => t.work).find((w) => w.id === id)!
const ids = (tasks: { id: string }[]) => tasks.map((t) => t.id)
const confirmSame: Action = { type: 'confirm_same', what: ['fields_other', 'details', 'measures', 'receipts'] }

describe('application list', () => {
  it('opens on the three changes, then "same as last year" as one named task; no miscellaneous bucket', () => {
    const r = run('second_year')
    expect(ids(r.list.todo)).toEqual(['herd', 'field_river', 'field_road', 'same'])
    expect(r.list.todo[3].members).toEqual(['fields_other', 'details', 'measures', 'receipts'])
  })

  it('starts from the full set of possible work', () => {
    expect(allTasks(run('second_year').list).flatMap((t) => t.work).map((w) => [w.id, w.state])).toEqual([
      ['herd_by_tag', 'possible'],
      ['river_split', 'possible'],
      ['road_redraw', 'possible'],
    ])
  })

  it('ordered by status: what needs him, then waiting for a check, then done', () => {
    const r = run('second_year', { type: 'answer_herd', answer: 'no' }, { type: 'set_herd_count', count: 41 }, { type: 'answer_road', answer: 'yes' })
    expect(ids(r.list.todo)).toEqual(['field_river', 'same'])
    expect(ids(r.list.waiting)).toEqual(['herd'])
    expect(ids(r.list.done)).toEqual(['field_road'])
  })

  it('the first task that needs him is the one next action', () => {
    expect(run('second_year').list.next).toBe('herd')
    expect(run('second_year', { type: 'answer_herd', answer: 'yes' }).list.next).toBe('field_river')
  })

  it('herd: either answer removes updating animals one by one, with a reason', () => {
    expect(work(run('second_year', { type: 'answer_herd', answer: 'yes' }), 'herd_by_tag')).toEqual({ id: 'herd_by_tag', state: 'removed', reason: 'registry_has_count' })
    const no = run('second_year', { type: 'answer_herd', answer: 'no' }, { type: 'set_herd_count', count: 41 })
    expect(work(no, 'herd_by_tag').reason).toBe('both_kept')
    expect(no.list.next).toBe('field_river')
  })

  it('river: yes makes the split needed; no removes it and completes the field', () => {
    expect(work(run('second_year', { type: 'answer_river', answer: 'yes' }), 'river_split').state).toBe('needed')
    expect(work(run('second_year', { type: 'answer_river', answer: 'yes' }, halfSplit()), 'river_split').state).toBe('done')
    const no = run('second_year', { type: 'answer_river', answer: 'no' })
    expect(work(no, 'river_split').reason).toBe('one_crop')
    expect(ids(no.list.done)).toEqual(['field_river'])
  })

  it('road: yes moves the edge for him; no sends a correction in one step', () => {
    expect(work(run('second_year', { type: 'answer_road', answer: 'yes' }), 'road_redraw').reason).toBe('edge_moved')
    const no = run('second_year', { type: 'answer_road', answer: 'no' })
    expect(work(no, 'road_redraw').reason).toBe('kept_until_checked')
    expect(ids(no.list.waiting)).toEqual(['field_road'])
  })

  it('a correction to his details takes it out of "same as last year" into its own task', () => {
    const r = run('second_year', { type: 'ask_record_check', itemId: 'details' })
    expect(r.list.todo.find((t) => t.id === 'same')!.members).toEqual(['fields_other', 'measures', 'receipts'])
    expect(ids(r.list.waiting)).toEqual(['details'])
  })

  it('submit is next once nothing needs his action; nothing is next once submitted', () => {
    const ready = [{ type: 'answer_herd', answer: 'yes' }, { type: 'answer_river', answer: 'yes' }, halfSplit(), { type: 'answer_road', answer: 'yes' }, confirmSame] as const
    expect(run('second_year', ...ready).list.next).toBe('submit')
    expect(run('second_year', ...ready).list.todo).toEqual([])
    expect(run('second_year', ...ready, { type: 'sign_declarations', signed: true }, { type: 'submit' }).list.next).toBeNull()
  })

  it('renewal is the first task when the status needs renewing', () => {
    expect(run('second_year_not_renewed').list.next).toBe('renewal')
    expect(ids(run('second_year_not_renewed', { type: 'renew' }).list.done)).toEqual(['renewal'])
  })

  it('missing receipts are their own task, outside "same as last year"', () => {
    const r = run('missing_document')
    expect(ids(r.list.todo)).toEqual(['herd', 'field_river', 'field_road', 'receipts', 'same'])
    expect(r.list.todo.find((t) => t.id === 'same')!.members).not.toContain('receipts')
  })

  it('no animals: no herd task', () => {
    const s = { ...SCENARIOS.second_year, herd: null }
    const a = initialState().answers
    expect(ids(applicationList(s, a, deriveItems(s, a), 'farmer').todo)).not.toContain('herd')
  })

  it('advisor: same list, denser', () => {
    expect(run('second_year').list.density).toBe('comfortable')
    const s = { ...SCENARIOS.second_year }
    const a = initialState().answers
    expect(applicationList(s, a, deriveItems(s, a), 'advisor').density).toBe('compact')
  })

  it('reports only the work his last answer removed', () => {
    const before = run('second_year', { type: 'answer_herd', answer: 'yes' })
    const after = run('second_year', { type: 'answer_herd', answer: 'yes' }, { type: 'answer_road', answer: 'yes' })
    expect(newlyRemoved(before.list, after.list).map((x) => [x.taskId, x.work.id])).toEqual([['field_road', 'road_redraw']])
  })
})
