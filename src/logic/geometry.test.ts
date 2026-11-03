import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import {
  bounds,
  centroid,
  followsEdge,
  inArea,
  keepInside,
  lineHeight,
  lineProblem,
  partNames,
  pointInPolygon,
  polygonAreaHa,
  pullLine,
  pullOutline,
  shapeProblem,
  outlineHa,
  outlineCrosses,
  snapToAny,
  removeBend,
  sameLine,
  shiftLine,
  snapToEdge,
  splitField,
  straightLine,
  tidyLine,
  toFieldEdge,
  type SplitLine,
} from './geometry'

const fields = SCENARIOS.second_year.fields
const riverField = fields.find((f) => f.id === 'river')!
const signal = riverField.signal?.kind === 'satellite_difference' ? riverField.signal : null
const traced = riverField.polygon
const tracedEdge = signal!.edge
// The rules, on a plain 2.40 ha rectangle, so the numbers are easy to read.
const river = [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 120 }, { x: 0, y: 120 }]
const edge: SplitLine = [{ x: 0, y: 54 }, { x: 52, y: 66 }, { x: 104, y: 58 }, { x: 152, y: 64 }, { x: 200, y: 60 }]
const flag = [...edge, { x: 200, y: 120 }, { x: 0, y: 120 }]
const flat: SplitLine = [{ x: 0, y: 60 }, { x: 200, y: 60 }]

describe('the fields as traced on the photo', () => {
  it('the record gives the areas: 9.00 ha in total', () => {
    expect(fields.reduce((s, f) => s + f.areaHa, 0)).toBeCloseTo(9, 6)
  })

  it("GSA's line runs from edge to edge of the traced field, and gives the part along the river its share of the record's 2.40 ha", () => {
    expect(lineProblem(traced, tracedEdge, riverField.areaHa)).toBeNull()
    const r = splitField(traced, tracedEdge, riverField.areaHa)!
    const names = partNames(r.parts)
    expect(r.areasHa[names.indexOf('top')]).toBe(signal!.flagHa)
    expect(r.areasHa[names.indexOf('bottom')]).toBe(1.32)
    expect(inArea(r.parts[names.indexOf('top')], signal!.flagPolygon)).toBe(true)
    expect(inArea(r.parts[names.indexOf('bottom')], signal!.flagPolygon)).toBe(false)
  })

  it('a part is a share of the record, whatever the drawing measures', () => {
    const r = splitField(traced, tracedEdge, 2.4)!
    expect(r.areasHa[0] + r.areasHa[1]).toBeCloseTo(2.4, 6)
    expect(polygonAreaHa(r.parts[0]) + polygonAreaHa(r.parts[1])).toBeCloseTo(polygonAreaHa(traced), 6)
  })

  it('a bend stays inside the traced shape, not just its outline box', () => {
    const b = bounds(traced)
    const corner = { x: b.minX + 2, y: b.maxY - 2 }
    expect(pointInPolygon(corner, traced)).toBe(false)
    const kept = keepInside(traced, corner)
    expect(kept.clamped).toBe(true)
    expect(pointInPolygon(kept.point, traced)).toBe(true)
  })

  it('a stretch of line that runs outside the field is a bad line', () => {
    // A bite into the field that crosses its bottom-left edge between two good points.
    expect(lineProblem(traced, [{ x: 170, y: 116 }, { x: 150, y: 30 }, { x: 278, y: 10 }], riverField.areaHa)).toBe('leaves_field')
  })
})

describe('splitting a field with a line', () => {
  it('a straight line in half: 1.20 + 1.20', () => {
    expect([...splitField(river, flat)!.areasHa].sort()).toEqual([1.2, 1.2])
  })

  it('a line with bends: 1.22 above, 1.18 below', () => {
    const r = splitField(river, edge)!
    const names = partNames(r.parts)
    expect(r.areasHa[names.indexOf('top')]).toBe(1.22)
    expect(r.areasHa[names.indexOf('bottom')]).toBe(1.18)
  })

  it('whatever the bends, the two parts always add up to the field', () => {
    const lines: SplitLine[] = [
      edge,
      [{ x: 0, y: 30 }, { x: 200, y: 100 }],
      [{ x: 0, y: 40 }, { x: 70, y: 90 }, { x: 130, y: 20 }, { x: 200, y: 70 }],
      // Across a corner: both ends on different sides next to each other.
      [{ x: 0, y: 40 }, { x: 60, y: 60 }, { x: 80, y: 0 }],
      // A bite out of one side: both ends on the same side.
      [{ x: 0, y: 30 }, { x: 70, y: 60 }, { x: 0, y: 90 }],
    ]
    for (const line of lines) {
      const r = splitField(river, line)!
      expect(r.areasHa[0] + r.areasHa[1]).toBeCloseTo(2.4, 6)
      expect(polygonAreaHa(r.parts[0]) + polygonAreaHa(r.parts[1])).toBeCloseTo(2.4, 6)
    }
  })

  it('a line along the side of the field makes no second part', () => {
    expect(splitField(river, [{ x: 0, y: 0 }, { x: 200, y: 0 }])).toBeNull()
  })

  it('centroids label the two parts', () => {
    const r = splitField(river, flat)!
    expect(r.parts.map((p) => centroid(p).y).sort((a, b) => a - b)).toEqual([30, 90])
  })

  it('names the parts as they look and finds the flagged one', () => {
    const r = splitField(river, edge)!
    const names = partNames(r.parts)
    expect([...names].sort()).toEqual(['bottom', 'top'])
    expect(inArea(r.parts[names.indexOf('bottom')], flag)).toBe(true)
    expect(inArea(r.parts[names.indexOf('top')], flag)).toBe(false)
  })

  it('a tap lands in the part it was on', () => {
    const r = splitField(river, edge)!
    const top = r.parts[partNames(r.parts).indexOf('top')]
    expect(pointInPolygon({ x: 100, y: 20 }, top)).toBe(true)
    expect(pointInPolygon({ x: 100, y: 100 }, top)).toBe(false)
  })
})

