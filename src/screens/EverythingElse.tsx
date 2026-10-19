import { en, finish, formatDateYear, formatDinars } from '../copy/en'
import type { Measure } from '../data/scenarios'
import { useApp } from '../components/AppContext'
import { isRenewed } from '../logic/readiness'
import { orderMeasures } from '../logic/status'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Disclosure } from '../ui/Disclosure'
import { FileInput } from '../ui/FileInput'
import { Compare, Stack, Text } from '../ui/Layout'

function MeasureCard({ m }: { m: Measure }) {
  const { derived } = useApp()
  const herd = derived.scenario.herd
  const t = finish.measureText
  const rate = formatDinars(m.rateDinars)
  const rows =
    m.id === 'plant_production'
      ? [t.plant_production.paysFor(rate), t.plant_production.yourPart, t.plant_production.why]
      : m.id === 'cows_raising_calves' && herd
        ? [
            t.cows_raising_calves.paysFor(rate, formatDateYear(herd.calvingPeriod.from), formatDateYear(herd.calvingPeriod.to)),
            t.cows_raising_calves.yourPart,
            t.cows_raising_calves.why(herd.cowsCalved),
          ]
        : null
  if (!rows) return null
  return (
    <Card title={en.measures[m.id]}>
      <Compare
        items={[
          { label: finish.ee.paysFor, value: <Text>{rows[0]}</Text> },
          { label: finish.ee.yourPart, value: <Text>{rows[1]}</Text> },
        ]}
      />
      <Text variant="small">
        {finish.ee.whyFits}: {rows[2]}
      </Text>
    </Card>
  )
}

/** One screen, one confirmation: records, measures, documents. */
export function EverythingElse() {
  const { derived, state, dispatch } = useApp()
  const { scenario, items } = derived
  const g = scenario.generalData
  const recordsAsked = state.answers.requests.some((r) => r.kind === 'record_check' && r.itemId === 'general_data')
  const measures = orderMeasures(scenario.measures)
  const fitting = measures.filter((m) => m.fits)
  const others = measures.filter((m) => !m.fits)
  const docsItem = items.find((i) => i.id === 'documents')!

  return (
    <Stack gap="lg">
      <Text>{finish.ee.intro}</Text>

      <section id="item-general_data" tabIndex={-1} aria-labelledby="records-title">
        <Stack gap="sm">
          <h2 id="records-title">{finish.ee.recordsTitle}</h2>
          <Text variant="small">{finish.ee.recordsNote}</Text>
          <dl className="records">
            <dt>{finish.ee.holder}</dt>
            <dd>{g.holder}</dd>
            <dt>{finish.ee.place}</dt>
            <dd>{g.place}</dd>
            <dt>{finish.ee.year}</dt>
            <dd>{g.applicationYear}</dd>
            <dt>{finish.ee.status}</dt>
            <dd>{isRenewed(scenario, state.answers) ? finish.ee.renewed : finish.ee.notRenewed}</dd>
          </dl>
          {recordsAsked ? (
            <Banner tone="success">{finish.ee.recordsAsked}</Banner>
          ) : (
            <div>
              <Button variant="link" onClick={() => dispatch({ type: 'ask_record_check', itemId: 'general_data' })}>
                {finish.ee.recordsWrong}
              </Button>
            </div>
          )}
        </Stack>
      </section>

      <section id="item-measures" tabIndex={-1} aria-labelledby="measures-title">
        <Stack gap="sm">
          <h2 id="measures-title">{finish.ee.measuresTitle}</h2>
          <Text variant="small">{finish.ee.measuresNote}</Text>
          {fitting.map((m) => (
            <MeasureCard key={m.id} m={m} />
          ))}
          {others.length > 0 && (
            <Disclosure label={`${finish.ee.otherMeasures} (${others.length})`}>
              <Stack gap="sm">
                {others.map((m) => (
                  <div key={m.id}>
                    <Text variant="strong">{en.measures[m.id]}</Text>
                    <Text variant="small">{finish.ee.doesNotFit}</Text>
                    {m.id === 'eco_scheme' && (
                      <>
                        <Text>{finish.measureText.eco_scheme.paysFor}</Text>
                        <Text>
                          {finish.ee.condition}: {finish.measureText.eco_scheme.condition}
                        </Text>
                      </>
                    )}
                  </div>
                ))}
              </Stack>
            </Disclosure>
          )}
        </Stack>
      </section>

      <section id="item-documents" tabIndex={-1} aria-labelledby="docs-title">
        <Card title={finish.ee.documentsTitle} status={docsItem.status}>
          {docsItem.status === 'action_required' ? (
            <Stack gap="sm">
              <Banner tone="attention">{finish.ee.missing}</Banner>
              <FileInput
                label={finish.ee.upload}
                hint={finish.ee.uploadHint}
                onFile={() => dispatch({ type: 'attach_document', documentId: 'input_receipts' })}
              />
            </Stack>
          ) : (
            <Text>{en.itemDetail.documents_attached}</Text>
          )}
        </Card>
      </section>
    </Stack>
  )
}
