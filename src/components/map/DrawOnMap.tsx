import Feature from 'ol/Feature'
import Overlay from 'ol/Overlay'
import DoubleClickZoom from 'ol/interaction/DoubleClickZoom'
import type Geometry from 'ol/geom/Geometry'
import LineString from 'ol/geom/LineString'
import OlPolygon from 'ol/geom/Polygon'
import { Style } from 'ol/style'
import { useEffect, useRef, useState } from 'react'
import { drawField as t, formatHa } from '../../copy/en'
import type { Point, Polygon } from '../../data/scenarios'
import { edgeM, midpoints, overlaps } from '../../logic/drawing'
import { centroid } from '../../logic/geometry'
import { drawStyle, overlapColour } from '../../ui/mapStyles'
import type { FieldDraw } from '../DrawTool'
import { createLoupe } from './loupe'
import type { FarmMap } from './olFarm'

const round = (p: Point): Point => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 })
/** An edge shorter than this has no room for its length on the photo. */
const LABEL_MIN_M = 25

/**
 * The field he draws, on the photo. While drawing: a cross where the next corner goes (the middle of the map,
 * or the mouse pointer), a dashed line to it from his last corner and back to his first, the live area inside
 * and the length of every edge. Every corner has a handle, and so has the middle of every edge: pulling that
 * one adds a corner there. Handles catch the press, so one finger elsewhere still moves the map.
 */
