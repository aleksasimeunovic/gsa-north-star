import { en, finish, formatDateYear, formatTime, itemLabel } from '../copy/en'
import { useApp } from '../components/AppContext'
import { referenceNumber } from '../logic/submit'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Compare, Stack, Text } from '../ui/Layout'
import { Note } from '../ui/Note'

// Date follows the prototype clock; the time is real.
/** Never ambiguous: submitted, when, which number, what next. */
export function Receipt() {
  const { derived, state, dispatch, go } = useApp()
  const at = state.answers.submittedAt!
  const awaiting = derived.readiness.awaiting

  return (
    <Stack gap="lg">
      <Banner tone="success">
        <h1 tabIndex={-1} id="receipt-title">{finish.receipt.title}</h1>
        <Text>{finish.receipt.when(`${formatDateYear(derived.scenario.today)}, ${formatTime(at)}`)}</Text>
      </Banner>
      <Compare items={[{ label: finish.receipt.reference, value: referenceNumber(at) }]} />
      <Text variant="small">{finish.receipt.referenceNote}</Text>

      <section aria-labelledby="next-title">
        <h2 id="next-title">{finish.receipt.nextTitle}</h2>
        <ol>
          {finish.receipt.next.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="still-title">
        <h2 id="still-title">{finish.receipt.awaitingTitle}</h2>
        {awaiting.length === 0 ? (
          <Text>{finish.receipt.nothingAwaiting}</Text>
        ) : (
          <ul>
            {awaiting.map((i) => (
              <li key={i.id}>
                <strong>{itemLabel(i.id)}</strong>: {en.itemDetail[i.detail]}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card title={finish.receipt.amendTitle} headingLevel={2}>
        <Stack gap="sm">
          <Text>{finish.receipt.amendText}</Text>
          <div><Note kind="assumption" /></div>
          <div>
            <Button
              onClick={() => {
                dispatch({ type: 'amend' })
                go('welcome')
              }}
            >
              {finish.receipt.amend}
            </Button>
          </div>
        </Stack>
      </Card>
    </Stack>
  )
}
