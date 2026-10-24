import { en, formatDinars, formatHa } from '../copy/en'
import { Card } from '../ui/Card'
import { Disclosure } from '../ui/Disclosure'
import { Stack, Text } from '../ui/Layout'
import { useApp } from './AppContext'

const list = (parts: string[]) => (parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`)

/**
 * Separate from status. An estimate, never the hero: the amount and whether it is still provisional
 * (and what it waits for). What changed it and how it is worked out open on request.
 */
export function EstimateBlock() {
  const { derived } = useApp()
  const e = derived.estimate
  const provisional = e.pending.length > 0

  return (
    <Card id="estimate" title={en.estimate.title} headingLevel={2} emphasis="low">
      <Stack gap="sm">
        <Text variant="strong">
          <span aria-live="polite">{en.estimate.about(formatDinars(e.aboutDinars))}</span>
        </Text>
        <div aria-live="polite" className="estimate-basis" data-provisional={provisional || undefined}>
          <Text variant={provisional ? 'body' : 'small'}>
            {provisional ? en.estimate.provisional(list(e.pending.map((id) => en.estimate.pending[id]))) : en.estimate.basis}
          </Text>
        </div>
        <Text variant="small">{en.estimate.caveat}</Text>
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
            <Text>{en.estimate.total(formatDinars(e.totalDinars))}</Text>
          </Stack>
        </Disclosure>
      </Stack>
    </Card>
  )
}
