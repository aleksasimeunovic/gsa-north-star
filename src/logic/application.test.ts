import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import { emptyAnswers } from '../state/store'
import { allTasks, applicationList, newlyNeeded, newlyRemoved, stepMark, stepOf, type Step, type WorkId } from './application'
import { deriveItems } from './status'
import { halfSplit, ready, run } from './testUtils'

type R = ReturnType<typeof run>
const work = (r: R, id: WorkId) => allTasks(r.list).flatMap((t) => t.work).find((w) => w.id === id)!
const ids = (tasks: { id: string }[]) => tasks.map((t) => t.id)

describe('application list', () => {
  it('opens only on what needs his input this year, by part; changes first in each (14 before round 10, 11 after it, 12 with the parcel he bought)', () => {
    expect(ids(run('second_year').list.todo)).toEqual([
      'bank',
      'herd', 'pigs',
      'field_river', 'field_road', 'field_upper', 'field_meadow', 'field_bought', 'fields_other',
      'measures',
      'receipts',
    ])
  })

  it('reuses what is unchanged and declares nothing (name, address, active farmer) without asking', () => {
    const r = run('second_year')
    expect(ids(allTasks(r.list))).not.toContain('details')
    expect(ids(allTasks(r.list))).not.toContain('household')
  })

  it('a blurry receipt is fixed inside the receipts task, not a task of its own', () => {
    const r = run('second_year')
    expect(r.items.find((i) => i.id === 'receipts')!.detail).toBe('receipts_unreadable')
    expect(run('second_year', { type: 'attach_document', documentId: 'unreadable_receipt' }).items.find((i) => i.id === 'receipts')!.detail).toBe('receipts_to_confirm')
  })

  it('says what work an answer added, so the finish line never moves silently', () => {
    const before = run('second_year')
    const after = run('second_year', { type: 'answer_river', answer: 'yes' })
    expect(newlyNeeded(before.list, after.list).map((x) => x.work.id)).toEqual(['river_split'])
    expect(newlyNeeded(before.list, run('second_year', { type: 'answer_river', answer: 'no' }).list)).toEqual([])
  })

  it('starts from the full set of possible work', () => {
    expect(allTasks(run('second_year').list).flatMap((t) => t.work).map((w) => [w.id, w.state])).toEqual([
      ['bank_enter', 'possible'],
      ['pigs_declare', 'possible'],
      ['river_split', 'possible'],
      ['road_redraw', 'possible'],
      ['upper_redraw', 'possible'],
      ['bought_draw', 'possible'],
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
    expect(run('second_year', { type: 'answer_bank', answer: 'yes' }).list.next).toBe('herd')
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

  it('a correction to something unchanged waits for a check in your details', () => {
    const r = run('second_year', { type: 'ask_record_check', itemId: 'details', what: 'place' })
    expect(ids(r.list.waiting)).toEqual(['details'])
    expect(r.list.waiting[0].step).toBe('details')
  })

  it('submit is next once nothing needs his action; nothing is next once submitted', () => {
    expect(run('second_year', ...ready).list.next).toBe('submit')
    expect(run('second_year', ...ready).list.todo).toEqual([])
    expect(run('second_year', ...ready, { type: 'sign_declarations', signed: true }, { type: 'submit' }).list.next).toBeNull()
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
      ['details', 1],
      ['animals', 2],
      ['land', 6],
      ['measures', 1],
      ['documents', 1],
      ['submit', 0],
    ])
  })

  it('every task belongs to the part it is about', () => {
    expect(['bank', 'details', 'renewal'].map((id) => stepOf(id as never))).toEqual(Array(3).fill('details'))
    expect(['herd', 'pigs', 'calvings'].map((id) => stepOf(id as never))).toEqual(Array(3).fill('animals'))
    expect(['field_meadow', 'fields_other'].map((id) => stepOf(id as never))).toEqual(['land', 'land'])
    expect(stepOf('measures')).toBe('measures')
    expect(stepOf('receipts')).toBe('documents')
  })

  it('keeps changes, choices and yearly confirmations apart, changes first in each part', () => {
    const kinds = Object.fromEntries(allTasks(run('second_year').list).map((t) => [t.id, t.kind]))
    expect(kinds).toEqual({
      bank: 'change',
      herd: 'change', pigs: 'change',
      field_river: 'change', field_road: 'change', field_upper: 'change', field_meadow: 'change', field_bought: 'change', fields_other: 'confirm',
      measures: 'choice',
      receipts: 'confirm',
    })
  })
})

describe('step marks', () => {
  const step = (id: Step['id'], left: number, o: { waiting?: number; errors?: number; look?: number } = {}): Step => ({ id, tasks: [], left, waiting: o.waiting ?? 0, errors: o.errors ?? 0, look: o.look ?? 0 })
  it('keeps the part icon for the open part, for check and submit and for work not done yet, opened or not', () => {
    expect(stepMark(step('land', 3), 'land')).toBe('part')
    expect(stepMark(step('submit', 0), 'land')).toBe('part')
    expect(stepMark(step('animals', 2), 'land')).toBe('part')
    // Red never marks work he simply hasn't done, even on check and submit.
    expect(stepMark(step('animals', 2), 'submit')).toBe('part')
  })
  it('marks a part red only when something in it is wrong', () => {
    expect(stepMark(step('documents', 1, { errors: 1 }), 'land')).toBe('error')
  })
  it('ticks a done part; orange when something waits for a check or lowers the payment', () => {
    expect(stepMark(step('details', 0), 'land')).toBe('done')
    expect(stepMark(step('animals', 0, { waiting: 1, look: 1 }), 'land')).toBe('look')
  })
})
