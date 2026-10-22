import { useEffect, useRef, useState } from 'react'
import { home, tasks } from '../copy/en'
import { newlyRemoved, type Task, type TaskId, type Work } from '../logic/application'
import { Button } from '../ui/Button'
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
 * His application as one list. After each answer: done work collapses, work that's no longer
 * needed leaves with a one-line reason, and the next action opens and takes focus.
 */
export function TaskList({ target }: { target: string | null }) {
  const { derived, state, go } = useApp()
  const { list, readiness } = derived
  const submitted = !!state.answers.submittedAt
  const receiptsMissing = derived.items.some((i) => i.detail === 'receipts_missing')
  const title = (id: TaskId | 'submit') => taskTitle(id, receiptsMissing)

  const [open, setOpen] = useState<Open>(submitted || list.next === 'submit' ? null : list.next)
  const [recent, setRecent] = useState<Removed[]>([])
  const [announce, setAnnounce] = useState('')
  const [focusId, setFocusId] = useState<Open>(null)
  const before = useRef(list)
  const key = JSON.stringify(list.tasks.map((t) => [t.id, t.status, t.work]))

  const moveTo = (next: Open) => {
    setOpen(next === 'submit' ? null : next)
    setFocusId(next)
  }
  const advance = () => moveTo(list.next)

  // React to each answer: what finished, what is no longer needed, what's next.
  useEffect(() => {
    const prev = before.current
    before.current = list
    if (prev === list) return
    const removed = newlyRemoved(prev, list)
    setRecent(removed)
    const was = prev.tasks.find((t) => t.id === open)?.status
    const now = list.tasks.find((t) => t.id === open)?.status
    const finished = open !== null && open !== 'submit' && was === 'action_required' && now === 'complete'
    const words = removed.map((r) => home.announce.removed(tasks.work[r.work.id]))
    if (finished) {
      words.unshift(home.announce.done(title(open)))
      if (list.next) words.push(home.announce.next(title(list.next)))
      moveTo(list.next)
    }
    if (words.length) setAnnounce(words.join(' '))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  // Arriving from elsewhere (readiness line, Submit) opens the task asked for.
  useEffect(() => {
    if (target?.startsWith('task-') && !submitted) {
      const id = target.slice(5) as TaskId | 'submit'
      setOpen(id === 'submit' ? null : id)
    }
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

  const toAct = readiness.blockers.length + (readiness.renewalNeeded ? 1 : 0)

  return (
    <section aria-labelledby="list-title" className="task-section">
      <h2 id="list-title">{home.listTitle}</h2>
      <p aria-live="polite" className="visually-hidden">{announce}</p>
      <ol className="tasks">
        {list.tasks.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            title={title(t.id)}
            summary={taskSummary(t.id, derived, state)}
            open={open === t.id}
            isNext={list.next === t.id}
            readOnly={submitted}
            recent={recent.filter((r) => r.taskId === t.id)}
            onToggle={() => setOpen(open === t.id ? null : t.id)}
            advance={advance}
          />
        ))}
        {!submitted && (
          <li id="task-submit" tabIndex={-1} className="task" data-next={list.next === 'submit' || undefined}>
            <div className="task-head">
              <h3 className="task-title">{tasks.title.submit}</h3>
            </div>
            {list.next === 'submit' ? (
              <div className="task-go">
                <Button variant="primary" onClick={() => go('submit')}>{tasks.submit.go}</Button>
              </div>
            ) : (
              <p className="task-summary">{tasks.submit.first(toAct)}</p>
            )}
          </li>
        )}
      </ol>
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
  recent: Removed[]
  onToggle: () => void
  advance: () => void
}

function TaskRow({ task, title, summary, open, isNext, readOnly, recent, onToggle, advance }: RowProps) {
  const bodyId = `task-${task.id}-body`
  const possible = task.work.filter((w) => w.state === 'possible')
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
        <StatusBadge status={task.status} iconOnly={task.status === 'complete' && !open} />
      </div>
      {open ? (
        <div id={bodyId} className="task-body">
          <TaskBody id={task.id} advance={advance} />
        </div>
      ) : (
        <p className="task-summary">{summary}</p>
      )}
      {(possible.length > 0 || recent.length > 0) && (
        <ul className="work-list">
          {possible.map((w) => (
            <li key={w.id} className="work" data-state="possible">
              {tasks.work[w.id]} <span className="work-note">{tasks.mayBeNeeded}</span>
            </li>
          ))}
          {recent.map(({ work: w }) => (
            <li key={w.id} className="work" data-state="removed">
              <s>{tasks.work[w.id]}</s> <span className="work-note">{tasks.notNeeded}: {tasks.reason[w.reason!]}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
