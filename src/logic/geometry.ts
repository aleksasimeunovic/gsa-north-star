import type { Point, Polygon } from '../data/scenarios'

const M2_PER_HA = 10_000

export const roundHa = (ha: number) => Math.round(ha * 100) / 100

/** Shoelace area in hectares (coordinates are metres). */
export function polygonAreaHa(poly: Polygon): number {
  let twice = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    twice += a.x * b.y - b.x * a.y
  }
  return Math.abs(twice) / 2 / M2_PER_HA
}

export const bounds = (poly: Polygon) => ({
  minX: Math.min(...poly.map((p) => p.x)),
  maxX: Math.max(...poly.map((p) => p.x)),
  minY: Math.min(...poly.map((p) => p.y)),
  maxY: Math.max(...poly.map((p) => p.y)),
})

/** Area-weighted centre, for labelling a part on the map. */
export function centroid(poly: Polygon): Point {
  let a = 0
  let cx = 0
  let cy = 0
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const cross = p.x * q.y - q.x * p.y
    a += cross
    cx += (p.x + q.x) * cross
    cy += (p.y + q.y) * cross
  }
  if (a === 0) return poly[0]
  return { x: cx / (3 * a), y: cy / (3 * a) }
}

export type PartName = 'top' | 'bottom' | 'left' | 'right'

/** Name the two parts as he sees them on the map, not as A and B. */
export function partNames(parts: [Polygon, Polygon]): [PartName, PartName] {
  const [a, b] = parts.map(centroid)
  if (Math.abs(a.y - b.y) >= Math.abs(a.x - b.x)) return a.y < b.y ? ['top', 'bottom'] : ['bottom', 'top']
  return a.x < b.x ? ['left', 'right'] : ['right', 'left']
}

/** Whether a part lies mostly in the flagged area (its centre is inside the flag's bounds). */
export function inArea(part: Polygon, area: Polygon): boolean {
  const c = centroid(part)
  const b = bounds(area)
  return c.x >= b.minX && c.x <= b.maxX && c.y >= b.minY && c.y <= b.maxY
}

/** Whether a point is inside a polygon, for a tap on one part of a split field. */
export function pointInPolygon(p: Point, poly: Polygon): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

// ---- The line that splits a field: from one edge of the field to another, with bends he pulls. ----

/** A line across a field. Its first and last points sit on the field's edge; the ones between are bends. */
export type SplitLine = Point[]

export interface SplitResult {
  parts: [Polygon, Polygon]
  areasHa: [number, number]
}

/** No part smaller than this (a prototype placeholder, to confirm with the ministry). */
export const MIN_PART_HA = 0.1
/** Closer than this to the edge the photo shows, a bend joins it. */
export const SNAP_M = 6
const INSET_M = 1
const MAX_BENDS = 7
/** A press on the line this close to a bend takes that bend. */
const BEND_REACH_M = 12
/** A bend left this close to a straight line isn't a bend. */
const STRAIGHT_M = 2

const closestOnSegment = (p: Point, a: Point, b: Point): { point: Point; t: number; dist: number } => {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = dx * dx + dy * dy
  const t = len === 0 ? 0 : Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len))
  const point = { x: a.x + dx * t, y: a.y + dy * t }
  return { point, t, dist: Math.hypot(p.x - point.x, p.y - point.y) }
}

/** The nearest place on a chain of segments. */
function closestOnPath(p: Point, path: Point[]) {
  let best = { ...closestOnSegment(p, path[0], path[1]), segment: 0 }
  for (let i = 1; i < path.length - 1; i++) {
    const c = closestOnSegment(p, path[i], path[i + 1])
    if (c.dist < best.dist) best = { ...c, segment: i }
  }
  return best
}

const ring = (poly: Polygon) => [...poly, poly[0]]

/** Where a point sits on the field's edge, as edge number plus how far along it. */
const onEdgeAt = (poly: Polygon, p: Point) => {
  const c = closestOnPath(p, ring(poly))
  return c.segment + c.t
}

/** The nearest place on the field's edge: an end of the line slides along it and can't leave it. */
export const toFieldEdge = (poly: Polygon, p: Point): Point => closestOnPath(p, ring(poly)).point

/** Keep a bend just inside the field. `clamped` says the edge stopped it, so the panel can say why. */
export function keepInside(poly: Polygon, p: Point): { point: Point; clamped: boolean } {
  const b = bounds(poly)
  const point = { x: Math.min(b.maxX - INSET_M, Math.max(b.minX + INSET_M, p.x)), y: Math.min(b.maxY - INSET_M, Math.max(b.minY + INSET_M, p.y)) }
  return { point, clamped: point.x !== p.x || point.y !== p.y }
}

