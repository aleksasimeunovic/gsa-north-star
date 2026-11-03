import Feature from 'ol/Feature'
import Overlay from 'ol/Overlay'
import type Geometry from 'ol/geom/Geometry'
import LineString from 'ol/geom/LineString'
import OlPolygon from 'ol/geom/Polygon'
import PointerInteraction from 'ol/interaction/Pointer'
import { useEffect, useRef } from 'react'
import { split as copy } from '../../copy/en'
import type { Point } from '../../data/scenarios'
import { centroid, followsEdge, nearestOnLine, outlinePath, pointInPolygon } from '../../logic/geometry'
import { mapStyle } from '../../ui/mapStyles'
import { edgeOf, splitMoves, type Selected, type SplitDraft } from '../SplitTool'
import type { FarmMap } from './olFarm'

const round = (p: Point): Point => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 })
const same = (a: Selected, b: Selected) => !!a && !!b && a.on === b.on && a.i === b.i

/**
 * His field and the line across it on the satellite photo, with each part's size written on it. He pulls the
 * line, or his field's edge, anywhere and it bends there; every bend and corner is a small handle with a large
 * hit area, and arrow keys move whichever has focus. Dragging anywhere else moves the map. With Snap on, the
 * edges he can follow (the photo's, his field's as registered) show as dashed guides once he has left them.
 * While he works, the farmland registered around the field shows too: the edge can't go past it.
 */
