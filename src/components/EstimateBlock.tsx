import { en, formatDateYear, formatDinars, formatHa, ui } from '../copy/en'
import { Card } from '../ui/Card'
import { Disclosure } from '../ui/Disclosure'
import { Stack, Text } from '../ui/Layout'
import { useApp } from './AppContext'

/** Separate from status. An estimate, with its assumptions on request. Never the hero. */
export function EstimateBlock() {
  const { derived } = useApp()
  const { estimate: e, scenario } = derived
  const period = scenario.herd?.calvingPeriod

  return (
    <Card id="estimate" title={en.estimate.title} headingLevel={2}>
      <Stack gap="sm">
        <Text variant="strong">
          <span aria-live="polite">{en.estimate.about(formatDinars(e.aboutDinars))}</span>
        </Text>
        {e.changes.map((c) => (
          <Text key={c.reason}>{en.impact[c.reason](formatHa(c.areaHa), formatDinars(-c.aboutDinars))}</Text>
        ))}
        <Text variant="small">{en.estimate.scope} {en.estimate.caveat}</Text>
        <Disclosure label={ui.estimateHow.toggle}>
          <ul>
            {e.lines.map((l) =>
              l.measureId === 'plant_production' ? (
                <li key={l.measureId}>
                  {en.measures.plant_production}: {ui.estimateHow.plant(formatHa(l.quantity), formatDinars(l.rateDinars), formatDinars(l.amountDinars))}
                </li>
              ) : (
                <li key={l.measureId}>
                  {en.measures.cows_raising_calves}:{' '}
                  {ui.estimateHow.cows(l.quantity, formatDateYear(period!.from), formatDateYear(period!.to), formatDinars(l.rateDinars), formatDinars(l.amountDinars))}
                </li>
              ),
            )}
          </ul>
          <Text>{ui.estimateHow.total(formatDinars(e.totalDinars))}</Text>
          <Text variant="small">{ui.estimateHow.receipts}</Text>
        </Disclosure>
      </Stack>
    </Card>
  )
}
