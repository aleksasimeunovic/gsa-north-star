import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import { emptyAnswers } from '../state/store'
import { allTasks, applicationList, newlyRemoved, stepOf, type WorkId } from './application'
import { deriveItems } from './status'
import { halfSplit, ready, run } from './testUtils'

type R = ReturnType<typeof run>
const work = (r: R, id: WorkId) => allTasks(r.list).flatMap((t) => t.work).find((w) => w.id === id)!
const ids = (tasks: { id: string }[]) => tasks.map((t) => t.id)

describe('application list', () => {
  it('opens on every part in order: details, animals, land, measures, documents; changes first in each', () => {
    expect(ids(run('second_year').list.todo)).toEqual([
      'bank', 'household', 'details',
      'herd', 'pigs', 'calvings',
      'field_river', 'field_road', 'field_upper', 'field_meadow', 'fields_other',
      'measures',
      'receipt_unreadable', 'receipts',
    ])
  })

  it('starts from the full set of possible work', () => {
    expect(allTasks(run('second_year').list).flatMap((t) => t.work).map((w) => [w.id, w.state])).toEqual([
      ['bank_enter', 'possible'],
      ['pigs_declare', 'possible'],
      ['river_split', 'possible'],
      ['road_redraw', 'possible'],
      ['upper_redraw', 'possible'],
    ])
  })

  it('bank: the new account from the bank removes typing one in, with a reason', () => {
    expect(work(run('second_year', { type: 'answer_bank', answer: 'yes' }), 'bank_enter')).toEqual({ id: 'bank_enter', state: 'removed', reason: 'bank_sent' })
    expect(work(run('second_year', { type: 'answer_bank', answer: 'no' }), 'bank_enter').state).toBe('needed')
  })

  it('ordered by status: what needs him, then waiting for a check, then done', () => {
    const r = run('second_year', { type: 'answer_herd', answer: 'no' }, { type: 'set_herd_count', count: 41 }, { type: 'answer_road', answer: 'yes' })
    expect(ids(r.list.todo)).not.toContain('herd')
    expect(ids(r.list.waiting)).toEqual(['herd'])
    expect(ids(r.list.done)).toEqual(['field_road'])
  })

  it('the first task that needs him is the one next action', () => {
    expect(run('second_year').list.next).toBe('bank')
    expect(run('second_year', { type: 'answer_bank', answer: 'yes' }).list.next).toBe('household')
  })

  it('pigs: household only removes declaring them, with a reason', () => {
    expect(work(run('second_year', { type: 'answer_pigs', answer: 'yes' }), 'pigs_declare')).toEqual({ id: 'pigs_declare', state: 'removed', reason: 'household' })
    expect(work(run('second_year', { type: 'answer_pigs', answer: 'no' }), 'pigs_declare').state).toBe('done')
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

  it("upper: yes moves his edge to the neighbour's line; no makes redrawing needed until he draws", () => {
    expect(work(run('second_year', { type: 'answer_upper', answer: 'yes' }), 'upper_redraw').reason).toBe('neighbour_line')
    expect(work(run('second_year', { type: 'answer_upper', answer: 'no' }), 'upper_redraw').state).toBe('needed')
  })

  it('measures stay one task, open until every chosen measure has what it needs', () => {
    const open = run('second_year', { type: 'choose_measures', chosen: ['plant_production', 'fertiliser', 'irrigation'] })
    expect(ids(open.list.todo)).toContain('measures')
    expect(ids(allTasks(open.list)).filter((id) => id.startsWith('measure'))).toEqual(['measures'])
    const done = run('second_year', {
      type: 'choose_measures',
      chosen: ['plant_production', 'fertiliser', 'irrigation'],
      inputs: { 'irrigation.water_permit': 'permit.jpg', 'irrigation.how_water': 'A pump from the river' },
    })
    expect(ids(done.list.done)).toContain('measures')
  })

  it('a correction to his details waits for a check and stays among the confirmations', () => {
    const r = run('second_year', { type: 'ask_record_check', itemId: 'details' })
    expect(ids(r.list.waiting)).toEqual(['details'])
    expect(r.list.waiting[0].kind).toBe('same')
  })

  it('submit is next once nothing needs his action; nothing is next once submitted', () => {
    expect(run('second_year', ...ready).list.next).toBe('submit')
    expect(run('second_year', ...ready).list.todo).toEqual([])
    expect(run('second_year', ...ready, { type: 'sign_declarations', signed: true }, { type: 'submit' }).list.next).toBeNull()
  })

  it('renewal is the first task when the status needs renewing', () => {
    expect(run('second_year_not_renewed').list.next).toBe('renewal')
    expect(ids(run('second_year_not_renewed', { type: 'renew' }).list.done)).toEqual(['renewal'])
  })

  it('missing receipts are something to do, not a confirmation, and there is no unreadable one', () => {
    const r = run('missing_document')
    expect(r.list.todo.find((t) => t.id === 'receipts')!.kind).toBe('choice')
    expect(ids(allTasks(r.list))).not.toContain('receipt_unreadable')
  })

  it('no animals: no herd, pigs or calvings task, and no animals part', () => {
    const s = { ...SCENARIOS.second_year, herd: null, pigs: null }
    const a = emptyAnswers()
    const list = applicationList(s, a, deriveItems(s, a), 'farmer')
    expect(ids(list.todo)).not.toContain('herd')
    expect(ids(list.todo)).not.toContain('calvings')
    expect(list.steps.map((st) => st.id)).toEqual(['details', 'land', 'measures', 'documents', 'submit'])
  })

  it('advisor: same list, denser', () => {
    expect(run('second_year').list.density).toBe('comfortable')
    const s = SCENARIOS.second_year
    const a = emptyAnswers()
    expect(applicationList(s, a, deriveItems(s, a), 'advisor').density).toBe('compact')
  })

  it('reports only the work his last answer removed', () => {
    const before = run('second_year', { type: 'answer_herd', answer: 'yes' })
    const after = run('second_year', { type: 'answer_herd', answer: 'yes' }, { type: 'answer_road', answer: 'yes' })
    expect(newlyRemoved(before.list, after.list).map((x) => [x.taskId, x.work.id])).toEqual([['field_road', 'road_redraw']])
  })
})

describe('parts and kinds of work', () => {
  it('six parts, each with what is left in it; check and submit is always last', () => {
    const steps = run('second_year').list.steps
    expect(steps.map((st) => [st.id, st.left])).toEqual([
      ['details', 3],
      ['animals', 3],
      ['land', 5],
      ['measures', 1],
      ['documents', 2],
      ['submit', 0],
    ])
  })

  it('every task belongs to the part it is about', () => {
    expect(['bank', 'household', 'details', 'renewal'].map((id) => stepOf(id as never))).toEqual(Array(4).fill('details'))
    expect(['herd', 'pigs', 'calvings'].map((id) => stepOf(id as never))).toEqual(Array(3).fill('animals'))
    expect(['field_meadow', 'fields_other'].map((id) => stepOf(id as never))).toEqual(['land', 'land'])
    expect(stepOf('measures')).toBe('measures')
    expect(['receipt_unreadable', 'receipts'].map((id) => stepOf(id as never))).toEqual(['documents', 'documents'])
  })

  it('keeps changes GSA found, his choices and what he confirms apart, changes first in each part', () => {
    const kinds = Object.fromEntries(allTasks(run('second_year').list).map((t) => [t.id, t.kind]))
    expect(kinds).toMatchObject({
      bank: 'change', household: 'change', details: 'same',
      herd: 'change', pigs: 'change', calvings: 'same',
      field_meadow: 'change', fields_other: 'same',
      measures: 'choice',
      receipt_unreadable: 'change', receipts: 'same',
    })
  })
})
