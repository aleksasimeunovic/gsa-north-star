import { useMemo, useRef, useState } from 'react'
import { drawField as t, formatHa } from '../copy/en'
import type { Point, Polygon } from '../data/scenarios'
import { closeProblem, cornerProblem, drawIssues, drawnHa, insertCorner, leaveOutOverlap, outlineProblem, snapCorner, type DrawContext, type DrawIssue, type DrawProblem } from '../logic/drawing'
import { sameLine } from '../logic/geometry'
import { Button } from '../ui/Button'
import { VisuallyHidden } from '../ui/Layout'
import { MapStatus, RemoveHint, ToolButton, ToolDivider, ToolIsland } from '../ui/MapTools'

type Shape = { corners: Point[]; closed: boolean }
const ARROWS: Record<string, Point> = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } }

/** An open chain of corners is good when each corner could have been placed after the ones before it. */
const pathProblem = (corners: Point[], ctx: DrawContext): DrawProblem | null => {
  for (let i = 0; i < corners.length; i++) {
    const p = cornerProblem(corners.slice(0, i), corners[i], ctx)
    if (p) return p
  }
  return null
}

/**
 * A field he draws himself, kept locally until he saves it. While he draws, a cross on the map says where the
 * next corner goes (the middle of the map on a phone, the pointer with a mouse). It goes red where a corner
 * can't go, and the shape goes orange while it is too small or takes land he already declares. Once it has
 * three corners he can create it; then every corner, and the middle of every edge, pulls to where his field ends.
 */
export function useFieldDraw(ctx: DrawContext, start?: Polygon) {
  const first: Shape = start ? { corners: start, closed: true } : { corners: [], closed: false }
  const [shape, setShape] = useState<Shape>(first)
  const [past, setPast] = useState<Shape[]>([])
  const [future, setFuture] = useState<Shape[]>([])
  const [cross, setCrossState] = useState<{ point: Point; snapped: boolean; closes: boolean } | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [stopped, setStopped] = useState<DrawProblem | null>(null)
  const cur = useRef(shape)
  cur.current = shape
  const created = useRef(start ?? null)

  const { corners, closed } = shape
  const crossProblem = !closed && cross ? (cross.closes ? closeProblem(corners, ctx) : cornerProblem(corners, cross.point, ctx)) : null
  // The shape he would get with a corner at the cross: what the area chip and the colour measure.
  const preview = closed || !cross || cross.closes || crossProblem ? corners : [...corners, cross.point]
  const issues: DrawIssue[] = useMemo(() => drawIssues(preview, ctx), [preview, ctx])
  // The shape is orange while something is left to do; only the cross and its line go red, since only they can't be.
  const mark: 'ok' | 'look' = issues.length ? 'look' : 'ok'
  // Whether the corners placed so far make a field: closed without crossing, big enough, on no land he declares.
  const canClose = !closed && corners.length >= 3 && !closeProblem(corners, ctx) && !drawIssues(corners, ctx).length

  const set = (next: Shape) => {
    cur.current = next
    setShape(next)
  }
  const remember = () => {
    setPast((p) => [...p, cur.current])
    setFuture([])
  }
  const tryCorners = (next: Point[]) => {
    const problem = cur.current.closed ? outlineProblem(next, ctx) : pathProblem(next, ctx)
    setStopped(problem)
    if (problem) return false
    set({ ...cur.current, corners: next })
    return true
  }
  const travel = (from: Shape[], to: Shape[], setFrom: (s: Shape[]) => void, setTo: (s: Shape[]) => void) => {
    if (!from.length) return
    setTo([...to, cur.current])
    setFrom(from.slice(0, -1))
    set(from[from.length - 1])
    setStopped(null)
    setSelected(null)
  }

  /** Where the next corner would go: snapped to what he can see, said on the map when it joins something. */
  const setCross = (p: Point | null) => {
    setCrossState(p ? snapCorner(p, cur.current.corners, ctx, cur.current.closed) : null)
    // Once he moves the map on, why the last move stopped is old news.
    setStopped(null)
  }

  const close = () => {
    const c = cur.current.corners
    if (c.length < 3 || cur.current.closed) return false
    const problem = closeProblem(c, ctx)
    setStopped(problem)
    if (problem || drawIssues(c, ctx).length) return false
    remember()
    created.current = c
    set({ corners: c, closed: true })
    setSelected(null)
    return true
  }

  return {
    corners,
    closed,
    cross,
    crossProblem,
    preview,
    issues,
    mark,
    canClose,
    areaHa: drawnHa(preview),
    selected,
    setSelected,
    stopped,
    setCross,
    remember,
    /** A corner at the cross, or at a point he clicked. On his first corner it closes the field. */
    add: (at?: Point) => {
      if (cur.current.closed) return
      const c = at ? snapCorner(at, cur.current.corners, ctx, false) : cross
      if (!c) return
      if (c.closes) return close()
      const problem = cornerProblem(cur.current.corners, c.point, ctx)
      setStopped(problem)
      if (problem) return false
      remember()
      set({ corners: [...cur.current.corners, c.point], closed: false })
      return true
    },
    close,
    /** He pressed the middle of an edge: a corner there, which he then pulls. */
    insert: (edge: number, p: Point) => {
      remember()
      set({ ...cur.current, corners: insertCorner(cur.current.corners, edge, p) })
      setSelected(edge + 1)
      return edge + 1
    },
    move: (i: number, p: Point) => tryCorners(cur.current.corners.map((q, k) => (k === i ? snapCorner(p, [], ctx, true).point : q))),
    letGo: () => setPast((p) => (p.length && p[p.length - 1].closed === cur.current.closed && sameLine(p[p.length - 1].corners, cur.current.corners) ? p.slice(0, -1) : p)),
    nudge: (i: number, key: string, far: boolean) => {
      if (key === 'Delete' || key === 'Backspace') {
        drop(i)
        return true
      }
      const d = ARROWS[key]
      if (!d) return false
      remember()
      const p = cur.current.corners[i]
      const k = far ? 5 : 1
      tryCorners(cur.current.corners.map((q, n) => (n === i ? { x: p.x + d.x * k, y: p.y + d.y * k } : q)))
      return true
    },
    drop: (i: number) => drop(i),
    /** One tap that fixes an overlap: corners on land he declares move onto that field's edge. */
    leaveOut: () => {
      remember()
      tryCorners(leaveOutOverlap(cur.current.corners, ctx))
    },
    undo: () => travel(past, future, setPast, setFuture),
    redo: () => travel(future, past, setFuture, setPast),
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    /** Deleting the field he just drew: nothing left, nothing to undo. */
    clear: () => {
      set({ corners: [], closed: false })
      setPast([])
      setFuture([])
      setSelected(null)
      setStopped(null)
      created.current = null
    },
    /** Back to the field as he created it. */
    reset: () => {
      if (!created.current) return
      remember()
      set({ corners: created.current, closed: true })
      setSelected(null)
      setStopped(null)
    },
    isReset: !created.current || sameLine(created.current, corners),
  }

  function drop(i: number) {
    const c = cur.current
    if (c.closed && c.corners.length <= 3) return
    // While drawing, only a corner can go that leaves the rest a path he could have drawn.
    remember()
    if (tryCorners(c.corners.filter((_, k) => k !== i))) setSelected(null)
  }
}

