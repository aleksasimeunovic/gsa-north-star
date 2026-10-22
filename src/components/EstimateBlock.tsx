import { en, formatDinars, formatHa } from '../copy/en'
import { Card } from '../ui/Card'
import { Disclosure } from '../ui/Disclosure'
import { Stack, Text } from '../ui/Layout'
import { useApp } from './AppContext'

/** Separate from status. An estimate, with its assumptions on request. Never the hero. */
export function EstimateBlock() {
  const { derived } = useApp()
  const e = derived.estimate

  return (
    <Card id="estimate" title={en.estimate.title} headingLevel={2}>
      <Stack gap="sm">
        <Text variant="strong">
          <span aria-live="polite">{en.estimate.about(formatDinars(e.aboutDinars))}</span>
        </Text>
        {e.changes.map((c) => (
          <Text key={c.reason}>{en.impact[c.reason](formatHa(c.areaHa), formatDinars(-c.aboutDinars))}</Text>
        ))}
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
