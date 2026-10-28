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

/** Slider alternative: a horizontal line edge to edge at fraction t (0 top, 1 bottom). */
export function lineAtFraction(poly: Polygon, t: number): [Point, Point] {
  const { minX, maxX, minY, maxY } = bounds(poly)
  const y = minY + Math.min(1, Math.max(0, t)) * (maxY - minY)
  return [
    { x: minX, y },
    { x: maxX, y },
  ]
}

/**
 * The satellite suggests, Milan decides: GSA proposes the split line along the top of the
 * flagged area, edge to edge. He accepts it or nudges it.
 */
export function proposedSplitLine(field: Polygon, flag: Polygon): [Point, Point] {
  const f = bounds(field)
  const y = bounds(flag).minY
  return [
    { x: f.minX, y },
    { x: f.maxX, y },
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

/**
 * Guardrail: a handle stops at the field's edge. `clamped` says the edge stopped it,
 * so the map can say why at that moment.
 */
export function clampToField(p: Point, poly: Polygon): { point: Point; clamped: boolean } {
  const b = bounds(poly)
  const point = { x: Math.min(b.maxX, Math.max(b.minX, p.x)), y: Math.min(b.maxY, Math.max(b.minY, p.y)) }
  return { point, clamped: point.x !== p.x || point.y !== p.y }
}

/** Move the whole line; it stays inside the field as one piece. */
export function translateLine(line: [Point, Point], dx: number, dy: number, poly: Polygon): { line: [Point, Point]; clamped: boolean } {
  const b = bounds(poly)
  const xs = line.map((p) => p.x)
  const ys = line.map((p) => p.y)
  const cdx = Math.min(b.maxX - Math.max(...xs), Math.max(b.minX - Math.min(...xs), dx))
  const cdy = Math.min(b.maxY - Math.max(...ys), Math.max(b.minY - Math.min(...ys), dy))
  return {
    line: [
      { x: line[0].x + cdx, y: line[0].y + cdy },
      { x: line[1].x + cdx, y: line[1].y + cdy },
    ],
    clamped: cdx !== dx || cdy !== dy,
  }
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

/** Fraction (0 top, 1 bottom) of a horizontal line, for the slider. */
export function fractionOfLine(poly: Polygon, line: [Point, Point]): number {
  const b = bounds(poly)
  const y = (line[0].y + line[1].y) / 2
  return Math.min(1, Math.max(0, (y - b.minY) / (b.maxY - b.minY)))
}

/** The part of a polygon inside a convex area (Sutherland–Hodgman). The subject may be any simple polygon. */
export function clipToConvex(subject: Polygon, area: Polygon): Polygon {
  // Walk the area's edges so that "inside" is always the same side, whatever its winding.
  const ccw = area.reduce((s, p, i) => {
    const q = area[(i + 1) % area.length]
    return s + (p.x * q.y - q.x * p.y)
  }, 0) > 0
  let out = subject
  for (let i = 0; i < area.length && out.length; i++) {
    const a = area[i]
    const b = area[(i + 1) % area.length]
    out = clipHalfPlane(out, a, b, ccw)
  }
  return out
}

/** How much of one polygon lies inside a convex other, in hectares. */
export const overlapHa = (poly: Polygon, convexOther: Polygon) => roundHa(polygonAreaHa(clipToConvex(poly, convexOther)))

/**
 * The field's shared edge moved as one line, never point by point: every corner on the bottom edge goes
 * to `y`. The guardrail keeps the line on his registered land and leaves the field at least 10 m deep.
 */
export function moveBottomEdge(poly: Polygon, land: Polygon, y: number): { polygon: Polygon; y: number; clamped: boolean } {
  const b = bounds(poly)
  const lo = b.minY + 10
  const hi = bounds(land).maxY
  const at = Math.round(Math.min(hi, Math.max(lo, y)) * 10) / 10
  return { polygon: poly.map((p) => (p.y === b.maxY ? { x: p.x, y: at } : p)), y: at, clamped: at !== Math.round(y * 10) / 10 }
}

/** The land the government has registered as farmland around a field. */
export function landOf(s: { blocks: { polygon: Polygon }[] }, field: { polygon: Polygon }): Polygon {
  const c = centroid(field.polygon)
  const inside = (poly: Polygon) => {
    const b = bounds(poly)
    return c.x >= b.minX && c.x <= b.maxX && c.y >= b.minY && c.y <= b.maxY
  }
  return s.blocks.find((b) => inside(b.polygon))?.polygon ?? field.polygon
}
