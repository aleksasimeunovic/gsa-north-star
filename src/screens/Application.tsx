import { bar, home, steps } from '../copy/en'
import { isMapChange } from '../logic/application'
import { ActionBar } from '../components/ActionBar'
import { useApp } from '../components/AppContext'
import { StepOutline } from '../components/StepOutline'
import { Stepper } from '../components/Stepper'
import { StepView } from '../components/StepView'
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
        <Stepper flow={flow} />
      </div>
      <section id="step" className="step" aria-labelledby="step-title">
        {/* The stepper already names the part on screen; the heading stays for screen readers. */}
        <h1 id="step-title" tabIndex={-1} className="sr-only">{steps.name[step.id]}</h1>
        {reviewing ? (
          <Review id={reviewing} flow={flow} />
        ) : step.id === 'submit' ? (
          <SubmitStep flow={flow} />
        ) : (
          // A part with several things: the part at a glance on the right (below on a phone). One thing: full width.
          <div className="app-layout" data-single={step.tasks.length < 2 || undefined}>
            <StepView flow={flow} />
            {step.tasks.length > 1 && (
              <aside className="app-side">
                <StepOutline flow={flow} />
              </aside>
            )}
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
          onPick={(id) => flow.show(id)}
        />
      )}
    </>
  )
}
