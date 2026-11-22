import { useRef, useState } from 'react'
import { en, formatDateYear, formatDinars, formatHa } from '../copy/en'
import { estimateState } from '../logic/estimate'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Drawer } from '../ui/Drawer'
import { Icon } from '../ui/Icon'
import { Stack, Text } from '../ui/Layout'
import { useApp } from './AppContext'
import { PanelSection } from './MeasureBodies'

const list = (parts: string[]) => (parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`)

/**
 * Separate from status. An estimate, never the hero, in three states: no basis yet (no number, and what it
 * needs), provisional (the amount and what it waits for), current (the amount and the caveat).
 * How it is worked out opens in a side panel, line by line, with the same numbers it adds up.
 */
export function EstimateBlock() {
  const { derived, state } = useApp()
  const e = derived.estimate
  const st = estimateState(e)
  const [open, setOpen] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)
  const calving = derived.scenario.herd?.calvingPeriod

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
          <div>
            <Button ref={opener} variant="secondary" aria-haspopup="dialog" onClick={() => setOpen(true)}>
              {en.estimate.how}
              <Icon name="details_open" size="sm" />
            </Button>
          </div>
        )}
      </Stack>
      <Drawer open={open} title={en.estimate.how} onClose={() => setOpen(false)} returnFocusTo={opener}>
        <div className="panel-sections">
          {e.lines.map((l) => (
            <PanelSection key={l.measureId} title={en.measures[l.measureId]}>
              {l.measureId === 'plant_production' ? (
                <>
                  {/* From all his fields to what counts: each change that took land, then the sum. */}
                  {e.changes.length > 0 && <Text>{en.estimate.land(formatHa(l.quantity + e.changes.reduce((sum, c) => sum + c.areaHa, 0)))}</Text>}
                  {e.changes.map((c) => (
                    <Text key={c.reason}>{en.impact[c.reason](formatHa(c.areaHa), formatDinars(-c.aboutDinars))}</Text>
                  ))}
                  <Text variant="strong">{en.estimate.plant(formatHa(l.quantity), formatDinars(l.rateDinars), formatDinars(l.amountDinars))}</Text>
                </>
              ) : (
                <Text variant="strong">
                  {en.estimate.cows(l.quantity, calving ? formatDateYear(calving.from) : '', calving ? formatDateYear(calving.to) : '', formatDinars(l.rateDinars), formatDinars(l.amountDinars))}
                </Text>
              )}
            </PanelSection>
          ))}
          <PanelSection title={en.estimate.title}>
            <Text variant="strong">
              {e.totalDinars === e.aboutDinars ? en.estimate.sum(formatDinars(e.totalDinars)) : en.estimate.total(formatDinars(e.totalDinars), formatDinars(e.aboutDinars))}
            </Text>
            {e.unpriced.length > 0 && <Text>{en.estimate.unpriced(e.unpriced.length)}</Text>}
            <Text variant="small">{en.estimate.caveat}</Text>
          </PanelSection>
        </div>
      </Drawer>
    </Card>
  )
}
