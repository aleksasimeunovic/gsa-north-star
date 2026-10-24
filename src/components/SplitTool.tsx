import { useState } from 'react'
import { en, formatHa, map, split as copy } from '../copy/en'
import { CROPS, type Crop, type Field, type Point } from '../data/scenarios'
import {
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
import { Inline, Stack, Text, VisuallyHidden } from '../ui/Layout'
import { Note } from '../ui/Note'
import { Select } from '../ui/Select'

const STEP_M = 5
const ARROWS: Record<string, Point> = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } }
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

export type SplitDraft = ReturnType<typeof useSplitDraft>

/**
 * Moving the line, whatever drags it. No precise point placement: he moves the whole line, or tilts it
 * by an end. A move that would leave a part with no land stops at the last good line before the edge,
 * and the edge says why.
 */
export function splitMoves(field: Field, d: SplitDraft) {
  const { draft } = d
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
  /** Arrow keys: 5 m a press, 1 m with Shift. */
  const nudge = (what: 0 | 1 | 'line', key: string, fine: boolean) => {
    const a = ARROWS[key]
    if (!a) return false
    const step = fine ? 1 : STEP_M
    if (what === 'line') moveLine(draft.line, a.x * step, a.y * step, true)
    else moveEnd(what, { x: draft.line[what].x + a.x * step, y: draft.line[what].y + a.y * step }, true)
    return true
  }
  return { moveEnd, moveLine, nudge }
}

/** Controls under the map: live areas, the guardrail in place, crops, undo, slider alternative, confirm. */
export function SplitControls({ field, d, onConfirm }: { field: Field; d: SplitDraft; onConfirm: (s: Split) => void }) {
  const [slider, setSlider] = useState(false)
  const { draft, result } = d
  const names = result ? partNames(result.parts) : null
  const same = !!draft.crops[0] && draft.crops[0] === draft.crops[1]
  const complete = !!result && !!draft.crops[0] && !!draft.crops[1] && !same
  const label = (i: 0 | 1) => (names ? copy.part[names[i]] : '')
  // Show the parts as they sit on the map: top before bottom, left before right.
  const order: (0 | 1)[] = names && (names[0] === 'bottom' || names[0] === 'right') ? [1, 0] : [0, 1]
  const cropError = (i: 0 | 1) => (same && i === order[1] ? copy.sameError : undefined)
  const options = CROPS.map((c) => ({ value: c, label: en.crops[c] }))

  return (
    <Stack gap="sm">
      <Text variant="small">
        {copy.proposed} <Note kind="ai" />
      </Text>
      <div aria-live="polite">
        {!result ? (
          <Banner tone="attention">{copy.noCross}</Banner>
        ) : d.edgeHit ? (
          <Banner tone="attention">{map.edge}</Banner>
        ) : (
          // The areas are on the map and in the crop labels; said once more for screen readers.
          <VisuallyHidden>{order.map((i) => copy.partArea(label(i), formatHa(result.areasHa[i]))).join('. ')}</VisuallyHidden>
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
        {d.canUndo && <Button onClick={d.undo}>{copy.undo}</Button>}
        <Button variant="primary" disabled={!complete} onClick={() => onConfirm(draft)}>
          {copy.confirm}
        </Button>
      </Inline>
    </Stack>
  )
}
