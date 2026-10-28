import { en, formatDinars, formatHa } from '../copy/en'
import { estimateState } from '../logic/estimate'
import { Card } from '../ui/Card'
import { Disclosure } from '../ui/Disclosure'
import { Stack, Text } from '../ui/Layout'
import { useApp } from './AppContext'

const list = (parts: string[]) => (parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`)

/**
 * Separate from status. An estimate, never the hero, in three states: no basis yet (no number, and what it
 * needs), provisional (the amount and what it waits for), current (the amount and the caveat).
 * What changed it and how it is worked out open on request.
 */
export function EstimateBlock() {
  const { derived, state } = useApp()
  const e = derived.estimate
  const st = estimateState(e)

  return (
    <Card id="estimate" title={en.estimate.title} headingLevel={3} emphasis="low">
      <Stack gap="sm">
        <div aria-live="polite">
          {st === 'none' ? (
            <Text>{state.answers.measures.chosen.length ? en.estimate.afterChecks : en.estimate.none}</Text>
          ) : (
            <>
              <Text variant="strong">{en.estimate.about(formatDinars(e.aboutDinars))}</Text>
              <Text variant={st === 'provisional' ? 'body' : 'small'}>
                {st === 'provisional' ? en.estimate.provisional(list(e.pending.map((id) => en.estimate.pending[id]))) : en.estimate.caveat}
              </Text>
            </>
          )}
        </div>
        {st !== 'none' && (
          <Disclosure label={en.estimate.how}>
            <Stack gap="sm">
              {e.changes.map((c) => (
                <Text key={c.reason}>{en.impact[c.reason](formatHa(c.areaHa), formatDinars(-c.aboutDinars))}</Text>
              ))}
              <ul>
                {e.lines.map((l) => (
                  <li key={l.measureId}>
                    {en.measures[l.measureId]}:{' '}
                    {l.measureId === 'plant_production'
                      ? en.estimate.plant(formatHa(l.quantity), formatDinars(l.rateDinars), formatDinars(l.amountDinars))
                      : en.estimate.cows(l.quantity, formatDinars(l.rateDinars), formatDinars(l.amountDinars))}
                  </li>
                ))}
              </ul>
              {e.unpriced.length > 0 && <Text variant="small">{en.estimate.unpriced(e.unpriced.length)}</Text>}
              {st === 'provisional' && <Text variant="small">{en.estimate.caveat}</Text>}
            </Stack>
          </Disclosure>
        )}
      </Stack>
    </Card>
  )
}
