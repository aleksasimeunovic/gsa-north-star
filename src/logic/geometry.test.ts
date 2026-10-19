import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import { clipLineToPolygon, lineAtFraction, polygonAreaHa, splitPolygon } from './geometry'

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
