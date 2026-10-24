import { after as copy, home, steps, tasks } from '../copy/en'
import type { TaskId } from '../logic/application'
import { Button } from '../ui/Button'
import { Text } from '../ui/Layout'
import { Note } from '../ui/Note'
import { StatusBadge } from '../ui/StatusBadge'
import { useApp } from './AppContext'
import { TaskBody, taskSummary } from './TaskBodies'
import type { Flow } from './useApplicationFlow'

/** One part of his application: what his last answer changed, then the one thing to do now in this part. */
export function StepView({ flow }: { flow: Flow }) {
  const { state } = useApp()
  const submitted = !!state.answers.submittedAt
  return (
    <div className="flow">
      <p aria-live="polite" className="visually-hidden">{flow.announce}</p>
      {!submitted && <AfterAnswerPanel flow={flow} />}
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
      <p className="next-kind">
        {home.kind[task.kind]} {task.kind === 'change' && <Note kind="ai" />}
      </p>
      <div className="next-head">
        <h3 id="next-title" tabIndex={-1}>{heading}</h3>
        {!needsHim && <StatusBadge status={task.status} />}
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
        <h3 id="after-title" className="group-title">{copy.title}</h3>
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
