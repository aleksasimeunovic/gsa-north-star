import { en, farm as copy, formatHa } from '../copy/en'
import type { Source } from '../logic/farm'
import { Card } from '../ui/Card'
import { Disclosure } from '../ui/Disclosure'
import { Text } from '../ui/Layout'
import { SourceTag } from '../ui/SourceTag'
import { useApp } from './AppContext'

/**
 * His farm as GSA knows it right now, in one line, with how much of it he has confirmed. Every answer
 * changes it. Each part and where it comes from (government records, confirmed by you, waiting for a check)
 * opens on request, so nothing looks settled before it is and nothing competes with the next action.
 */
export function FarmPicture() {
  const { derived } = useApp()
  const f = derived.farm
  const fieldSource =
    f.fields.source === 'records' && f.fields.confirmed > 0 ? copy.partly(f.fields.confirmed, f.fields.count) : copy.source[f.fields.source]
  const rows: { label: string; lines: string[]; source: Source; tag: string }[] = [
    {
      label: copy.fields,
      lines: [copy.landValue(formatHa(f.fields.totalHa), f.fields.count), f.fields.crops.map((c) => copy.crop(en.crops[c.crop], formatHa(c.ha))).join(', ')],
      source: f.fields.source,
      tag: fieldSource,
    },
  ]
  if (f.cattle) {
    const checking = f.cattle.source === 'checking'
    rows.push({ label: copy.cattleLabel, lines: [checking ? copy.cattleChecking(f.cattle.count, f.cattle.registry) : copy.cattle(f.cattle.count)], source: f.cattle.source, tag: copy.source[f.cattle.source] })
  }
  if (f.pigs) rows.push({ label: copy.pigsLabel, lines: [f.pigs.household ? copy.pigsHousehold(f.pigs.count) : copy.pigs(f.pigs.count)], source: f.pigs.source, tag: copy.source[f.pigs.source] })
  rows.push({ label: copy.measures, lines: [copy.measuresValue(f.measures.chosen, f.measures.fitting)], source: f.measures.source, tag: copy.source[f.measures.source] })

  const confirmed = rows.filter((r) => r.source === 'confirmed').length
  const overall: Source = confirmed === rows.length ? 'confirmed' : 'records'
  const overallTag = confirmed === rows.length ? copy.source.confirmed : confirmed === 0 ? copy.source.records : copy.partly(confirmed, rows.length)
  const summary = [
    copy.landValue(formatHa(f.fields.totalHa), f.fields.count),
    f.cattle && copy.cattle(f.cattle.count),
    f.pigs && copy.pigs(f.pigs.count),
  ].filter(Boolean).join(', ')

  return (
    <Card id="farm" title={copy.title} headingLevel={2} emphasis="low">
      <div aria-live="polite" className="farm-summary">
        <Text>{summary}</Text>
        <SourceTag source={overall}>{overallTag}</SourceTag>
      </div>
      <Disclosure label={copy.details}>
        <dl className="farm">
          {rows.map((r) => (
            <div key={r.label} className="farm-row" data-source={r.source}>
              <dt>{r.label}</dt>
              {r.lines.map((l) => (
                <dd key={l}>{l}</dd>
              ))}
              <dd>
                <SourceTag source={r.source}>{r.tag}</SourceTag>
              </dd>
            </div>
          ))}
        </dl>
      </Disclosure>
    </Card>
  )
}
