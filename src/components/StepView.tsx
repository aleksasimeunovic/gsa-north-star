import { useEffect, useRef, useState } from 'react'
import { after as copy, en, home, steps, tasks } from '../copy/en'
import type { TaskId } from '../logic/application'
import { isMapTask, stepOf } from '../logic/application'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { Inline, Text, VisuallyHidden } from '../ui/Layout'
import { StageAction } from '../ui/MapStage'
import { Note } from '../ui/Note'
import { StatusBadge } from '../ui/StatusBadge'
import { Toast, type ToastKind } from '../ui/Toast'
import { useApp } from './AppContext'
import { nextActionLabel } from './ReadinessBar'
import { MapFacts, MapReviewButton, TaskBody, taskSummary } from './TaskBodies'
import { taskIcon } from './taskIcon'
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
  const { derived, state } = useApp()
  const task = flow.focusTask!
  const needsHim = task.status === 'action_required'
  // The very first thing he does in the application is said as a start.
  const first = derived.list.done.length === 0 && derived.list.waiting.length === 0 && task.id === derived.list.next
  const heading = needsHim ? (first && tasks.start[task.id]) || actionTitle(task.id, derived.items) : flow.title(task.id)

  return (
    <section key={task.id} id="next" className="next" data-kind={task.kind} aria-labelledby="next-title">
      {/* Heading and its one line of context are one group; the map's way in sits opposite it. */}
      <div className="next-top">
        <div className="next-titles">
          {task.kind === 'change' && <Note kind="ai" />}
          <div className="next-head">
            <h3 id="next-title" tabIndex={-1}>{heading}</h3>
            {!needsHim && <StatusBadge mark={task.mark} />}
          </div>
          {/* A road he gave up has its outcome as facts under the map, so the line isn't said twice. */}
          {isMapTask(task.id) && !(task.id === 'field_road' && task.status === 'complete') && <p className="next-lead">{taskSummary(task.id, derived, state)}</p>}
        </div>
        <MapReviewButton id={task.id} />
      </div>
      <TaskBody task={task} />
      {/* Changing a decision in a finished part: the way back to all of them. */}
      {!needsHim && flow.step.left === 0 && (
        <div>
          <Button onClick={() => flow.goStep(flow.step.id)}>
            <Icon name="back" size="sm" />
            {home.backToList}
          </Button>
        </div>
      )}
    </section>
  )
}

// Missing receipts are an upload, named as one; a blurry one is sent again; otherwise receipts are confirmed.
const actionTitle = (id: TaskId, items: { id: string; detail: string }[]) => nextActionLabel(id, items)

/**
 * A part with nothing left: every decision he made in it, one by one, each with its outcome and a way to
 * change it, so a wrong tap is never final. Then what waits for a check, and the way on to the next part.
 */
function StepDone({ flow }: { flow: Flow }) {
  const { derived, state } = useApp()
  const { step, nextStep } = flow
  return (
    <section id="next" className="next" data-done aria-labelledby="next-title">
      <h3 id="next-title" tabIndex={-1}>{home.stepDone(steps.name[step.id])}</h3>
      {step.waiting > 0 && (
        <Text variant="secondary">
          {home.stepWaiting(step.waiting)} <Note kind="assumption" />
        </Text>
      )}
      <ul className="resolved-list">
        {step.tasks.map((t) => {
          const name = flow.title(t.id)
          // The road's outcome is two plain facts: what the field becomes and what that does to the payment.
          const facts = t.id === 'field_road' && t.status === 'complete'
          return (
            <li key={t.id} className="resolved">
              <span className="resolved-icon" aria-hidden="true">
                <Icon name={taskIcon(t.id)} />
              </span>
              <div className="resolved-text">
                <div className="resolved-head">
                  <strong>{name}</strong>
                  <StatusBadge mark={t.mark} />
                </div>
                {facts ? <MapFacts id="field_road" /> : <span className="hint">{taskSummary(t.id, derived, state)}</span>}
              </div>
              <Button onClick={() => flow.show(t.id)}>
                {en.change}
                <VisuallyHidden>: {name}</VisuallyHidden>
              </Button>
            </li>
          )
        })}
      </ul>
      {nextStep && (
        <StageAction>
          <Inline>
            <Button variant="primary" onClick={() => flow.goStep(nextStep.id)}>{home.continueTo(steps.name[nextStep.id])}<Icon name="forward" size="sm" /></Button>
          </Inline>
        </StageAction>
      )}
    </section>
  )
}

/**
 * The defining moment, said briefly: one line about what his answer did to the application, with Undo.
 * The next action has already taken the top slot under it.
 */
export function AfterAnswerToast({ flow, onMap }: { flow: Flow; onMap?: boolean }) {
  const { derived, state, dispatch } = useApp()
  const a = flow.after
  const [seen, setSeen] = useState<AfterAnswer | null>(null)
  const count = useRef(0)
  const last = useRef<AfterAnswer | null>(null)
  if (a !== last.current) {
    last.current = a
    count.current++
  }
  // Work his answer added comes first, so the finish line never moves silently; then a part he finished.
  const finished = !a ? undefined : derived.list.steps.find((st) => st.id !== 'submit' && st.left === 0 && a.done.some((id) => stepOf(id) === st.id))
  const lines: { kind: ToastKind; title: string }[] = !a ? [] : [
    // On the map he is already inside the work his answer added (the steps say so), so it isn't said twice.
    ...(onMap ? [] : a.more.map(({ work }) => ({ kind: 'added' as const, title: copy.more(tasks.work[work.id]) }))),
    ...a.added.map((id) => ({ kind: 'added' as const, title: copy.more(flow.title(id)) })),
    ...(finished ? [{ kind: 'done' as const, title: home.stepFinished(steps.name[finished.id]) }] : []),
    ...a.done.map((id) => ({ kind: 'done' as const, title: copy.done(flow.title(id)) })),
    ...a.waiting.map((id) => ({ kind: 'waiting' as const, title: copy.waiting(flow.title(id)) })),
    ...a.removed.map(({ work }) => ({ kind: 'removed' as const, title: copy.removed(tasks.work[work.id]) })),
  ]
  const line = lines[0]
  // Nothing to say about this answer here: it is spent, so it isn't said late on the next screen.
  useEffect(() => {
    if (a && !line) flow.spend()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a, line])
  if (!a || a === seen || !line) return null
  return <Toast id={count.current} kind={line.kind} title={line.title} onClose={() => setSeen(a)} undo={state.past.length > 0 ? { label: copy.undo, hint: copy.undoLabel, onClick: () => dispatch({ type: 'undo' }) } : undefined} />
}
