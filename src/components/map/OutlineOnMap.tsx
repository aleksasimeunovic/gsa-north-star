import Feature from 'ol/Feature'
import Overlay from 'ol/Overlay'
import type Geometry from 'ol/geom/Geometry'
import OlPoint from 'ol/geom/Point'
import OlPolygon from 'ol/geom/Polygon'
import { useEffect, useRef } from 'react'
import { fieldEdit as copy, formatHa } from '../../copy/en'
import type { Polygon } from '../../data/scenarios'
import { bounds, centroid, type Side } from '../../logic/geometry'
import { labelStyle, mapStyle } from '../../ui/mapStyles'
import type { OutlineDraft } from '../NewField'
import type { FarmMap } from './olFarm'

const SIDES: Side[] = ['top', 'right', 'bottom', 'left']

/**
 * The outline GSA proposed, on the satellite photo, with one large handle in the middle of each side.
 * Dragging a handle (or the arrow keys on it) moves that whole side; dragging anywhere else moves the map.
 * The registered farmland it sits on is drawn underneath, so when a side stops he sees why. No point placement.
 */
export function OutlineOnMap({ fm, d, label }: { fm: FarmMap; d: OutlineDraft; label: string }) {
  const latest = useRef(d)
  latest.current = d
  const grips = useRef<Partial<Record<Side, Overlay>>>({})

  const mid = (poly: Polygon, side: Side) => {
    const b = bounds(poly)
    const x = side === 'left' ? b.minX : side === 'right' ? b.maxX : (b.minX + b.maxX) / 2
    const y = side === 'top' ? b.minY : side === 'bottom' ? b.maxY : (b.minY + b.maxY) / 2
    return fm.coord({ x, y })
  }

  useEffect(() => {
    fm.extra.clear()
    // The registered farmland itself is the map's place in question, drawn underneath.
    const shape = new Feature<Geometry>(new OlPolygon(fm.ring(d.polygon)))
    shape.setStyle(mapStyle('mine'))
    const name = new Feature<Geometry>(new OlPoint(fm.coord(centroid(d.polygon))))
    name.setStyle(labelStyle(`${label} ${formatHa(d.areaHa)}`, { size: 16 }))
    fm.extra.addFeatures([shape, name])
    for (const side of SIDES) grips.current[side]?.setPosition(mid(d.polygon, side))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fm, d.polygon, label])

  useEffect(() => {
    const made: Overlay[] = []
    for (const side of SIDES) {
      const across = side === 'left' || side === 'right'
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'map-grip'
      el.setAttribute('aria-label', `${copy.sides[side]}. ${copy.keys}`)
      el.innerHTML = `<span aria-hidden="true">${across ? '↔' : '↕'}</span>`
      let from: { value: number; at: number } | null = null
      const at = (e: PointerEvent) => {
        const p = fm.point(fm.map.getEventCoordinate(e))
        return across ? p.x : p.y
      }
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        el.setPointerCapture(e.pointerId)
        el.focus({ preventScroll: true })
        from = { value: latest.current.sideAt(side), at: at(e) }
        latest.current.remember()
      })
      el.addEventListener('pointermove', (e) => {
        if (from) latest.current.move(side, from.value + at(e) - from.at, false)
      })
      const end = () => (from = null)
      el.addEventListener('pointerup', end)
      el.addEventListener('pointercancel', end)
      el.addEventListener('keydown', (e) => {
        const keys: Record<string, number> = across ? { ArrowLeft: -1, ArrowRight: 1 } : { ArrowUp: -1, ArrowDown: 1 }
        const step = keys[e.key]
        if (!step) return
        e.preventDefault()
        e.stopPropagation()
        latest.current.move(side, latest.current.sideAt(side) + step * (e.shiftKey ? 5 : 1))
      })
      const o = new Overlay({ element: el, positioning: 'center-center', stopEvent: true })
      fm.map.addOverlay(o)
      o.setPosition(mid(latest.current.polygon, side))
      grips.current[side] = o
      made.push(o)
    }
    return () => {
      made.forEach((o) => fm.map.removeOverlay(o))
      grips.current = {}
      fm.extra.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fm])

  return null
}
