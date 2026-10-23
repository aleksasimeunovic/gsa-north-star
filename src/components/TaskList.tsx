import { after as copy, en, home, tasks } from '../copy/en'
import { CHANGE_TASKS, type Task } from '../logic/application'
import { Button } from '../ui/Button'
import { Note } from '../ui/Note'
import { StatusBadge } from '../ui/StatusBadge'
import { useApp } from './AppContext'
import { NudgeLine } from './NudgeLine'
import { TaskBody, taskSummary } from './TaskBodies'
import type { Flow } from './useApplicationFlow'

/**
 * His application as one list, ordered by status: what needs him first, then what waits for a check,
 * then what's done (collapsed). At the top, GSA says what his last answer changed and what's next.
 */
export function TaskList({ flow }: { flow: Flow }) {
  const { derived, state, go } = useApp()
  const { list } = derived
  const submitted = !!state.answers.submittedAt
  const { open, held, title } = flow
  const all = [...list.todo, ...list.waiting, ...list.done]

  const heldTask = held ? all.find((t) => t.id === held && t.status !== 'action_required') : undefined
  const todo = heldTask ? [heldTask, ...list.todo] : list.todo
  const changes = todo.filter((t) => CHANGE_TASKS.includes(t.id))
  const renewal = todo.filter((t) => t.id === 'renewal')
  const rest = todo.filter((t) => t.id !== 'renewal' && !CHANGE_TASKS.includes(t.id))
  const waiting = list.waiting.filter((t) => t !== heldTask)
  const doneOpen = flow.showDone || list.done.some((t) => t.id === open)

  const row = (t: Task) => (
    <TaskRow
      key={t.id}
      task={t}
      title={title(t.id)}
      summary={taskSummary(t.id, derived, state)}
      open={open === t.id}
      isNext={list.next === t.id}
      readOnly={submitted}
      onToggle={() => flow.toggle(t.id)}
    />
  )

  return (
    <section aria-labelledby="list-title" className="task-section">
      <h2 id="list-title" className="visually-hidden">{home.listTitle}</h2>
      <p aria-live="polite" className="visually-hidden">{flow.announce}</p>

      {!submitted && <AfterAnswerPanel flow={flow} />}

      {!submitted && list.next === 'submit' && (
        <div id="task-submit" tabIndex={-1} className="task" data-next>
          <h3 className="task-title">{en.readiness.headline.ready_to_submit}</h3>
          <div className="task-go">
            <Button variant="link" onClick={() => go('submit')}>{tasks.submit.go}</Button>
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
            <button type="button" className="group-toggle" aria-expanded={doneOpen} aria-controls="done-list" onClick={() => flow.setShowDone(!doneOpen)}>
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

/**
 * The defining moment: his answer, then what it did to the application. What's done, what is no longer
 * needed and why, what was added, with Undo in case it was a mistake, then the one next step.
 */
function AfterAnswerPanel({ flow }: { flow: Flow }) {
  const { derived, state, dispatch } = useApp()
  const a = flow.after
  const outcome = (id: Parameters<typeof taskSummary>[0]) => taskSummary(id, derived, state)
  return (
    <section className="after" aria-label={a ? copy.title : undefined} data-has-change={a ? true : undefined}>
      {a && (
        <>
          <div className="after-head">
            <h3 className="group-title">{copy.title}</h3>
            {state.past.length > 0 && (
              <Button variant="link" onClick={() => dispatch({ type: 'undo' })} aria-label={copy.undoLabel}>
                {copy.undo}
              </Button>
            )}
          </div>
          <ul className="after-list">
            {a.done.map((id) => (
              <li key={id} data-kind="done">
                <StatusBadge status="complete" iconOnly /> {copy.done(flow.title(id), outcome(id))}
              </li>
            ))}
            {a.waiting.map((id) => (
              <li key={id} data-kind="waiting">
                <StatusBadge status="awaiting_verification" iconOnly /> {copy.waiting(flow.title(id))} <Note kind="assumption" />
              </li>
            ))}
            {a.removed.map(({ work }) => (
              <li key={work.id} data-kind="removed">
                <span aria-hidden="true" className="after-icon">−</span> {copy.removed(tasks.work[work.id], tasks.reason[work.reason!])}
              </li>
            ))}
            {a.added.map((id) => (
              <li key={id} data-kind="added">
                <span aria-hidden="true" className="after-icon">+</span> {flow.title(id)}: {outcome(id)}
              </li>
            ))}
          </ul>
        </>
      )}
      <NudgeLine />
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
}

function TaskRow({ task, title, summary, open, isNext, readOnly, onToggle }: RowProps) {
  const bodyId = `task-${task.id}-body`
  // Before he answers, the work a change could still need is named, so he sees it go.
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
        <StatusBadge status={task.status} iconOnly={task.status !== 'awaiting_verification'} />
      </div>
      {open ? (
        <div id={bodyId} className="task-body">
          <TaskBody task={task} />
        </div>
      ) : (
        <p className="task-summary">{summary}</p>
      )}
      {possible.length > 0 && (
        <ul className="work-list">
          {possible.map((w) => (
            <li key={w.id} className="work" data-state="possible">
              {tasks.mightNeed(tasks.work[w.id])}
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
