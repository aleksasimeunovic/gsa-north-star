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

/** Where a field's top edge is at this x, to write its name just above it. */
export function topEdgeAt(poly: Polygon, x: number): number {
  let top = Infinity
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length]
    if ((a.x <= x && b.x >= x) || (b.x <= x && a.x >= x)) top = Math.min(top, a.x === b.x ? Math.min(a.y, b.y) : a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x))
  })
  return top
}

export type PartName = 'top' | 'bottom' | 'left' | 'right'

/** Name the two parts as he sees them on the map, not as A and B. */
export function partNames(parts: [Polygon, Polygon]): [PartName, PartName] {
  const [a, b] = parts.map(centroid)
  if (Math.abs(a.y - b.y) >= Math.abs(a.x - b.x)) return a.y < b.y ? ['top', 'bottom'] : ['bottom', 'top']
  return a.x < b.x ? ['left', 'right'] : ['right', 'left']
}

/** Whether a part lies mostly in the flagged area (its centre is inside it). */
export const inArea = (part: Polygon, area: Polygon): boolean => pointInPolygon(centroid(part), area)

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

/** No part smaller than this. A design assumption until validated (placeholder, to confirm with the ministry). */
export const MIN_PART_HA = 0.1
/** Closer than this to the edge the photo shows, a bend joins it. A design assumption until validated with farmers. */
export const SNAP_M = 6
const INSET_M = 1
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

/** The nearest place on the line, where a press would pull it. */
export const nearestOnLine = (line: SplitLine, p: Point): Point => closestOnPath(p, line).point

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

/** Keep a bend just inside the field, whatever its shape. `clamped` says the edge stopped it, so the map can say why. */
export function keepInside(poly: Polygon, p: Point): { point: Point; clamped: boolean } {
  const inside = pointInPolygon(p, poly)
  const edge = closestOnPath(p, ring(poly))
  if (inside && edge.dist >= INSET_M) return { point: p, clamped: false }
  const c = centroid(poly)
  const len = Math.hypot(c.x - edge.point.x, c.y - edge.point.y) || 1
  return { point: { x: edge.point.x + ((c.x - edge.point.x) / len) * INSET_M, y: edge.point.y + ((c.y - edge.point.y) / len) * INSET_M }, clamped: !inside }
}

/** Help following a boundary: near the edge the photo shows, a bend joins it. */
export function snapToEdge(p: Point, edge: Point[]): { point: Point; snapped: boolean } {
  const c = closestOnPath(p, edge)
  return c.dist <= SNAP_M ? { point: c.point, snapped: true } : { point: p, snapped: false }
}

/**
 * The two parts a line makes: the line, then the field's edge back round to its start, one way for
 * each part. The record's area is what counts, so a part is its share of `wholeHa`.
 */
export function splitField(poly: Polygon, line: SplitLine, wholeHa = polygonAreaHa(poly)): SplitResult | null {
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
  const whole = roundHa(wholeHa)
  const a = roundHa((polygonAreaHa(first) / polygonAreaHa(poly)) * wholeHa)
  const areasHa: [number, number] = [a, roundHa(whole - a)]
  return areasHa[0] > 0 && areasHa[1] > 0 ? { parts: [first, second], areasHa } : null
}

const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
const segmentsCross = (a: Point, b: Point, c: Point, d: Point) =>
  cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0

export type LineProblem = 'crosses_itself' | 'too_small' | 'leaves_field'

// A field's edge isn't straight, so a stretch of line between two good bends can still run outside it.
const staysInside = (poly: Polygon, a: Point, b: Point) =>
  [0.1, 0.25, 0.5, 0.75, 0.9].every((t) => {
    const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
    return pointInPolygon(p, poly) || closestOnPath(p, ring(poly)).dist < 0.5
  })

/** What's wrong with a line, or null. The map never lets him leave one of these behind. */
export function lineProblem(poly: Polygon, line: SplitLine, wholeHa = polygonAreaHa(poly)): LineProblem | null {
  for (let i = 0; i < line.length - 1; i++) {
    for (let j = i + 2; j < line.length - 1; j++) {
      if (segmentsCross(line[i], line[i + 1], line[j], line[j + 1])) return 'crosses_itself'
    }
    if (!staysInside(poly, line[i], line[i + 1])) return 'leaves_field'
  }
  const r = splitField(poly, line, wholeHa)
  return !r || Math.min(...r.areasHa) < MIN_PART_HA ? 'too_small' : null
}

/**
 * Pulling the line somewhere that has no bend makes one there; near a bend, it takes that bend. As many
 * bends as he likes. There are no points to place: only the line, which he pulls.
 */
