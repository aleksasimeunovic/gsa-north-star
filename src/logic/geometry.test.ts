import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import { centroid, clampToField, clipLineToPolygon, drawingProblems, fractionOfLine, inArea, lineAtFraction, overlapHa, partNames, polygonAreaHa, proposedSplitLine, selfCrosses, splitPolygon, translateLine } from './geometry'

const fields = SCENARIOS.second_year.fields
const river = fields.find((f) => f.id === 'river')!.polygon

describe('geometry', () => {
  it('field polygons match their declared areas (9.00 ha in total)', () => {
    for (const f of fields) expect(polygonAreaHa(f.polygon)).toBeCloseTo(f.areaHa, 6)
    expect(fields.reduce((s, f) => s + polygonAreaHa(f.polygon), 0)).toBeCloseTo(9, 6)
  })

  it('signal areas match the scenario', () => {
    for (const f of fields) {
      if (f.signal?.kind === 'satellite_difference') expect(polygonAreaHa(f.signal.flagPolygon)).toBeCloseTo(f.signal.flagHa, 6)
      if (f.signal?.kind === 'road_strip') expect(polygonAreaHa(f.signal.stripPolygon)).toBeCloseTo(f.signal.stripHa, 6)
    }
  })

  it('clips a line drawn beyond the field to the field edge', () => {
    const chord = clipLineToPolygon(river, { x: -50, y: 60 }, { x: 500, y: 60 })!
    const xs = chord.map((p) => p.x).sort((a, b) => a - b)
    expect(xs).toEqual([0, 200])
    expect(chord.every((p) => p.y === 60)).toBe(true)
  })

  it('splits the river field in half: 1.20 + 1.20', () => {
    const r = splitPolygon(river, { x: 0, y: 60 }, { x: 200, y: 60 })!
    expect([...r.areasHa].sort()).toEqual([1.2, 1.2])
  })

  it('a diagonal split keeps the total area', () => {
    const r = splitPolygon(river, { x: 0, y: 30 }, { x: 200, y: 100 })!
    expect(r.areasHa[0] + r.areasHa[1]).toBeCloseTo(2.4, 2)
  })

  it('returns null when the line misses the field or touches only an edge', () => {
    expect(splitPolygon(river, { x: 0, y: 500 }, { x: 200, y: 500 })).toBeNull()
    expect(splitPolygon(river, { x: 0, y: 0 }, { x: 200, y: 0 })).toBeNull()
    expect(splitPolygon(river, { x: 5, y: 5 }, { x: 5, y: 5 })).toBeNull()
  })

  it('slider alternative: a line at a fraction of the field height', () => {
    const [a, b] = lineAtFraction(river, 0.25)
    const r = splitPolygon(river, a, b)!
    expect([...r.areasHa].sort()).toEqual([0.6, 1.8])
  })
})

describe('map helpers', () => {
  it('centroids label the two halves of the river field', () => {
    const r = splitPolygon(river, { x: 0, y: 60 }, { x: 200, y: 60 })!
    const ys = r.parts.map((p) => centroid(p).y).sort((a, b) => a - b)
    expect(ys).toEqual([30, 90])
    expect(r.parts.map((p) => centroid(p).x)).toEqual([100, 100])
  })

  it('guardrail: a handle stops at the field edge and says so', () => {
    expect(clampToField({ x: -900, y: 60 }, river)).toEqual({ point: { x: 0, y: 60 }, clamped: true })
    expect(clampToField({ x: 50, y: 60 }, river)).toEqual({ point: { x: 50, y: 60 }, clamped: false })
  })

  it('moving the whole line keeps it inside the field', () => {
    const r = translateLine([{ x: 0, y: 60 }, { x: 200, y: 60 }], 30, 500, river)
    expect(r.line).toEqual([{ x: 0, y: 120 }, { x: 200, y: 120 }])
    expect(r.clamped).toBe(true)
    expect(translateLine([{ x: 0, y: 60 }, { x: 200, y: 60 }], 0, 10, river)).toMatchObject({ clamped: false })
  })

  it('proposes the split along the top of the flagged area', () => {
    const f = fields.find((x) => x.id === 'river')!
    const flag = f.signal?.kind === 'satellite_difference' ? f.signal.flagPolygon : []
    expect(proposedSplitLine(river, flag)).toEqual([{ x: 0, y: 60 }, { x: 200, y: 60 }])
  })

  it('names the parts as they look and finds the flagged one', () => {
    const f = fields.find((x) => x.id === 'river')!
    const flag = f.signal?.kind === 'satellite_difference' ? f.signal.flagPolygon : []
    const r = splitPolygon(river, { x: 0, y: 60 }, { x: 200, y: 60 })!
    const names = partNames(r.parts)
    expect([...names].sort()).toEqual(['bottom', 'top'])
    const bottom = r.parts[names.indexOf('bottom')]
    expect(inArea(bottom, flag)).toBe(true)
    expect(inArea(r.parts[names.indexOf('top')], flag)).toBe(false)
  })


  it('slider position round-trips', () => {
    expect(fractionOfLine(river, lineAtFraction(river, 0.5))).toBe(0.5)
  })
})

describe('drawing a field', () => {
  const s = SCENARIOS.second_year
  const upper = s.fields.find((f) => f.id === 'upper')!
  const signal = upper.signal?.kind === 'overlap' ? upper.signal : null!
  const land = s.blocks.find((b) => b.id === 'block_2')!.polygon
  const others = s.fields.filter((f) => f.id !== 'upper').map((f) => f.polygon)
  const rect = (x: number, y: number, w: number, h: number) => [{ x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h }]

  it("last year's drawing overlaps the neighbour by 0.10 ha", () => {
    expect(overlapHa(upper.polygon, signal.neighbourPolygon)).toBe(0.1)
    expect(polygonAreaHa(signal.overlapPolygon)).toBeCloseTo(signal.overlapHa, 6)
  })

  it('finds edges that cross each other', () => {
    expect(selfCrosses(upper.polygon)).toBe(false)
    expect(selfCrosses([{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 10, y: 0 }, { x: 0, y: 10 }])).toBe(true)
  })

  it('names what stops a drawing: outside farmland, over his own field, crossing itself', () => {
    expect(drawingProblems(upper.polygon, land, signal.neighbourPolygon, others)).toEqual(['overlaps_neighbour'])
    expect(drawingProblems(rect(0, 140, 200, 95), land, signal.neighbourPolygon, others)).toEqual([])
    expect(drawingProblems(rect(0, 140, 200, 120), land, null, others)).toContain('outside_land')
    expect(drawingProblems(rect(0, 140, 260, 95), land, null, others)).toContain('overlaps_own')
    expect(drawingProblems([{ x: 0, y: 140 }, { x: 200, y: 235 }, { x: 200, y: 140 }, { x: 0, y: 235 }], land, null, others)).toEqual(['crosses_itself'])
  })
})
