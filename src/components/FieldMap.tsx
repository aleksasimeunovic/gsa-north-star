import type { ReactNode, Ref } from 'react'
import { en, formatHa, map } from '../copy/en'
import type { FieldId, Polygon, Scenario } from '../data/scenarios'
import { bounds, centroid } from '../logic/geometry'

const pts = (p: Polygon) => p.map((q) => `${q.x},${q.y}`).join(' ')

interface Props {
  scenario: Scenario
  /** Zoom to one field; its neighbours stay faint and unlabelled at the edges for orientation. */
  focus?: FieldId
  /** Draw only these fields, without the registered land around them. */
  only?: FieldId[]
  overlay?: (unit: number) => ReactNode
  svgRef?: Ref<SVGSVGElement>
  label: string
}

/** Plain SVG map in plain words: your fields, land the government has registered, and what changed. */
export function FieldMap({ scenario, focus, only, overlay, svgRef, label }: Props) {
  const focused = focus && scenario.fields.find((f) => f.id === focus)
  const fields = only ? scenario.fields.filter((f) => only.includes(f.id)) : scenario.fields
  const all = focused ? focused.polygon : [...fields.flatMap((f) => f.polygon), ...(only ? [] : scenario.blocks.flatMap((b) => b.polygon))]
  const b = bounds(all)
  const pad = focused ? 28 : 12
  const w = b.maxX - b.minX + pad * 2
  const h = b.maxY - b.minY + pad * 2
  // Text and handles scale with the zoom so they read the same on a phone.
  const unit = w / 24

  return (
    <svg ref={svgRef} className="field-map" viewBox={`${b.minX - pad} ${b.minY - pad} ${w} ${h}`} role="img" aria-label={label} style={{ fontSize: unit }}>
      <defs>
        <pattern id="hatch" width={unit / 2} height={unit / 2} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2={unit / 2} className="pattern-line" />
        </pattern>
        <pattern id="dots" width={unit * 0.7} height={unit * 0.7} patternUnits="userSpaceOnUse">
          <circle cx={unit * 0.35} cy={unit * 0.35} r={unit * 0.11} className="pattern-dot" />
        </pattern>
      </defs>

      {!only &&
        scenario.blocks.map((p) => (
          <polygon key={p.id} points={pts(p.polygon)} className="layer-block" />
        ))}

      {fields.map((f) => {
        const fb = bounds(f.polygon)
        const faint = focus && focus !== f.id
        return (
          <g key={f.id} className="map-field" data-faint={faint || undefined}>
            <polygon points={pts(f.polygon)} className="layer-field" />
            {f.signal?.kind === 'satellite_difference' && !faint && <polygon points={pts(f.signal.flagPolygon)} fill="url(#dots)" className="layer-flag" />}
            {f.signal?.kind === 'road_strip' && !faint && <polygon points={pts(f.signal.stripPolygon)} fill="url(#hatch)" className="layer-road" />}
            {!faint && (
              <text x={fb.minX + unit * 0.4} y={fb.minY + unit * 1.2} className="map-label">
                {en.fields[f.id]}
              </text>
            )}
            {focus === f.id && f.signal?.kind === 'road_strip' && (
              <text x={(fb.minX + fb.maxX) / 2} y={fb.maxY + unit * 1.3} textAnchor="middle" className="map-label map-note">
                {map.strip(formatHa(f.signal.stripHa))}
              </text>
            )}
          </g>
        )
      })}

      {overlay?.(unit)}
    </svg>
  )
}

export const partCentre = centroid