export function SplitOnMap({ fm, d, interactive, labels, onPickPart }: { fm: FarmMap; d: SplitDraft; interactive: boolean; labels: [string, string]; onPickPart?: (i: 0 | 1) => void }) {
  const latest = useRef({ d, moves: splitMoves(d), onPickPart })
  latest.current = { d, moves: splitMoves(d), onPickPart }
  const handles = useRef<Overlay[]>([])
  const chips = useRef<Overlay[]>([])
  const r = d.result
  const line = d.draft.line
  const poly = d.field.polygon
  const record = d.record
  const key = JSON.stringify([line, poly])
  const shape = `${line.length}:${poly.length}`
  const edge = edgeOf(record)
  const lineGuide = interactive && d.snap && !followsEdge(line, edge)
  const fieldGuide = interactive && d.snap && !!d.draft.boundary

  // What's written on each part: two chips over the photo that never catch a press.
  useEffect(() => {
    chips.current = [0, 1].map(() => {
      const el = document.createElement('div')
      el.className = 'map-chip'
      const o = new Overlay({ element: el, positioning: 'center-center', stopEvent: false })
      fm.map.addOverlay(o)
      return o
    })
    fm.hideFocus(true)
    return () => {
      chips.current.forEach((o) => fm.map.removeOverlay(o))
      chips.current = []
      fm.hideFocus(false)
    }
  }, [fm])

  // The field and the line, redrawn as they move.
  useEffect(() => {
    fm.extra.clear()
    const add = (g: Geometry, role: Parameters<typeof mapStyle>[0], tag?: string) => {
      const f = new Feature<Geometry>(g)
      f.setStyle(mapStyle(role))
      if (tag) f.set(tag, true)
      fm.extra.addFeature(f)
    }
    if (interactive && record.land) add(new OlPolygon(fm.ring(record.land)), 'land')
    if (fieldGuide) add(new LineString(outlinePath(record.polygon).map(fm.coord)), 'guide')
    if (lineGuide) add(new LineString(edge.map(fm.coord)), 'guide')
    add(new LineString(outlinePath(poly).map(fm.coord)), 'field', 'outline')
    if (!r) return
    add(new LineString(line.map(fm.coord)), 'split', 'split')
    r.parts.forEach((part, i) => {
      const chip = chips.current[i]
      if (!chip) return
      chip.setPosition(fm.coord(centroid(part)))
      chip.getElement()!.textContent = labels[i]
    })
    handles.current.forEach((o) => {
      const sel = o.get('sel') as NonNullable<Selected>
      const p = sel.on === 'line' ? line[sel.i] : poly[sel.i]
      if (p) o.setPosition(fm.coord(p))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fm, key, labels[0], labels[1], !!r, lineGuide, fieldGuide, interactive])

  useEffect(() => () => fm.extra.clear(), [fm])

  // A handle for every bend, end and corner: real buttons on the map, so they take focus and arrow keys.
  useEffect(() => {
    if (!interactive) return
    const at = (e: PointerEvent) => round(fm.point(fm.map.getEventCoordinate(e)))
    const { d: cur } = latest.current
    const make = (sel: NonNullable<Selected>): Overlay => {
      const el = document.createElement('button')
      const count = cur.draft.line.length
      const end = sel.on === 'line' && (sel.i === 0 || sel.i === count - 1)
      el.type = 'button'
      el.className = 'map-handle'
      if (end) el.dataset.end = ''
      if (sel.on === 'field') el.dataset.corner = ''
      const name = sel.on === 'field' ? copy.cornerLabel(sel.i + 1) : sel.i === 0 ? copy.endStart : sel.i === count - 1 ? copy.endEnd : copy.bendLabel(sel.i)
      el.setAttribute('aria-label', `${name}. ${copy.keys}`)
      let dragging = false
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        el.setPointerCapture(e.pointerId)
        el.focus({ preventScroll: true })
        dragging = true
        el.dataset.dragging = ''
        latest.current.d.remember()
        latest.current.d.setSelected(sel)
      })
      el.addEventListener('pointermove', (e) => {
        if (dragging) latest.current.moves.movePoint(sel, at(e), false)
      })
      const stop = () => {
        if (dragging) latest.current.moves.letGo()
        dragging = false
        delete el.dataset.dragging
      }
      el.addEventListener('pointerup', stop)
      el.addEventListener('pointercancel', stop)
      el.addEventListener('focus', () => latest.current.d.setSelected(sel))
      el.addEventListener('keydown', (e) => {
        // Arrow keys move the point, not the map.
        if (latest.current.moves.nudge(sel, e.key, e.shiftKey)) {
          e.preventDefault()
          e.stopPropagation()
        }
      })
      const o = new Overlay({ element: el, positioning: 'center-center', stopEvent: true })
      o.set('sel', sel)
      fm.map.addOverlay(o)
      const p = sel.on === 'line' ? cur.draft.line[sel.i] : cur.field.polygon[sel.i]
      o.setPosition(fm.coord(p))
      return o
    }
    // Corners first, so the line's handles sit on top where they meet.
    handles.current = [
      ...cur.field.polygon.map((_, i) => make({ on: 'field', i })),
      ...cur.draft.line.map((_, i) => make({ on: 'line', i })),
    ]
    return () => {
      handles.current.forEach((o) => fm.map.removeOverlay(o))
      handles.current = []
    }
  }, [fm, interactive, shape])

  // The point he is working on looks selected.
  useEffect(() => {
    handles.current.forEach((o) => o.getElement()?.toggleAttribute('data-selected', same(o.get('sel'), d.selected)))
  }, [d.selected, shape])

  // Pulling the line or the field's edge: pressing anywhere on it makes a point there, or takes the one he pressed near.
  useEffect(() => {
    if (!interactive) return
    let sel: Selected = null
    const hit = (pixel: number[]): 'split' | 'outline' | null =>
      fm.map.forEachFeatureAtPixel(pixel, (f) => (f.get('split') ? 'split' : f.get('outline') ? 'outline' : undefined), { hitTolerance: 12 }) ?? null
    const along = new PointerInteraction({
      handleDownEvent: (e) => {
        const what = hit(e.pixel)
        if (!what) return false
        const p = round(fm.point(e.coordinate))
        sel = what === 'split' ? latest.current.moves.pull(p) : latest.current.moves.pullEdge(p)
        ghost.setPosition(undefined)
        // A press on the line or the edge never moves the map.
        return true
      },
      handleDragEvent: (e) => {
        if (sel) latest.current.moves.movePoint(sel, round(fm.point(e.coordinate)), false)
      },
      handleUpEvent: () => {
        latest.current.moves.letGo()
        sel = null
        return false
      },
    })
    fm.map.addInteraction(along)
    // A small dot follows the pointer along the line and the edge, to show they can be pulled from anywhere.
    const dot = document.createElement('div')
    dot.className = 'map-ghost'
    const ghost = new Overlay({ element: dot, positioning: 'center-center', stopEvent: false })
    fm.map.addOverlay(ghost)
    const hover = (e: { pixel: number[]; coordinate: number[]; dragging: boolean }) => {
      if (e.dragging) return
      const what = hit(e.pixel)
      fm.map.getViewport().style.cursor = what ? 'grab' : ''
      const cur = latest.current.d
      const path = what === 'split' ? cur.draft.line : what === 'outline' ? outlinePath(cur.field.polygon) : null
      ghost.setPosition(path ? fm.coord(nearestOnLine(path, fm.point(e.coordinate))) : undefined)
    }
    fm.map.on('pointermove', hover)
    return () => {
      fm.map.removeInteraction(along)
      fm.map.removeOverlay(ghost)
      fm.map.un('pointermove', hover)
      fm.map.getViewport().style.cursor = ''
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