export function DrawOnMap({ fm, d, fields }: { fm: FarmMap; d: FieldDraw; fields: Polygon[] }) {
  const latest = useRef(d)
  latest.current = d
  const chips = useRef<Overlay[]>([])
  const crossEl = useRef<Overlay | null>(null)
  const handles = useRef<Overlay[]>([])
  const key = JSON.stringify([d.corners, d.closed, d.cross, d.mark])

  // Where the next corner would go: the middle of the map, unless a mouse is over it.
  useEffect(() => {
    let mouse: number[] | null = null
    const centre = () => {
      const [w = 0, h = 0] = fm.map.getSize() ?? []
      return [w / 2, h * 0.42]
    }
    const update = () => {
      if (latest.current.closed) return latest.current.setCross(null)
      const px = mouse ?? centre()
      const c = fm.map.getCoordinateFromPixel(px)
      if (c) latest.current.setCross(round(fm.point(c)))
    }
    const view = fm.map.getView()
    view.on('change:center', update)
    view.on('change:resolution', update)
    fm.map.on('change:size', update)
    const vp = fm.map.getViewport()
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.buttons) return
      const r = vp.getBoundingClientRect()
      mouse = [e.clientX - r.left, e.clientY - r.top]
      update()
    }
    const leave = () => {
      mouse = null
      update()
    }
    vp.addEventListener('pointermove', move)
    vp.addEventListener('pointerleave', leave)
    // With a mouse, a click is a corner where he clicked; on touch the cross and the button place it.
    const click = (e: { originalEvent: Event; coordinate: number[] }) => {
      if ((e.originalEvent as PointerEvent).pointerType !== 'mouse' || latest.current.closed) return
      latest.current.add(round(fm.point(e.coordinate)))
    }
    // Corners placed one after another are corners, never a double click that zooms; and with no wait for one.
    const zooms = fm.map.getInteractions().getArray().filter((i): i is DoubleClickZoom => i instanceof DoubleClickZoom)
    zooms.forEach((z) => z.setActive(false))
    fm.map.on('click', click)
    update()
    return () => {
      view.un('change:center', update)
      view.un('change:resolution', update)
      fm.map.un('change:size', update)
      vp.removeEventListener('pointermove', move)
      vp.removeEventListener('pointerleave', leave)
      fm.map.un('click', click)
      zooms.forEach((z) => z.setActive(true))
      latest.current.setCross(null)
    }
  }, [fm, d.closed])

  // The cross: a mark that never catches a press.
  useEffect(() => {
    const el = document.createElement('div')
    el.className = 'map-cross'
    el.setAttribute('aria-hidden', 'true')
    const o = new Overlay({ element: el, positioning: 'center-center', stopEvent: false })
    fm.map.addOverlay(o)
    crossEl.current = o
    return () => {
      fm.map.removeOverlay(o)
      crossEl.current = null
    }
  }, [fm])

  // The shape, the lines and the chips, redrawn whenever the corners or the cross move.
  useEffect(() => {
    const cur = latest.current
    fm.extra.clear()
    chips.current.forEach((o) => fm.map.removeOverlay(o))
    chips.current = []
    const add = (geom: Geometry, style: Style[]) => {
      const f = new Feature<Geometry>(geom)
      f.setStyle(style)
      fm.extra.addFeature(f)
    }
    const chip = (at: Point, text: string, kind?: string) => {
      const el = document.createElement('div')
      el.className = 'map-chip'
      if (kind) el.dataset.kind = kind
      el.textContent = text
      // An edge's length sits just off the edge, so the handle in its middle stays free to grab.
      const o = new Overlay({ element: el, position: fm.coord(at), positioning: 'center-center', offset: kind === 'edge' ? [0, -22] : [0, 0], stopEvent: false })
      fm.map.addOverlay(o)
      chips.current.push(o)
    }
    const { corners, closed, cross, preview, mark } = cur
    if (preview.length >= 3) {
      add(new OlPolygon(fm.ring(preview)), drawStyle('shape', mark))
      // Land he already declares, veiled orange where the drawing takes it.
      const clip = fm.ring(preview)[0]
      for (const f of fields) {
        if (!overlaps(preview, f)) continue
        const g = new Feature<Geometry>(new OlPolygon(fm.ring(f)))
        g.setStyle(overlapStyle(fm, clip))
        fm.extra.addFeature(g)
      }
    }
    const placed = closed ? [...corners, corners[0]] : corners
    if (placed.length >= 2) add(new LineString(placed.map(fm.coord)), drawStyle('path', mark))
    const live = !closed && cross && corners.length > 0
    if (live) {
      const to = cross.point
      add(new LineString([corners[corners.length - 1], to].map(fm.coord)), drawStyle('band', cur.crossProblem ? 'error' : mark))
      if (corners.length >= 2 && !cross.closes) add(new LineString([to, corners[0]].map(fm.coord)), drawStyle('band', 'ok'))
    }
    // How long each edge is, and the area inside, as he draws.
    for (let i = 0; i < placed.length - 1; i++) {
      const a = placed[i]
      const b = placed[i + 1]
      if (edgeM(a, b) >= LABEL_MIN_M) chip({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, t.metres(edgeM(a, b)), 'edge')
    }
    if (live && edgeM(corners[corners.length - 1], cross.point) >= LABEL_MIN_M) {
      const a = corners[corners.length - 1]
      chip({ x: (a.x + cross.point.x) / 2, y: (a.y + cross.point.y) / 2 }, t.metres(edgeM(a, cross.point)), 'edge')
    }
    if (preview.length >= 3) chip(centroid(preview), formatHa(cur.areaHa), `area-${mark}`)

    const c = crossEl.current
    if (c) {
      c.setPosition(!closed && cross ? fm.coord(cross.point) : undefined)
      const el = c.getElement()!
      el.dataset.state = cur.crossProblem ? 'error' : cross?.closes ? 'closes' : cross?.snapped ? 'snapped' : 'ok'
    }
    handles.current.forEach((o) => {
      const i = o.get('i') as number
      // The handle he is pulling follows its corner, even while the others wait to be rebuilt.
      const drag = o.get('drag') as number | undefined
      const p = drag !== undefined ? corners[drag] : o.get('mid') ? midpoints(corners, closed)[i] : corners[i]
      if (p) o.setPosition(fm.coord(p))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fm, key])
  useEffect(
    () => () => {
      fm.extra.clear()
      chips.current.forEach((o) => fm.map.removeOverlay(o))
    },
    [fm],
  )

  const loupe = useRef<ReturnType<typeof createLoupe> | null>(null)
  useEffect(() => {
    const l = createLoupe(fm.map, () => {
      const cur = latest.current
      const p = cur.selected !== null ? cur.corners[cur.selected] : null
      return p ? fm.map.getPixelFromCoordinate(fm.coord(p)) : null
    })
    loupe.current = l
    return () => l.destroy()
  }, [fm])

  // A handle on every corner and in the middle of every edge: real buttons, so they take focus and arrow keys.
  // They are rebuilt when a corner comes or goes, but never mid-drag, or the handle under his finger would vanish.
  const shapeNow = `${d.corners.length}:${d.closed}`
  const dragging = useRef(false)
  const [shape, setShape] = useState(shapeNow)
  useEffect(() => {
    if (!dragging.current) setShape(shapeNow)
  }, [shapeNow])
  useEffect(() => {
    const cur = latest.current
    const at = (e: PointerEvent) => round(fm.point(fm.map.getEventCoordinate(e)))
    const finger = (e: PointerEvent) => {
      const r = fm.map.getViewport().getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top]
    }
    const make = (i: number, mid: boolean) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'map-handle'
      if (mid) el.dataset.mid = ''
      else el.dataset.vertex = ''
      el.setAttribute('aria-label', mid ? t.midLabel(i + 1) : `${t.cornerLabel(i + 1)}. ${t.keys}`)
      let corner: number | null = null
      const o = new Overlay({ element: el, positioning: 'center-center', stopEvent: true })
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        el.setPointerCapture(e.pointerId)
        el.dataset.dragging = ''
        dragging.current = true
        fm.map.getViewport().toggleAttribute('data-pulling', true)
        if (mid) corner = latest.current.insert(i, at(e))
        else {
          corner = i
          latest.current.remember()
          latest.current.setSelected(i)
          el.focus({ preventScroll: true })
        }
      })
      el.addEventListener('pointermove', (e) => {
        if (corner === null) return
        o.set('drag', corner)
        latest.current.move(corner, at(e))
        loupe.current?.show(finger(e), e.pointerType === 'touch')
      })
      const stop = () => {
        loupe.current?.hide()
        if (corner !== null) latest.current.letGo()
        corner = null
        o.unset('drag')
        delete el.dataset.dragging
        dragging.current = false
        fm.map.getViewport().toggleAttribute('data-pulling', false)
        const c = latest.current
        setShape(`${c.corners.length}:${c.closed}`)
      }
      el.addEventListener('pointerup', stop)
      el.addEventListener('pointercancel', stop)
      if (!mid) {
        el.addEventListener('focus', () => latest.current.setSelected(i))
        el.addEventListener('keydown', (e) => {
          if (latest.current.nudge(i, e.key, e.shiftKey)) {
            e.preventDefault()
            e.stopPropagation()
          }
        })
      }
      o.set('i', i)
      o.set('mid', mid)
      fm.map.addOverlay(o)
      o.setPosition(fm.coord(mid ? midpoints(cur.corners, cur.closed)[i] : cur.corners[i]))
      return o
    }
    // Middles first, so a corner always sits on top where they come close.
    handles.current = [...midpoints(cur.corners, cur.closed).map((_, i) => make(i, true)), ...cur.corners.map((_, i) => make(i, false))]
    return () => {
      handles.current.forEach((o) => fm.map.removeOverlay(o))
      handles.current = []
    }
  }, [fm, shape])

  useEffect(() => {
    handles.current.forEach((o) => o.getElement()?.toggleAttribute('data-selected', !o.get('mid') && o.get('i') === d.selected))
  }, [d.selected, shape])

  return null
}

/** A field he already declares, filled orange only where the drawing covers it. */
function overlapStyle(fm: FarmMap, clip: number[][]) {
  return new Style({
    renderer: (coords, state) => {
      const ctx = state.context
      const k = state.pixelRatio
      const ring = (coords as number[][][])[0]
      ctx.save()
      ctx.beginPath()
      clip.forEach((c, i) => {
        const [x, y] = fm.map.getPixelFromCoordinate(c).map((v) => v * k)
        if (i) ctx.lineTo(x, y)
        else ctx.moveTo(x, y)
      })
      ctx.closePath()
      ctx.clip()
      ctx.beginPath()
      ring.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      ctx.closePath()
      ctx.fillStyle = overlapColour()
      ctx.fill()
      ctx.restore()
    },
  })
}
