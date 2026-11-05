import type { Point, Polygon } from '../data/scenarios'
import { closestOnPath, MIN_PART_HA, outlineCrosses, pointInPolygon, polygonAreaHa, roundHa, segmentsCross, SNAP_M } from './geometry'

// ---- Drawing a field he adds himself: corner by corner on the photo, then its edges pulled into place. ----

/** Where a drawn field can go, and what it must stay clear of. */
export interface DrawContext {
  /** Registered farmland: a corner can go anywhere on it (his own fields are registered farmland too). */
  farmland: Polygon[]
  /** His fields, by name: a new field can't take land he already declares. */
  fields: { name: string; polygon: Polygon }[]
}

/** The smallest field worth declaring, as for a part of a split field. A design assumption until validated. */
export const MIN_FIELD_HA = MIN_PART_HA

/** Red: a corner or an edge that can't be. The map never lets one exist; the cross says why. */
export type DrawProblem = 'outside_farmland' | 'crosses_itself'

/** Orange: a shape that exists but isn't a field yet, with the one thing left to do about it. */
export type DrawIssue = { kind: 'too_small' } | { kind: 'overlaps'; field: string }

const ring = (poly: Polygon) => [...poly, poly[0]]
const ON_EDGE_M = 0.5
const near = (p: Point, path: Point[], within = ON_EDGE_M) => path.length > 1 && closestOnPath(p, path).dist < within
/** Registered edges and the photo can differ by a few metres, so this close to farmland counts as on it. A design assumption. */
export const FARMLAND_SLACK_M = 3

export const onFarmland = (p: Point, ctx: DrawContext) => ctx.farmland.some((l) => pointInPolygon(p, l) || near(p, ring(l), FARMLAND_SLACK_M))

/**
 * Every few metres along an edge is on registered farmland: land between two good corners can still be outside
 * it. An edge may cross a narrow strip between two pieces of farmland (a track, a ditch), within SNAP_M of either.
 */
export function edgeOnFarmland(a: Point, b: Point, ctx: DrawContext): boolean {
  const steps = Math.max(4, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 2))
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
    if (!ctx.farmland.some((l) => pointInPolygon(p, l) || near(p, ring(l), SNAP_M))) return false
  }
  return true
}

/** Whether a new edge from the last corner to p crosses an edge already drawn. `skipFirst`: it closes on the first corner. */
function crossesDrawn(corners: Point[], p: Point, skipFirst = false): boolean {
  const last = corners[corners.length - 1]
  for (let i = skipFirst ? 1 : 0; i < corners.length - 2; i++) if (segmentsCross(corners[i], corners[i + 1], last, p)) return true
  return false
}

/** What stops a corner going here, after the corners already placed, or null. */
export function cornerProblem(corners: Point[], p: Point, ctx: DrawContext): DrawProblem | null {
  if (!onFarmland(p, ctx)) return 'outside_farmland'
  if (!corners.length) return null
  if (!edgeOnFarmland(corners[corners.length - 1], p, ctx)) return 'outside_farmland'
  return crossesDrawn(corners, p) ? 'crosses_itself' : null
}

/** What stops the last edge closing the shape back to the first corner, or null. */
export function closeProblem(corners: Point[], ctx: DrawContext): DrawProblem | null {
  if (corners.length < 3) return null
  if (!edgeOnFarmland(corners[corners.length - 1], corners[0], ctx)) return 'outside_farmland'
  return crossesDrawn(corners, corners[0], true) ? 'crosses_itself' : null
}

/** What's wrong with a closed shape, or null: a move that would make one stops at the last good shape. */
export function outlineProblem(poly: Polygon, ctx: DrawContext): DrawProblem | null {
  if (outlineCrosses(poly)) return 'crosses_itself'
  return poly.every((p, i) => onFarmland(p, ctx) && edgeOnFarmland(p, poly[(i + 1) % poly.length], ctx)) ? null : 'outside_farmland'
}

/** Edges that cross properly, each end clearly on its own side: running along a shared edge is not crossing. */
function crossesClearly(a: Point, b: Point, c: Point, d: Point): boolean {
  const side = (p: Point, q: Point, r: Point) => ((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)) / (Math.hypot(q.x - p.x, q.y - p.y) || 1)
  const s1 = side(a, b, c)
  const s2 = side(a, b, d)
  const s3 = side(c, d, a)
  const s4 = side(c, d, b)
  const clear = (x: number, y: number) => (x > ON_EDGE_M && y < -ON_EDGE_M) || (x < -ON_EDGE_M && y > ON_EDGE_M)
  return clear(s1, s2) && clear(s3, s4)
}

/** Whether two shapes share land, not just an edge: a corner well inside the other, or edges that cross. */
export function overlaps(a: Polygon, b: Polygon): boolean {
  const inside = (p: Point, poly: Polygon) => pointInPolygon(p, poly) && !near(p, ring(poly))
  if (a.some((p) => inside(p, b)) || b.some((p) => inside(p, a))) return true
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      if (crossesClearly(a[i], a[(i + 1) % a.length], b[j], b[(j + 1) % b.length])) return true
    }
  }
  return false
}

