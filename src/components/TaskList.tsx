import { useState } from 'react'
import { after as copy, en, home, tasks } from '../copy/en'
import { KINDS, laterByKind, taskKind, type Task, type TaskId, type TaskKind } from '../logic/application'
import { Button } from '../ui/Button'
import { Note } from '../ui/Note'
import { StatusBadge } from '../ui/StatusBadge'
import { useApp } from './AppContext'
import { TaskBody, taskSummary } from './TaskBodies'
import type { Flow } from './useApplicationFlow'

/**
 * His application, answering three questions in order: what to do next (one task, open, at the top),
 * what's already done (one closed line), and what can wait (one closed line per kind: changes GSA found,
 * his choices this year, what's the same as last year). Everything else opens when he asks for it.
 */
export function TaskList({ flow }: { flow: Flow }) {
  const { derived, state } = useApp()
  const { list } = derived
  const submitted = !!state.answers.submittedAt
  const later = laterByKind(list, flow.focus)
  const waiting = list.waiting.filter((t) => t.id !== flow.focus)
  const done = list.done.filter((t) => t.id !== flow.focus)
  const doneOpen = flow.showDone || submitted

  return (
    <div className="flow">
      <p aria-live="polite" className="visually-hidden">{flow.announce}</p>
      {!submitted && <AfterAnswerPanel flow={flow} />}
      {!submitted && <NextAction flow={flow} />}

      {waiting.length + done.length > 0 && (
        <section className="rows-group" aria-labelledby="done-title">
          <h2 id="done-title" className="group-title">
            <button type="button" className="group-toggle" aria-expanded={doneOpen} aria-controls="done-list" onClick={() => flow.setShowDone(!doneOpen)}>
              <span aria-hidden="true">{doneOpen ? '−' : '+'}</span> {home.handled(done.length, waiting.length)}
            </button>
          </h2>
          <ul id="done-list" className="rows" hidden={!doneOpen}>
            {[...waiting, ...done].map((t) => <Row key={t.id} task={t} flow={flow} />)}
          </ul>
        </section>
      )}

      {KINDS.some((kind) => later[kind].length > 0) && (
        <section className="later-all" aria-labelledby="later-title">
          <h2 id="later-title" className="group-title">{home.later}</h2>
          {KINDS.map((kind) => later[kind].length > 0 && <Later key={kind} kind={kind} tasks={later[kind]} flow={flow} />)}
        </section>
      )}
    </div>
  )
}

/** The one next action: what kind of work it is, what to do, and the task itself, open. */
function NextAction({ flow }: { flow: Flow }) {
  const { derived, go } = useApp()
  const { list } = derived
  const task = flow.focusTask

  if (flow.focus === 'submit') {
    return (
      <section id="next" className="next" aria-labelledby="next-title">
        <h2 id="next-title" tabIndex={-1}>{en.readiness.headline.ready_to_submit}</h2>
        <div>
          <Button variant="primary" onClick={() => go('submit')}>{tasks.submit.go}</Button>
        </div>
      </section>
    )
  }
  if (!task) return null

  const kind = taskKind(task.id)
  const needsHim = task.status === 'action_required'
  const first = list.done.length === 0 && list.waiting.length === 0 && task.id === list.next
  const heading = needsHim ? (first && tasks.start[task.id]) || actionTitle(task.id, flow) : flow.title(task.id)

  return (
    <section id="next" className="next" data-kind={kind} aria-labelledby="next-title">
      <p className="next-kind">
        {home.kind[kind]} {kind === 'change' && <Note kind="ai" />}
      </p>
      <div className="next-head">
        <h2 id="next-title" tabIndex={-1}>{heading}</h2>
        {!needsHim && <StatusBadge status={task.status} />}
      </div>
      <TaskBody task={task} />
    </section>
  )
}

function actionTitle(id: TaskId, flow: Flow) {
  if (id.startsWith('measure_')) return tasks.measureAction(flow.title(id))
  if (id === 'receipts') return tasks.action.receipts
  return tasks.action[id] ?? flow.title(id)
}

/** One kind of work that can wait: a closed line with its count; opened, the tasks by name, each opens in the top slot. */
function Later({ kind, tasks: list, flow }: { kind: TaskKind; tasks: Task[]; flow: Flow }) {
  const [open, setOpen] = useState(false)
  const listId = `later-${kind}`
  // "Same as last year" is one confirmation; opened, it names each thing it covers.
  const rows = list.flatMap((t) =>
    t.id === 'same' && t.members
      ? t.members.map((m) => ({ key: m, open: t.id, title: tasks.title[m] }))
      : [{ key: t.id, open: t.id, title: flow.title(t.id) }],
  )
  return (
    <div className="later" data-kind={kind}>
      <h3 className="later-title">
        <button type="button" className="group-toggle" aria-expanded={open} aria-controls={listId} onClick={() => setOpen(!open)}>
          <span aria-hidden="true">{open ? '−' : '+'}</span> <span aria-hidden="true" className="kind-mark" /> {home.kind[kind]}{' '}
          <span className="count">({rows.length})</span>
        </button>
      </h3>
      <ul id={listId} className="rows" hidden={!open}>
        {rows.map((r) => (
          <li key={r.key} className="row">
            <button
              type="button"
              className="row-title"
              onClick={() => {
                // It moves to the top slot, so the group closes again.
                setOpen(false)
                flow.show(r.open)
              }}
            >
              {r.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** A task that is done or waiting for a check: one line with its outcome, opens in the top slot. */
function Row({ task, flow }: { task: Task; flow: Flow }) {
  const { derived, state } = useApp()
  const submitted = !!state.answers.submittedAt
  const title = flow.title(task.id)
  return (
    <li className="row" data-status={task.status}>
      <StatusBadge status={task.status} iconOnly />
      <div className="row-text">
        {submitted ? (
          <span className="row-title">{title}</span>
        ) : (
          <button type="button" className="row-title" onClick={() => flow.show(task.id)}>{title}</button>
        )}
        <span className="row-summary">{taskSummary(task.id, derived, state)}</span>
      </div>
    </li>
  )
}

/**
 * The defining moment: his answer, then what it did to the application. What's done, what is no longer
 * needed and why, what was added, with Undo in case it was a mistake. The next action follows right under it.
 */
function AfterAnswerPanel({ flow }: { flow: Flow }) {
  const { derived, state, dispatch } = useApp()
  const a = flow.after
  if (!a) return null
  const outcome = (id: TaskId) => taskSummary(id, derived, state)
  return (
    <section className="after" aria-labelledby="after-title" data-has-change>
      <div className="after-head">
        <h2 id="after-title" className="group-title">{copy.title}</h2>
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
    </section>
  )
}
