import { useEffect, useState } from 'react'
import { en, formatDinars, formatHa, split as copy } from '../copy/en'
import { PART_CROPS, type Field, type PartCrop, type Point, type Polygon } from '../data/scenarios'
import { fieldWith, splitEffects } from '../logic/farm'
import {
  fitLine,
  followsEdge,
  inArea,
  keepInside,
  lineHeight,
  outlinePath,
  partNames,
  pullLine,
  pullOutline,
  removeBend,
  removeCorner,
  roundHa,
  sameLine,
  shapeProblem,
  shiftLine,
  SNAP_M,
  snapToAny,
  splitField,
  tidyLine,
  tidyOutline,
  toFieldEdge,
  type ShapeProblem,
  type SplitLine,
} from '../logic/geometry'
import type { Split } from '../state/actions'
import { Button } from '../ui/Button'
import { Answers } from '../ui/Fact'
import { Inline, Stack, Text, VisuallyHidden } from '../ui/Layout'
import { StageAction } from '../ui/MapStage'
import { MapStatus, ToolButton, ToolDivider, ToolIsland } from '../ui/MapTools'
import { Note } from '../ui/Note'
import { Select } from '../ui/Select'
import { useApp } from './AppContext'

const STEP_M = 5
const ARROWS: Record<string, Point> = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } }
export const edgeOf = (field: Field) => (field.signal?.kind === 'satellite_difference' ? field.signal.edge : field.polygon)
const flagOf = (field: Field) => (field.signal?.kind === 'satellite_difference' ? field.signal.flagPolygon : field.polygon)

/** Why a move stopped where it did, said at that moment. */
type Stopped = 'edge' | ShapeProblem | null
/** The point he is working on: a bend in the line, or a corner of his field. */
export type Selected = { on: 'line' | 'field'; i: number } | null

/** GSA's proposal: his field as registered, the line along the edge the photo shows; the part away from what it flagged keeps last year's crop. */
function proposal(field: Field): Split {
  const line = edgeOf(field)
  const r = splitField(field.polygon, line, field.areaHa)
  const crops = (r ? r.parts.map((p) => (inArea(p, flagOf(field)) ? null : field.cropLastYear)) : [null, null]) as Split['crops']
  return { line, crops }
}

const samePoly = (a: Polygon, b: Polygon) => sameLine(a, b)

/**
 * Draft split, kept locally until he confirms. Undo and redo walk through drafts, and nothing here counts
 * as declared. Whatever he does, the draft is always a field and a line the field can be split by.
 * `record` is the field as registered; the draft may move its edge.
 */
export function useSplitDraft(record: Field, stored: Split | null) {
  const [draft, setDraft] = useState<Split>(() => stored ?? proposal(record))
  const [past, setPast] = useState<Split[]>([])
  const [future, setFuture] = useState<Split[]>([])
  const [stopped, setStopped] = useState<Stopped>(null)
  const [selected, setSelected] = useState<Selected>(null)
  // The helpers, on or off, always shown on the toolbar.
  const [snap, setSnap] = useState(true)
  const [slider, setSlider] = useState(false)
  const field = fieldWith(record, draft.boundary)
  const result = splitField(field.polygon, draft.line, field.areaHa)

  const remember = () => {
    setPast((p) => [...p, draft])
    setFuture([])
  }
  const update = (next: Split, rec = true, why: Stopped = null) => {
    if (rec) remember()
    // A field moved back onto its registered edge is the record again.
    const boundary = next.boundary && !samePoly(next.boundary, record.polygon) ? next.boundary : undefined
    setDraft({ ...next, boundary })
    setStopped(why)
  }
  /** A press that moved nothing leaves nothing to undo. */
  const settle = (next: Split) => {
    const last = past[past.length - 1]
    if (last && sameLine(last.line, next.line) && samePoly(last.boundary ?? record.polygon, next.boundary ?? record.polygon)) setPast(past.slice(0, -1))
  }
  const travel = (from: Split[], to: Split[], setFrom: (s: Split[]) => void, setTo: (s: Split[]) => void) => {
    if (!from.length) return
    const next = from[from.length - 1]
    setTo([...to, draft])
    setFrom(from.slice(0, -1))
    setDraft(next)
    setStopped(null)
    setSelected(null)
  }
  const undo = () => travel(past, future, setPast, setFuture)
  const redo = () => travel(future, past, setFuture, setPast)
  return { record, field, draft, result, update, remember, settle, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0, stopped, setStopped, selected, setSelected, snap, setSnap, slider, setSlider }
}

export type SplitDraft = ReturnType<typeof useSplitDraft>

