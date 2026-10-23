import { useState } from 'react'
import { finish } from '../copy/en'
import { useApp } from '../components/AppContext'
import { taskSummary } from '../components/TaskBodies'
import { taskTitle } from '../components/TaskList'
import { STATE_CHECKS, submitCheck } from '../logic/submit'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Checkbox } from '../ui/Checkbox'
import { Stack, Text } from '../ui/Layout'
import { Note } from '../ui/Note'
import { StatusBadge } from '../ui/StatusBadge'

/** Unambiguous submission: what's left or what waits, what the state checks, one primary action. */
export function Submit() {
  const { derived, state, dispatch, go } = useApp()
  const { readiness } = derived
  const signed = state.answers.declarationsSigned
  const check = submitCheck(readiness, signed)
  const [tried, setTried] = useState(false)
  const receiptsMissing = derived.items.some((i) => i.detail === 'receipts_missing')
  const left = derived.list.todo.map((t) => t.id)
  const goTo = (id: string) => (id === 'renewal' ? go('renewal') : go('welcome', `task-${id}`))

  return (
    <Stack gap="lg">
      <h1 tabIndex={-1}>{finish.submit.title}</h1>

      {left.length > 0 ? (
        <>
          <Banner tone="attention">
            <Stack gap="sm">
              <Text variant="strong">{finish.submit.blockedTitle}</Text>
              <ul className="plain-list">
                {left.map((id) => (
                  <li key={id}>
                    <Button variant="link" onClick={() => goTo(id)}>{taskTitle(id, receiptsMissing)}</Button>
                  </li>
                ))}
              </ul>
            </Stack>
          </Banner>
          <div>
            <Button variant="primary" onClick={() => goTo(left[0])}>{finish.submit.goTo(taskTitle(left[0], receiptsMissing))}</Button>
          </div>
        </>
      ) : (
        <Banner tone="success">
          <Text variant="strong">{finish.submit.readyTitle}</Text>
          <Text>{finish.submit.readyNote}</Text>
        </Banner>
      )}

      {readiness.awaiting.length > 0 && (
        <section aria-labelledby="awaiting-title">
          <h2 id="awaiting-title">{finish.submit.awaitingTitle}</h2>
          <Text variant="secondary">
            {finish.submit.awaitingNote} <Note kind="assumption" />
          </Text>
          <ul className="plain-list">
            {readiness.awaiting.map((i) => (
              <li key={i.id}>
                <StatusBadge status={i.status} iconOnly /> <strong>{taskTitle(i.id)}</strong>: {taskSummary(i.id, derived, state)}
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

      {left.length === 0 && (
        <>
          <Card title={finish.submit.declarationTitle} headingLevel={2}>
            <span id="declaration" tabIndex={-1} />
            {tried && !signed && (
              <Text variant="strong" as="p">
                <span className="error" role="alert">{finish.submit.signError}</span>
              </Text>
            )}
            <Checkbox label={finish.submit.declaration} checked={signed} onChange={(v) => dispatch({ type: 'sign_declarations', signed: v })} />
          </Card>
          <div>
            <Button
              variant="primary"
              onClick={() => {
                if (!check.canSubmit) {
                  setTried(true)
                  document.getElementById('declaration')?.focus()
                  return
                }
                dispatch({ type: 'submit' })
                go('receipt')
              }}
            >
              {finish.submit.button}
            </Button>
          </div>
        </>
      )}

      <div>
        <Button variant="link" onClick={() => go('welcome')}>{finish.submit.back}</Button>
      </div>
    </Stack>
  )
}