/** Help following a boundary: near the edge the photo shows, a bend joins it. */
export function snapToEdge(p: Point, edge: Point[]): { point: Point; snapped: boolean } {
  const c = closestOnPath(p, edge)
  return c.dist <= SNAP_M ? { point: c.point, snapped: true } : { point: p, snapped: false }
}

/**
 * The two parts a line makes: the line, then the field's edge back round to its start, one way for
 * each part. Fields are convex, so a line that stays inside can't leave anything out.
 */
export function splitField(poly: Polygon, line: SplitLine): SplitResult | null {
  if (line.length < 2) return null
  const n = poly.length
  const from = onEdgeAt(poly, line[0])
  const to = onEdgeAt(poly, line[line.length - 1])
  const corners = (a: number, b: number) => {
    const span = (b - a + n) % n
    const out: Polygon = []
    for (let k = 1; k <= n; k++) {
      const c = (Math.floor(a) + k) % n
      const ahead = (c - a + n) % n
      if (ahead > 0 && ahead < span) out.push(poly[c])
    }
    return out
  }
  const first = [...line, ...corners(to, from)]
  const second = [...[...line].reverse(), ...corners(from, to)]
  const whole = roundHa(polygonAreaHa(poly))
  const a = roundHa(polygonAreaHa(first))
  const areasHa: [number, number] = [a, roundHa(whole - a)]
  return areasHa[0] > 0 && areasHa[1] > 0 ? { parts: [first, second], areasHa } : null
}

const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
const segmentsCross = (a: Point, b: Point, c: Point, d: Point) =>
  cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0

export type LineProblem = 'crosses_itself' | 'too_small'

/** What's wrong with a line, or null. The map never lets him leave one of these behind. */
export function lineProblem(poly: Polygon, line: SplitLine): LineProblem | null {
  for (let i = 0; i < line.length - 1; i++) {
    for (let j = i + 2; j < line.length - 1; j++) {
      if (segmentsCross(line[i], line[i + 1], line[j], line[j + 1])) return 'crosses_itself'
    }
  }
  const r = splitField(poly, line)
  return !r || Math.min(...r.areasHa) < MIN_PART_HA ? 'too_small' : null
}

/**
 * Pulling the line somewhere that has no bend makes one there; near a bend, it takes that bend. Null at
 * the most bends a line can have. There are no points to place: only the line, which he pulls.
 */
export function pullLine(line: SplitLine, p: Point): { line: SplitLine; bend: number } | null {
  for (let i = 1; i < line.length - 1; i++) if (Math.hypot(line[i].x - p.x, line[i].y - p.y) <= BEND_REACH_M) return { line, bend: i }
  if (line.length - 2 >= MAX_BENDS) return null
  const at = closestOnPath(p, line)
  const bend = at.segment + 1
  return { line: [...line.slice(0, bend), at.point, ...line.slice(bend)], bend }
}

export const removeBend = (line: SplitLine, i: number): SplitLine => line.filter((_, k) => k !== i || k === 0 || k === line.length - 1)

/** A bend he let go on a straight stretch is gone, so handles stay few. */
export function tidyLine(line: SplitLine): SplitLine {
  return line.filter((p, i) => i === 0 || i === line.length - 1 || closestOnSegment(p, line[i - 1], line[i + 1]).dist > STRAIGHT_M)
}

/** The line from end to end with no bends. */
export const straightLine = (line: SplitLine): SplitLine => [line[0], line[line.length - 1]]

/** The whole line moved up or down; its ends stay on the field's edge. */
export const shiftLine = (poly: Polygon, line: SplitLine, dy: number): SplitLine =>
  line.map((p, i) => (i === 0 || i === line.length - 1 ? toFieldEdge(poly, { x: p.x, y: p.y + dy }) : keepInside(poly, { x: p.x, y: p.y + dy }).point))

/** How far down the field the line sits (0 top, 1 bottom), for the slider. */
export function lineHeight(poly: Polygon, line: SplitLine): number {
  const b = bounds(poly)
  const y = line.reduce((sum, p) => sum + p.y, 0) / line.length
  return Math.min(1, Math.max(0, (y - b.minY) / (b.maxY - b.minY)))
}

export const sameLine = (a: SplitLine, b: SplitLine) => a.length === b.length && a.every((p, i) => Math.hypot(p.x - b[i].x, p.y - b[i].y) < 0.05)

/** Whether every bend of the line sits on the edge the photo shows. */
export const followsEdge = (line: SplitLine, edge: Point[]) => line.every((p) => closestOnPath(p, edge).dist < 0.5)
