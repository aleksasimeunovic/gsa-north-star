import Feature from 'ol/Feature'
import Overlay from 'ol/Overlay'
import type Geometry from 'ol/geom/Geometry'
import LineString from 'ol/geom/LineString'
import OlPolygon from 'ol/geom/Polygon'
import PointerInteraction from 'ol/interaction/Pointer'
import DragPan from 'ol/interaction/DragPan'
import type MapBrowserEvent from 'ol/MapBrowserEvent'
import { useEffect, useRef } from 'react'
import { split as copy } from '../../copy/en'
import type { Point } from '../../data/scenarios'
import { centroid, followsEdge, nearestOnLine, outlinePath, pointInPolygon } from '../../logic/geometry'
import { mapStyle } from '../../ui/mapStyles'
import { edgeOf, splitMoves, type Selected, type SplitDraft } from '../SplitTool'
import { createLoupe } from './loupe'
import { outsideStyle, type FarmMap } from './olFarm'

/** Grows a line from its start to its end over a moment, along its own length. */
function drawIn(f: Feature<Geometry>, coords: number[][], ms = 700) {
  const lengths = coords.slice(1).map((c, i) => Math.hypot(c[0] - coords[i][0], c[1] - coords[i][1]))
  const total = lengths.reduce((a, b) => a + b, 0)
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / ms)
    const eased = 1 - Math.pow(1 - t, 3)
    let left = total * eased
    const out = [coords[0]]
    for (let i = 0; i < lengths.length && left > 0; i++) {
      const k = Math.min(1, left / (lengths[i] || 1))
      out.push([coords[i][0] + (coords[i + 1][0] - coords[i][0]) * k, coords[i][1] + (coords[i + 1][1] - coords[i][1]) * k])
      left -= lengths[i]
    }
    // Only while the feature still shows this line: a redraw replaces it.
    const g = f.getGeometry()
    if (g instanceof LineString) g.setCoordinates(out.length > 1 ? out : [coords[0], coords[0]])
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

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
  // The dot that follows the pointer along the line; it goes while the pointer is on a handle.
  const ghostRef = useRef<Overlay | null>(null)
  const drawnIn = useRef(false)
  const litRef = useRef<Feature<Geometry> | null>(null)
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
  const showLand = d.selected?.on === 'field' || d.pastLand

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
      return f
    }
    // The registered farmland only when it matters: while he works on his field's edge, or once it goes past it.
    if (interactive && record.land && showLand) add(new OlPolygon(fm.ring(record.land)), 'land')
    if (fieldGuide) add(new LineString(outlinePath(record.polygon).map(fm.coord)), 'guide')
    if (lineGuide) add(new LineString(edge.map(fm.coord)), 'guide')
    // Past the registered farmland, the land outside it is veiled orange: look at this, the registry checks it.
    if (d.pastLand && record.land) {
      const land = record.land.map(fm.coord)
      const veil = new Feature<Geometry>(new OlPolygon(fm.ring(poly)))
      veil.setStyle(outsideStyle(fm.map, land))
      fm.extra.addFeature(veil)
    }
    add(new LineString(outlinePath(poly).map(fm.coord)), 'field', 'outline')
    if (!r) return
    const splitLine = add(new LineString(line.map(fm.coord)), 'split', 'split')
    // The first time GSA's line appears, it draws itself along the edge, so he sees it is a proposal being made.
    if (!drawnIn.current) {
      drawnIn.current = true
      if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) drawIn(splitLine, line.map(fm.coord))
    }
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
  }, [fm, key, labels[0], labels[1], !!r, lineGuide, fieldGuide, interactive, showLand, d.pastLand])

  useEffect(() => () => fm.extra.clear(), [fm])

  // The loupe, for a finger that covers the point it drags.
  const loupe = useRef<ReturnType<typeof createLoupe> | null>(null)
  useEffect(() => {
    if (!interactive) return
    const l = createLoupe(fm.map, () => {
      const { d: cur } = latest.current
      const sel = cur.selected
      const p = sel && (sel.on === 'line' ? cur.draft.line[sel.i] : cur.field.polygon[sel.i])
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
      // What this handle does, said beside it when a mouse rests on it, until he has dragged one.
      const tip = document.createElement('span')
      tip.className = 'map-tip'
      tip.setAttribute('aria-hidden', 'true')
      tip.textContent = sel.on === 'field' ? copy.tips.corner : end ? copy.tips.end : copy.tips.bend
      el.appendChild(tip)
      let dragging = false
      el.addEventListener('pointerenter', () => ghostRef.current?.setPosition(undefined))
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        ghostRef.current?.setPosition(undefined)
        el.setPointerCapture(e.pointerId)
        el.focus({ preventScroll: true })
        dragging = true
        fm.map.getViewport().dataset.dragged = ''
        el.dataset.dragging = ''
        latest.current.d.remember()
        latest.current.d.setSelected(sel)
      })
      el.addEventListener('pointermove', (e) => {
        if (!dragging) return
        latest.current.moves.movePoint(sel, at(e), false)
        loupe.current?.show(fingerAt(e), e.pointerType === 'touch')
      })
      const stop = () => {
        loupe.current?.hide()
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
    handles.current.forEach((o) => {
      const el = o.getElement()
      const sel = same(o.get('sel'), d.selected)
      el?.toggleAttribute('data-selected', sel)
      // The point he moves pulses once when it joins an edge.
      el?.toggleAttribute('data-snapped', sel && d.snapped && d.snap)
    })
  }, [d.selected, d.snapped, d.snap, shape])

  // Pulling the line or the field's edge: pressing anywhere on it makes a point there, or takes the one he pressed near.
  useEffect(() => {
    if (!interactive) return
    let sel: Selected = null
    // A finger is wider than a mouse, so a press near the line takes the line rather than moving the map.
    const hit = (pixel: number[], touch = false): 'split' | 'outline' | null =>
      fm.map.forEachFeatureAtPixel(pixel, (f) => (f.get('split') ? 'split' : f.get('outline') ? 'outline' : undefined), { hitTolerance: touch ? 24 : 12 }) ?? null
    const along = new PointerInteraction({
      handleDownEvent: (e) => {
        const what = hit(e.pixel, (e.originalEvent as PointerEvent).pointerType === 'touch')
        if (!what) return false
        const p = round(fm.point(e.coordinate))
        sel = what === 'split' ? latest.current.moves.pull(p) : latest.current.moves.pullEdge(p)
        pulled[what] = true
        ghost.setPosition(undefined)
        // A press on the line or the edge never moves the map.
        return true
      },
      handleDragEvent: (e) => {
        if (!sel) return
        latest.current.moves.movePoint(sel, round(fm.point(e.coordinate)), false)
        const pe = e.originalEvent as PointerEvent
        loupe.current?.show(fingerAt(pe), pe.pointerType === 'touch')
      },
      handleUpEvent: () => {
        loupe.current?.hide()
        latest.current.moves.letGo()
        sel = null
        return false
      },
    })
    fm.map.addInteraction(along)
    // A small dot follows the pointer along the line and the edge, to show they can be pulled from anywhere.
    const dot = document.createElement('div')
    dot.className = 'map-ghost'
    // Beside the dot, what a press here does, until he has done it once.
    const tip = document.createElement('span')
    tip.className = 'map-tip'
    dot.appendChild(tip)
    const pulled = { split: false, outline: false }
    const ghost = new Overlay({ element: dot, positioning: 'center-center', stopEvent: false })
    fm.map.addOverlay(ghost)
    ghostRef.current = ghost
    const hover = (e: { pixel: number[]; coordinate: number[]; dragging: boolean }) => {
      if (e.dragging) return
      const what = hit(e.pixel)
      fm.map.getViewport().style.cursor = what ? 'grab' : ''
      const cur = latest.current.d
      const path = what === 'split' ? cur.draft.line : what === 'outline' ? outlinePath(cur.field.polygon) : null
      if (what) {
        tip.textContent = what === 'split' ? copy.tips.line : copy.tips.edge
        tip.hidden = pulled[what]
      }
      ghost.setPosition(path ? fm.coord(nearestOnLine(path, fm.point(e.coordinate))) : undefined)
    }
    fm.map.on('pointermove', hover)
    return () => {
      fm.map.removeInteraction(along)
      fm.map.removeOverlay(ghost)
      ghostRef.current = null
      fm.map.un('pointermove', hover)
      fm.map.getViewport().style.cursor = ''
      delete fm.map.getViewport().dataset.dragged
    }
  }, [fm, interactive])

  // While he edits on a touch screen, one finger only ever moves the line or the edge, and two fingers move the
  // map, so a press that misses the line can't move the map by accident. A mouse drags the map as usual.
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

  // A part the panel says is wrong is red on the map, the whole part, so he sees which one.
  const faultyRef = useRef<Feature<Geometry>[]>([])
  const faultyKey = `${d.faulty.join()}|${key}`
  useEffect(() => {
    faultyRef.current.forEach((f) => fm.extra.hasFeature(f) && fm.extra.removeFeature(f))
    faultyRef.current = d.faulty.flatMap((i) => {
      const part = r?.parts[i]
      if (!part) return []
      const f = new Feature<Geometry>(new OlPolygon(fm.ring(part)))
      f.setStyle(mapStyle('error'))
      fm.extra.addFeature(f)
      return [f]
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fm, faultyKey])

  // The part the panel points at (the crop he is choosing) lights up too.
  useEffect(() => {
    const part = d.lit !== null ? d.result?.parts[d.lit] : undefined
    litRef.current?.setGeometry(part ? new OlPolygon(fm.ring(part)) : undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.lit, fm])

  // A tap on a part goes to that part's crop: the part under the pointer lights up, so he sees it can be tapped.
  useEffect(() => {
    if (!onPickPart) return
    const lit = new Feature<Geometry>()
    lit.setStyle(mapStyle('hover'))
    fm.extra.addFeature(lit)
    litRef.current = lit
    const light = (e: { coordinate: number[]; dragging: boolean }) => {
      if (e.dragging) return
      const p = fm.point(e.coordinate)
      const part = latest.current.d.result?.parts.find((q) => pointInPolygon(p, q))
      lit.setGeometry(part ? new OlPolygon(fm.ring(part)) : undefined)
      fm.map.getViewport().style.cursor = part ? 'pointer' : ''
    }
    fm.map.on('pointermove', light)
    const offLight = () => {
      litRef.current = null
      fm.map.un('pointermove', light)
      if (fm.extra.hasFeature(lit)) fm.extra.removeFeature(lit)
      fm.map.getViewport().style.cursor = ''
    }
    const pick = (e: { coordinate: number[] }) => {
      const p = fm.point(e.coordinate)
      const parts = latest.current.d.result?.parts
      const i = parts?.findIndex((part) => pointInPolygon(p, part)) ?? -1
      if (i === 0 || i === 1) latest.current.onPickPart?.(i)
    }
    fm.map.on('singleclick', pick)
    return () => {
      fm.map.un('singleclick', pick)
      offLight()
    }
  }, [fm, !!onPickPart]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
