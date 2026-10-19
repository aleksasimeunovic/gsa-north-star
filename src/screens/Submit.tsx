import { en, finish, itemLabel } from '../copy/en'
import { useApp } from '../components/AppContext'
import { itemTarget } from '../components/targets'
import { STATE_CHECKS, submitCheck } from '../logic/submit'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Checkbox } from '../ui/Checkbox'
import { Stack, Text } from '../ui/Layout'
import { StatusBadge } from '../ui/StatusBadge'
import { Note } from '../ui/Note'

/** Unambiguous submission: what's done, what waits, what the state checks, one button. */
export function Submit() {
  const { derived, state, dispatch, go } = useApp()
  const { items, readiness, changes } = derived
  const signed = state.answers.declarationsSigned
  const check = submitCheck(readiness, signed)
  const actionOrRenewal = check.reasons.filter((r) => r !== 'declarations')
  const complete = items.filter((i) => i.status === 'complete')

  return (
    <Stack gap="lg">
      {actionOrRenewal.length === 0 ? (
        <Banner tone="success">
          <Text variant="strong">{finish.submit.readyTitle}</Text>
          <Text>{finish.submit.readyNote}</Text>
        </Banner>
      ) : (
        <Banner tone="attention">
          <Stack gap="sm">
            <Text variant="strong">{finish.submit.blockedTitle}</Text>
            {check.reasons.includes('renewal') && (
              <div>
                <Text>{finish.submit.reasons.renewal}</Text>
                <Button variant="link" onClick={() => go('renewal')}>{finish.submit.goRenew}</Button>
              </div>
            )}
            {check.reasons.includes('action_required') && (
              <div>
                <Text>
                  {finish.submit.reasons.action_required(readiness.blockers.length)} <Note kind="tested" />
                </Text>
                <ul>
                  {readiness.blockers.map((i) => (
                    <li key={i.id}>
                      <Button variant="link" onClick={() => go(...itemTarget(i, changes))}>
                        {itemLabel(i.id)}: {en.itemDetail[i.detail]}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Stack>
        </Banner>
      )}

      {readiness.awaiting.length > 0 && (
        <section aria-labelledby="awaiting-title">
          <h2 id="awaiting-title">
            <StatusBadge status="awaiting_verification" />
          </h2>
          <Text variant="secondary">
            {finish.submit.awaitingNote} <Note kind="assumption" />
          </Text>
          <ul>
            {readiness.awaiting.map((i) => (
              <li key={i.id}>
                <strong>{itemLabel(i.id)}</strong>: {en.itemDetail[i.detail]}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="complete-title">
        <h2 id="complete-title">
          <StatusBadge status="complete" />
        </h2>
        <Text variant="secondary">{complete.map((i) => itemLabel(i.id)).join(', ')}.</Text>
      </section>

      <section aria-labelledby="checks-title">
        <h2 id="checks-title">{finish.submit.checksTitle}</h2>
        <ul>
          {STATE_CHECKS.map((c) => (
            <li key={c}>{finish.submit.checks[c]}</li>
          ))}
        </ul>
      </section>

      <Card title={finish.submit.declarationTitle} headingLevel={2}>
        <Checkbox label={finish.submit.declaration} checked={signed} onChange={(v) => dispatch({ type: 'sign_declarations', signed: v })} />
      </Card>

      <Stack gap="sm">
        {!check.canSubmit && check.reasons.length > 0 && (
          <Text variant="small" as="p">
            <span id="submit-why">{check.reasons.map((r) => (r === 'action_required' ? finish.submit.reasons.action_required(readiness.blockers.length).replace(':', '.') : finish.submit.reasons[r])).join(' ')}</span>
          </Text>
        )}
        <div>
          <Button
            variant="primary"
            aria-disabled={!check.canSubmit}
            aria-describedby={check.canSubmit ? undefined : 'submit-why'}
            onClick={() => {
              if (!check.canSubmit) return
              dispatch({ type: 'submit' })
              go('receipt')
            }}
          >
            {finish.submit.button}
          </Button>
        </div>
      </Stack>
    </Stack>
  )
}