/**
 * Moving the line and the field's edge, whatever moves them. He never places a point on empty ground: he
 * pulls the line or the edge, which bends where he pulled, and moves the corners and bends that makes. A move
 * that would leave a bad shape stops at the last good one before it, and the map says why, so there is no
 * invalid shape to come back from. The field can't go past the farmland registered around it.
 */
export function splitMoves(d: SplitDraft) {
  const { draft, record } = d
  const poly = d.field.polygon
  const edge = edgeOf(record)
  const land = record.land
  const haOf = (b: Polygon) => fieldWith(record, b).areaHa
  // What he can see and follow: the edge the photo shows, and his field's edge as registered.
  const snapped = (p: Point) => (d.snap ? snapToAny(p, [edge, outlinePath(record.polygon)]).point : p)

  type Shape = { boundary: Polygon; line: SplitLine; clamped?: boolean }
  const commit = (at: (t: number) => Shape, rec: boolean) => {
    const full = at(1)
    const problem = shapeProblem(land, full.boundary, full.line, haOf(full.boundary))
    if (!problem) return d.update({ ...draft, boundary: full.boundary, line: full.line }, rec, full.clamped ? 'edge' : null)
    let lo = 0
    let hi = 1
    for (let k = 0; k < 12; k++) {
      const mid = (lo + hi) / 2
      const m = at(mid)
      if (shapeProblem(land, m.boundary, m.line, haOf(m.boundary))) hi = mid
      else lo = mid
    }
    const good = at(lo)
    d.update({ ...draft, boundary: good.boundary, line: good.line }, rec, problem)
  }
  const isEnd = (i: number) => i === 0 || i === draft.line.length - 1
  /** With Snap on, an end close to where the photo's edge meets the field joins it. */
  const snapEnd = (p: Point) => [edge[0], edge[edge.length - 1]].find((e) => d.snap && Math.hypot(e.x - p.x, e.y - p.y) <= SNAP_M) ?? p
  const lerp = (a: Point, b: Point, t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })

  const moveBend = (i: number, p: Point, rec: boolean) => {
    const from = draft.line[i]
    commit((t) => {
      const at = lerp(from, p, t)
      const line = draft.line.map((q, k) => (k === i ? q : q))
      if (isEnd(i)) {
        line[i] = snapEnd(toFieldEdge(poly, at))
        return { boundary: poly, line }
      }
      const inside = keepInside(poly, snapped(at))
      line[i] = inside.point
      return { boundary: poly, line, clamped: inside.clamped }
    }, rec)
  }
  const moveCorner = (i: number, p: Point, rec: boolean) => {
    const from = poly[i]
    commit((t) => {
      const boundary = poly.map((q, k) => (k === i ? snapped(lerp(from, p, t)) : q))
      return { boundary, line: fitLine(boundary, draft.line) }
    }, rec)
  }
  const movePoint = (sel: NonNullable<Selected>, p: Point, rec: boolean) => (sel.on === 'line' ? moveBend(sel.i, p, rec) : moveCorner(sel.i, p, rec))

  /** A press on the line: the bend he pressed near, or a new one there. */
  const pull = (p: Point): Selected => {
    const r = pullLine(draft.line, p)
    d.remember()
    d.update({ ...draft, line: r.line }, false)
    const sel = { on: 'line' as const, i: r.bend }
    d.setSelected(sel)
    return sel
  }
  /** A press on the field's edge: the corner he pressed near, or a new one there. */
  const pullEdge = (p: Point): Selected => {
    const r = pullOutline(poly, p)
    d.remember()
    d.update({ ...draft, boundary: r.poly }, false)
    const sel = { on: 'field' as const, i: r.corner }
    d.setSelected(sel)
    return sel
  }
  const letGo = () => {
    // Only a point he let go on a straight stretch goes: the corners traced from the photo stay.
    const sel = d.selected
    const line = tidyLine(draft.line)
    const boundary = sel?.on === 'field' ? tidyOutline(poly, sel.i) : poly
    const next = { ...draft, line: fitLine(boundary, line), boundary }
    if (line.length !== draft.line.length || boundary.length !== poly.length) {
      d.update(next, false, d.stopped)
      d.setSelected(null)
    }
    d.settle(next)
  }
  const drop = (sel: NonNullable<Selected>) => {
    if (sel.on === 'line') {
      if (isEnd(sel.i)) return
      d.update({ ...draft, line: removeBend(draft.line, sel.i) })
    } else {
      const boundary = removeCorner(poly, sel.i)
      const line = fitLine(boundary, draft.line)
      const problem = shapeProblem(land, boundary, line, haOf(boundary))
      if (problem) return d.setStopped(problem)
      d.update({ ...draft, boundary, line })
    }
    d.setSelected(null)
  }
  /** Arrow keys: 5 m a press, 1 m with Shift. Delete takes the point out. */
  const nudge = (sel: NonNullable<Selected>, key: string, fine: boolean) => {
    if (key === 'Delete' || key === 'Backspace') {
      drop(sel)
      return true
    }
    const a = ARROWS[key]
    if (!a) return false
    const step = fine ? 1 : STEP_M
    const from = sel.on === 'line' ? draft.line[sel.i] : poly[sel.i]
    movePoint(sel, { x: from.x + a.x * step, y: from.y + a.y * step }, true)
    return true
  }
  const moveWhole = (to: number) => {
    const b = poly.map((p) => p.y)
    const dy = (to - lineHeight(poly, draft.line)) * (Math.max(...b) - Math.min(...b))
    const from = draft.line
    commit((t) => ({ boundary: poly, line: shiftLine(poly, from, dy * t) }), false)
  }
  const reset = () => {
    d.update({ ...draft, boundary: undefined, line: edge })
    d.setSelected(null)
  }
  const isReset = sameLine(draft.line, edge) && !draft.boundary
  return { movePoint, pull, pullEdge, letGo, drop, nudge, moveWhole, reset, isReset, isEnd }
}

