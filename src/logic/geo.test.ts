import { describe, expect, it } from 'vitest'
import { SCENARIOS } from '../data/scenarios'
import { fromMercator, toMercator } from './geo'

const at = SCENARIOS.second_year.place

describe('placing the farm on the satellite photo', () => {
  it('goes there and back without moving a point', () => {
    for (const p of [{ x: 0, y: 0 }, { x: 370, y: 120 }, { x: -40, y: 290 }]) {
      const back = fromMercator(toMercator(p, at), at)
      expect(back.x).toBeCloseTo(p.x, 6)
      expect(back.y).toBeCloseTo(p.y, 6)
    }
  })

  it('keeps distances in metres on the ground, so areas on the map match the rules', () => {
    const [ax, ay] = toMercator({ x: 0, y: 0 }, at)
    const [bx, by] = toMercator({ x: 100, y: 0 }, at)
    const ground = Math.hypot(bx - ax, by - ay) * Math.cos((at.lat * Math.PI) / 180)
    expect(ground).toBeCloseTo(100, 6)
  })

  it('turns the grid with the road, and local y points down the map', () => {
    const [, y0] = toMercator({ x: 0, y: 0 }, at)
    const [, yRight] = toMercator({ x: 100, y: 0 }, at)
    const [, yDown] = toMercator({ x: 0, y: 100 }, at)
    expect(yRight).toBeGreaterThan(y0)
    expect(yDown).toBeLessThan(y0)
  })
})
