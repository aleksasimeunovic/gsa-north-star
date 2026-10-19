import type { ReactNode, Ref } from 'react'
import { en, formatHa, wiz } from '../copy/en'
import type { FieldId, Polygon, Scenario } from '../data/scenarios'
import { bounds } from '../logic/geometry'
import type { Status } from '../logic/status'

const pts = (p: Polygon) => p.map((q) => `${q.x},${q.y}`).join(' ')
const PAD = 16

interface Props {
  scenario: Scenario
  selectedId: FieldId | null
  statusOf: (id: FieldId) => Status
  onSelect: (id: FieldId) => void
  overlay?: ReactNode
  svgRef?: Ref<SVGSVGElement>
}

/** Plain SVG map: your fields, physical blocks, cadastral parcels, road strip, satellite flag. */
export function FieldMap({ scenario, selectedId, statusOf, onSelect, overlay, svgRef }: Props) {
  const all = [...scenario.fields.flatMap((f) => f.polygon), ...scenario.blocks.flatMap((b) => b.polygon)]
  const b = bounds(all)
  const viewBox = `${b.minX - PAD} ${b.minY - PAD} ${b.maxX - b.minX + PAD * 2} ${b.maxY - b.minY + PAD * 2}`

  return (
    <svg ref={svgRef} className="field-map" viewBox={viewBox} role="group" aria-labelledby="map-title map-desc">
      <title id="map-title">{wiz.land.mapTitle}</title>
      <desc id="map-desc">{wiz.land.mapDesc}</desc>
      <defs>
        <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" className="pattern-line" />
        </pattern>
        <pattern id="dots" width="8" height="8" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="1.4" className="pattern-dot" />
        </pattern>
      </defs>

      {scenario.parcels.map((p) => (
        <polygon key={p.id} points={pts(p.polygon)} className="layer-parcel" aria-hidden="true" />
      ))}
      {scenario.blocks.map((p) => (
        <polygon key={p.id} points={pts(p.polygon)} className="layer-block" aria-hidden="true" />
      ))}

      {scenario.fields.map((f) => {
        const fb = bounds(f.polygon)
        const status = statusOf(f.id)
        const select = () => onSelect(f.id)
        return (
          <g
            key={f.id}
            role="button"
            tabIndex={0}
            className="map-field"
            data-selected={selectedId === f.id || undefined}
            data-status={status}
            aria-pressed={selectedId === f.id}
            aria-label={wiz.land.fieldSummary(en.fields[f.id], formatHa(f.areaHa), en.crops[f.cropLastYear], en.status[status])}
            onClick={select}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                select()
              }
            }}
          >
            <polygon points={pts(f.polygon)} className="layer-field" />
            {f.signal?.kind === 'satellite_difference' && <polygon points={pts(f.signal.flagPolygon)} fill="url(#dots)" className="layer-flag" />}
            {f.signal?.kind === 'road_strip' && <polygon points={pts(f.signal.stripPolygon)} fill="url(#hatch)" className="layer-road" />}
            <text x={fb.minX + 6} y={fb.minY + 18} className="map-label" aria-hidden="true">
              {en.fields[f.id]}
            </text>
          </g>
        )
      })}

      {overlay}
    </svg>
  )
}

/** Legend that explains the three land terms in plain words. */
export function MapLegend() {
  const items = [
    ['field', wiz.land.legend.field],
    ['block', wiz.land.legend.block],
    ['parcel', wiz.land.legend.parcel],
    ['road', wiz.land.legend.road],
    ['satellite', wiz.land.legend.satellite],
  ] as const
  return (
    <section aria-labelledby="legend-title">
      <h2 id="legend-title" className="legend-title">{wiz.land.legendTitle}</h2>
      <dl className="legend">
        {items.map(([kind, item]) => (
          <div key={kind}>
            <dt>
              <svg width="28" height="16" aria-hidden="true" className="legend-swatch" data-kind={kind}>
                <rect x="2" y="2" width="24" height="12" fill={kind === 'road' ? 'url(#hatch)' : kind === 'satellite' ? 'url(#dots)' : 'none'} />
              </svg>
              {item.name}
            </dt>
            <dd>{item.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
