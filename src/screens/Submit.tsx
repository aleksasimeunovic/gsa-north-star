import { bar, finish } from '../copy/en'
import { ActionBar } from '../components/ActionBar'
import { useApp } from '../components/AppContext'
import { EstimateBlock } from '../components/EstimateBlock'
import { StepReview } from '../components/StepReview'
import { FarmPicture } from '../components/FarmPicture'
import { UnchangedReview } from '../components/UnchangedReview'
import { taskSummary } from '../components/TaskBodies'
import type { Flow } from '../components/useApplicationFlow'
import { STATE_CHECKS, submitCheck } from '../logic/submit'
import { Icon } from '../ui/Icon'
import { Card } from '../ui/Card'
import { Checkbox } from '../ui/Checkbox'
import { Stack, Text } from '../ui/Layout'
import { Note } from '../ui/Note'
import { StatusBadge } from '../ui/StatusBadge'
import { markOf } from '../logic/severity'

/**
 * The last part: his farm as he is about to declare it and the estimate, then an unambiguous submission:
 * what's left or what waits, what the state still checks, the declaration, one primary action.
 */
export function SubmitStep({ flow }: { flow: Flow }) {
  const { derived, state, dispatch, go } = useApp()
  const { readiness } = derived
  const signed = state.answers.declarationsSigned
  const check = submitCheck(readiness, signed)
  const left = derived.list.todo.map((t) => t.id)
  const goTo = (id: (typeof left)[number]) => (id === 'renewal' ? go('renewal') : flow.show(id))

  return (
    <Stack gap="lg">
      {left.length > 0 && <StepReview flow={flow} title={finish.submit.blockedTitle} />}

      <div className="submit-picture">
        <FarmPicture detailed />
        <div className="submit-side">
          <EstimateBlock />
          <UnchangedReview />
        </div>
      </div>

      {readiness.awaiting.length > 0 && (
        <section className="status-section" aria-labelledby="awaiting-title">
          <h3 id="awaiting-title">{finish.submit.awaitingTitle}</h3>
          <Text variant="secondary">
            {finish.submit.awaitingNote} <Note kind="assumption" />
          </Text>
          <ul className="status-list">
            {readiness.awaiting.map((i) => (
              <li key={i.id}>
                <StatusBadge mark={markOf(i)} iconOnly />
                <span>
                  <strong>{flow.title(i.id)}</strong>
                  <span className="hint">{taskSummary(i.id, derived, state)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

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
                disabled: !check.canSubmit,
                onClick: () => {
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
