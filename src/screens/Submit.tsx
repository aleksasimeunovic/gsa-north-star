import { useState } from 'react'
import { bar, en, finish } from '../copy/en'
import { ActionBar } from '../components/ActionBar'
import { useApp } from '../components/AppContext'
import { EstimateBlock } from '../components/EstimateBlock'
import { ActionPoints } from '../components/ReadinessDrawer'
import { FarmPicture } from '../components/FarmPicture'
import { UnchangedReview } from '../components/UnchangedReview'
import type { Flow } from '../components/useApplicationFlow'
import { STATE_CHECKS, submitCheck } from '../logic/submit'
import { Icon } from '../ui/Icon'
import { Card } from '../ui/Card'
import { Checkbox } from '../ui/Checkbox'
import { Stack } from '../ui/Layout'

/**
 * The last part: whether he can submit, only what to fix or look at (the stepper already shows the rest),
 * his farm as he is about to declare it and the estimate, then an unambiguous submission: what the state
 * still checks, the declaration, one primary action.
 */
export function SubmitStep({ flow }: { flow: Flow }) {
  const { derived, state, dispatch, go } = useApp()
  const { readiness } = derived
  const signed = state.answers.declarationsSigned
  const check = submitCheck(readiness, signed)
  const left = derived.list.todo.map((t) => t.id)
  const [unsigned, setUnsigned] = useState(false)
  const goTo = (id: (typeof left)[number]) => (id === 'renewal' ? go('renewal') : flow.show(id))

  return (
    <Stack gap="lg">
      {(left.length > 0 || derived.report.warnings.length > 0 || derived.report.errors.length > 0) && (
        <section className="action-points" aria-label={finish.submit.blockedTitle}>
          <h3 className="group-title">{left.length > 0 ? finish.submit.blockedTitle : en.readiness.group.look}</h3>
          <ActionPoints onPick={goTo} todo />
        </section>
      )}

      <div className="submit-picture">
        <FarmPicture detailed />
        <div className="submit-side">
          <EstimateBlock />
          <UnchangedReview />
        </div>
      </div>

      {left.length === 0 && (
        <>
          {/* Ready is not approved: what the state still checks, in the same heading. */}
          <section className="status-section" aria-labelledby="checks-title">
            <h3 id="checks-title">{finish.submit.readyTitle}</h3>
            <ul className="status-list">
              {STATE_CHECKS.map((c) => (
                <li key={c}>
                  {/* Not done: what the state will still check, so good to know, not a tick. */}
                  <Icon name="info" />
                  <span>{finish.submit.checks[c]}</span>
                </li>
              ))}
            </ul>
          </section>
          <Card title={finish.submit.declarationTitle} headingLevel={3}>
            <Checkbox
              id="declaration"
              label={finish.submit.declaration}
              checked={signed}
              error={unsigned && !signed ? finish.submit.signFirst : undefined}
              onChange={(v) => dispatch({ type: 'sign_declarations', signed: v })}
            />
          </Card>
        </>
      )}

      {/* One primary action: submit when nothing is left, otherwise the first thing that is. */}
      <ActionBar
        back={flow.back && { label: bar.back, onClick: flow.back }}
        forward={
          left.length > 0
            ? { label: finish.submit.goTo(flow.title(left[0])), onClick: () => goTo(left[0]) }
            : {
                label: finish.submit.button,
                // Never a grey button with no reason: unsigned, it takes him to the declaration and says why.
                onClick: () => {
                  if (!check.canSubmit) {
                    setUnsigned(true)
                    const box = document.getElementById('declaration')
                    box?.scrollIntoView({ block: 'end', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
                    box?.focus({ preventScroll: true })
                    return
                  }
                  dispatch({ type: 'submit' })
                  go('receipt')
                },
              }
        }
        forwardIsPrimary
        onPick={(id) => flow.show(id)}
      />
    </Stack>
  )
}
