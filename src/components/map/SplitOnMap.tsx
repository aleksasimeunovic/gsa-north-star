import Feature from 'ol/Feature'
import Overlay from 'ol/Overlay'
import type Geometry from 'ol/geom/Geometry'
import LineString from 'ol/geom/LineString'
import OlPoint from 'ol/geom/Point'
import PointerInteraction from 'ol/interaction/Pointer'
import { useEffect, useRef } from 'react'
import { split as copy } from '../../copy/en'
import type { Field, Point } from '../../data/scenarios'
import { centroid, pointInPolygon } from '../../logic/geometry'
import { labelStyle, mapStyle } from '../../ui/mapStyles'
import { splitMoves, type SplitDraft } from '../SplitTool'
import type { FarmMap } from './olFarm'

const round = (p: Point): Point => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 })

/**
 * The line across the field on the satellite photo, with what's written on each part. He pulls the line
 * anywhere and it bends there; each bend and each end is a large handle, and arrow keys move whichever has
 * focus. Dragging anywhere else moves the map. Once the line is settled, a tap on a part picks that part.
 */
export function SplitOnMap({ fm, field, d, interactive, labels, onPickPart }: { fm: FarmMap; field: Field; d: SplitDraft; interactive: boolean; labels: [string, string]; onPickPart?: (i: 0 | 1) => void }) {
  const latest = useRef({ d, moves: splitMoves(field, d), onPickPart })
  latest.current = { d, moves: splitMoves(field, d), onPickPart }
  const handles = useRef<Overlay[]>([])
  const r = d.result
  const line = d.draft.line
  const key = JSON.stringify(line)
  const count = line.length

  // The line and what's written on each part, redrawn as it moves.
  useEffect(() => {
    fm.extra.clear()
    if (!r) return
    const f = new Feature<Geometry>(new LineString(line.map(fm.coord)))
    f.setStyle(mapStyle('split'))
    f.set('split', true)
    fm.extra.addFeature(f)
    r.parts.forEach((part, i) => {
      const at = new Feature<Geometry>(new OlPoint(fm.coord(centroid(part))))
      at.setStyle(labelStyle(labels[i], { size: 16 }))
      fm.extra.addFeature(at)
    })
    handles.current.forEach((o, i) => line[i] && o.setPosition(fm.coord(line[i])))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fm, key, labels[0], labels[1], !!r])

  useEffect(() => () => fm.extra.clear(), [fm])

  // A handle for each bend and end: real buttons on the map, so they take focus and arrow keys.
  useEffect(() => {
    if (!interactive) return
    const at = (e: PointerEvent) => round(fm.point(fm.map.getEventCoordinate(e)))
    const make = (i: number): Overlay => {
      const el = document.createElement('button')
      const end = i === 0 || i === count - 1
      el.type = 'button'
      el.className = 'map-handle'
      if (end) el.dataset.end = ''
      el.setAttribute('aria-label', `${i === 0 ? copy.endStart : i === count - 1 ? copy.endEnd : copy.bendLabel(i)}. ${copy.keys}`)
      let dragging = false
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        el.setPointerCapture(e.pointerId)
        el.focus({ preventScroll: true })
        dragging = true
        latest.current.d.remember()
        latest.current.d.setBend(end ? null : i)
      })
      el.addEventListener('pointermove', (e) => {
        if (dragging) latest.current.moves.movePoint(i, at(e), false)
      })
      const stop = () => {
        if (dragging) latest.current.moves.letGo()
        dragging = false
      }
      el.addEventListener('pointerup', stop)
      el.addEventListener('pointercancel', stop)
      el.addEventListener('focus', () => latest.current.d.setBend(end ? null : i))
      el.addEventListener('keydown', (e) => {
        // Arrow keys move the line, not the map.
        if (latest.current.moves.nudge(i, e.key, e.shiftKey)) {
          e.preventDefault()
          e.stopPropagation()
        }
      })
      const o = new Overlay({ element: el, positioning: 'center-center', stopEvent: true })
      fm.map.addOverlay(o)
      o.setPosition(fm.coord(latest.current.d.draft.line[i]))
      return o
    }
    handles.current = Array.from({ length: count }, (_, i) => make(i))
    return () => {
      handles.current.forEach((o) => fm.map.removeOverlay(o))
      handles.current = []
    }
  }, [fm, interactive, count])

  // Pulling the line: pressing anywhere on it makes a bend there, or takes the one he pressed near.
  useEffect(() => {
    if (!interactive) return
    let bend: number | null = null
    const onLine = (pixel: number[]) => !!fm.map.forEachFeatureAtPixel(pixel, (f) => f.get('split') || undefined, { hitTolerance: 18 })
    const along = new PointerInteraction({
      handleDownEvent: (e) => {
        if (!onLine(e.pixel)) return false
        bend = latest.current.moves.pull(round(fm.point(e.coordinate)))
        return bend !== null
      },
      handleDragEvent: (e) => {
        if (bend !== null) latest.current.moves.movePoint(bend, round(fm.point(e.coordinate)), false)
      },
      handleUpEvent: () => {
        latest.current.moves.letGo()
        bend = null
        return false
      },
    })
    fm.map.addInteraction(along)
    const cursor = (e: { pixel: number[]; dragging: boolean }) => {
      if (!e.dragging) fm.map.getViewport().style.cursor = onLine(e.pixel) ? 'grab' : ''
    }
    fm.map.on('pointermove', cursor)
    return () => {
      fm.map.removeInteraction(along)
      fm.map.un('pointermove', cursor)
    }
  }, [fm, interactive])

  // A tap on a part goes to that part's crop.
  useEffect(() => {
    if (!onPickPart) return
    const pick = (e: { coordinate: number[] }) => {
      const p = fm.point(e.coordinate)
      const parts = latest.current.d.result?.parts
      const i = parts?.findIndex((part) => pointInPolygon(p, part)) ?? -1
      if (i === 0 || i === 1) latest.current.onPickPart?.(i)
    }
    fm.map.on('singleclick', pick)
    return () => fm.map.un('singleclick', pick)
  }, [fm, !!onPickPart]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
