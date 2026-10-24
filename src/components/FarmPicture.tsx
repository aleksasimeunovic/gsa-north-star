import { en, farm as copy, formatHa } from '../copy/en'
import type { Source } from '../logic/farm'
import { Card } from '../ui/Card'
import { SourceTag } from '../ui/SourceTag'
import { useApp } from './AppContext'

/**
 * His farm as GSA knows it right now. Every answer changes it, and each line says whether it still
 * comes from government records or he has confirmed it, so nothing looks settled before it is.
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

  return (
    <Card id="farm" title={copy.title} headingLevel={2} emphasis="low">
      <dl className="farm" aria-live="polite">
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
    </Card>
  )
}
