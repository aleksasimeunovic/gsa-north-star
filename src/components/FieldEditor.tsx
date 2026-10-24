import Feature from 'ol/Feature'
import OlPolygon from 'ol/geom/Polygon'
import Modify from 'ol/interaction/Modify'
import Snap from 'ol/interaction/Snap'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import { useEffect, useMemo, useRef, useState } from 'react'
import { draw as copy, en, formatHa } from '../copy/en'
import type { FieldId, Polygon, Scenario } from '../data/scenarios'
import { bounds, drawingProblems, overlapHa, polygonAreaHa, roundHa } from '../logic/geometry'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Inline, Stack, Text } from '../ui/Layout'
import { labelStyle, mapStyle, vertexStyle } from '../ui/mapStyles'
import { createFarmMap, landOf } from './map/olFarm'

interface Props {
  scenario: Scenario
  fieldId: FieldId
  /** Where he starts: last year's line, or his own drawing. */
  start: Polygon
  onSave: (p: Polygon) => void
}

/**
 * Drawing where a field really ends, on the satellite photo. He drags corners (or an edge to add one);
 * corners stick to the neighbour's line and the registered land nearby. Dragging anywhere else moves the map.
 * Area and problems update as he drags, and each problem is explained where it stops him.
 * A slider is the alternative to dragging.
 */
export default function FieldEditor({ scenario, fieldId, start, onSave }: Props) {
  const field = scenario.fields.find((f) => f.id === fieldId)!
  const neighbour = field.signal?.kind === 'overlap' ? field.signal.neighbourPolygon : null
  const land = landOf(scenario, field)
  const others = scenario.fields.filter((f) => f.id !== fieldId)

  const el = useRef<HTMLDivElement>(null)
  const mine = useRef<Feature<OlPolygon>>()
  const [poly, setPoly] = useState<Polygon>(start)
  const [past, setPast] = useState<Polygon[]>([])
  const [slider, setSlider] = useState(false)

  const problems = useMemo(
    () => drawingProblems(poly, land, neighbour, others.map((o) => o.polygon)),
    [poly, land, neighbour, others],
  )
  const hard = problems.filter((p) => p !== 'overlaps_neighbour')
  const still = neighbour ? overlapHa(poly, neighbour) : 0
  const area = roundHa(polygonAreaHa(poly))

  // Build the map once; the field's shape is pushed in from state below.
  const toLocal = useRef<(rings: number[][][]) => Polygon>(() => [])
  const toRings = useRef<(p: Polygon) => number[][][]>(() => [])
  useEffect(() => {
    if (!el.current) return
    const fm = createFarmMap(el.current, scenario, { interactive: true, focus: fieldId, editing: true })
    toRings.current = fm.ring
    toLocal.current = (rings) => rings[0].slice(0, -1).map((c) => {
      const p = fm.point(c)
      return { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 }
    })

    const own = new VectorSource()
    const feature = new Feature(new OlPolygon(fm.ring(start)))
    mine.current = feature
    own.addFeature(feature)
    fm.map.getLayers().insertAt(2, new VectorLayer({ source: own }))

    const modify = new Modify({ source: own, pixelTolerance: 24, style: vertexStyle })
    // Undo goes back to the shape before the drag, not each step of it.
    let before: Polygon | null = null
    modify.on('modifystart', () => (before = toLocal.current(feature.getGeometry()!.getCoordinates())))
    modify.on('modifyend', () => {
      const snapshot = before
      if (snapshot) setPast((p) => [...p, snapshot])
      before = null
    })
    fm.map.addInteraction(modify)
    // Snap goes last so it sees the moves of the modify interaction.
    fm.map.addInteraction(new Snap({ source: fm.shapes, pixelTolerance: 14 }))
    fm.map.addInteraction(new Snap({ source: own, pixelTolerance: 14 }))

    const live = () => setPoly(toLocal.current(feature.getGeometry()!.getCoordinates()))
    feature.getGeometry()!.on('change', live)
    return () => fm.destroy()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the map's shape and label in step with state (undo, reset, slider).
  useEffect(() => {
    const f = mine.current
    if (!f) return
    const geom = f.getGeometry()!
    const now = JSON.stringify(toLocal.current(geom.getCoordinates()))
    if (now !== JSON.stringify(poly)) geom.setCoordinates(toRings.current(poly))
    f.setStyle([...mapStyle(hard.length ? 'mine_problem' : 'mine'), labelStyle(`${en.fields[fieldId]} ${formatHa(area)}`)])
  }, [poly, hard.length, area, fieldId])

  const set = (next: Polygon) => {
    setPast([...past, poly])
    setPoly(next)
  }
  const b = bounds(field.polygon)
  const landBottom = bounds(land).maxY
  const bottom = Math.round(bounds(poly).maxY)

  return (
    <Stack gap="sm">
      <Text variant="small">{copy.how}</Text>
      <div ref={el} className="farm-map" data-mode="draw" tabIndex={0} role="application" aria-label={copy.label(en.fields[fieldId])} aria-describedby="draw-status" />
      <div id="draw-status" aria-live="polite">
        <Text variant="strong">{copy.area(formatHa(area))}</Text>
        {hard.map((p) => (
          <Banner key={p} tone="attention">{copy.problem[p]}</Banner>
        ))}
        {!hard.length && still >= 0.01 && <Text>{copy.stillOverlaps(formatHa(still))}</Text>}
      </div>
      {slider && (
        <div className="field">
          <label htmlFor="draw-slider" className="field-label">{copy.sliderLabel}</label>
          <input
            id="draw-slider"
            type="range"
            min={20}
            max={Math.round(landBottom - b.minY)}
            step={1}
            value={bottom - b.minY}
            aria-valuetext={`${bottom - b.minY} m, ${copy.area(formatHa(area))}`}
            onChange={(e) => {
              const y = b.minY + Number(e.target.value)
              setPoly([
                { x: b.minX, y: b.minY },
                { x: b.maxX, y: b.minY },
                { x: b.maxX, y },
                { x: b.minX, y },
              ])
            }}
            onPointerDown={() => setPast([...past, poly])}
            onKeyDown={() => setPast([...past, poly])}
          />
        </div>
      )}
      <div>
        <Button variant="link" onClick={() => setSlider(!slider)}>{slider ? copy.useMap : copy.useSlider}</Button>
      </div>
      <Inline>
        {past.length > 0 && (
          <Button
            onClick={() => {
              setPoly(past[past.length - 1])
              setPast(past.slice(0, -1))
            }}
          >
            {copy.undo}
          </Button>
        )}
        {JSON.stringify(poly) !== JSON.stringify(field.polygon) && <Button variant="link" onClick={() => set(field.polygon)}>{copy.reset}</Button>}
      </Inline>
      <div>
        <Button variant="primary" disabled={hard.length > 0} onClick={() => onSave(poly)}>
          {copy.save}
        </Button>
      </div>
    </Stack>
  )
}