const namesOf = (d: SplitDraft) => (d.result ? partNames(d.result.parts) : null)
/** The parts as they sit on the map: top before bottom, left before right. */
const orderOf = (d: SplitDraft): (0 | 1)[] => {
  const n = namesOf(d)
  return n && (n[0] === 'bottom' || n[0] === 'right') ? [1, 0] : [0, 1]
}
const partLabel = (d: SplitDraft, i: 0 | 1) => {
  const n = namesOf(d)
  return n ? copy.part[n[i]] : ''
}

/** What's written on each part of the map at each step: which part and its size, then what grows there. */
export function partLabels(d: SplitDraft, step: 'line' | 'crops' | 'effects'): [string, string] {
  const r = d.result
  if (!r) return ['', '']
  const label = (i: 0 | 1) => {
    const ha = formatHa(r.areasHa[i])
    const crop = d.draft.crops[i]
    return step === 'line' || !crop ? copy.partArea(partLabel(d, i), ha) : copy.partArea(en.crops[crop], ha)
  }
  return [label(0), label(1)]
}

/**
 * Step 1's toolbar: undo and redo never move, the helpers always show whether they're on, and the last place
 * changes with what he has selected. Why a move stopped is said above it, right where he is working; going
 * past the registered farmland is an error, said the same way.
 */
export function LineTools({ d }: { d: SplitDraft }) {
  const { draft } = d
  const moves = splitMoves(d)
  const t = copy.tools
  const sel = d.selected && !(d.selected.on === 'line' && moves.isEnd(d.selected.i)) ? d.selected : null
  const order = orderOf(d)
  const r = d.result
  const areas = r ? order.map((i) => copy.partArea(partLabel(d, i), formatHa(r.areasHa[i]))).join(', ') : ''

  return (
    <>
      <div aria-live="polite">
        {d.stopped && (
          <MapStatus error={d.stopped === 'outside_land'}>
            {copy.stopped[d.stopped]} {d.stopped === 'too_small' && <Note kind="assumption" />}
          </MapStatus>
        )}
        <VisuallyHidden>{areas}</VisuallyHidden>
      </div>
      {d.slider && (
        <label className="tool-slider">
          <span>{t.sliderLabel}</span>
          <input
            type="range"
            min={5}
            max={95}
            step={1}
            value={Math.round(lineHeight(d.field.polygon, draft.line) * 100)}
            aria-valuetext={areas}
            onPointerDown={d.remember}
            onKeyDown={(e) => e.key.startsWith('Arrow') && d.remember()}
            onChange={(e) => moves.moveWhole(Number(e.target.value) / 100)}
          />
        </label>
      )}
      <ToolIsland label={t.label}>
        <ToolButton icon="undo" caption={t.undo} hint={t.undoHint} short disabled={!d.canUndo} onClick={d.undo} />
        <ToolButton icon="redo" caption={t.redo} hint={t.redoHint} short disabled={!d.canRedo} onClick={d.redo} />
        <ToolDivider />
        <ToolButton icon="snap" caption={t.snap(d.snap)} hint={t.snapHint} on={d.snap} onClick={() => d.setSnap(!d.snap)} />
        <ToolButton icon="slider" caption={t.slider(d.slider)} hint={t.sliderHint} on={d.slider} onClick={() => d.setSlider(!d.slider)} />
        <ToolDivider />
        {sel ? (
          <ToolButton icon="close" caption={t.remove} hint={t.removeHint} short onClick={() => moves.drop(sel)} />
        ) : (
          <ToolButton icon="reset" caption={t.reset} hint={t.resetHint} short disabled={moves.isReset} onClick={moves.reset} />
        )}
      </ToolIsland>
    </>
  )
}

