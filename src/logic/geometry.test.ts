import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import {
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
const river = riverField.polygon
const signal = riverField.signal?.kind === 'satellite_difference' ? riverField.signal : null
const edge = signal!.edge
const flat: SplitLine = [{ x: 0, y: 60 }, { x: 200, y: 60 }]

describe('geometry', () => {
  it('field polygons match their declared areas (9.00 ha in total)', () => {
    for (const f of fields) expect(polygonAreaHa(f.polygon)).toBeCloseTo(f.areaHa, 6)
    expect(fields.reduce((s, f) => s + polygonAreaHa(f.polygon), 0)).toBeCloseTo(9, 6)
  })

  it('signal areas match the scenario', () => {
    for (const f of fields) {
      if (f.signal?.kind === 'satellite_difference') expect(polygonAreaHa(f.signal.flagPolygon)).toBeCloseTo(f.signal.flagHa, 2)
      if (f.signal?.kind === 'road_strip') expect(polygonAreaHa(f.signal.stripPolygon)).toBeCloseTo(f.signal.stripHa, 6)
    }
  })
})

describe('splitting a field with a line', () => {
  it('a straight line in half: 1.20 + 1.20', () => {
    expect([...splitField(river, flat)!.areasHa].sort()).toEqual([1.2, 1.2])
  })

  it("GSA's line along the photo's edge: 1.22 above, 1.18 below", () => {
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
    expect(inArea(r.parts[names.indexOf('bottom')], signal!.flagPolygon)).toBe(true)
    expect(inArea(r.parts[names.indexOf('top')], signal!.flagPolygon)).toBe(false)
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

  it('a line has a limit of bends, so handles stay large on a phone', () => {
    let line: SplitLine = flat
    for (let x = 20; x < 200; x += 25) line = pullLine(line, { x, y: 60 })?.line ?? line
    expect(line.length).toBe(9)
    expect(pullLine(line, { x: 190, y: 60 })).toBeNull()
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