export type FieldDraw = ReturnType<typeof useFieldDraw>

/** What the map says about the shape: red can't be, orange is still to do, with its fix when GSA has one. */
export function drawMessages(d: FieldDraw): { text: string; error?: boolean; fix?: boolean }[] {
  const out: { text: string; error?: boolean; fix?: boolean }[] = []
  if (d.crossProblem) out.push({ text: t.problem[d.crossProblem], error: true })
  else if (d.stopped) out.push({ text: t.stopped[d.stopped], error: true })
  const overlap = d.issues.find((i) => i.kind === 'overlaps')
  if (overlap?.kind === 'overlaps') out.push({ text: t.overlaps(overlap.field), fix: true })
  else if (d.issues.some((i) => i.kind === 'too_small') && d.preview.length >= 3) out.push({ text: t.tooSmall })
  return out
}

/**
 * On the map while he draws: what's wrong or left to do, the way to create the field once it has three
 * corners, then Undo and Redo. A corner goes where he taps or clicks, and a tap on his first corner closes it.
 */
export function DrawIsland({ d, onCreate }: { d: FieldDraw; onCreate: () => void }) {
  const msgs = drawMessages(d)
  const canCreate = !d.closed && d.corners.length >= 3
  const ready = canCreate && d.canClose
  return (
    <>
      <div aria-live="polite">
        {/* One message at a time, what can't be first, so the map stays visible on a phone. */}
        {msgs.slice(0, 1).map((m) => (
          <MapStatus key={m.text} error={m.error} action={m.fix ? { label: t.leaveOut, onClick: d.leaveOut } : undefined}>{m.text}</MapStatus>
        ))}
        {!msgs.length && d.cross?.closes && !d.closed && <MapStatus icon="info">{t.onFirst}</MapStatus>}
        {!msgs.length && !d.cross?.closes && d.corners.length > 0 && <RemoveHint />}
        <VisuallyHidden>{t.areaSaid(formatHa(d.areaHa), d.corners.length)}</VisuallyHidden>
      </div>
      {/* Once there are three corners, the field can be made; until it's big enough the line above says why. */}
      {canCreate && (
        <Button variant={ready ? 'primary' : 'secondary'} className="map-create" aria-disabled={!ready || undefined} onClick={() => ready && onCreate()}>
          {t.create(formatHa(drawnHa(d.corners)))}
        </Button>
      )}
      <ToolIsland label={t.tools}>
        <ToolButton icon="undo" caption={t.undo} hint={t.undoHint} short disabled={!d.canUndo} onClick={d.undo} />
        <ToolButton icon="redo" caption={t.redo} hint={t.redoHint} short disabled={!d.canRedo} onClick={d.redo} />
        {d.closed && (
          <>
            <ToolDivider />
            <ToolButton icon="reset" caption={t.reset} hint={t.resetHint} disabled={d.isReset} onClick={d.reset} />
          </>
        )}
      </ToolIsland>
    </>
  )
}

