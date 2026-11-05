import { useRef, useState } from 'react'
import { fieldEdit, formatHa } from '../copy/en'
import type { Point, Polygon } from '../data/scenarios'
import { pullOutline, removeCorner, sameLine, tidyOutline, yardHa, yardProblem, type YardProblem } from '../logic/geometry'
import { VisuallyHidden } from '../ui/Layout'
import { MapStatus, ToolButton, ToolDivider, ToolIsland } from '../ui/MapTools'

const STEP_M = 1
const ARROWS: Record<string, Point> = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } }

/**
 * The house and yard he leaves out of a field, kept locally until he saves the field. It starts as GSA's
 * outline from the photo. He pulls its edge anywhere (it bends there), moves its corners, or drags the whole
 * yard onto the house. A move that would leave a bad shape stops at the last good one and says why, so a yard
 * outside the field, crossing itself or too small to matter never exists.
 */
export function useYardDraft(field: Polygon, recordHa: number, start: Polygon) {
  const [yard, setYard] = useState(start)
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
  const tryShape = (next: Polygon) => {
    const problem = yardProblem(field, next)
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
    move: (i: number, p: Point) => tryShape(cur.current.map((q, k) => (k === i ? p : q))),
    /** The whole yard, by as far as he dragged it. */
    shift: (from: Polygon, by: Point) => tryShape(from.map((q) => ({ x: q.x + by.x, y: q.y + by.y }))),
    /** Letting go: a corner on a straight stretch isn't a corner, and a press that moved nothing leaves nothing to undo. */
    letGo: (i: number | null) => {
      if (i !== null) {
        const tidy = tidyOutline(cur.current, i)
        if (tidy !== cur.current && !yardProblem(field, tidy)) {
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
    yardHa: yard.length && field.length ? yardHa(field, recordHa, yard) : 0,
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

/** On the map while he edits: why a move stopped, then Undo, Redo and Reset (Remove while a corner is selected). */
export function YardIsland({ d }: { d: YardDraft }) {
  const t = fieldEdit.yard
  return (
    <>
      <div aria-live="polite">
        {d.stopped && <MapStatus>{t.stopped[d.stopped]}</MapStatus>}
        <VisuallyHidden>{t.label(formatHa(d.yardHa))}</VisuallyHidden>
      </div>
      <ToolIsland label={t.tools}>
        <ToolButton icon="undo" caption={t.undo} hint={t.undoHint} disabled={!d.canUndo} onClick={d.undo} />
        <ToolButton icon="redo" caption={t.redo} hint={t.redoHint} disabled={!d.canRedo} onClick={d.redo} />
        <ToolDivider />
        {d.selected !== null && d.yard.length > 3 ? (
          <ToolButton icon="close" caption={t.remove} hint={t.removeHint} onClick={() => d.moves.drop(d.selected!)} />
        ) : (
          <ToolButton icon="reset" caption={t.reset} hint={t.resetHint} disabled={d.moves.isReset} onClick={d.moves.reset} />
        )}
      </ToolIsland>
    </>
  )
}
