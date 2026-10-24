import Feature from 'ol/Feature'
import Overlay from 'ol/Overlay'
import type Geometry from 'ol/geom/Geometry'
import LineString from 'ol/geom/LineString'
import OlPoint from 'ol/geom/Point'
import PointerInteraction from 'ol/interaction/Pointer'
import { useEffect, useRef } from 'react'
import { formatHa, split as copy } from '../../copy/en'
import type { Field, Point } from '../../data/scenarios'
import { centroid } from '../../logic/geometry'
import { labelStyle, mapStyle } from '../../ui/mapStyles'
import { splitMoves, type SplitDraft } from '../SplitTool'
import type { FarmMap } from './olFarm'

type Grab = 0 | 1 | 'line'
const round = (p: Point): Point => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 })

/**
 * The split line on the satellite photo, with the area of each part. He drags the whole line by its grip
 * or anywhere along it, or tilts it by a large end handle; arrow keys move whatever has focus.
 * Dragging anywhere else moves the map.
 */
export function SplitOnMap({ fm, field, d, interactive }: { fm: FarmMap; field: Field; d: SplitDraft; interactive: boolean }) {
  const latest = useRef({ d, moves: splitMoves(field, d) })
  latest.current = { d, moves: splitMoves(field, d) }
  const handles = useRef<Record<Grab, Overlay> | null>(null)
  const r = d.result
  const key = JSON.stringify(d.draft.line)

  // The line and the area of each part, redrawn as it moves.
  useEffect(() => {
    fm.extra.clear()
    if (!r) return
    const line = new Feature<Geometry>(new LineString(r.chord.map(fm.coord)))
    line.setStyle(mapStyle('split'))
    line.set('split', true)
    fm.extra.addFeature(line)
    r.parts.forEach((part, i) => {
      const f = new Feature<Geometry>(new OlPoint(fm.coord(centroid(part))))
      f.setStyle(labelStyle(formatHa(r.areasHa[i]), { size: 17 }))
      fm.extra.addFeature(f)
    })
    const h = handles.current
    if (h) {
      h[0].setPosition(fm.coord(d.draft.line[0]))
      h[1].setPosition(fm.coord(d.draft.line[1]))
      h.line.setPosition(fm.coord({ x: (r.chord[0].x + r.chord[1].x) / 2, y: (r.chord[0].y + r.chord[1].y) / 2 }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fm, key, !!r])

  useEffect(() => () => fm.extra.clear(), [fm])

  // Grip and end handles: real buttons on the map, so they take focus and arrow keys.
  useEffect(() => {
    if (!interactive) return
    const at = (e: PointerEvent) => round(fm.point(fm.map.getEventCoordinate(e)))
    const make = (what: Grab): Overlay => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = what === 'line' ? 'map-grip' : 'map-handle'
      el.setAttribute('aria-label', `${what === 'line' ? copy.moveLine : what === 0 ? copy.handleStart : copy.handleEnd}. ${copy.keys}`)
      if (what === 'line') el.innerHTML = '<span aria-hidden="true">↕</span>'
      let drag: { from: Point; line: [Point, Point] } | null = null
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        el.setPointerCapture(e.pointerId)
        el.focus({ preventScroll: true })
        drag = { from: at(e), line: latest.current.d.draft.line }
        latest.current.d.remember()
      })
      el.addEventListener('pointermove', (e) => {
        if (!drag) return
        const p = at(e)
        const { moves } = latest.current
        if (what === 'line') moves.moveLine(drag.line, p.x - drag.from.x, p.y - drag.from.y, false)
        else moves.moveEnd(what, p, false)
      })
      const end = () => (drag = null)
      el.addEventListener('pointerup', end)
      el.addEventListener('pointercancel', end)
      el.addEventListener('keydown', (e) => {
        // Arrow keys move the line, not the map.
        if (latest.current.moves.nudge(what, e.key, e.shiftKey)) {
          e.preventDefault()
          e.stopPropagation()
        }
      })
      const o = new Overlay({ element: el, positioning: 'center-center', stopEvent: true })
      fm.map.addOverlay(o)
      return o
    }
    const h = { 0: make(0), 1: make(1), line: make('line') }
    handles.current = h
    const { d: now } = latest.current
    h[0].setPosition(fm.coord(now.draft.line[0]))
    h[1].setPosition(fm.coord(now.draft.line[1]))
    if (now.result) {
      const c = now.result.chord
      h.line.setPosition(fm.coord({ x: (c[0].x + c[1].x) / 2, y: (c[0].y + c[1].y) / 2 }))
    }

    // Dragging anywhere along the line moves it too.
    let drag: { from: Point; line: [Point, Point] } | null = null
    const onLine = (pixel: number[]) => !!fm.map.forEachFeatureAtPixel(pixel, (f) => f.get('split') || undefined, { hitTolerance: 16 })
    const along = new PointerInteraction({
      handleDownEvent: (e) => {
        if (!onLine(e.pixel)) return false
        drag = { from: round(fm.point(e.coordinate)), line: latest.current.d.draft.line }
        latest.current.d.remember()
        return true
      },
      handleDragEvent: (e) => {
        if (!drag) return
        const p = round(fm.point(e.coordinate))
        latest.current.moves.moveLine(drag.line, p.x - drag.from.x, p.y - drag.from.y, false)
      },
      handleUpEvent: () => {
        drag = null
        return false
      },
    })
    fm.map.addInteraction(along)
    const cursor = (e: { pixel: number[]; dragging: boolean }) => {
      if (!e.dragging) fm.map.getViewport().style.cursor = onLine(e.pixel) ? 'grab' : ''
    }
    fm.map.on('pointermove', cursor)

    return () => {
      Object.values(h).forEach((o) => fm.map.removeOverlay(o))
      handles.current = null
      fm.map.removeInteraction(along)
      fm.map.un('pointermove', cursor)
    }
  }, [fm, interactive])

  return null
}
