import { useEffect, useState } from 'react'
import { en, formatDinars, formatHa, split as copy } from '../copy/en'
import { PART_CROPS, type Field, type PartCrop, type Point } from '../data/scenarios'
import { splitEffects } from '../logic/farm'
import {
  followsEdge,
  inArea,
  keepInside,
  lineHeight,
  lineProblem,
  partNames,
  pullLine,
  removeBend,
  roundHa,
  sameLine,
  shiftLine,
  SNAP_M,
  snapToEdge,
  splitField,
  straightLine,
  tidyLine,
  toFieldEdge,
  type LineProblem,
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

/** Why the line stopped where it did, said at that moment. */
type Stopped = 'edge' | LineProblem | 'bends' | 'straight' | null

/** GSA's proposal: the line along the edge the photo shows; the part away from what it flagged keeps last year's crop. */
function proposal(field: Field): Split {
  const line = edgeOf(field)
  const r = splitField(field.polygon, line, field.areaHa)
  const crops = (r ? r.parts.map((p) => (inArea(p, flagOf(field)) ? null : field.cropLastYear)) : [null, null]) as Split['crops']
  return { line, crops }
}

/**
 * Draft split, kept locally until he confirms. Undo and redo walk through drafts, and nothing here counts
 * as declared. Whatever he does, the draft is always a line the field can be split by.
 */
export function useSplitDraft(field: Field, stored: Split | null) {
  const [draft, setDraft] = useState<Split>(() => stored ?? proposal(field))
  const [past, setPast] = useState<Split[]>([])
  const [future, setFuture] = useState<Split[]>([])
  const [stopped, setStopped] = useState<Stopped>(null)
  const [bend, setBend] = useState<number | null>(null)
  // The helpers, on or off, always shown on the toolbar.
  const [snap, setSnap] = useState(true)
  const [straight, setStraight] = useState(false)
  const [slider, setSlider] = useState(false)
  const result = splitField(field.polygon, draft.line, field.areaHa)

  const remember = () => {
    setPast((p) => [...p, draft])
    setFuture([])
  }
  const update = (next: Split, record = true, why: Stopped = null) => {
    if (record) remember()
    setDraft(next)
    setStopped(why)
  }
  /** A press that moved nothing leaves nothing to undo. */
  const settle = (line: SplitLine) => {
    const last = past[past.length - 1]
    if (last && sameLine(last.line, line)) setPast(past.slice(0, -1))
  }
  const travel = (from: Split[], to: Split[], setFrom: (s: Split[]) => void, setTo: (s: Split[]) => void) => {
    if (!from.length) return
    const next = from[from.length - 1]
    setTo([...to, draft])
    setFrom(from.slice(0, -1))
    setDraft(next)
    setStopped(null)
    setBend(null)
    if (next.line.length > 2) setStraight(false)
  }
  const undo = () => travel(past, future, setPast, setFuture)
  const redo = () => travel(future, past, setFuture, setPast)
  return { draft, result, update, remember, settle, undo, redo, canUndo: past.length > 0, canRedo: future.length > 0, stopped, setStopped, bend, setBend, snap, setSnap, straight, setStraight, slider, setSlider }
}

export type SplitDraft = ReturnType<typeof useSplitDraft>

/**
 * Moving the line, whatever moves it. He never places a point: he pulls the line, which bends where he
 * pulled, and moves its ends along the field's edge. A move that would leave a bad line stops at the last
 * good one before it, and the map says why, so there is no invalid shape to come back from.
 */
export function splitMoves(field: Field, d: SplitDraft) {
  const { draft } = d
  const poly = field.polygon
  const edge = edgeOf(field)
  const commit = (lineAt: (t: number) => { line: SplitLine; clamped?: boolean }, record: boolean) => {
    const full = lineAt(1)
    const problem = lineProblem(poly, full.line, field.areaHa)
    if (!problem) return d.update({ ...draft, line: full.line }, record, full.clamped ? 'edge' : null)
    let lo = 0
    let hi = 1
    for (let k = 0; k < 12; k++) {
      const mid = (lo + hi) / 2
      if (lineProblem(poly, lineAt(mid).line, field.areaHa)) hi = mid
      else lo = mid
    }
    d.update({ ...draft, line: lineAt(lo).line }, record, problem)
  }
  const withPoint = (i: number, p: Point) => draft.line.map((q, k) => (k === i ? p : q))
  const isEnd = (i: number) => i === 0 || i === draft.line.length - 1
  /** With Snap on, an end close to where the photo's edge meets the field joins it. */
  const snapEnd = (p: Point) => [edge[0], edge[edge.length - 1]].find((e) => d.snap && Math.hypot(e.x - p.x, e.y - p.y) <= SNAP_M) ?? p

  const movePoint = (i: number, p: Point, record: boolean) => {
    const from = draft.line[i]
    commit((t) => {
      const at = { x: from.x + (p.x - from.x) * t, y: from.y + (p.y - from.y) * t }
      if (isEnd(i)) return { line: withPoint(i, snapEnd(toFieldEdge(poly, at))) }
      const inside = keepInside(poly, at)
      return { line: withPoint(i, d.snap ? snapToEdge(inside.point, edge).point : inside.point), clamped: inside.clamped }
    }, record)
  }
  /** A press on the line: the bend he pressed near, or a new one there. */
  const pull = (p: Point): number | null => {
    if (d.straight) {
      d.setStopped('straight')
      return null
    }
    const r = pullLine(draft.line, p)
    if (!r) {
      d.setStopped('bends')
      return null
    }
    d.remember()
    d.update({ ...draft, line: r.line }, false)
    d.setBend(r.bend)
    return r.bend
  }
  const letGo = () => {
    const tidy = tidyLine(draft.line)
    if (tidy.length !== draft.line.length) {
      d.update({ ...draft, line: tidy }, false)
      d.setBend(null)
    }
    d.settle(tidy)
  }
  const dropBend = (i: number) => {
    d.update({ ...draft, line: removeBend(draft.line, i) })
    d.setBend(null)
  }
  /** Arrow keys: 5 m a press, 1 m with Shift. */
  const nudge = (i: number, key: string, fine: boolean) => {
    if ((key === 'Delete' || key === 'Backspace') && !isEnd(i)) {
      dropBend(i)
      return true
    }
    const a = ARROWS[key]
    if (!a) return false
    const step = fine ? 1 : STEP_M
    movePoint(i, { x: draft.line[i].x + a.x * step, y: draft.line[i].y + a.y * step }, true)
    return true
  }
  const moveWhole = (to: number) => {
    const b = poly.map((p) => p.y)
    const dy = (to - lineHeight(poly, draft.line)) * (Math.max(...b) - Math.min(...b))
    const from = draft.line
    commit((t) => ({ line: shiftLine(poly, from, dy * t) }), false)
  }
  const reset = () => {
    d.update({ ...draft, line: edge })
    d.setStraight(false)
    d.setBend(null)
  }
  const toggleStraight = () => {
    d.setBend(null)
    if (d.straight) return d.setStraight(false)
    d.setStraight(true)
    if (draft.line.length > 2) d.update({ ...draft, line: straightLine(draft.line) })
    else d.setStopped(null)
  }
  return { movePoint, pull, letGo, dropBend, nudge, moveWhole, reset, toggleStraight, isEnd }
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

const STOPPED = (s: NonNullable<Stopped>) => (s === 'bends' ? copy.noMoreBends : s === 'straight' ? copy.straightOn : copy.stopped[s])

/**
 * Step 1's toolbar: undo and redo never move, the helpers always show whether they're on, and the last place
 * changes with what he has selected. Why the line stopped is said above it, right where he is working.
 */
export function LineTools({ field, d }: { field: Field; d: SplitDraft }) {
  const { draft } = d
  const moves = splitMoves(field, d)
  const t = copy.tools
  const edge = edgeOf(field)
  const bend = d.bend !== null && !moves.isEnd(d.bend) && d.bend < draft.line.length ? d.bend : null
  const order = orderOf(d)
  const r = d.result
  const areas = r ? order.map((i) => copy.partArea(partLabel(d, i), formatHa(r.areasHa[i]))).join(', ') : ''

  return (
    <>
      <div aria-live="polite">
        {d.stopped && (
          <MapStatus>
            {STOPPED(d.stopped)} {d.stopped === 'too_small' && <Note kind="assumption" />}
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
            value={Math.round(lineHeight(field.polygon, draft.line) * 100)}
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
        <ToolButton icon="straight" caption={t.straight(d.straight)} hint={t.straightHint} on={d.straight} onClick={moves.toggleStraight} />
        <ToolButton icon="slider" caption={t.slider(d.slider)} hint={t.sliderHint} on={d.slider} onClick={() => d.setSlider(!d.slider)} />
        <ToolDivider />
        {bend !== null ? (
          <ToolButton icon="close" caption={t.remove} hint={t.removeHint} short onClick={() => moves.dropBend(bend)} />
        ) : (
          <ToolButton icon="reset" caption={t.reset} hint={t.resetHint} short disabled={sameLine(draft.line, edge)} onClick={moves.reset} />
        )}
      </ToolIsland>
    </>
  )
}

/** Step 1: GSA's line and how to move it. The tools are on the map. */
export function LineStep({ field, d, onBack, onNext }: { field: Field; d: SplitDraft; onBack: () => void; onNext: () => void }) {
  const onEdge = followsEdge(d.draft.line, edgeOf(field))

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

  return (
    <Stack gap="sm">
      <div className="split-lead">
        <Text variant="secondary">
          {onEdge ? copy.proposed : copy.yourLine} <Note kind="ai" />
        </Text>
      </div>
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
  const e = splitEffects(derived.scenario, state.answers, d.draft)
  if (!e) return null
  const c = copy.effects
  const about = (n: number) => formatDinars(Math.round(n / 100) * 100)
  const items: [string, string][] = [
    [c.field, c.fieldValue(e.parts.map((p) => `${en.crops[p.crop].toLowerCase()} ${formatHa(p.ha)}`).join(' and '), formatHa(e.totalHa))],
    [c.estimate, e.lostHa ? c.less(about(e.lostDinars)) : c.same],
    [c.measures, e.lostHa ? c.oneCounts(formatHa(roundHa(e.totalHa - e.lostHa))) : c.bothCount],
  ]
  if (e.coverChosen) items.push([c.measures, c.cover])
  return (
    <Stack gap="sm">
      <Answers items={items} />
      {e.lostHa > 0 && <Note kind="assumption" />}
      <StageAction>
        <Inline>
          <Button onClick={onBack}>{copy.back}</Button>
          <Button variant="primary" onClick={() => onConfirm(d.draft)}>{copy.confirm}</Button>
        </Inline>
      </StageAction>
    </Stack>
  )
}
