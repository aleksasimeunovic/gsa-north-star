import { useState } from 'react'
import { bar, finish } from '../copy/en'
import { ActionBar } from '../components/ActionBar'
import { useApp } from '../components/AppContext'
import { EstimateBlock } from '../components/EstimateBlock'
import { StepReview } from '../components/StepReview'
import { FarmPicture } from '../components/FarmPicture'
import { taskSummary } from '../components/TaskBodies'
import type { Flow } from '../components/useApplicationFlow'
import { STATE_CHECKS, submitCheck } from '../logic/submit'
import { Icon } from '../ui/Icon'
import { Card } from '../ui/Card'
import { Checkbox } from '../ui/Checkbox'
import { Stack, Text } from '../ui/Layout'
import { Note } from '../ui/Note'
import { StatusBadge } from '../ui/StatusBadge'

/**
 * The last part: his farm as he is about to declare it and the estimate, then an unambiguous submission:
 * what's left or what waits, what the state still checks, the declaration, one primary action.
 */
export function SubmitStep({ flow }: { flow: Flow }) {
  const { derived, state, dispatch, go } = useApp()
  const { readiness } = derived
  const signed = state.answers.declarationsSigned
  const check = submitCheck(readiness, signed)
  const [tried, setTried] = useState(false)
  const left = derived.list.todo.map((t) => t.id)
  const goTo = (id: (typeof left)[number]) => (id === 'renewal' ? go('renewal') : flow.show(id))

  return (
    <Stack gap="lg">
      <StepReview flow={flow} title={left.length ? finish.submit.blockedTitle : finish.submit.allAnswered} />

      <div className="submit-picture">
        <FarmPicture detailed />
        <EstimateBlock />
      </div>

      {readiness.awaiting.length > 0 && (
        <section aria-labelledby="awaiting-title">
          <h3 id="awaiting-title">{finish.submit.awaitingTitle}</h3>
          <Text variant="secondary">
            {finish.submit.awaitingNote} <Note kind="assumption" />
          </Text>
          <ul className="plain-list">
            {readiness.awaiting.map((i) => (
              <li key={i.id}>
                <StatusBadge status={i.status} iconOnly /> <strong>{flow.title(i.id)}</strong>: {taskSummary(i.id, derived, state)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {left.length === 0 && (
        <>
          {/* Ready is not approved: what the state still checks, in the same heading. */}
          <section aria-labelledby="checks-title">
            <h3 id="checks-title">{finish.submit.readyTitle}</h3>
            <ul className="check-list">
              {STATE_CHECKS.map((c) => (
                <li key={c}>
                  <Icon name="same" /> {finish.submit.checks[c]}
                </li>
              ))}
            </ul>
          </section>
          <Card title={finish.submit.declarationTitle} headingLevel={3}>
            <span id="declaration" tabIndex={-1} />
            {tried && !signed && (
              <Text variant="strong" as="p">
                <span className="error" role="alert">{finish.submit.signError}</span>
              </Text>
            )}
            <Checkbox label={finish.submit.declaration} checked={signed} onChange={(v) => dispatch({ type: 'sign_declarations', signed: v })} />
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
                onClick: () => {
                  if (!check.canSubmit) {
                    setTried(true)
                    document.getElementById('declaration')?.focus()
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
