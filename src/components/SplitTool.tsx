import { useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import { en, formatHa, map, split as copy } from '../copy/en'
import { CROPS, type Crop, type Field, type Point } from '../data/scenarios'
import {
  centroid,
  clampToField,
  fractionOfLine,
  inArea,
  lineAtFraction,
  partNames,
  proposedSplitLine,
  splitPolygon,
  translateLine,
} from '../logic/geometry'
import type { Split } from '../state/actions'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Inline, Stack, Text } from '../ui/Layout'
import { Note } from '../ui/Note'
import { Select } from '../ui/Select'

const STEP_M = 5
const flagOf = (field: Field) => (field.signal?.kind === 'satellite_difference' ? field.signal.flagPolygon : field.polygon)

/** GSA's proposal: the line along the flagged area; the part outside it keeps last year's crop. */
function proposal(field: Field): Split {
  const line = proposedSplitLine(field.polygon, flagOf(field))
  const r = splitPolygon(field.polygon, line[0], line[1])
  const crops = (r ? r.parts.map((p) => (inArea(p, flagOf(field)) ? null : field.cropLastYear)) : [null, null]) as Split['crops']
  return { line, crops }
}

/** Draft split, kept locally until he confirms. Undo walks back through drafts. */
export function useSplitDraft(field: Field, stored: Split | null) {
  const [draft, setDraft] = useState<Split>(() => stored ?? proposal(field))
  const [past, setPast] = useState<Split[]>([])
  const [edgeHit, setEdgeHit] = useState(false)
  const result = splitPolygon(field.polygon, draft.line[0], draft.line[1])

  const remember = () => setPast((p) => [...p, draft])
  const update = (next: Split, record = true, clamped = false) => {
    if (record) remember()
    setDraft(next)
    setEdgeHit(clamped)
  }
  const undo = () => {
    if (!past.length) return
    setDraft(past[past.length - 1])
    setPast(past.slice(0, -1))
    setEdgeHit(false)
  }
  return { draft, result, update, remember, undo, canUndo: past.length > 0, edgeHit }
}

type Draft = ReturnType<typeof useSplitDraft>

function toSvgPoint(svg: SVGSVGElement, e: PointerEvent): Point {
  const pt = svg.createSVGPoint()
  pt.x = e.clientX
  pt.y = e.clientY
  const m = svg.getScreenCTM()
  const p = m ? pt.matrixTransform(m.inverse()) : pt
  return { x: Math.round(p.x), y: Math.round(p.y) }
}

const ARROWS: Record<string, Point> = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } }

/**
 * Drawn inside the FieldMap's SVG. No precise point placement: drag the whole line by its
 * grip (or anywhere on it), or tilt it by its large end handles.
 */
export function SplitOverlay({ field, d, svgRef, unit, interactive }: { field: Field; d: Draft; svgRef: RefObject<SVGSVGElement>; unit: number; interactive: boolean }) {
  const drag = useRef<{ what: 0 | 1 | 'line'; from: Point; line: [Point, Point] } | null>(null)
  const { draft, result } = d
  const names = result ? partNames(result.parts) : null

  // A move that would leave a part with no land stops at the last good line before the edge, and says why.
  const valid = (line: [Point, Point]) => !!splitPolygon(field.polygon, line[0], line[1])
  const commit = (lineAt: (t: number) => { line: [Point, Point]; clamped: boolean }, record: boolean) => {
    const full = lineAt(1)
    if (valid(full.line)) return d.update({ ...draft, line: full.line }, record, full.clamped)
    let lo = 0
    let hi = 1
    for (let k = 0; k < 12; k++) {
      const mid = (lo + hi) / 2
      if (valid(lineAt(mid).line)) lo = mid
      else hi = mid
    }
    d.update({ ...draft, line: lineAt(lo).line }, record, true)
  }
  const moveEnd = (i: 0 | 1, p: Point, record: boolean) => {
    const from = draft.line[i]
    commit((t) => {
      const { point, clamped } = clampToField({ x: from.x + (p.x - from.x) * t, y: from.y + (p.y - from.y) * t }, field.polygon)
      const line: [Point, Point] = [...draft.line]
      line[i] = point
      return { line, clamped }
    }, record)
  }
  const moveLine = (from: [Point, Point], dx: number, dy: number, record: boolean) =>
    commit((t) => translateLine(from, dx * t, dy * t, field.polygon), record)

  const start = (what: 0 | 1 | 'line') => (e: PointerEvent<SVGElement>) => {
    if (!svgRef.current) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { what, from: toSvgPoint(svgRef.current, e), line: draft.line }
    d.remember()
  }
  const move = (e: PointerEvent<SVGElement>) => {
    const g = drag.current
    if (!g || !svgRef.current) return
    const p = toSvgPoint(svgRef.current, e)
    if (g.what === 'line') moveLine(g.line, p.x - g.from.x, p.y - g.from.y, false)
    else moveEnd(g.what, p, false)
  }
  const end = () => (drag.current = null)
  const key = (what: 0 | 1 | 'line') => (e: KeyboardEvent) => {
    const a = ARROWS[e.key]
    if (!a) return
    e.preventDefault()
    const step = e.shiftKey ? 1 : STEP_M
    if (what === 'line') moveLine(draft.line, a.x * step, a.y * step, true)
    else moveEnd(what, { x: draft.line[what].x + a.x * step, y: draft.line[what].y + a.y * step }, true)
  }
  const handlers = (what: 0 | 1 | 'line') => ({ onPointerDown: start(what), onPointerMove: move, onPointerUp: end, onPointerCancel: end, onKeyDown: key(what) })

  const chord = result?.chord
  const mid = chord ? { x: (chord[0].x + chord[1].x) / 2, y: (chord[0].y + chord[1].y) / 2 } : null

  return (
    <g className="split-overlay">
      {result &&
        result.parts.map((part, i) => {
          const c = centroid(part)
          return (
            <text key={i} x={c.x} y={c.y + unit * 1.1} textAnchor="middle" className="map-label split-label">
              {formatHa(result.areasHa[i])}
            </text>
          )
        })}
      {chord && <line x1={chord[0].x} y1={chord[0].y} x2={chord[1].x} y2={chord[1].y} className="split-line" style={{ strokeWidth: unit * 0.3 }} />}
      {interactive && chord && mid && names && (
        <>
          <line
            x1={chord[0].x}
            y1={chord[0].y}
            x2={chord[1].x}
            y2={chord[1].y}
            className="split-hit"
            style={{ strokeWidth: unit * 2.4 }}
            aria-hidden="true"
            {...handlers('line')}
          />
          <g
            role="button"
            tabIndex={0}
            aria-label={`${copy.moveLine}. ${copy.keys}`}
            className="split-grip"
            transform={`translate(${mid.x} ${mid.y})`}
            {...handlers('line')}
          >
            <rect x={-unit * 1.6} y={-unit * 0.9} width={unit * 3.2} height={unit * 1.8} rx={unit * 0.9} />
            <path d={`M0 ${-unit * 0.55} l${-unit * 0.4} ${unit * 0.35} h${unit * 0.8}z M0 ${unit * 0.55} l${-unit * 0.4} ${-unit * 0.35} h${unit * 0.8}z`} className="split-grip-icon" />
          </g>
          {([0, 1] as const).map((i) => (
            <g key={i} role="button" tabIndex={0} aria-label={`${i === 0 ? copy.handleStart : copy.handleEnd}. ${copy.keys}`} className="split-handle" {...handlers(i)}>
              <circle cx={draft.line[i].x} cy={draft.line[i].y} r={unit * 1.7} className="split-handle-hit" />
              <circle cx={draft.line[i].x} cy={draft.line[i].y} r={unit * 0.8} className="split-handle-dot" />
            </g>
          ))}
        </>
      )}
    </g>
  )
}

