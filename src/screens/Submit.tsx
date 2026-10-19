import { useState } from 'react'
import { en, finish, itemLabel, wiz } from '../copy/en'
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
  const { readiness, changes } = derived
  const signed = state.answers.declarationsSigned
  const check = submitCheck(readiness, signed)
  const actionOrRenewal = check.reasons.filter((r) => r !== 'declarations')
  const [tried, setTried] = useState(false)

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
            <span id="submit-blockers" tabIndex={-1} />
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

      <section aria-labelledby="checks-title">
        <h2 id="checks-title">{finish.submit.checksTitle}</h2>
        <ul>
          {STATE_CHECKS.map((c) => (
            <li key={c}>{finish.submit.checks[c]}</li>
          ))}
        </ul>
      </section>

      <Card title={finish.submit.declarationTitle} headingLevel={2}>
        <span id="declaration" tabIndex={-1} />
        {tried && !signed && (
          <Text variant="strong" as="p">
            <span className="error" role="alert">{finish.submit.signError}</span>
          </Text>
        )}
        <Checkbox label={finish.submit.declaration} checked={signed} onChange={(v) => dispatch({ type: 'sign_declarations', signed: v })} />
      </Card>

      {/* Same sticky bar as the other steps, with Submit as its one primary action. */}
      <nav className="step-nav" aria-label={wiz.stepNav}>
        <Button onClick={() => go('everything_else')}>{wiz.back}</Button>
        <Button
            variant="primary"
            onClick={() => {
              if (!check.canSubmit) {
                // Say what's left, right where it is.
                setTried(true)
                const first = actionOrRenewal.length ? 'submit-blockers' : 'declaration'
                const el = document.getElementById(first)
                el?.scrollIntoView({ block: 'center' })
                el?.focus({ preventScroll: true })
                return
              }
              dispatch({ type: 'submit' })
              go('receipt')
            }}
          >
            {finish.submit.button}
          </Button>
      </nav>
    </Stack>
  )
}
