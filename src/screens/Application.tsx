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
  const { derived, state, go } = useApp()
  const flow = useApplicationFlow(target)
  const submitted = !!state.answers.submittedAt
  const reviewing = review && isMapChange(review as never) && !submitted ? (review as MapTask) : null

  const { step, forward } = flow
  const forwardLabel = !forward ? '' : 'task' in forward ? bar.next(flow.title(forward.task)) : home.continueTo(steps.name[forward.step])
  // Until he has answered anything, the part opens with a greeting rather than a step number.
  const fresh = derived.list.done.length === 0 && derived.list.waiting.length === 0

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
        <header className="step-head">
          <p className="step-of" data-greeting={fresh || undefined}>
            {fresh ? home.greeting : steps.of(flow.index + 1, derived.list.steps.length)}
          </p>
          <h1 id="step-title" tabIndex={-1}>{steps.name[step.id]}</h1>
        </header>
        {reviewing ? (
          <Review id={reviewing} flow={flow} />
        ) : step.id === 'submit' ? (
          <SubmitStep flow={flow} />
        ) : (
          // Desktop: the part at a glance on the right. Mobile: below.
          <div className="app-layout">
            <StepView flow={flow} />
            <aside className="app-side">
              <StepOutline flow={flow} />
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
          onPick={(id) => flow.show(id)}
        />
      )}
    </>
  )
}
