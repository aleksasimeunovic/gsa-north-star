import type { Scenario } from '../data/scenarios'
import type { Answers, Role } from '../state/actions'
import { isRenewed } from './readiness'
import type { Item, ItemDetail, ItemId, Status } from './status'

export type TaskId = 'renewal' | ItemId

/**
 * Work a change could still need. It starts as possible; his answer makes it needed or
 * removes it with a reason. This is what makes the application shrink as he answers.
 */
export type WorkId = 'river_split' | 'road_redraw' | 'upper_redraw' | 'pigs_declare' | 'bank_enter'
export type WorkState = 'possible' | 'needed' | 'done' | 'removed'
export type RemovalReason = 'one_crop' | 'edge_moved' | 'kept_until_checked' | 'neighbour_line' | 'household' | 'bank_sent'

export interface Work {
  id: WorkId
  state: WorkState
  reason?: RemovalReason
}

/**
 * Three kinds of work, kept apart because they ask different things of him:
 * - change: GSA found something that may differ from the records, and he verifies it
 * - choice: what he decides or adds for this year regardless of changes (measures, what they need)
 * - same: what GSA already has and he confirms is still right
 */
export type TaskKind = 'change' | 'choice' | 'same'
export const KINDS: TaskKind[] = ['change', 'choice', 'same']

/**
 * The parts of his application, in the order he goes through them. A part his farm has nothing for
 * is left out; "check and submit" is always last.
 */
export type StepId = 'details' | 'animals' | 'land' | 'measures' | 'documents' | 'submit'
export const STEPS: StepId[] = ['details', 'animals', 'land', 'measures', 'documents', 'submit']

export interface Task {
  id: TaskId
  status: Status
  kind: TaskKind
  step: StepId
  work: Work[]
}

export interface Step {
  id: StepId
  tasks: Task[]
  /** How many tasks in this part still need him. */
  left: number
  waiting: number
}

export interface ApplicationList {
  /** What needs him, in order: by part, then changes, choices and confirmations. */
  todo: Task[]
  /** His answer differs from a record; only that part waits. */
  waiting: Task[]
  done: Task[]
  /** The one next action. 'submit' once nothing needs his action; null once submitted. */
  next: TaskId | 'submit' | null
  steps: Step[]
  density: 'comfortable' | 'compact'
}

export const CHANGE_TASKS: TaskId[] = ['bank', 'household', 'herd', 'pigs', 'receipt_unreadable']

/** Things GSA already has; he confirms them while they only need confirming. */
const CONFIRMABLE = new Set<ItemDetail>([
  'fields_same', 'fields_confirmed', 'details_to_confirm', 'details_confirmed',
  'receipts_to_confirm', 'receipts_confirmed', 'calvings_to_confirm', 'calvings_confirmed',
])

export function stepOf(id: TaskId): StepId {
  if (id === 'renewal' || id === 'bank' || id === 'household' || id === 'details') return 'details'
  if (id === 'herd' || id === 'pigs' || id === 'calvings') return 'animals'
  if (id.startsWith('field_') || id === 'fields_other') return 'land'
  if (id === 'measures') return 'measures'
  return 'documents'
}

function kindOf(id: TaskId, item: Item | undefined): TaskKind {
  if (CHANGE_TASKS.includes(id) || id.startsWith('field_')) return 'change'
  if (item && CONFIRMABLE.has(item.detail)) return 'same'
  // A correction asked for on something he was confirming stays where it was.
  if (id === 'details' || id === 'calvings') return 'same'
  return 'choice'
}

/** Whether a map shows this change: he reviews the boundary on the map, not from a description. */
export const isMapChange = (id: TaskId): id is 'field_river' | 'field_road' | 'field_upper' =>
  id === 'field_river' || id === 'field_road' || id === 'field_upper'

const removed = (id: WorkId, reason: RemovalReason): Work => ({ id, state: 'removed', reason })

