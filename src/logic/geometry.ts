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

// Which side of the line a point is on: > 0 left, < 0 right.
const side = (p: Point, a: Point, b: Point) => (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x)

const lerp = (p: Point, q: Point, t: number): Point => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t })

/** Keep the part of the polygon on one side of the line through a and b. */
function clipHalfPlane(poly: Polygon, a: Point, b: Point, keepLeft: boolean): Polygon {
  const out: Polygon = []
  const s = (p: Point) => (keepLeft ? side(p, a, b) : -side(p, a, b))
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const sp = s(p)
    const sq = s(q)
    if (sp >= 0) out.push(p)
    if ((sp > 0 && sq < 0) || (sp < 0 && sq > 0)) out.push(lerp(p, q, sp / (sp - sq)))
  }
  return out
}

/**
 * The part of the line through a and b that lies inside the field.
 * Guardrail: the drawn line never reaches outside eligible land. Fields are convex.
 */
export function clipLineToPolygon(poly: Polygon, a: Point, b: Point): [Point, Point] | null {
  if (a.x === b.x && a.y === b.y) return null
  const hits: Point[] = []
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const sp = side(p, a, b)
    const sq = side(q, a, b)
    if (sp === 0) hits.push(p)
    else if ((sp > 0 && sq < 0) || (sp < 0 && sq > 0)) hits.push(lerp(p, q, sp / (sp - sq)))
  }
  const unique = hits.filter((h, i) => hits.findIndex((o) => Math.hypot(o.x - h.x, o.y - h.y) < 1e-9) === i)
  return unique.length >= 2 ? [unique[0], unique[1]] : null
}

export interface SplitResult {
  parts: [Polygon, Polygon]
  areasHa: [number, number]
  chord: [Point, Point]
}

/** Split a field with one line. Null when the line doesn't cross the field. */
export function splitPolygon(poly: Polygon, a: Point, b: Point): SplitResult | null {
  const chord = clipLineToPolygon(poly, a, b)
  if (!chord) return null
  const left = clipHalfPlane(poly, a, b, true)
  const right = clipHalfPlane(poly, a, b, false)
  const areasHa: [number, number] = [roundHa(polygonAreaHa(left)), roundHa(polygonAreaHa(right))]
  if (areasHa[0] <= 0 || areasHa[1] <= 0) return null
  return { parts: [left, right], areasHa, chord }
}

export const bounds = (poly: Polygon) => ({
  minX: Math.min(...poly.map((p) => p.x)),
  maxX: Math.max(...poly.map((p) => p.x)),
  minY: Math.min(...poly.map((p) => p.y)),
  maxY: Math.max(...poly.map((p) => p.y)),
})

/** Keyboard alternative: a horizontal line at fraction t (0 top, 1 bottom). */
export function lineAtFraction(poly: Polygon, t: number): [Point, Point] {
  const { minX, maxX, minY, maxY } = bounds(poly)
  const y = minY + Math.min(1, Math.max(0, t)) * (maxY - minY)
  return [
    { x: minX - 1, y },
    { x: maxX + 1, y },
  ]
}

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

/** Keep a drag handle near the field (margin in metres). */
export function clampToBounds(p: Point, poly: Polygon, margin = 10): Point {
  const b = bounds(poly)
  return {
    x: Math.min(b.maxX + margin, Math.max(b.minX - margin, p.x)),
    y: Math.min(b.maxY + margin, Math.max(b.minY - margin, p.y)),
  }
}

/** Shapes whose bounding boxes overlap the field (rectangular data: exact). */
export function overlapping<T extends { polygon: Polygon }>(field: Polygon, shapes: T[]): T[] {
  const f = bounds(field)
  return shapes.filter((s) => {
    const b = bounds(s.polygon)
    return Math.min(f.maxX, b.maxX) - Math.max(f.minX, b.minX) > 0 && Math.min(f.maxY, b.maxY) - Math.max(f.minY, b.minY) > 0
  })
}

/** Fraction (0 top, 1 bottom) of a horizontal line, for the slider. */
export function fractionOfLine(poly: Polygon, line: [Point, Point]): number {
  const b = bounds(poly)
  const y = (line[0].y + line[1].y) / 2
  return Math.min(1, Math.max(0, (y - b.minY) / (b.maxY - b.minY)))
}