/** Controls under the map: live areas, the guardrail in place, crops, undo, slider alternative, confirm. */
export function SplitControls({ field, d, onConfirm }: { field: Field; d: Draft; onConfirm: (s: Split) => void }) {
  const [slider, setSlider] = useState(false)
  const [tried, setTried] = useState(false)
  const { draft, result } = d
  const names = result ? partNames(result.parts) : null
  const same = !!draft.crops[0] && draft.crops[0] === draft.crops[1]
  const complete = !!result && !!draft.crops[0] && !!draft.crops[1] && !same
  const label = (i: 0 | 1) => (names ? copy.part[names[i]] : '')
  // Show the parts as they sit on the map: top before bottom, left before right.
  const order: (0 | 1)[] = names && (names[0] === 'bottom' || names[0] === 'right') ? [1, 0] : [0, 1]
  const cropError = (i: 0 | 1) =>
    !tried ? undefined : !draft.crops[i] ? copy.chooseError : same && i === order[1] ? copy.sameError : undefined
  const options = CROPS.map((c) => ({ value: c, label: en.crops[c] }))

  return (
    <Stack gap="sm">
      <Text variant="small">
        {copy.proposed} <Note kind="eu_mandate" />
      </Text>
      <div aria-live="polite">
        {!result ? (
          <Banner tone="attention">{copy.noCross}</Banner>
        ) : d.edgeHit ? (
          <Banner tone="attention">{map.edge}</Banner>
        ) : (
          <Text>{order.map((i) => copy.partArea(label(i), formatHa(result.areasHa[i]))).join('. ')}</Text>
        )}
      </div>
      {slider && (
        <div className="field">
          <label htmlFor="split-slider" className="field-label">{copy.sliderLabel}</label>
          <input
            id="split-slider"
            type="range"
            min={5}
            max={95}
            step={1}
            value={Math.round(fractionOfLine(field.polygon, draft.line) * 100)}
            aria-valuetext={result ? order.map((i) => copy.partArea(label(i), formatHa(result.areasHa[i]))).join(', ') : undefined}
            onChange={(e) => d.update({ ...draft, line: lineAtFraction(field.polygon, Number(e.target.value) / 100) })}
          />
        </div>
      )}
      <div>
        <Button variant="link" onClick={() => setSlider(!slider)}>{slider ? copy.useDrag : copy.useSlider}</Button>
      </div>
      {result &&
        order.map((i) => (
          <Select
            key={i}
            label={copy.cropFor(label(i), formatHa(result.areasHa[i]))}
            placeholder={copy.choose}
            options={options}
            value={draft.crops[i] ?? ''}
            error={cropError(i)}
            onChange={(e) => {
              const crops: Split['crops'] = [...draft.crops]
              crops[i] = (e.target.value || null) as Crop | null
              d.update({ ...draft, crops })
            }}
          />
        ))}
      <Inline>
        <Button onClick={d.undo} disabled={!d.canUndo}>{copy.undo}</Button>
        <Button
          variant="primary"
          onClick={() => {
            if (complete) return onConfirm(draft)
            setTried(true)
            requestAnimationFrame(() => document.querySelector<HTMLElement>('.task[data-open] [aria-invalid]')?.focus())
          }}
        >
          {copy.confirm}
        </Button>
      </Inline>
    </Stack>
  )
}