/** What's left before a shape can be a field: land he already declares, then its size. Overlaps first, it's the fix. */
export function drawIssues(poly: Polygon, ctx: DrawContext): DrawIssue[] {
  if (poly.length < 3) return []
  const issues: DrawIssue[] = ctx.fields.filter((f) => overlaps(poly, f.polygon)).map((f) => ({ kind: 'overlaps', field: f.name }))
  if (polygonAreaHa(poly) < MIN_FIELD_HA) issues.push({ kind: 'too_small' })
  return issues
}

/** The drawn area in hectares, as he sees it while he draws. */
export const drawnHa = (poly: Polygon) => (poly.length < 3 ? 0 : roundHa(polygonAreaHa(poly)))

/** An edge's length in metres, for the chip on it. */
export const edgeM = (a: Point, b: Point) => Math.round(Math.hypot(b.x - a.x, b.y - a.y))

/** The middle of every edge: a handle there adds a corner, so an edge bends where he pulls it. */
export function midpoints(corners: Point[], closed: boolean): Point[] {
  const n = closed ? corners.length : corners.length - 1
  const out: Point[] = []
  for (let i = 0; i < n; i++) {
    const a = corners[i]
    const b = corners[(i + 1) % corners.length]
    out.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
  }
  return out
}

/** A new corner on edge i (between corner i and the next), at p. */
export const insertCorner = (corners: Point[], i: number, p: Point): Point[] => [...corners.slice(0, i + 1), p, ...corners.slice(i + 1)]

/**
 * Where a corner goes near something he can see: his first corner (to close the shape), then a corner of a
 * field or farmland, then their edges, within SNAP_M. `closes` says it landed on his first corner.
 */
export function snapCorner(p: Point, corners: Point[], ctx: DrawContext, closed: boolean): { point: Point; snapped: boolean; closes: boolean } {
  const dist = (q: Point) => Math.hypot(q.x - p.x, q.y - p.y)
  if (!closed && corners.length >= 3 && dist(corners[0]) <= SNAP_M) return { point: corners[0], snapped: true, closes: true }
  const shapes = [...ctx.farmland, ...ctx.fields.map((f) => f.polygon)]
  let best: { point: Point; d: number } | null = null
  for (const q of shapes.flat()) if (dist(q) <= SNAP_M && (!best || dist(q) < best.d)) best = { point: q, d: dist(q) }
  if (best) return { point: best.point, snapped: true, closes: false }
  for (const s of shapes) {
    const c = closestOnPath(p, ring(s))
    if (c.dist <= SNAP_M && (!best || c.dist < best.d)) best = { point: c.point, d: c.dist }
  }
  return best ? { point: best.point, snapped: true, closes: false } : { point: p, snapped: false, closes: false }
}

/** Where segment ab crosses segment cd, as how far along ab (0 to 1), or null. */
function crossingAt(a: Point, b: Point, c: Point, d: Point): number | null {
  const den = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x)
  if (den === 0) return null
  const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / den
  const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / den
  return t > 1e-9 && t < 1 - 1e-9 && u >= 0 && u <= 1 ? t : null
}

/**
 * The shape without the land of another field: where it runs into that field, its edge follows the field's
 * edge instead, so the two fields share an edge and no land.
 */
export function cutOut(poly: Polygon, field: Polygon): Polygon {
  const inside = (p: Point) => pointInPolygon(p, field) && !near(p, ring(field))
  const start = poly.findIndex((p) => !inside(p))
  if (start < 0) return poly
  const pts = [...poly.slice(start), ...poly.slice(0, start)]
  const m = field.length
  const out: Point[] = []
  let entry: { j: number } | null = null
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    if (!entry) out.push(a)
    const hits: { t: number; j: number }[] = []
    for (let j = 0; j < m; j++) {
      const t = crossingAt(a, b, field[j], field[(j + 1) % m])
      if (t !== null) hits.push({ t, j })
    }
    hits.sort((x, y) => x.t - y.t)
    for (const h of hits) {
      const c = { x: a.x + (b.x - a.x) * h.t, y: a.y + (b.y - a.y) * h.t }
      if (!entry) {
        out.push(c)
        entry = { j: h.j }
        continue
      }
      // Along the field's edge, the way that runs through the shape, from where it went in to where it comes out.
      if (entry.j !== h.j) {
        const forward: Point[] = []
        for (let k = (entry.j + 1) % m; ; k = (k + 1) % m) {
          forward.push(field[k])
          if (k === h.j) break
        }
        const backward: Point[] = []
        for (let k = entry.j; ; k = (k - 1 + m) % m) {
          backward.push(field[k])
          if (k === (h.j + 1) % m) break
        }
        out.push(...(forward.every((p) => pointInPolygon(p, poly)) ? forward : backward))
      }
      out.push(c)
      entry = null
    }
  }
  return out.filter((p, i) => Math.hypot(p.x - out[(i + 1) % out.length].x, p.y - out[(i + 1) % out.length].y) > 0.05)
}

/** One tap that fixes an overlap: the shape gives back the land of every field he already declares. */
export function leaveOutOverlap(poly: Polygon, ctx: DrawContext): Polygon {
  return ctx.fields.reduce((shape, f) => (overlaps(shape, f.polygon) ? cutOut(shape, f.polygon) : shape), poly)
}