describe('invalid lines', () => {
  it('a good line has no problem', () => {
    expect(lineProblem(river, edge)).toBeNull()
  })

  it('a line that crosses itself', () => {
    expect(lineProblem(river, [{ x: 0, y: 40 }, { x: 60, y: 90 }, { x: 120, y: 30 }, { x: 200, y: 60 }])).toBeNull()
    expect(lineProblem(river, [{ x: 0, y: 40 }, { x: 150, y: 60 }, { x: 120, y: 100 }, { x: 110, y: 30 }, { x: 200, y: 70 }])).toBe('crosses_itself')
  })

  it('a part too small to declare', () => {
    expect(lineProblem(river, [{ x: 0, y: 3 }, { x: 200, y: 3 }])).toBe('too_small')
    expect(lineProblem(river, [{ x: 0, y: 6 }, { x: 200, y: 6 }])).toBeNull()
  })
})

describe('moving the line', () => {
  it('a bend stops inside the field and says so', () => {
    expect(keepInside(river, { x: -900, y: 60 })).toEqual({ point: { x: 1, y: 60 }, clamped: true })
    expect(keepInside(river, { x: 50, y: 60 })).toEqual({ point: { x: 50, y: 60 }, clamped: false })
  })

  it("an end of the line stays on the field's edge", () => {
    expect(toFieldEdge(river, { x: -40, y: 70 })).toEqual({ x: 0, y: 70 })
    expect(toFieldEdge(river, { x: 100, y: 118 })).toEqual({ x: 100, y: 120 })
  })

  it("near the edge the photo shows, a bend joins it; further off, it doesn't", () => {
    const near = snapToEdge({ x: 104, y: 62 }, edge)
    expect(near.snapped).toBe(true)
    expect(followsEdge([near.point], edge)).toBe(true)
    expect(snapToEdge({ x: 104, y: 80 }, edge)).toMatchObject({ snapped: false, point: { x: 104, y: 80 } })
  })

  it('pulling the line makes a bend where he pressed, between its neighbours', () => {
    const r = pullLine(flat, { x: 100, y: 62 })!
    expect(r.bend).toBe(1)
    expect(r.line).toEqual([flat[0], { x: 100, y: 60 }, flat[1]])
  })

  it('pressing near a bend takes that bend instead of making another', () => {
    const r = pullLine(edge, { x: 106, y: 60 })!
    expect(r.bend).toBe(2)
    expect(r.line).toBe(edge)
  })

  it('a line takes as many bends as he pulls', () => {
    let line: SplitLine = flat
    for (let x = 20; x < 200; x += 25) line = pullLine(line, { x, y: 60 }).line
    expect(line.length).toBe(10)
  })

  it("the field's edge takes new corners where he pulls it, and stays on the registered farmland", () => {
    const sq = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }]
    const land = [{ x: -20, y: -20 }, { x: 120, y: -20 }, { x: 120, y: 120 }, { x: -20, y: 120 }]
    const r = pullOutline(sq, { x: 50, y: 1 })
    expect(r.poly.length).toBe(5)
    expect(r.corner).toBe(1)
    const line = [{ x: 0, y: 50 }, { x: 100, y: 50 }]
    const out = r.poly.map((p, i) => (i === 1 ? { x: 50, y: -30 } : p))
    expect(shapeProblem(land, out, line, 1)).toBe('outside_land')
    const ok = r.poly.map((p, i) => (i === 1 ? { x: 50, y: -10 } : p))
    expect(shapeProblem(land, ok, line, 1)).toBeNull()
    expect(outlineHa(sq, 1, ok)).toBeCloseTo(1.05, 2)
    const crossed = [{ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 100, y: 0 }, { x: 0, y: 100 }]
    expect(outlineCrosses(crossed)).toBe(true)
  })

  it('snaps to the nearest of several edges', () => {
    const a = [{ x: 0, y: 0 }, { x: 100, y: 0 }]
    const b = [{ x: 0, y: 10 }, { x: 100, y: 10 }]
    expect(snapToAny({ x: 50, y: 7 }, [a, b]).point.y).toBe(10)
    expect(snapToAny({ x: 50, y: 50 }, [a, b]).snapped).toBe(false)
  })

  it('a bend can be taken out, and a bend let go on a straight stretch goes by itself', () => {
    expect(removeBend(edge, 2).length).toBe(edge.length - 1)
    expect(removeBend(edge, 0)).toEqual(edge)
    expect(tidyLine([flat[0], { x: 100, y: 61 }, flat[1]])).toEqual(flat)
    expect(tidyLine(edge)).toEqual(edge)
  })

  it('a straight line runs from end to end', () => {
    expect(straightLine(edge)).toEqual([edge[0], edge[edge.length - 1]])
  })

  it('the slider moves the whole line, with its ends on the edge', () => {
    const down = shiftLine(river, edge, 20)
    expect(down[0]).toEqual({ x: 0, y: 74 })
    expect(down[2]).toEqual({ x: 104, y: 78 })
    expect(lineHeight(river, down)).toBeGreaterThan(lineHeight(river, edge))
  })

  it("tells whether the line still follows the photo's edge", () => {
    expect(followsEdge(edge, edge)).toBe(true)
    expect(followsEdge(flat, edge)).toBe(false)
    expect(sameLine(edge, [...edge])).toBe(true)
    expect(sameLine(edge, flat)).toBe(false)
  })
})
