import { en, formatDinars, formatHa } from '../copy/en'
import { Card } from '../ui/Card'
import { Disclosure } from '../ui/Disclosure'
import { Stack, Text } from '../ui/Layout'
import { useApp } from './AppContext'

const list = (parts: string[]) => (parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`)

/**
 * Separate from status. An estimate, with its assumptions on request. Never the hero.
 * While something that could change it is unanswered, it says it is provisional and what it waits for.
 */
export function EstimateBlock() {
  const { derived } = useApp()
  const e = derived.estimate
  const provisional = e.pending.length > 0

  return (
    <Card id="estimate" title={en.estimate.title} headingLevel={2} emphasis="low">
      <Stack gap="sm">
        <div aria-live="polite" className="estimate-basis" data-provisional={provisional || undefined}>
          <Text variant={provisional ? 'body' : 'small'}>
            {provisional ? en.estimate.provisional(list(e.pending.map((id) => en.estimate.pending[id]))) : en.estimate.basis}
          </Text>
        </div>
        <Text variant="strong">
          <span aria-live="polite">{en.estimate.about(formatDinars(e.aboutDinars))}</span>
        </Text>
        {e.changes.map((c) => (
          <Text key={c.reason}>{en.impact[c.reason](formatHa(c.areaHa), formatDinars(-c.aboutDinars))}</Text>
        ))}
        {e.unpriced.length > 0 && <Text variant="small">{en.estimate.unpriced(e.unpriced.length)}</Text>}
        <Text variant="small">{en.estimate.caveat}</Text>
        <Disclosure label={en.estimate.how}>
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
          <Text>{en.estimate.total(formatDinars(e.totalDinars))}</Text>
        </Disclosure>
      </Stack>
    </Card>
  )
}
