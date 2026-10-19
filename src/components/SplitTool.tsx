import { useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from 'react'
import { en, formatHa, wiz } from '../copy/en'
import { CROPS, type Crop, type Field, type Point } from '../data/scenarios'
import { centroid, clampToBounds, fractionOfLine, lineAtFraction, splitPolygon } from '../logic/geometry'
import type { Split } from '../state/actions'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Inline, Stack, Text } from '../ui/Layout'
import { Select } from '../ui/Select'

const LETTERS = ['A', 'B'] as const
const STEP_M = 5

/** Draft split, kept locally until he confirms. Undo walks back through drafts. */
export function useSplitDraft(field: Field, stored: Split | null) {
  const [draft, setDraft] = useState<Split>(stored ?? { line: lineAtFraction(field.polygon, 0.5), crops: [null, null] })
  const [past, setPast] = useState<Split[]>([])
  const result = splitPolygon(field.polygon, draft.line[0], draft.line[1])

  const remember = () => setPast((p) => [...p, draft])
  const update = (next: Split, record = true) => {
    if (record) remember()
    setDraft(next)
  }
  const undo = () => {
    if (!past.length) return
    setDraft(past[past.length - 1])
    setPast(past.slice(0, -1))
  }
  return { draft, result, update, remember, undo, canUndo: past.length > 0 }
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

/** Line, part labels and draggable ends, drawn inside the FieldMap's SVG. */
export function SplitOverlay({ field, d, svgRef, interactive }: { field: Field; d: Draft; svgRef: RefObject<SVGSVGElement>; interactive: boolean }) {
  const dragging = useRef<0 | 1 | null>(null)
  const { draft, result } = d

  const move = (i: 0 | 1, p: Point, record: boolean) => {
    const line: [Point, Point] = [...draft.line]
    line[i] = clampToBounds(p, field.polygon)
    d.update({ ...draft, line }, record)
  }

  const onKey = (i: 0 | 1) => (e: KeyboardEvent) => {
    const step = e.shiftKey ? 1 : STEP_M
    const delta: Record<string, Point> = {
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
    }
    const dlt = delta[e.key]
    if (!dlt) return
    e.preventDefault()
    const p = draft.line[i]
    move(i, { x: p.x + dlt.x, y: p.y + dlt.y }, true)
  }

  return (
    <g className="split-overlay">
      {result && (
        <>
          <line x1={result.chord[0].x} y1={result.chord[0].y} x2={result.chord[1].x} y2={result.chord[1].y} className="split-line" />
          {result.parts.map((part, i) => {
            const c = centroid(part)
            return (
              <text key={i} x={c.x} y={c.y + 6} textAnchor="middle" className="map-label split-label" aria-hidden="true">
                {LETTERS[i]} · {formatHa(result.areasHa[i])}
              </text>
            )
          })}
        </>
      )}
      {interactive && (
        <>
          <line x1={draft.line[0].x} y1={draft.line[0].y} x2={draft.line[1].x} y2={draft.line[1].y} className="split-guide" aria-hidden="true" />
          {([0, 1] as const).map((i) => (
            <circle
              key={i}
              cx={draft.line[i].x}
              cy={draft.line[i].y}
              r={14}
              tabIndex={0}
              role="button"
              aria-label={`${i === 0 ? wiz.split.handleStart : wiz.split.handleEnd}. ${wiz.split.keyboardHint}`}
              className="split-handle"
              onKeyDown={onKey(i)}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                dragging.current = i
                d.remember()
              }}
              onPointerMove={(e) => {
                if (dragging.current !== i || !svgRef.current) return
                move(i, toSvgPoint(svgRef.current, e), false)
              }}
              onPointerUp={() => (dragging.current = null)}
            />
          ))}
        </>
      )}
    </g>
  )
}

/** Controls under the map: slider alternative, crops, undo, confirm. */
export function SplitControls({ field, d, onConfirm }: { field: Field; d: Draft; onConfirm: (s: Split) => void }) {
  const [slider, setSlider] = useState(false)
  const { draft, result } = d
  const complete = !!result && !!draft.crops[0] && !!draft.crops[1]
  const options = CROPS.map((c) => ({ value: c, label: en.crops[c] }))

  return (
    <Stack gap="sm">
      <Text variant="strong">{wiz.split.title}</Text>
      <Text>{wiz.split.instruction}</Text>
      <Text variant="small">{wiz.split.guardrail}</Text>
      <div>
        <Button variant="link" onClick={() => setSlider(!slider)}>{slider ? wiz.split.useDrag : wiz.split.useSlider}</Button>
      </div>
      {slider && (
        <div className="field">
          <label htmlFor="split-slider" className="field-label">{wiz.split.sliderLabel}</label>
          <input
            id="split-slider"
            type="range"
            min={5}
            max={95}
            step={1}
            value={Math.round(fractionOfLine(field.polygon, draft.line) * 100)}
            aria-valuetext={result ? result.areasHa.map((a, i) => wiz.split.part(LETTERS[i], formatHa(a))).join(', ') : undefined}
            onChange={(e) => d.update({ ...draft, line: lineAtFraction(field.polygon, Number(e.target.value) / 100) })}
          />
        </div>
      )}
      <div aria-live="polite">
        {result ? (
          <Text>{result.areasHa.map((a, i) => wiz.split.part(LETTERS[i], formatHa(a))).join('. ')}</Text>
        ) : (
          <Banner tone="attention">{wiz.split.noCross}</Banner>
        )}
      </div>
      {result &&
        ([0, 1] as const).map((i) => (
          <Select
            key={i}
            label={wiz.split.cropFor(LETTERS[i], formatHa(result.areasHa[i]))}
            placeholder={wiz.split.choose}
            options={options}
            value={draft.crops[i] ?? ''}
            onChange={(e) => {
              const crops: [Crop | null, Crop | null] = [...draft.crops]
              crops[i] = (e.target.value || null) as Crop | null
              d.update({ ...draft, crops })
            }}
          />
        ))}
      {!complete && result && <Text variant="small">{wiz.split.missing}</Text>}
      <Inline>
        <Button onClick={d.undo} disabled={!d.canUndo}>{wiz.split.undo}</Button>
        <Button variant="primary" aria-disabled={!complete} onClick={() => complete && onConfirm(draft)}>
          {wiz.split.confirm}
        </Button>
      </Inline>
    </Stack>
  )
}
