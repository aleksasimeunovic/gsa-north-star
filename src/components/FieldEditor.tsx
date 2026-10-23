import 'ol/ol.css'
import Feature from 'ol/Feature'
import OlMap from 'ol/Map'
import View from 'ol/View'
import { defaults as defaultControls } from 'ol/control/defaults'
import OlPolygon from 'ol/geom/Polygon'
import Modify from 'ol/interaction/Modify'
import Snap from 'ol/interaction/Snap'
import VectorLayer from 'ol/layer/Vector'
import Projection from 'ol/proj/Projection'
import VectorSource from 'ol/source/Vector'
import { useEffect, useMemo, useRef, useState } from 'react'
import { draw as copy, en, formatHa, map as mapCopy } from '../copy/en'
import type { FieldId, Point, Polygon, Scenario } from '../data/scenarios'
import { bounds, centroid, drawingProblems, overlapHa, polygonAreaHa, roundHa } from '../logic/geometry'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Inline, Stack, Text, VisuallyHidden } from '../ui/Layout'
import { mapStyle, vertexStyle } from '../ui/mapStyles'

// Scenario coordinates are metres with y pointing down; the map's y points up.
const toMap = (p: Polygon) => [[...p.map((q) => [q.x, -q.y]), [p[0].x, -p[0].y]]]
const fromMap = (rings: number[][][]): Polygon => rings[0].slice(0, -1).map(([x, y]) => ({ x: Math.round(x * 10) / 10, y: Math.round(-y * 10) / 10 }))
const projection = new Projection({ code: 'gsa-local', units: 'm', extent: [-200, -500, 800, 200] })

const inside = (p: Point, poly: Polygon) => {
  const b = bounds(poly)
  return p.x >= b.minX && p.x <= b.maxX && p.y >= b.minY && p.y <= b.maxY
}

interface Props {
  scenario: Scenario
  fieldId: FieldId
  /** Where he starts: last year's line, or his own drawing. */
  start: Polygon
  onSave: (p: Polygon) => void
}

/**
 * Drawing where a field really ends, on a real map. He drags corners (or an edge to add one); corners
 * stick to the neighbour's line and the registered land nearby. Area and problems update as he drags,
 * and each problem is explained where it stops him. A slider is the alternative to dragging.
 */
export default function FieldEditor({ scenario, fieldId, start, onSave }: Props) {
  const field = scenario.fields.find((f) => f.id === fieldId)!
  const neighbour = field.signal?.kind === 'overlap' ? field.signal.neighbourPolygon : null
  const land = scenario.blocks.find((b) => inside(centroid(field.polygon), b.polygon))?.polygon ?? field.polygon
  const others = scenario.fields.filter((f) => f.id !== fieldId)

  const el = useRef<HTMLDivElement>(null)
  const mine = useRef<Feature<OlPolygon>>()
  const [poly, setPoly] = useState<Polygon>(start)
  const [past, setPast] = useState<Polygon[]>([])
  const [slider, setSlider] = useState(false)
  const [tried, setTried] = useState(false)

  const problems = useMemo(
    () => drawingProblems(poly, land, neighbour, others.map((o) => o.polygon)),
    [poly, land, neighbour, others],
  )
  const hard = problems.filter((p) => p !== 'overlaps_neighbour')
  const still = neighbour ? overlapHa(poly, neighbour) : 0
  const area = roundHa(polygonAreaHa(poly))

  // Build the map once; the field's shape is pushed in from state below.
  useEffect(() => {
    if (!el.current) return
    const ref = new VectorSource()
    const add = (p: Polygon, role: Parameters<typeof mapStyle>[0], text?: string) => {
      const f = new Feature(new OlPolygon(toMap(p)))
      f.setStyle(mapStyle(role, text))
      ref.addFeature(f)
    }
    add(land, 'land')
    others.forEach((o) => add(o.polygon, 'other'))
    if (neighbour) add(neighbour, 'neighbour', mapCopy.neighbour)

    const own = new VectorSource()
    const feature = new Feature(new OlPolygon(toMap(start)))
    mine.current = feature
    own.addFeature(feature)

    const shown = [...field.polygon, ...(neighbour ?? [])]
    const b = bounds(shown)
    const map = new OlMap({
      target: el.current,
      controls: defaultControls({ rotate: false, attribution: false }),
      // No panning or wheel zoom: dragging on the map always means moving his line.
      interactions: [],
      layers: [new VectorLayer({ source: ref }), new VectorLayer({ source: own })],
      view: new View({ projection, extent: [b.minX - 120, -b.maxY - 120, b.maxX + 120, -b.minY + 120], constrainOnlyCenter: true }),
    })
    map.getView().fit([b.minX, -b.maxY, b.maxX, -b.minY], { padding: [24, 24, 24, 24] })

    const modify = new Modify({ source: own, pixelTolerance: 24, style: vertexStyle })
    // Undo goes back to the shape before the drag, not each step of it.
    let before: Polygon | null = null
    modify.on('modifystart', () => (before = fromMap(feature.getGeometry()!.getCoordinates())))
    modify.on('modifyend', () => {
      const snapshot = before
      if (snapshot) setPast((p) => [...p, snapshot])
      before = null
    })
    map.addInteraction(modify)
    // Snap goes last so it sees the moves of the modify interaction.
    map.addInteraction(new Snap({ source: ref, pixelTolerance: 14 }))
    map.addInteraction(new Snap({ source: own, pixelTolerance: 14 }))

    const live = () => setPoly(fromMap(feature.getGeometry()!.getCoordinates()))
    feature.getGeometry()!.on('change', live)
    return () => {
      map.setTarget(undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the map's shape and label in step with state (undo, reset, slider).
  useEffect(() => {
    const f = mine.current
    if (!f) return
    const geom = f.getGeometry()!
    const now = JSON.stringify(fromMap(geom.getCoordinates()))
    if (now !== JSON.stringify(poly)) geom.setCoordinates(toMap(poly))
    f.setStyle(mapStyle(hard.length ? 'mine_problem' : 'mine', `${en.fields[fieldId]} ${formatHa(area)}`))
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
      <div ref={el} className="draw-map" role="application" aria-label={copy.label(en.fields[fieldId])} aria-describedby="draw-status" />
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
      {tried && hard.length > 0 && <VisuallyHidden>{copy.problem[hard[0]]}</VisuallyHidden>}
      <div>
        <Button
          variant="primary"
          onClick={() => {
            if (hard.length) {
              setTried(true)
              document.getElementById('draw-status')?.scrollIntoView({ block: 'center' })
              return
            }
            onSave(poly)
          }}
        >
          {copy.save}
        </Button>
      </div>
    </Stack>
  )
}
