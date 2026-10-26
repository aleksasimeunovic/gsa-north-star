import { useRef, useState } from 'react'
import { after as copy, home, steps, tasks } from '../copy/en'
import type { TaskId } from '../logic/application'
import { Button } from '../ui/Button'
import { Text } from '../ui/Layout'
import { Note } from '../ui/Note'
import { StatusBadge } from '../ui/StatusBadge'
import { Toast } from '../ui/Toast'
import { useApp } from './AppContext'
import { TaskBody, taskSummary } from './TaskBodies'
import type { AfterAnswer, Flow } from './useApplicationFlow'

/** One part of his application: what his last answer changed, then the one thing to do now in this part. */
export function StepView({ flow }: { flow: Flow }) {
  const { state } = useApp()
  const submitted = !!state.answers.submittedAt
  return (
    <div className="flow">
      <p aria-live="polite" className="visually-hidden">{flow.announce}</p>
      {!submitted && <AfterAnswerToast flow={flow} />}
      {!submitted && (flow.focusTask ? <NextAction flow={flow} /> : <StepDone flow={flow} />)}
    </div>
  )
}

/** The one next action: what kind of work it is, what to do, and the task itself, open. */
function NextAction({ flow }: { flow: Flow }) {
  const { derived } = useApp()
  const task = flow.focusTask!
  const needsHim = task.status === 'action_required'
  // The very first thing he does in the application is said as a start.
  const first = derived.list.done.length === 0 && derived.list.waiting.length === 0 && task.id === derived.list.next
  const heading = needsHim ? (first && tasks.start[task.id]) || actionTitle(task.id, flow) : flow.title(task.id)

  return (
    <section id="next" className="next" data-kind={task.kind} aria-labelledby="next-title">
      <div className="next-top">
        <div className="next-titles">
          {task.kind === 'change' ? <Note kind="ai" /> : <p className="next-kind">{home.kind[task.kind]}</p>}
          <div className="next-head">
            <h3 id="next-title" tabIndex={-1}>{heading}</h3>
            {!needsHim && <StatusBadge status={task.status} />}
          </div>
        </div>
      </div>
      <TaskBody task={task} />
    </section>
  )
}

function actionTitle(id: TaskId, flow: Flow) {
  if (id.startsWith('measure_')) return tasks.measureAction(flow.title(id))
  // Missing receipts are an upload, named as one; otherwise receipts are something to confirm.
  if (id === 'receipts' && flow.title(id) === tasks.receiptsMissingTitle) return tasks.receiptsMissingTitle
  return tasks.action[id] ?? flow.title(id)
}

/** A part with nothing left: what waits for a check, and the way on to the next part. */
function StepDone({ flow }: { flow: Flow }) {
  const { step, nextStep } = flow
  return (
    <section id="next" className="next" data-done aria-labelledby="next-title">
      <h3 id="next-title" tabIndex={-1}>{home.stepDone(steps.name[step.id])}</h3>
      {step.waiting > 0 && (
        <Text variant="secondary">
          {home.stepWaiting(step.waiting)} <Note kind="assumption" />
        </Text>
      )}
      {nextStep && (
        <div>
          <Button variant="primary" onClick={() => flow.goStep(nextStep.id)}>{home.continueTo(steps.name[nextStep.id])}</Button>
        </div>
      )}
    </section>
  )
}

/**
 * The defining moment, said briefly: what his answer did to the application (done, no longer needed and
 * why, added), as a toast with Undo. The next action has already taken the top slot under it.
 */
function AfterAnswerToast({ flow }: { flow: Flow }) {
  const { derived, state, dispatch } = useApp()
  const a = flow.after
  const [seen, setSeen] = useState<AfterAnswer | null>(null)
  const count = useRef(0)
  const last = useRef<AfterAnswer | null>(null)
  if (a !== last.current) {
    last.current = a
    count.current++
  }
  if (!a || a === seen) return null
  const outcome = (id: TaskId) => taskSummary(id, derived, state)
  const lines = [
    ...a.done.map((id) => copy.done(flow.title(id), outcome(id))),
    ...a.waiting.map((id) => copy.waiting(flow.title(id))),
    ...a.removed.map(({ work }) => copy.removed(tasks.work[work.id], tasks.reason[work.reason!])),
    ...a.added.map((id) => `${flow.title(id)}: ${outcome(id)}`),
  ]
  const [title, ...rest] = lines
  return (
    <Toast
      id={count.current}
      title={title}
      onClose={() => setSeen(a)}
      action={
        state.past.length > 0 && (
          <Button variant="link" onClick={() => dispatch({ type: 'undo' })} aria-label={copy.undoLabel}>
            {copy.undo}
          </Button>
        )
      }
    >
      {rest.length > 0 && (
        <ul className="toast-list">
          {rest.map((l) => <li key={l}>{l}</li>)}
        </ul>
      )}
    </Toast>
  )
}