/** Step 1: GSA's line and how to move it, and his field's edge. The tools are on the map. */
export function LineStep({ d, onBack, onNext }: { d: SplitDraft; onBack: () => void; onNext: () => void }) {
  const onEdge = followsEdge(d.draft.line, edgeOf(d.record)) && !d.draft.boundary

  // On a keyboard, undo and redo work as everywhere else.
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) d.redo()
        else d.undo()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })

  const moved = d.draft.boundary ? roundHa(d.field.areaHa - d.record.areaHa) : 0
  return (
    <Stack gap="sm">
      <div className="split-lead">
        <Text variant="secondary">
          {onEdge ? copy.proposed : copy.yourLine} <Note kind="ai" />
        </Text>
      </div>
      {moved !== 0 && <Text variant="secondary">{copy.fieldNow(formatHa(d.field.areaHa), formatHa(Math.abs(moved)), moved > 0)}</Text>}
      <StageAction>
        <Inline>
          <Button onClick={onBack}>{copy.back}</Button>
          <Button variant="primary" disabled={!d.result} onClick={onNext}>{copy.next}</Button>
        </Inline>
      </StageAction>
    </Stack>
  )
}

/** Step 2: what grows in each part, in the order they sit on the map. A tap on a part comes here. */
export function CropsStep({ d, onBack, onNext }: { d: SplitDraft; onBack: () => void; onNext: () => void }) {
  const { draft, result } = d
  const same = !!draft.crops[0] && draft.crops[0] === draft.crops[1]
  const complete = !!result && !!draft.crops[0] && !!draft.crops[1] && !same
  const order = orderOf(d)
  const options = PART_CROPS.map((c) => ({ value: c, label: en.crops[c] }))
  return (
    <Stack gap="md">
      <div className="split-lead">
        <Text variant="secondary">{copy.cropsHint}</Text>
      </div>
      {result &&
        order.map((i) => (
          <Select
            key={i}
            id={`part-crop-${i}`}
            label={copy.cropFor(partLabel(d, i), formatHa(result.areasHa[i]))}
            placeholder={copy.choose}
            options={options}
            value={draft.crops[i] ?? ''}
            error={same && i === order[1] ? copy.sameError : undefined}
            onChange={(e) => {
              const crops: Split['crops'] = [...draft.crops]
              crops[i] = (e.target.value || null) as PartCrop | null
              d.update({ ...draft, crops }, false)
            }}
          />
        ))}
      <StageAction>
        <Inline>
          <Button onClick={onBack}>{copy.back}</Button>
          <Button variant="primary" disabled={!complete} onClick={onNext}>{copy.next}</Button>
        </Inline>
      </StageAction>
    </Stack>
  )
}

/**
 * Step 3: before he confirms, what the split does to the rest of his application, worked out from the same
 * rules as the estimate. The areas, the crops, the measures it touches and the money, each with its reason.
 */
export function EffectsStep({ d, onBack, onConfirm }: { d: SplitDraft; onBack: () => void; onConfirm: (s: Split) => void }) {
  const { derived, state } = useApp()
  const e = splitEffects(derived.base, state.answers, d.draft)
  if (!e) return null
  const c = copy.effects
  const about = (n: number) => formatDinars(Math.round(Math.abs(n) / 100) * 100)
  const parts = e.parts.map((p) => `${en.crops[p.crop].toLowerCase()} ${formatHa(p.ha)}`).join(' and ')
  const money = e.movedDinars - e.lostDinars
  const items: [string, string][] = [
    [c.field, e.movedHa ? c.fieldMoved(parts, formatHa(e.totalHa), formatHa(Math.abs(e.movedHa)), e.movedHa > 0) : c.fieldValue(parts, formatHa(e.totalHa))],
    [c.estimate, money > 0 ? c.more(about(money)) : money < 0 ? (e.lostHa ? c.less(about(money)) : c.smaller(about(money))) : c.same],
    [c.measures, e.lostHa ? c.oneCounts(formatHa(roundHa(e.totalHa - e.lostHa))) : c.bothCount],
  ]
  if (e.newCrop) items.push([c.newFor, c.newCrop(en.crops[e.newCrop.crop].toLowerCase())])
  if (e.coverChosen) items.push([c.measures, c.cover])
  return (
    <Stack gap="sm">
      <Answers items={items} />
      {(e.lostHa > 0 || e.newCrop) && <Note kind="assumption" />}
      <StageAction>
        <Inline>
          <Button onClick={onBack}>{copy.back}</Button>
          <Button variant="primary" onClick={() => onConfirm(d.draft)}>{copy.confirm}</Button>
        </Inline>
      </StageAction>
    </Stack>
  )
}
