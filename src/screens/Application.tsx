import { bar, home, steps } from '../copy/en'
import { isMapChange } from '../logic/application'
import { daysLeft } from '../logic/readiness'
import { ActionBar } from '../components/ActionBar'
import { useApp } from '../components/AppContext'
import { StepOutline } from '../components/StepOutline'
import { Stepper } from '../components/Stepper'
import { StepView } from '../components/StepView'
import { useApplicationFlow } from '../components/useApplicationFlow'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Stack, Text } from '../ui/Layout'
import { Note } from '../ui/Note'
import { Review } from './Review'
import { SubmitStep } from './Submit'

/**
 * Welcome back: his application in parts, generated around his farm, one part at a time. Inside a part, one
 * obvious next action on the left and the part at a glance on the right; the last part shows his farm and
 * the estimate before he signs. Reviewing a boundary on the map happens here too, so what his answer changed
 * is waiting when he comes back.
 */
export function Application({ target, review }: { target: string | null; review?: string | null }) {
  const { derived, state, go } = useApp()
  const { scenario } = derived
  const flow = useApplicationFlow(target)
  const submitted = !!state.answers.submittedAt

  if (review && isMapChange(review as never) && !submitted) return <Review id={review as never} flow={flow} />

  const { step, forward } = flow
  const forwardLabel = !forward ? '' : 'task' in forward ? bar.next(flow.title(forward.task)) : home.continueTo(steps.name[forward.step])

  return (
    <Stack gap="md">
      <header>
        <h1>{home.greeting}</h1>
        <Text>
          {home.deadline(daysLeft(scenario.today, scenario.window.closes), scenario.window.closes)} <Note kind="eu_mandate" />
        </Text>
      </header>

      {submitted ? (
        <Banner tone="success">
          <Text variant="strong">{home.submitted}</Text>
          <Button variant="link" onClick={() => go('receipt')}>{home.seeReceipt}</Button>
        </Banner>
      ) : (
        <>
          <Stepper flow={flow} />
          <section id="step" className="step" aria-labelledby="step-title">
            <h2 id="step-title" className="step-title">
              <span className="step-of">{steps.of(flow.index + 1, derived.list.steps.length)}</span> {steps.name[step.id]}
            </h2>
            {step.id === 'submit' ? (
              <SubmitStep flow={flow} />
            ) : (
              // Desktop: the part at a glance on the right, where the farm summary used to be. Mobile: below.
              <div className="app-layout">
                <StepView flow={flow} />
                <aside className="app-side">
                  <StepOutline flow={flow} />
                </aside>
              </div>
            )}
          </section>
        </>
      )}

      {!submitted && step.id !== 'submit' && (
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
    </Stack>
  )
}