export function pullLine(line: SplitLine, p: Point): { line: SplitLine; bend: number } {
  for (let i = 1; i < line.length - 1; i++) if (Math.hypot(line[i].x - p.x, line[i].y - p.y) <= BEND_REACH_M) return { line, bend: i }
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

// ---- The field's own edge: he pulls it like the line, and it can't leave the farmland registered there. ----

/** Help following what he sees: near any of these edges (the photo's, the field's as registered), a point joins it. */
export function snapToAny(p: Point, paths: Point[][]): { point: Point; snapped: boolean } {
  let best: { point: Point; dist: number } | null = null
  for (const path of paths) {
    if (path.length < 2) continue
    const c = closestOnPath(p, path)
    if (c.dist <= SNAP_M && (!best || c.dist < best.dist)) best = c
  }
  return best ? { point: best.point, snapped: true } : { point: p, snapped: false }
}

/** A closed outline as a path, for snapping to it. */
export const outlinePath = (poly: Polygon): Point[] => ring(poly)

/**
 * Pressing the field's edge: the corner he pressed near, or a new one there. As many as he likes, and
 * never a point he places on empty ground.
 */
export function pullOutline(poly: Polygon, p: Point): { poly: Polygon; corner: number } {
  for (let i = 0; i < poly.length; i++) if (Math.hypot(poly[i].x - p.x, poly[i].y - p.y) <= BEND_REACH_M / 2) return { poly, corner: i }
  const at = closestOnPath(p, ring(poly))
  const corner = at.segment + 1
  return { poly: [...poly.slice(0, corner), at.point, ...poly.slice(corner)], corner }
}

export const removeCorner = (poly: Polygon, i: number): Polygon => (poly.length <= 3 ? poly : poly.filter((_, k) => k !== i))

/** A corner he let go on a straight stretch of the edge isn't a corner. */
export function tidyOutline(poly: Polygon, i: number): Polygon {
  const n = poly.length
  if (n <= 3 || !poly[i]) return poly
  return closestOnSegment(poly[i], poly[(i - 1 + n) % n], poly[(i + 1) % n]).dist > STRAIGHT_M ? poly : removeCorner(poly, i)
}

/** Whether a field's edge crosses itself. */
export function outlineCrosses(poly: Polygon): boolean {
  const n = poly.length
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue
      if (segmentsCross(poly[i], poly[(i + 1) % n], poly[j], poly[(j + 1) % n])) return true
    }
  }
  return false
}

const onLand = (land: Polygon, p: Point) => pointInPolygon(p, land) || closestOnPath(p, ring(land)).dist < 0.5

/** Whether the field's edge stays on the farmland registered there, corners and the stretches between them. */
export const staysOnLand = (land: Polygon, poly: Polygon) =>
  poly.every((p, i) => onLand(land, p) && staysInside(land, p, poly[(i + 1) % poly.length]))

/** The line's ends stay on the field's edge when the edge moves. */
export const fitLine = (poly: Polygon, line: SplitLine): SplitLine => line.map((p, i) => (i === 0 || i === line.length - 1 ? toFieldEdge(poly, p) : p))

/** The record's area, grown or shrunk by as much as he moved the field's edge. */
export const outlineHa = (record: Polygon, recordHa: number, poly: Polygon) => roundHa((recordHa * polygonAreaHa(poly)) / polygonAreaHa(record))

export type ShapeProblem = LineProblem

/**
 * What's wrong with the field's edge and the line across it, or null. The map never leaves him with one.
 * Going past the registered farmland is not one of them: the record can be wrong, so that is flagged for a check.
 */
export function shapeProblem(poly: Polygon, line: SplitLine, wholeHa: number): ShapeProblem | null {
  if (outlineCrosses(poly)) return 'crosses_itself'
  return lineProblem(poly, line, wholeHa)
}

/** Whether his field now goes past the farmland registered around it: a disagreement with the record, not an error. */
export const pastLand = (land: Polygon | undefined, poly: Polygon) => !!land && !staysOnLand(land, poly)

/** A straight line across the middle of the field, for when he rejects GSA's line entirely. */
export function straightAcross(poly: Polygon): SplitLine {
  const { minY, maxY } = bounds(poly)
  const y = (minY + maxY) / 2
  const xs: number[] = []
  poly.forEach((a, i) => {
    const b = poly[(i + 1) % poly.length]
    if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) xs.push(a.x + ((b.x - a.x) * (y - a.y)) / (b.y - a.y))
  })
  return [{ x: Math.min(...xs), y }, { x: Math.max(...xs), y }]
}
