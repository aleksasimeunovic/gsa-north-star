import Feature from 'ol/Feature'
import Overlay from 'ol/Overlay'
import type Geometry from 'ol/geom/Geometry'
import OlPolygon from 'ol/geom/Polygon'
import DragPan from 'ol/interaction/DragPan'
import PointerInteraction from 'ol/interaction/Pointer'
import type MapBrowserEvent from 'ol/MapBrowserEvent'
import { boundingExtent } from 'ol/extent'
import { useEffect, useRef } from 'react'
import { fieldEdit, formatHa } from '../../copy/en'
import type { Point, Polygon } from '../../data/scenarios'
import { bounds, nearestOnLine, outlinePath, pointInPolygon } from '../../logic/geometry'
import { mapStyle } from '../../ui/mapStyles'
import type { YardDraft } from '../YardTool'
import { createLoupe } from './loupe'
import type { FarmMap } from './olFarm'

const round = (p: Point): Point => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 })
const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * The house and yard he leaves out of his field, hatched on the photo with its size beside it. While he edits:
 * a handle on every corner (arrow keys, Delete), the edge pulls from anywhere, and a press inside the yard drags
 * it whole. On touch, one finger only ever moves the yard; two fingers move the map.
 */
export function YardOnMap({ fm, d, interactive, settled }: { fm: FarmMap; d: YardDraft; interactive: boolean; settled?: boolean }) {
  const latest = useRef(d)
  latest.current = d
  const handles = useRef<Overlay[]>([])
  const chip = useRef<Overlay | null>(null)
  const yard = d.yard
  const key = JSON.stringify(yard)
  const shape = yard.length

  // Its size, written just under it, never catching a press.
  useEffect(() => {
    const el = document.createElement('div')
    el.className = 'map-chip'
    const o = new Overlay({ element: el, positioning: 'center-center', stopEvent: false })
    fm.map.addOverlay(o)
    chip.current = o
    return () => {
      fm.map.removeOverlay(o)
      chip.current = null
    }
  }, [fm])

  useEffect(() => {
    fm.extra.clear()
    const f = new Feature<Geometry>(new OlPolygon(fm.ring(yard)))
    // GSA's guess is a light veil, like any flag; once he works on it or confirms it, it is hatched: land that doesn't count.
    f.setStyle(mapStyle(interactive || settled ? 'strip' : 'flag'))
    f.set('yard', true)
    fm.extra.addFeature(f)
    const b = bounds(yard)
    chip.current?.setPosition(fm.coord({ x: (b.minX + b.maxX) / 2, y: b.minY - 7 }))
    const el = chip.current?.getElement()
    if (el) el.textContent = fieldEdit.yard.label(formatHa(d.yardHa))
    handles.current.forEach((o) => {
      const p = yard[o.get('i') as number]
      if (p) o.setPosition(fm.coord(p))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fm, key, interactive, settled])
  useEffect(() => () => fm.extra.clear(), [fm])

  // A yard is small: editing it starts close up, so the corners are far enough apart for a finger.
  useEffect(() => {
    if (!interactive) return
    const ext = boundingExtent(latest.current.yard.map(fm.coord))
    const [w = 0, h = 0] = fm.map.getSize() ?? []
    const pad = Math.round(Math.min(w, h) * 0.22)
    // The tools float over the bottom of the map, so the yard sits a little higher.
    fm.map.getView().fit(ext, { padding: [pad, pad, pad + 60, pad], maxZoom: 19, duration: reduced() ? 0 : 400 })
    // Done editing: back to the whole field.
    return () => fm.fitHome(!reduced())
  }, [fm, interactive])

  const loupe = useRef<ReturnType<typeof createLoupe> | null>(null)
  useEffect(() => {
    if (!interactive) return
    const l = createLoupe(fm.map, () => {
      const cur = latest.current
      const p = cur.selected !== null ? cur.yard[cur.selected] : null
      return p ? fm.map.getPixelFromCoordinate(fm.coord(p)) : null
    })
    loupe.current = l
    return () => {
      l.destroy()
      loupe.current = null
    }
  }, [fm, interactive])
  const fingerAt = (e: PointerEvent) => {
    const r = fm.map.getViewport().getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  // A handle on every corner: real buttons on the map, so they take focus and arrow keys.
  useEffect(() => {
    if (!interactive) return
    const at = (e: PointerEvent) => round(fm.point(fm.map.getEventCoordinate(e)))
    handles.current = latest.current.yard.map((p, i) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'map-handle'
      el.dataset.corner = ''
      el.setAttribute('aria-label', `${fieldEdit.yard.corner(i + 1)}. ${fieldEdit.yard.keys}`)
      let dragging = false
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        el.setPointerCapture(e.pointerId)
        el.focus({ preventScroll: true })
        dragging = true
        el.dataset.dragging = ''
        latest.current.remember()
        latest.current.setSelected(i)
      })
      el.addEventListener('pointermove', (e) => {
        if (!dragging) return
        latest.current.moves.move(i, at(e))
        if (e.pointerType === 'touch') loupe.current?.show(fingerAt(e))
      })
      const stop = () => {
        loupe.current?.hide()
        if (dragging) latest.current.moves.letGo(i)
        dragging = false
        delete el.dataset.dragging
      }
      el.addEventListener('pointerup', stop)
      el.addEventListener('pointercancel', stop)
      el.addEventListener('focus', () => latest.current.setSelected(i))
      el.addEventListener('keydown', (e) => {
        if (latest.current.moves.nudge(i, e.key, e.shiftKey)) {
          e.preventDefault()
          e.stopPropagation()
        }
      })
      const o = new Overlay({ element: el, positioning: 'center-center', stopEvent: true })
      o.set('i', i)
      fm.map.addOverlay(o)
      o.setPosition(fm.coord(p))
      return o
    })
    return () => {
      handles.current.forEach((o) => fm.map.removeOverlay(o))
      handles.current = []
    }
  }, [fm, interactive, shape])

  useEffect(() => {
    handles.current.forEach((o) => o.getElement()?.toggleAttribute('data-selected', o.get('i') === d.selected))
  }, [d.selected, shape])

  // Pulling the edge from anywhere, or dragging the whole yard from inside it.
  useEffect(() => {
    if (!interactive) return
    let corner: number | null = null
    let whole: { from: Polygon; at: Point } | null = null
    const onEdge = (pixel: number[], touch: boolean) =>
      !!fm.map.forEachFeatureAtPixel(pixel, (f) => (f.get('yard') ? true : undefined), { hitTolerance: touch ? 24 : 12 }) &&
      !pointInPolygon(fm.point(fm.map.getCoordinateFromPixel(pixel)), shrink(latest.current.yard))
    const along = new PointerInteraction({
      handleDownEvent: (e) => {
        const touch = (e.originalEvent as PointerEvent).pointerType === 'touch'
        const p = round(fm.point(e.coordinate))
        if (onEdge(e.pixel, touch)) {
          corner = latest.current.moves.pull(p)
          ghost.setPosition(undefined)
          return true
        }
        if (pointInPolygon(p, latest.current.yard)) {
          latest.current.remember()
          whole = { from: latest.current.yard, at: p }
          return true
        }
        return false
      },
      handleDragEvent: (e) => {
        const p = round(fm.point(e.coordinate))
        if (corner !== null) latest.current.moves.move(corner, p)
        else if (whole) latest.current.moves.shift(whole.from, { x: p.x - whole.at.x, y: p.y - whole.at.y })
        const pe = e.originalEvent as PointerEvent
        if (corner !== null && pe.pointerType === 'touch') loupe.current?.show(fingerAt(pe))
      },
      handleUpEvent: () => {
        loupe.current?.hide()
        latest.current.moves.letGo(corner)
        corner = null
        whole = null
        return false
      },
    })
    fm.map.addInteraction(along)
    // A dot follows the pointer along the edge, to show it can be pulled from anywhere.
    const dot = document.createElement('div')
    dot.className = 'map-ghost'
    const ghost = new Overlay({ element: dot, positioning: 'center-center', stopEvent: false })
    fm.map.addOverlay(ghost)
    const hover = (e: { pixel: number[]; coordinate: number[]; dragging: boolean }) => {
      if (e.dragging) return
      const edge = onEdge(e.pixel, false)
      const inside = !edge && pointInPolygon(fm.point(e.coordinate), latest.current.yard)
      fm.map.getViewport().style.cursor = edge ? 'grab' : inside ? 'move' : ''
      ghost.setPosition(edge ? fm.coord(nearestOnLine(outlinePath(latest.current.yard), fm.point(e.coordinate))) : undefined)
    }
    fm.map.on('pointermove', hover)
    return () => {
      fm.map.removeInteraction(along)
      fm.map.removeOverlay(ghost)
      fm.map.un('pointermove', hover)
      fm.map.getViewport().style.cursor = ''
    }
  }, [fm, interactive])

  // On touch, one finger moves the yard and two move the map; a mouse drags the map as usual.
  useEffect(() => {
    if (!interactive) return
    const pans = fm.map.getInteractions().getArray().filter((i): i is DragPan => i instanceof DragPan)
    pans.forEach((p) => p.setActive(false))
    const twoFingers: DragPan = new DragPan({
      condition: (e: MapBrowserEvent) =>
        (e.originalEvent as PointerEvent).pointerType !== 'touch' || (twoFingers as unknown as { getPointerCount: () => number }).getPointerCount() === 2,
    })
    fm.map.addInteraction(twoFingers)
    return () => {
      fm.map.removeInteraction(twoFingers)
      pans.forEach((p) => p.setActive(true))
    }
  }, [fm, interactive])

  return null
}

/** The yard pulled in a little towards its middle, so a press just inside the edge still takes the edge. */
function shrink(poly: Polygon): Polygon {
  const c = poly.reduce((s, p) => ({ x: s.x + p.x / poly.length, y: s.y + p.y / poly.length }), { x: 0, y: 0 })
  return poly.map((p) => ({ x: c.x + (p.x - c.x) * 0.8, y: c.y + (p.y - c.y) * 0.8 }))
}
