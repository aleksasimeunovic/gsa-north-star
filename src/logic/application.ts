import type { Scenario } from '../data/scenarios'
import type { Answers, Role } from '../state/actions'
import { isRenewed } from './readiness'
import type { Item, ItemDetail, ItemId, Status } from './status'

/** "Same as last year": one task for the unchanged things, confirmed in one tap. */
export type TaskId = 'renewal' | 'same' | ItemId

/**
 * Work a change could still need. It starts as possible; his answer makes it needed or
 * removes it with a reason. This is what makes the application shrink as he answers.
 */
export type WorkId = 'herd_by_tag' | 'river_split' | 'road_redraw'
export type WorkState = 'possible' | 'needed' | 'done' | 'removed'
export type RemovalReason = 'registry_has_count' | 'both_kept' | 'one_crop' | 'edge_moved' | 'kept_until_checked'

export interface Work {
  id: WorkId
  state: WorkState
  reason?: RemovalReason
}

export interface Task {
  id: TaskId
  status: Status
  work: Work[]
  /** For the "same as last year" task: the things it confirms. */
  members?: ItemId[]
}

export interface ApplicationList {
  /** What needs him, in order: renewal, the changes, anything needing attention, then "same as last year". */
  todo: Task[]
  /** His answer differs from a record; only that part waits. */
  waiting: Task[]
  done: Task[]
  /** The one next action. 'submit' once nothing needs his action; null once submitted. */
  next: TaskId | 'submit' | null
  density: 'comfortable' | 'compact'
}

export const CHANGE_TASKS: TaskId[] = ['herd', 'field_river', 'field_road']

/** Unchanged things go in "same as last year" while they only need confirming. */
const CONFIRMABLE = new Set<ItemDetail>([
  'fields_same', 'fields_confirmed', 'details_to_confirm', 'details_confirmed',
  'measures_to_confirm', 'measures_confirmed', 'receipts_to_confirm', 'receipts_confirmed',
])

const removed = (id: WorkId, reason: RemovalReason): Work => ({ id, state: 'removed', reason })

function workFor(id: TaskId, a: Answers, item: Item | undefined): Work[] {
  if (id === 'herd') {
    const { answer, ownCount } = a.herd
    if (answer === 'yes') return [removed('herd_by_tag', 'registry_has_count')]
    if (answer === 'no' && ownCount !== null) return [removed('herd_by_tag', 'both_kept')]
    return [{ id: 'herd_by_tag', state: 'possible' }]
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
  return []
}

/**
 * The application is one list of named tasks, generated around the farm. It is also the readiness view:
 * what needs him first, then what waits for a check, then what's done.
 * - Nothing on the farm for a task: not in the list (no animals, no herd task).
 * - A detected change: its own task, with the work it could still need.
 * - Unchanged things: one named "same as last year" task, each thing listed. Anything needing attention: its own task.
 * - Exactly one next action: the first task that needs him, then submit.
 * - Advisor: same list, denser.
 */
export function applicationList(s: Scenario, a: Answers, items: Item[], role: Role): ApplicationList {
  const all: Task[] = []
  if (!s.renewed) all.push({ id: 'renewal', status: isRenewed(s, a) ? 'complete' : 'action_required', work: [] })
  const same = items.filter((i) => CONFIRMABLE.has(i.detail))
  const own = items.filter((i) => !CONFIRMABLE.has(i.detail))
  for (const item of own) all.push({ id: item.id, status: item.status, work: workFor(item.id, a, item) })
  if (same.length) {
    const open = same.some((i) => i.status === 'action_required')
    all.push({ id: 'same', status: open ? 'action_required' : 'complete', work: [], members: same.map((i) => i.id) })
  }

  const todo = all.filter((t) => t.status === 'action_required')
  const next = a.submittedAt ? null : (todo[0]?.id ?? 'submit')
  return {
    todo,
    waiting: all.filter((t) => t.status === 'awaiting_verification'),
    done: all.filter((t) => t.status === 'complete'),
    next,
    density: role === 'advisor' ? 'compact' : 'comfortable',
  }
}

export const allTasks = (l: ApplicationList) => [...l.todo, ...l.waiting, ...l.done]

/** Work his last answer removed: shown once, with its reason, then gone. */
export function newlyRemoved(before: ApplicationList, after: ApplicationList): { taskId: TaskId; work: Work }[] {
  const was = new Map(allTasks(before).flatMap((t) => t.work.map((w) => [w.id, w.state] as const)))
  return allTasks(after).flatMap((t) =>
    t.work.filter((w) => w.state === 'removed' && was.get(w.id) !== 'removed').map((work) => ({ taskId: t.id, work })),
  )
}
