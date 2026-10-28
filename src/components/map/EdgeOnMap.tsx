import Feature from 'ol/Feature'
import Overlay from 'ol/Overlay'
import type Geometry from 'ol/geom/Geometry'
import LineString from 'ol/geom/LineString'
import OlPoint from 'ol/geom/Point'
import OlPolygon from 'ol/geom/Polygon'
import { useEffect, useRef } from 'react'
import { draw as copy, en, formatHa } from '../../copy/en'
import type { Field } from '../../data/scenarios'
import { bounds, centroid } from '../../logic/geometry'
import { labelStyle, mapStyle } from '../../ui/mapStyles'
import type { EdgeDraft } from '../EdgeTool'
import type { FarmMap } from './olFarm'

/**
 * The field's edge on the satellite photo as one line with one large handle. Dragging the handle (or the
 * arrow keys on it) moves the whole edge; dragging anywhere else moves the map. No point placement.
 */
export function EdgeOnMap({ fm, field, d }: { fm: FarmMap; field: Field; d: EdgeDraft }) {
  const latest = useRef(d)
  latest.current = d
  const grip = useRef<Overlay | null>(null)
  const b = bounds(field.polygon)
  const mid = (y: number) => fm.coord({ x: (b.minX + b.maxX) / 2, y })

  useEffect(() => {
    fm.extra.clear()
    const shape = new Feature<Geometry>(new OlPolygon(fm.ring(d.polygon)))
    shape.setStyle(mapStyle('mine'))
    const edge = new Feature<Geometry>(new LineString([fm.coord({ x: b.minX, y: d.y }), fm.coord({ x: b.maxX, y: d.y })]))
    edge.setStyle(mapStyle('split'))
    const label = new Feature<Geometry>(new OlPoint(fm.coord(centroid(d.polygon))))
    label.setStyle(labelStyle(`${en.fields[field.id]} ${formatHa(d.areaHa)}`, { size: 17 }))
    fm.extra.addFeatures([shape, edge, label])
    grip.current?.setPosition(mid(d.y))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fm, d.y])

  useEffect(() => {
    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'map-grip'
    el.setAttribute('aria-label', `${copy.moveEdge}. ${copy.keys}`)
    el.innerHTML = '<span aria-hidden="true">↕</span>'
    let from: { y: number; at: number } | null = null
    const yAt = (e: PointerEvent) => fm.point(fm.map.getEventCoordinate(e)).y
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      el.setPointerCapture(e.pointerId)
      el.focus({ preventScroll: true })
      from = { y: latest.current.y, at: yAt(e) }
      latest.current.remember()
    })
    el.addEventListener('pointermove', (e) => {
      if (from) latest.current.move(from.y + yAt(e) - from.at, false)
    })
    const end = () => (from = null)
    el.addEventListener('pointerup', end)
    el.addEventListener('pointercancel', end)
    el.addEventListener('keydown', (e) => {
      const step = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0
      if (!step) return
      e.preventDefault()
      e.stopPropagation()
      latest.current.move(latest.current.y + step * (e.shiftKey ? 5 : 1))
    })
    const o = new Overlay({ element: el, positioning: 'center-center', stopEvent: true })
    fm.map.addOverlay(o)
    grip.current = o
    o.setPosition(mid(latest.current.y))
    return () => {
      fm.map.removeOverlay(o)
      grip.current = null
      fm.extra.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fm])

  return null
}
