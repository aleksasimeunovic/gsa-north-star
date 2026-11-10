import { useRef, useState } from 'react'
import { fieldEdit, formatHa, shapeTools } from '../copy/en'
import type { Point, Polygon } from '../data/scenarios'
import { outlinePath, pullOutline, removeCorner, sameLine, scaledHa, snapToAny, stripProblem, tidyOutline, yardHa, yardProblem, type YardProblem } from '../logic/geometry'
import { VisuallyHidden } from '../ui/Layout'
import { MapStatus, RemoveHint, ToolButton, ToolDivider, ToolIsland } from '../ui/MapTools'

const STEP_M = 1
const ARROWS: Record<string, Point> = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } }

/**
 * The house and yard he leaves out of a field, kept locally until he saves the field. It starts as GSA's
 * outline from the photo. He pulls its edge anywhere (it bends there), moves its corners, or drags the whole
 * yard onto the house. A move that would leave a bad shape stops at the last good one and says why, so a yard
 * outside the field, crossing itself or too small to matter never exists.
 * The same editing serves the road strip (`kind: 'road'`): GSA's outline from the land map, which he moves if
 * the road took more or less of his field. With Snap on, a corner joins GSA's outline or the field's edge.
 * `recordHa` for the road is the land map's strip area, so his outline counts as its share.
 */
export function useYardDraft(field: Polygon, recordHa: number, start: Polygon, kind: 'yard' | 'road' = 'yard', initial: Polygon = start) {
  const words = kind === 'road' ? fieldEdit.road : fieldEdit.yard
  const problemOf = kind === 'road' ? stripProblem : yardProblem
  const [snap, setSnap] = useState(true)
  const [snapped, setSnapped] = useState(false)
  const [yard, setYard] = useState(initial)
  const [past, setPast] = useState<Polygon[]>([])
  const [future, setFuture] = useState<Polygon[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [stopped, setStopped] = useState<YardProblem | null>(null)
  // Confirm first: he edits only once he says GSA's outline is wrong.
  const [editing, setEditing] = useState(false)
  const cur = useRef(yard)
  cur.current = yard

  const remember = () => {
    setPast((p) => [...p, cur.current])
    setFuture([])
  }
  const snapped_ = (p: Point) => {
    if (!snap) return p
    const r = snapToAny(p, [outlinePath(start), outlinePath(field)])
    setSnapped(r.snapped)
    return r.point
  }
  const tryShape = (next: Polygon) => {
    const problem = problemOf(field, next)
    setStopped(problem)
    if (problem) return false
    cur.current = next
    setYard(next)
    return true
  }
  const travel = (from: Polygon[], to: Polygon[], setFrom: (s: Polygon[]) => void, setTo: (s: Polygon[]) => void) => {
    if (!from.length) return
    setTo([...to, cur.current])
    setFrom(from.slice(0, -1))
    cur.current = from[from.length - 1]
    setYard(cur.current)
    setStopped(null)
    setSelected(null)
  }
  const moves = {
    /** A press on the yard's edge: the corner he pressed near, or a new one there. */
    pull: (p: Point) => {
      remember()
      const r = pullOutline(cur.current, p)
      tryShape(r.poly)
      setSelected(r.corner)
      return r.corner
    },
    move: (i: number, p: Point) => tryShape(cur.current.map((q, k) => (k === i ? snapped_(p) : q))),
    /** The whole yard, by as far as he dragged it. */
    shift: (from: Polygon, by: Point) => tryShape(from.map((q) => ({ x: q.x + by.x, y: q.y + by.y }))),
    /** Letting go: a corner on a straight stretch isn't a corner, and a press that moved nothing leaves nothing to undo. */
    letGo: (i: number | null) => {
      if (i !== null) {
        const tidy = tidyOutline(cur.current, i)
        if (tidy !== cur.current && !problemOf(field, tidy)) {
          cur.current = tidy
          setYard(tidy)
          setSelected(null)
        }
      }
      setPast((p) => (p.length && sameLine(p[p.length - 1], cur.current) ? p.slice(0, -1) : p))
    },
    nudge: (i: number, key: string, far: boolean) => {
      if (key === 'Delete' || key === 'Backspace') {
        moves.drop(i)
        return true
      }
      const d = ARROWS[key]
      if (!d) return false
      remember()
      const k = far ? 5 : STEP_M
      const p = cur.current[i]
      tryShape(cur.current.map((q, n) => (n === i ? { x: p.x + d.x * k, y: p.y + d.y * k } : q)))
      return true
    },
    drop: (i: number) => {
      if (cur.current.length <= 3) return
      remember()
      if (tryShape(removeCorner(cur.current, i))) setSelected(null)
    },
    reset: () => {
      remember()
      tryShape(start)
      setSelected(null)
    },
    isReset: sameLine(yard, start),
  }
  return {
    field,
    yard,
    yardHa: !yard.length || !field.length ? 0 : kind === 'road' ? scaledHa(start, recordHa, yard, field) : yardHa(field, recordHa, yard),
    words,
    snap,
    setSnap: (on: boolean) => {
      setSnap(on)
      setSnapped(false)
    },
    snapped,
    moves,
    remember,
    selected,
    setSelected,
    stopped,
    editing,
    setEditing,
    undo: () => travel(past, future, setPast, setFuture),
    redo: () => travel(future, past, setFuture, setPast),
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  }
}

export type YardDraft = ReturnType<typeof useYardDraft>

/**
 * On the map while he edits, the same island as the divider line: why a move stopped or that a corner joined
 * an edge, or how to take a corner out (a double click), then Undo, Redo, Snap and Reset.
 */
export function YardIsland({ d }: { d: YardDraft }) {
  const t = shapeTools
  const w = d.words
  return (
    <>
      <div aria-live="polite">
        {d.stopped ? <MapStatus>{w.stopped[d.stopped]}</MapStatus> : d.snap && d.snapped ? <MapStatus icon="snap">{t.joined}</MapStatus> : <RemoveHint />}
        <VisuallyHidden>{w.label(formatHa(d.yardHa))}</VisuallyHidden>
      </div>
      <ToolIsland label={w.tools}>
        <ToolButton icon="undo" caption={t.undo} hint={t.undoHint} idle={t.undoIdle} disabled={!d.canUndo} onClick={d.undo} />
        <ToolButton icon="redo" caption={t.redo} hint={t.redoHint} idle={t.redoIdle} disabled={!d.canRedo} onClick={d.redo} />
        <ToolDivider />
        <ToolButton icon="snap" caption={t.snap} hint={d.snap ? t.snapOn : t.snapOff} on={d.snap} onClick={() => d.setSnap(!d.snap)} />
        <ToolDivider />
        <ToolButton icon="reset" caption={t.reset} hint={w.resetHint} idle={w.resetIdle} disabled={d.moves.isReset} onClick={d.moves.reset} />
      </ToolIsland>
    </>
  )
}
