import { bar, home, steps } from '../copy/en'
import { isMapChange } from '../logic/application'
import { ActionBar } from '../components/ActionBar'
import { useApp } from '../components/AppContext'
import { Kept } from '../components/Kept'
import { StepOutline } from '../components/StepOutline'
import { Stepper } from '../components/Stepper'
import { AfterAnswerToast, StepView } from '../components/StepView'
import { useApplicationFlow } from '../components/useApplicationFlow'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Review, type MapTask } from './Review'
import { SubmitStep } from './Submit'

/**
 * His application in parts, generated around his farm, one part at a time. The stepper stays at the top,
 * also while he reviews a boundary on the map, so he always knows where he is. Inside a part, one obvious
 * next action on the left and the part at a glance on the right; the last part shows his farm and the
 * estimate before he signs.
 */
export function Application({ target, review }: { target: string | null; review?: string | null }) {
  const { state, go } = useApp()
  // Opening a boundary review straight from a link still puts the stepper on its part.
  const flow = useApplicationFlow(target ?? (review ? `task-${review}` : null))
  const submitted = !!state.answers.submittedAt
  const reviewing = review && isMapChange(review as never) && !submitted ? (review as MapTask) : null

  const { step, forward } = flow
  const forwardLabel = !forward ? '' : 'task' in forward ? bar.next(flow.title(forward.task)) : home.continueTo(steps.name[forward.step])

  if (submitted) {
    return (
      <Banner tone="success">
        <h1 tabIndex={-1}>{home.submitted}</h1>
        <Button variant="link" onClick={() => go('receipt')}>{home.seeReceipt}</Button>
      </Banner>
    )
  }

  return (
    <>
      <div className="step-nav">
        {/* From the map, a part in the stepper leaves the map and opens that part straight away. */}
        <Stepper
          flow={flow}
          onStep={
            reviewing
              ? (id) => {
                  go('welcome')
                  flow.goStep(id)
                }
              : undefined
          }
        />
      </div>
      <section id="step" className="step" aria-labelledby="step-title">
        {/* The stepper already names the part on screen; the heading stays for screen readers. */}
        <h1 id="step-title" tabIndex={-1} className="sr-only">{steps.name[step.id]}</h1>
        {reviewing ? (
          <>
            {/* On the map too, an answer that adds work says what and why. */}
            <AfterAnswerToast flow={flow} />
            <Review id={reviewing} flow={flow} />
          </>
        ) : step.id === 'submit' ? (
          <SubmitStep flow={flow} />
        ) : (
          // One content width for every part: the task on the left, the part at a glance on the right (below on a phone).
          <div className="app-layout">
            <StepView flow={flow} />
            <aside className="app-side">
              <StepOutline flow={flow} />
              <Kept step={step.id} />
            </aside>
          </div>
        )}
      </section>

      {!reviewing && step.id !== 'submit' && (
        <ActionBar
          back={flow.back && { label: bar.back, onClick: flow.back }}
          forward={
            forward
              ? { label: forwardLabel, onClick: () => ('task' in forward ? flow.show(forward.task) : flow.goStep(forward.step)) }
              : undefined
          }
          forwardIsPrimary={flow.forwardIsPrimary}
          next={flow.focusTask?.status === 'action_required' ? flow.focusTask.id : null}
          onPick={(id) => flow.show(id)}
        />
      )}
    </>
  )
}
