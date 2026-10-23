import { useEffect, useRef, useState } from 'react'
import { en, home, tasks } from '../copy/en'
import { allTasks, CHANGE_TASKS, newlyRemoved, type Task, type TaskId, type Work } from '../logic/application'
import { Button } from '../ui/Button'
import { Note } from '../ui/Note'
import { StatusBadge } from '../ui/StatusBadge'
import { useApp } from './AppContext'
import { TaskBody, taskSummary } from './TaskBodies'

type Open = TaskId | 'submit' | null
type Removed = { taskId: TaskId; work: Work }

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function taskTitle(id: TaskId | 'submit', receiptsMissing = false) {
  return id === 'receipts' && receiptsMissing ? tasks.receiptsMissingTitle : tasks.title[id]
}

/**
 * His application as one list, ordered by status: what needs him first, then what waits for a check,
 * then what's done (collapsed). After each answer the finished task moves into Done, work that's no
 * longer needed is struck through with its reason, and the next action opens at the top and takes focus.
 */
export function TaskList({ target }: { target: string | null }) {
  const { derived, state, go } = useApp()
  const { list } = derived
  const submitted = !!state.answers.submittedAt
  const receiptsMissing = derived.items.some((i) => i.detail === 'receipts_missing')
  const title = (id: TaskId | 'submit') => taskTitle(id, receiptsMissing)
  const all = allTasks(list)

  const [open, setOpen] = useState<Open>(submitted || list.next === 'submit' ? null : list.next)
  // A task that turned into "waiting for a check" while open stays in place until he carries on.
  const [held, setHeld] = useState<TaskId | null>(null)
  const [recent, setRecent] = useState<Removed[]>([])
  const [showDone, setShowDone] = useState(false)
  const [announce, setAnnounce] = useState('')
  const [focusId, setFocusId] = useState<Open>(null)
  const before = useRef(list)
  const key = JSON.stringify(all.map((t) => [t.id, t.status, t.work, t.members]))

  const moveTo = (next: Open) => {
    setOpen(next === 'submit' ? null : next)
    setFocusId(next)
  }
  const advance = () => {
    setHeld(null)
    moveTo(list.next)
  }

  // React to each answer: what finished, what is no longer needed, what's next.
  useEffect(() => {
    const prev = before.current
    before.current = list
    if (prev === list) return
    const removed = newlyRemoved(prev, list)
    setRecent(removed)
    const was = allTasks(prev).find((t) => t.id === open)?.status
    const now = all.find((t) => t.id === open)?.status
    const words = removed.map((r) => home.announce.removed(tasks.work[r.work.id]))
    if (open && open !== 'submit' && was === 'action_required') {
      if (now === 'complete' || now === undefined) {
        words.unshift(home.announce.done(title(open)))
        if (list.next) words.push(home.announce.next(title(list.next)))
        moveTo(list.next)
      } else if (now === 'awaiting_verification') {
        words.unshift(home.announce.waiting(title(open)))
        setHeld(open)
      }
    }
    // Something that left "same as last year" for a check, say his details.
    for (const t of list.waiting) {
      if (t.id !== open && !prev.waiting.some((w) => w.id === t.id)) words.push(home.announce.waiting(title(t.id)))
    }
    if (words.length) setAnnounce(words.join(' '))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Arriving from elsewhere (readiness line, Submit) opens the task asked for.
  useEffect(() => {
    if (target?.startsWith('task-') && !submitted) {
      const id = target.slice(5) as TaskId | 'submit'
      setOpen(id === 'submit' ? null : id)
      if (list.done.some((t) => t.id === id)) setShowDone(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, submitted])

  useEffect(() => {
    if (!focusId) return
    requestAnimationFrame(() => {
      const el = document.getElementById(`task-${focusId}`)
      el?.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' })
      el?.querySelector<HTMLElement>('.task-title button, .task-go button')?.focus({ preventScroll: true })
    })
    setFocusId(null)
  }, [focusId])

  const heldTask = held ? all.find((t) => t.id === held && t.status !== 'action_required') : undefined
  const todo = heldTask ? [heldTask, ...list.todo] : list.todo
  const changes = todo.filter((t) => CHANGE_TASKS.includes(t.id))
  const renewal = todo.filter((t) => t.id === 'renewal')
  const rest = todo.filter((t) => t.id !== 'renewal' && !CHANGE_TASKS.includes(t.id))
  const waiting = list.waiting.filter((t) => t !== heldTask)
  const doneOpen = showDone || list.done.some((t) => t.id === open)

  const row = (t: Task) => (
    <TaskRow
      key={t.id}
      task={t}
      title={title(t.id)}
      summary={taskSummary(t.id, derived, state)}
      open={open === t.id}
      isNext={list.next === t.id}
      readOnly={submitted}
      onToggle={() => setOpen(open === t.id ? null : t.id)}
      advance={advance}
    />
  )

  return (
    <section aria-labelledby="list-title" className="task-section">
      <h2 id="list-title" className="visually-hidden">{home.listTitle}</h2>
      <p aria-live="polite" className="visually-hidden">{announce}</p>

      {recent.length > 0 && (
        <ul className="work-list" aria-hidden="true">
          {recent.map(({ work: w }) => (
            <li key={w.id} className="work" data-state="removed">
              <s>{tasks.work[w.id]}</s> <span className="work-note">{tasks.notNeeded}: {tasks.reason[w.reason!]}</span>
              {w.reason === 'one_crop' && <> <Note kind="assumption" /></>}
            </li>
          ))}
        </ul>
      )}

      {!submitted && list.next === 'submit' && (
        <div id="task-submit" tabIndex={-1} className="task" data-next>
          <h3 className="task-title">{en.readiness.headline.ready_to_submit}</h3>
          <div className="task-go">
            <Button variant="primary" onClick={() => go('submit')}>{tasks.submit.go}</Button>
          </div>
        </div>
      )}

      {renewal.length > 0 && <ol className="tasks">{renewal.map(row)}</ol>}

      {changes.length > 0 && (
        <div className="task-group">
          <h3 className="group-title">
            {home.changes(changes.length)} <Note kind="ai" />
          </h3>
          <ol className="tasks">{changes.map(row)}</ol>
        </div>
      )}

      {rest.length > 0 && <ol className="tasks">{rest.map(row)}</ol>}

      {waiting.length > 0 && (
        <div className="task-group">
          <h3 className="group-title">{home.waiting(waiting.length)}</h3>
          <ol className="tasks">{waiting.map(row)}</ol>
        </div>
      )}

      {list.done.length > 0 && (
        <div className="task-group">
          <h3 className="group-title">
            <button type="button" className="group-toggle" aria-expanded={doneOpen} aria-controls="done-list" onClick={() => setShowDone(!doneOpen)}>
              <span aria-hidden="true">{doneOpen ? '−' : '+'}</span> {home.done(list.done.length)}
            </button>
          </h3>
          <ol id="done-list" className="tasks" hidden={!doneOpen}>
            {list.done.map(row)}
          </ol>
        </div>
      )}
    </section>
  )
}

interface RowProps {
  task: Task
  title: string
  summary: string
  open: boolean
  isNext: boolean
  readOnly: boolean
  onToggle: () => void
  advance: () => void
}

function TaskRow({ task, title, summary, open, isNext, readOnly, onToggle, advance }: RowProps) {
  const bodyId = `task-${task.id}-body`
  // "May be needed" only where he is working, never on collapsed tasks.
  const possible = open ? task.work.filter((w) => w.state === 'possible') : []
  return (
    <li id={`task-${task.id}`} tabIndex={-1} className="task" data-status={task.status} data-open={open || undefined} data-next={isNext || undefined}>
      <div className="task-head">
        <h3 className="task-title">
          {readOnly ? (
            title
          ) : (
            <button type="button" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
              {title}
            </button>
          )}
        </h3>
        <StatusBadge status={task.status} iconOnly={task.status !== 'awaiting_verification'} />
      </div>
      {open ? (
        <div id={bodyId} className="task-body">
          <TaskBody task={task} advance={advance} />
        </div>
      ) : (
        <p className="task-summary">{summary}</p>
      )}
      {possible.length > 0 && (
        <ul className="work-list">
          {possible.map((w) => (
            <li key={w.id} className="work" data-state="possible">
              {tasks.work[w.id]} <span className="work-note">{tasks.mayBeNeeded}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
