import { useState } from 'react'
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
  snapToEdge,
  splitField,
  straightLine,
  tidyLine,
  toFieldEdge,
  type LineProblem,
  type SplitLine,
} from '../logic/geometry'
import type { Split } from '../state/actions'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Answers } from '../ui/Fact'
import { Inline, Stack, Text, VisuallyHidden } from '../ui/Layout'
import { StageAction } from '../ui/MapStage'
import { Note } from '../ui/Note'
import { Select } from '../ui/Select'
import { useApp } from './AppContext'

const STEP_M = 5
const ARROWS: Record<string, Point> = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } }
const edgeOf = (field: Field) => (field.signal?.kind === 'satellite_difference' ? field.signal.edge : field.polygon)
const flagOf = (field: Field) => (field.signal?.kind === 'satellite_difference' ? field.signal.flagPolygon : field.polygon)

/** Why the line stopped where it did, said at that moment. */
type Stopped = 'edge' | LineProblem | 'bends' | null

/** GSA's proposal: the line along the edge the photo shows; the part above it keeps last year's crop. */
function proposal(field: Field): Split {
  const line = edgeOf(field)
  const r = splitField(field.polygon, line)
  const crops = (r ? r.parts.map((p) => (inArea(p, flagOf(field)) ? null : field.cropLastYear)) : [null, null]) as Split['crops']
  return { line, crops }
}

/**
 * Draft split, kept locally until he confirms. Undo walks back through drafts, and nothing here counts
 * as declared. Whatever he does, the draft is always a line the field can be split by.
 */
export function useSplitDraft(field: Field, stored: Split | null) {
  const [draft, setDraft] = useState<Split>(() => stored ?? proposal(field))
  const [past, setPast] = useState<Split[]>([])
  const [stopped, setStopped] = useState<Stopped>(null)
  const [bend, setBend] = useState<number | null>(null)
  const result = splitField(field.polygon, draft.line)

  const remember = () => setPast((p) => [...p, draft])
  const update = (next: Split, record = true, why: Stopped = null) => {
    if (record) remember()
    setDraft(next)
    setStopped(why)
  }
  const undo = () => {
    if (!past.length) return
    setDraft(past[past.length - 1])
    setPast(past.slice(0, -1))
    setStopped(null)
    setBend(null)
  }
  return { draft, result, update, remember, undo, canUndo: past.length > 0, stopped, setStopped, bend, setBend }
}

export type SplitDraft = ReturnType<typeof useSplitDraft>

/**
 * Moving the line, whatever moves it. He never places a point: he pulls the line, which bends where he
 * pulled, and moves its ends along the field's edge. A move that would leave a bad line stops at the last
 * good one before it, and the panel says why, so there is no invalid shape to come back from.
 */
export function splitMoves(field: Field, d: SplitDraft) {
  const { draft } = d
  const poly = field.polygon
  const edge = edgeOf(field)
  const commit = (lineAt: (t: number) => { line: SplitLine; clamped?: boolean }, record: boolean) => {
    const full = lineAt(1)
    const problem = lineProblem(poly, full.line)
    if (!problem) return d.update({ ...draft, line: full.line }, record, full.clamped ? 'edge' : null)
    let lo = 0
    let hi = 1
    for (let k = 0; k < 12; k++) {
      const mid = (lo + hi) / 2
      if (lineProblem(poly, lineAt(mid).line)) hi = mid
      else lo = mid
    }
    d.update({ ...draft, line: lineAt(lo).line }, record, problem)
  }
  const withPoint = (i: number, p: Point) => draft.line.map((q, k) => (k === i ? p : q))
  const isEnd = (i: number) => i === 0 || i === draft.line.length - 1

  const movePoint = (i: number, p: Point, record: boolean) => {
    const from = draft.line[i]
    commit((t) => {
      const at = { x: from.x + (p.x - from.x) * t, y: from.y + (p.y - from.y) * t }
      if (isEnd(i)) return { line: withPoint(i, toFieldEdge(poly, at)) }
      const inside = keepInside(poly, at)
      return { line: withPoint(i, snapToEdge(inside.point, edge).point), clamped: inside.clamped }
    }, record)
  }
  /** A press on the line: the bend he pressed near, or a new one there. */
  const pull = (p: Point): number | null => {
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
    commit((t) => ({ line: shiftLine(poly, from, dy * t) }), true)
  }
  const replace = (line: SplitLine) => {
    d.update({ ...draft, line })
    d.setBend(null)
  }
  return { movePoint, pull, letGo, dropBend, nudge, moveWhole, replace, isEnd }
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

/** What's written on each part of the map at each step: its size, then which part, then what grows there. */
export function partLabels(d: SplitDraft, step: 'line' | 'crops' | 'effects'): [string, string] {
  const r = d.result
  if (!r) return ['', '']
  const label = (i: 0 | 1) => {
    const ha = formatHa(r.areasHa[i])
    if (step === 'line') return ha
    const crop = d.draft.crops[i]
    return step === 'crops' || !crop ? `${partLabel(d, i)}, ${ha}` : `${en.crops[crop]}, ${ha}`
  }
  return [label(0), label(1)]
}

/** Step 1: the line GSA proposes, the help to follow a boundary, and why it stopped if it stopped. */
export function LineStep({ field, d, onNext }: { field: Field; d: SplitDraft; onNext: () => void }) {
  const [slider, setSlider] = useState(false)
  const { draft, result } = d
  const moves = splitMoves(field, d)
  const edge = edgeOf(field)
  const onEdge = followsEdge(draft.line, edge)
  const hasBends = draft.line.length > 2
  const order = orderOf(d)
  const areas = result ? order.map((i) => copy.partArea(partLabel(d, i), formatHa(result.areasHa[i]))).join('. ') : ''

  return (
    <Stack gap="sm">
      <Text>
        {copy.proposed} <Note kind="ai" />
      </Text>
      <div aria-live="polite">
        {d.stopped ? (
          <Banner tone="attention">
            {d.stopped === 'bends' ? copy.noMoreBends : copy.stopped[d.stopped]} {d.stopped === 'too_small' && <Note kind="assumption" />}
          </Banner>
        ) : (
          <p className="hint split-state">{onEdge ? copy.following : copy.yourLine}</p>
        )}
        <VisuallyHidden>{areas}</VisuallyHidden>
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
            value={Math.round(lineHeight(field.polygon, draft.line) * 100)}
            aria-valuetext={areas}
            onChange={(e) => moves.moveWhole(Number(e.target.value) / 100)}
          />
        </div>
      )}
      <div className="split-help">
        {d.bend !== null && !moves.isEnd(d.bend) && d.bend < draft.line.length && (
          <Button variant="link" onClick={() => moves.dropBend(d.bend!)}>{copy.removeBend}</Button>
        )}
        {!onEdge && <Button variant="link" onClick={() => moves.replace(edge)}>{copy.follow}</Button>}
        {hasBends && !sameLine(draft.line, straightLine(draft.line)) && <Button variant="link" onClick={() => moves.replace(straightLine(draft.line))}>{copy.straight}</Button>}
        <Button variant="link" onClick={() => setSlider(!slider)}>{slider ? copy.useDrag : copy.useSlider}</Button>
      </div>
      <StageAction>
        <Inline>
          {d.canUndo && <Button onClick={d.undo}>{copy.undo}</Button>}
          <Button variant="primary" disabled={!result} onClick={onNext}>{copy.next}</Button>
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
    <Stack gap="sm">
      <Text variant="small">{copy.cropsHint}</Text>
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
