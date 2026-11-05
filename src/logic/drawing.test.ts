import { describe, expect, it } from 'vitest'
import type { Polygon } from '../data/scenarios'
import { closeProblem, cornerProblem, drawIssues, drawnHa, insertCorner, leaveOutOverlap, midpoints, outlineProblem, snapCorner, type DrawContext } from './drawing'

const sq = (x: number, y: number, s: number): Polygon => [{ x, y }, { x: x + s, y }, { x: x + s, y: y + s }, { x, y: y + s }]
// Farmland 100 × 100 m (1 ha); one of his fields fills its right quarter.
const ctx: DrawContext = { farmland: [sq(0, 0, 100)], fields: [{ name: 'Meadow', polygon: [{ x: 75, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 75, y: 100 }] }] }

describe('drawing a field', () => {
  it('stops a corner off registered farmland, red', () => {
    expect(cornerProblem([], { x: 120, y: 10 }, ctx)).toBe('outside_farmland')
    expect(cornerProblem([], { x: 10, y: 10 }, ctx)).toBeNull()
  })
  it('stops an edge that would cross one already drawn', () => {
    const z = [{ x: 10, y: 10 }, { x: 60, y: 10 }, { x: 10, y: 60 }]
    expect(cornerProblem(z, { x: 40, y: 5 }, ctx)).toBe('crosses_itself')
    expect(cornerProblem(z, { x: 5, y: 40 }, ctx)).toBeNull()
  })
  it('stops closing the shape across itself', () => {
    expect(closeProblem([{ x: 10, y: 10 }, { x: 60, y: 10 }, { x: 60, y: 60 }, { x: 80, y: 60 }, { x: 70, y: 30 }], ctx)).toBe('crosses_itself')
    expect(closeProblem([{ x: 10, y: 10 }, { x: 60, y: 10 }, { x: 60, y: 60 }, { x: 10, y: 60 }], ctx)).toBeNull()
  })
  it('a field too small to declare is left to do, orange', () => {
    expect(drawIssues(sq(10, 10, 20), ctx)).toEqual([{ kind: 'too_small' }])
    expect(drawIssues(sq(10, 10, 40), ctx)).toEqual([])
  })
  it('land he already declares is an overlap to fix, not an edge he shares', () => {
    expect(drawIssues([{ x: 10, y: 10 }, { x: 80, y: 10 }, { x: 80, y: 60 }, { x: 10, y: 60 }], ctx)).toEqual([{ kind: 'overlaps', field: 'Meadow' }])
    expect(drawIssues([{ x: 10, y: 10 }, { x: 75, y: 10 }, { x: 75, y: 60 }, { x: 10, y: 60 }], ctx)).toEqual([])
  })
  it('leaving out a bite follows the field edge where the shape ran into it', () => {
    // A field in the middle of the shape's right edge: the cut runs round it.
    const bite: DrawContext = { farmland: ctx.farmland, fields: [{ name: 'Yard', polygon: sq(50, 20, 20) }] }
    const fixed = leaveOutOverlap([{ x: 10, y: 10 }, { x: 60, y: 10 }, { x: 60, y: 60 }, { x: 10, y: 60 }], bite)
    expect(drawIssues(fixed, bite)).toEqual([])
    expect(fixed).toContainEqual({ x: 50, y: 20 })
  })
  it('leaving out the overlap moves its corners onto the field edge', () => {
    const fixed = leaveOutOverlap([{ x: 10, y: 10 }, { x: 80, y: 10 }, { x: 80, y: 60 }, { x: 10, y: 60 }], ctx)
    expect(fixed[1]).toEqual({ x: 75, y: 10 })
    expect(drawIssues(fixed, ctx)).toEqual([])
  })
  it('a moved edge off the farmland is stopped', () => {
    expect(outlineProblem([{ x: 10, y: 10 }, { x: 60, y: 10 }, { x: 60, y: 130 }], ctx)).toBe('outside_farmland')
    expect(outlineProblem(sq(10, 10, 40), ctx)).toBeNull()
  })
  it('snaps to his first corner to close, then to edges he can see', () => {
    const z = [{ x: 10, y: 10 }, { x: 60, y: 10 }, { x: 60, y: 60 }]
    expect(snapCorner({ x: 13, y: 12 }, z, ctx, false)).toMatchObject({ point: { x: 10, y: 10 }, closes: true })
    expect(snapCorner({ x: 72, y: 40 }, [], ctx, false)).toMatchObject({ point: { x: 75, y: 40 }, snapped: true, closes: false })
    expect(snapCorner({ x: 40, y: 40 }, [], ctx, false).snapped).toBe(false)
  })
  it('measures the area and adds a corner in the middle of an edge', () => {
    expect(drawnHa(sq(0, 0, 50))).toBe(0.25)
    expect(midpoints(sq(0, 0, 10), true)).toHaveLength(4)
    expect(midpoints(sq(0, 0, 10).slice(0, 3), false)).toHaveLength(2)
    expect(insertCorner(sq(0, 0, 10), 0, { x: 5, y: -2 })[1]).toEqual({ x: 5, y: -2 })
  })
})
