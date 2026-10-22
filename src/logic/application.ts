import type { Scenario } from '../data/scenarios'
import type { Answers, Role } from '../state/actions'
import { isRenewed } from './readiness'
import { type Item, type ItemId, type Status } from './status'

export type TaskId = 'renewal' | ItemId

/**
 * Work a change could still need. It starts as possible; his answer makes it needed or
 * removes it with a reason. This is what makes the application shrink as he answers.
 */
export type WorkId = 'herd_by_tag' | 'river_split' | 'river_redraw' | 'road_redraw'
export type WorkState = 'possible' | 'needed' | 'done' | 'removed'
export type RemovalReason =
  | 'registry_has_count'
  | 'both_kept'
  | 'edges_same'
  | 'one_crop'
  | 'inspector_checks'
  | 'edge_moved'
  | 'kept_until_checked'

export interface Work {
  id: WorkId
  state: WorkState
  reason?: RemovalReason
}

export interface Task {
  id: TaskId
  status: Status
  work: Work[]
}

export interface ApplicationList {
  tasks: Task[]
  /** The one next action. 'submit' once nothing needs his action; null once submitted. */
  next: TaskId | 'submit' | null
  density: 'comfortable' | 'compact'
}

const removed = (id: WorkId, reason: RemovalReason): Work => ({ id, state: 'removed', reason })

function workFor(id: TaskId, a: Answers, item: Item | undefined): Work[] {
  if (id === 'herd') {
    const { answer, ownCount } = a.herd
    if (answer === 'yes') return [removed('herd_by_tag', 'registry_has_count')]
    if (answer === 'no' && ownCount !== null) return [removed('herd_by_tag', 'both_kept')]
    return [{ id: 'herd_by_tag', state: 'possible' }]
  }
  if (id === 'field_river') {
    const r = a.river
    if (r.answer === 'yes') {
      return [{ id: 'river_split', state: item?.status === 'complete' ? 'done' : 'needed' }, removed('river_redraw', 'edges_same')]
    }
    if (r.answer === 'no') {
      const redraw: Work =
        r.noOption === 'redraw'
          ? { id: 'river_redraw', state: r.redrawn ? 'done' : 'needed' }
          : r.noOption === 'field_check'
            ? removed('river_redraw', 'inspector_checks')
            : { id: 'river_redraw', state: 'possible' }
      return [removed('river_split', 'one_crop'), redraw]
    }
    return [
      { id: 'river_split', state: 'possible' },
      { id: 'river_redraw', state: 'possible' },
    ]
  }
  if (id === 'field_road') {
    const r = a.road
    if (r.answer === 'yes') return [removed('road_redraw', 'edge_moved')]
    if (r.answer === 'no' && r.correctionRequested) return [removed('road_redraw', 'kept_until_checked')]
    return [{ id: 'road_redraw', state: 'possible' }]
  }
  return []
}

/**
 * The application is one list of named tasks, generated around the farm. It is also the readiness view.
 * - Nothing on the farm for a task: not in the list (no animals, no herd task).
 * - A detected change: its own task, with the work it could still need.
 * - Unchanged things: named confirmations. Anything needing attention: its own task.
 * - Exactly one next action: the first task that needs him, then submit.
 * - Advisor: same list, denser, what needs action first.
 */
export function applicationList(s: Scenario, a: Answers, items: Item[], role: Role): ApplicationList {
  const tasks: Task[] = []
  if (!s.renewed) tasks.push({ id: 'renewal', status: isRenewed(s, a) ? 'complete' : 'action_required', work: [] })
  for (const item of items) tasks.push({ id: item.id, status: item.status, work: workFor(item.id, a, item) })

  const open = tasks.find((t) => t.status === 'action_required')
  const next = a.submittedAt ? null : (open?.id ?? 'submit')

  if (role === 'advisor') {
    const rank: Record<Status, number> = { action_required: 0, awaiting_verification: 1, complete: 2 }
    tasks.sort((x, y) => rank[x.status] - rank[y.status])
  }
  return { tasks, next, density: role === 'advisor' ? 'compact' : 'comfortable' }
}

/** Work his last answer removed: shown once, with its reason, then gone. */
export function newlyRemoved(before: ApplicationList, after: ApplicationList): { taskId: TaskId; work: Work }[] {
  const was = new Map(before.tasks.flatMap((t) => t.work.map((w) => [w.id, w.state] as const)))
  return after.tasks.flatMap((t) =>
    t.work.filter((w) => w.state === 'removed' && was.get(w.id) !== 'removed').map((work) => ({ taskId: t.id, work })),
  )
}
