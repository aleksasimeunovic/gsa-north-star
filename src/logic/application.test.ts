import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import { initialState } from '../state/store'
import { applicationList, newlyRemoved, type WorkId } from './application'
import { deriveItems } from './status'
import { halfSplit, run } from './testUtils'

const work = (r: ReturnType<typeof run>, id: WorkId) => r.list.tasks.flatMap((t) => t.work).find((w) => w.id === id)!
const ids = (r: ReturnType<typeof run>) => r.list.tasks.map((t) => t.id)
const confirmAll = (['fields_other', 'details', 'measures', 'receipts'] as const).map((what) => ({ type: 'confirm', what }) as const)

describe('application list', () => {
  it('is one list of named tasks: the changes first, then named confirmations; no miscellaneous bucket', () => {
    expect(ids(run('second_year'))).toEqual(['herd', 'field_river', 'field_road', 'fields_other', 'details', 'measures', 'receipts'])
  })

  it('starts from the full set of possible work', () => {
    const r = run('second_year')
    expect(r.list.tasks.flatMap((t) => t.work).map((w) => [w.id, w.state])).toEqual([
      ['herd_by_tag', 'possible'],
      ['river_split', 'possible'],
      ['river_redraw', 'possible'],
      ['road_redraw', 'possible'],
    ])
  })

  it('the first task that needs him is the one next action', () => {
    expect(run('second_year').list.next).toBe('herd')
    expect(run('second_year', { type: 'answer_herd', answer: 'yes' }).list.next).toBe('field_river')
  })

  it('herd: either answer removes updating animals one by one, with a reason', () => {
    expect(work(run('second_year', { type: 'answer_herd', answer: 'yes' }), 'herd_by_tag')).toEqual({ id: 'herd_by_tag', state: 'removed', reason: 'registry_has_count' })
    const no = run('second_year', { type: 'answer_herd', answer: 'no' }, { type: 'set_herd_count', count: 41 })
    expect(work(no, 'herd_by_tag').reason).toBe('both_kept')
  })

  it('a herd disagreement does not stop him: the next action moves on', () => {
    expect(run('second_year', { type: 'answer_herd', answer: 'no' }, { type: 'set_herd_count', count: 41 }).list.next).toBe('field_river')
  })

  it('river yes: the split becomes needed and redrawing is removed', () => {
    const r = run('second_year', { type: 'answer_river', answer: 'yes' })
    expect(work(r, 'river_split').state).toBe('needed')
    expect(work(r, 'river_redraw')).toMatchObject({ state: 'removed', reason: 'edges_same' })
    expect(work(run('second_year', { type: 'answer_river', answer: 'yes' }, halfSplit()), 'river_split').state).toBe('done')
  })

  it('river no: the split is removed; a field check removes redrawing too', () => {
    const no = { type: 'answer_river', answer: 'no' } as const
    expect(work(run('second_year', no), 'river_split').reason).toBe('one_crop')
    expect(work(run('second_year', no), 'river_redraw').state).toBe('possible')
    expect(work(run('second_year', no, { type: 'river_no_option', option: 'redraw' }), 'river_redraw').state).toBe('needed')
    expect(work(run('second_year', no, { type: 'river_no_option', option: 'field_check' }), 'river_redraw').reason).toBe('inspector_checks')
  })

  it('road: yes moves the edge for him; a correction keeps the field until checked', () => {
    expect(work(run('second_year', { type: 'answer_road', answer: 'yes' }), 'road_redraw').reason).toBe('edge_moved')
    expect(work(run('second_year', { type: 'answer_road', answer: 'no' }), 'road_redraw').state).toBe('possible')
    expect(work(run('second_year', { type: 'answer_road', answer: 'no' }, { type: 'request_road_correction' }), 'road_redraw').reason).toBe('kept_until_checked')
  })

  it('submit is next once nothing needs his action; nothing is next once submitted', () => {
    const ready = [{ type: 'answer_herd', answer: 'yes' }, { type: 'answer_river', answer: 'yes' }, halfSplit(), { type: 'answer_road', answer: 'yes' }, ...confirmAll] as const
    expect(run('second_year', ...ready).list.next).toBe('submit')
    expect(run('second_year', ...ready, { type: 'sign_declarations', signed: true }, { type: 'submit' }).list.next).toBeNull()
  })

  it('renewal is the first task when the status needs renewing', () => {
    expect(ids(run('second_year_not_renewed'))[0]).toBe('renewal')
    expect(run('second_year_not_renewed').list.next).toBe('renewal')
    expect(run('second_year_not_renewed', { type: 'renew' }).list.tasks[0].status).toBe('complete')
  })

  it('missing receipts are their own task', () => {
    const t = run('missing_document').list.tasks.find((x) => x.id === 'receipts')!
    expect(t.status).toBe('action_required')
  })

  it('no animals: no herd task', () => {
    const s = { ...SCENARIOS.second_year, herd: null }
    const a = initialState().answers
    expect(applicationList(s, a, deriveItems(s, a), 'farmer').tasks.some((t) => t.id === 'herd')).toBe(false)
  })

  it('advisor: same list, denser, what needs action first', () => {
    const s = { ...initialState(), role: 'advisor' as const }
    s.answers = { ...s.answers, herd: { answer: 'no', ownCount: 41 }, confirmed: ['fields_other'] }
    const sc = SCENARIOS.second_year
    const list = applicationList(sc, s.answers, deriveItems(sc, s.answers), 'advisor')
    expect(list.density).toBe('compact')
    expect(list.tasks.map((t) => t.status)).toEqual([
      'action_required', 'action_required', 'action_required', 'action_required', 'action_required',
      'awaiting_verification', 'complete',
    ])
  })

  it('reports only the work his last answer removed', () => {
    const before = run('second_year', { type: 'answer_herd', answer: 'yes' })
    const after = run('second_year', { type: 'answer_herd', answer: 'yes' }, { type: 'answer_road', answer: 'yes' })
    expect(newlyRemoved(before.list, after.list).map((x) => [x.taskId, x.work.id])).toEqual([['field_road', 'road_redraw']])
  })
})
