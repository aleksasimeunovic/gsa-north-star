import { useState } from 'react'
import { draw as copy, formatHa, map } from '../copy/en'
import type { Field, Polygon } from '../data/scenarios'
import { bounds, moveBottomEdge, overlapHa, polygonAreaHa, roundHa } from '../logic/geometry'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Inline, Stack, Text } from '../ui/Layout'
import { StageAction } from '../ui/MapStage'

/**
 * Where the field ends, as one line he moves (the split's interaction): by a large handle on the map, or a
 * metre stepper. The line stays on his registered land and says so when it stops; undo walks back.
 */
export function useEdgeDraft(field: Field, land: Polygon, start: Polygon) {
  const top = bounds(field.polygon).minY
  const [y, setY] = useState(() => bounds(start).maxY)
  const [past, setPast] = useState<number[]>([])
  const [clamped, setClamped] = useState(false)
  const r = moveBottomEdge(field.polygon, land, y)
  const move = (to: number, record = true) => {
    const next = moveBottomEdge(field.polygon, land, to)
    if (record) setPast((p) => [...p, y])
    setY(next.y)
    setClamped(next.clamped)
  }
  const remember = () => setPast((p) => [...p, y])
  const undo = () => {
    if (!past.length) return
    setY(past[past.length - 1])
    setPast(past.slice(0, -1))
    setClamped(false)
  }
  return { y, depth: Math.round(y - top), polygon: r.polygon, areaHa: roundHa(polygonAreaHa(r.polygon)), clamped, move, remember, undo, canUndo: past.length > 0 }
}

export type EdgeDraft = ReturnType<typeof useEdgeDraft>

/** Beside the map: the live area, the guardrail in place, the metre stepper, undo and save. */
export function EdgeControls({ d, neighbour, onSave }: { d: EdgeDraft; neighbour: Polygon | null; onSave: (p: Polygon) => void }) {
  const still = neighbour ? overlapHa(d.polygon, neighbour) : 0
  return (
    <Stack gap="md">
      <div aria-live="polite">
        <Text variant="strong">{copy.area(formatHa(d.areaHa))}</Text>
        {d.clamped && <Banner tone="attention">{map.edge}</Banner>}
        {!d.clamped && still >= 0.01 && <Text variant="secondary">{copy.stillOverlaps(formatHa(still))}</Text>}
      </div>
      <div className="flex flex-col gap-2">
        <span id="edge-label" className="font-medium">{copy.stepperLabel}</span>
        <div className="edge-stepper" role="group" aria-labelledby="edge-label">
          <Button onClick={() => d.move(d.y - 1)} aria-label={copy.up}>−</Button>
          <output aria-live="polite">{copy.metres(d.depth)}</output>
          <Button onClick={() => d.move(d.y + 1)} aria-label={copy.down}>+</Button>
        </div>
      </div>
      <StageAction>
        <Inline>
          {d.canUndo && <Button onClick={d.undo}>{copy.undo}</Button>}
          <Button variant="primary" onClick={() => onSave(d.polygon)}>{copy.save}</Button>
        </Inline>
      </StageAction>
    </Stack>
  )
}