function workFor(id: TaskId, a: Answers, item: Item | undefined): Work[] {
  if (id === 'bank') {
    if (a.bank.answer === 'yes') return [removed('bank_enter', 'bank_sent')]
    return [{ id: 'bank_enter', state: a.bank.answer === 'no' ? (item?.status === 'complete' ? 'done' : 'needed') : 'possible' }]
  }
  if (id === 'pigs') {
    if (a.pigs.answer === 'yes') return [removed('pigs_declare', 'household')]
    return [{ id: 'pigs_declare', state: a.pigs.answer === 'no' ? 'done' : 'possible' }]
  }
  if (id === 'field_river') {
    if (a.river.answer === 'yes') return [{ id: 'river_split', state: item?.status === 'complete' ? 'done' : 'needed' }]
    if (a.river.answer === 'no') return [removed('river_split', 'one_crop')]
    return [{ id: 'river_split', state: 'possible' }]
  }
  if (id === 'field_road') {
    if (a.road.answer === 'yes') return [removed('road_redraw', 'edge_moved')]
    if (a.road.answer === 'no') return [removed('road_redraw', 'kept_until_checked')]
    return [{ id: 'road_redraw', state: 'possible' }]
  }
  if (id === 'field_upper') {
    if (a.upper.answer === 'yes') return [removed('upper_redraw', 'neighbour_line')]
    if (a.upper.answer === 'no') return [{ id: 'upper_redraw', state: item?.status === 'action_required' ? 'needed' : 'done' }]
    return [{ id: 'upper_redraw', state: 'possible' }]
  }
  return []
}

// Renewal is a gate, so it comes first; then by part, then changes, choices and confirmations.
const order = (t: Task) => (t.id === 'renewal' ? -1 : STEPS.indexOf(t.step) * 10 + KINDS.indexOf(t.kind))

/**
 * The application is generated around the farm, in parts. It is also the readiness view.
 * - Nothing on the farm for a task: not in the list (no animals, no herd task, no animals part).
 * - A detected change: its own task, with the work it could still need.
 * - What GSA already has: a confirmation in its own part. Anything needing attention: its own task.
 * - Within a part: changes first, then choices, then confirmations.
 * - Exactly one next action: the first task that needs him, then submit.
 * - Advisor: same list, denser.
 */
export function applicationList(s: Scenario, a: Answers, items: Item[], role: Role): ApplicationList {
  const all: Task[] = []
  if (!s.renewed) all.push({ id: 'renewal', status: isRenewed(s, a) ? 'complete' : 'action_required', kind: 'choice', step: 'details', work: [] })
  for (const item of items) all.push({ id: item.id, status: item.status, kind: kindOf(item.id, item), step: stepOf(item.id), work: workFor(item.id, a, item) })
  // Stable sort: by part, then by kind, keeping the order within each.
  const sorted = all.map((t, i) => [t, i] as const).sort(([x, i], [y, j]) => order(x) - order(y) || i - j).map(([t]) => t)

  const todo = sorted.filter((t) => t.status === 'action_required')
  const next = a.submittedAt ? null : (todo[0]?.id ?? 'submit')
  const steps: Step[] = STEPS.map((id) => {
    const tasks = sorted.filter((t) => t.step === id)
    return {
      id,
      tasks,
      left: tasks.filter((t) => t.status === 'action_required').length,
      waiting: tasks.filter((t) => t.status === 'awaiting_verification').length,
    }
  }).filter((st) => st.tasks.length > 0 || st.id === 'submit')
  return {
    todo,
    waiting: sorted.filter((t) => t.status === 'awaiting_verification'),
    done: sorted.filter((t) => t.status === 'complete'),
    next,
    steps,
    density: role === 'advisor' ? 'compact' : 'comfortable',
  }
}

export const allTasks = (l: ApplicationList) => [...l.todo, ...l.waiting, ...l.done]

/**
 * The mark on a part in the stepper, in the readiness drawer's terms. A part he hasn't opened keeps its
 * own icon, so nothing is flagged on arrival. One he left with things to do is a warning; once he is on
 * check and submit, those stop him submitting and become errors. Done with something waiting for a check
 * is info; done is a tick. Payment impact never sets a mark.
 */
export type StepMark = 'part' | 'complete' | 'warning' | 'error' | 'info'
export function stepMark(s: Step, at: StepId, seen: ReadonlySet<StepId>): StepMark {
  if (s.id === 'submit' || s.id === at) return 'part'
  if (s.left > 0) return at === 'submit' ? 'error' : seen.has(s.id) ? 'warning' : 'part'
  return s.waiting > 0 ? 'info' : 'complete'
}

/** Work his last answer removed: shown once, with its reason, then gone. */
export function newlyRemoved(before: ApplicationList, after: ApplicationList): { taskId: TaskId; work: Work }[] {
  const was = new Map(allTasks(before).flatMap((t) => t.work.map((w) => [w.id, w.state] as const)))
  return allTasks(after).flatMap((t) =>
    t.work.filter((w) => w.state === 'removed' && was.get(w.id) !== 'removed').map((work) => ({ taskId: t.id, work })),
  )
}
