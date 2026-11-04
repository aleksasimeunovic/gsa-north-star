import 'ol/ol.css'
import Feature from 'ol/Feature'
import OlMap from 'ol/Map'
import Overlay from 'ol/Overlay'
import View from 'ol/View'
import Attribution from 'ol/control/Attribution'
import Zoom from 'ol/control/Zoom'
import { focusWithTabindex } from 'ol/events/condition'
import { boundingExtent, buffer } from 'ol/extent'
import type Geometry from 'ol/geom/Geometry'
import LineString from 'ol/geom/LineString'
import OlPoint from 'ol/geom/Point'
import OlPolygon from 'ol/geom/Polygon'
import { defaults as defaultInteractions } from 'ol/interaction/defaults'
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import XYZ from 'ol/source/XYZ'
import { en, formatHa, map as copy } from '../../copy/en'
import type { FieldId, Point, Polygon, Scenario } from '../../data/scenarios'
import { bounds, centroid, topEdgeAt } from '../../logic/geometry'
import { fromMercator, toMercator } from '../../logic/geo'
import { Style } from 'ol/style'
import { labelStyle, mapStyle, type MapRole } from '../../ui/mapStyles'

// The satellite photo. Esri World Imagery needs no key; the attribution stays on the map.
const IMAGERY = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

export interface FarmMapOptions {
  /** He can move around it: pan, zoom, keyboard. Off for the still preview on a card. */
  interactive: boolean
  /** The field in question, drawn strongest with what changed; his other fields faint. */
  focus?: FieldId
  /** Draw only these fields. */
  only?: FieldId[]
  /** Someone else's parcel, shown alone and framed. */
  parcel?: Polygon
  /** Fields he added this year, drawn and named like the rest. */
  added?: { id: string; polygon: Polygon; name: string }[]
  /** A place in question that isn't a field yet (the parcel he bought): outlined, named, and framed. */
  spot?: { polygon: Polygon; label: string }
  /** Registered farmland he can put a field on, outlined and named so he can tap it. */
  lands?: { id: string; polygon: Polygon; label: string }[]
  /** Leave this added field out: it is the one being changed. */
  skip?: string
  /** The river field once he has split it: drawn on every map instead of the flag. */
  done?: { line: Point[]; parts: { polygon: Polygon; label: string }[] }
  /** Tools float over the bottom of the map, so his field is framed above them. */
  docked?: boolean
  /** He has moved away from the field in question, or come back to it. */
  onAway?: (away: boolean) => void
}

export type FarmMap = ReturnType<typeof createFarmMap>

/**
 * His field where it goes past the registered farmland, veiled orange (look at this: the land registry checks
 * it). Drawn by clipping his field to everything outside the farmland, so only that sliver shows.
 */
export function outsideStyle(map: OlMap, land: number[][]) {
  return new Style({
    renderer: (coords, state) => {
      const ctx = state.context
      const ring = (coords as number[][][])[0]
      const k = state.pixelRatio
      const px = land.map((c) => map.getPixelFromCoordinate(c).map((v) => v * k))
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height)
      px.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      ctx.closePath()
      ctx.clip('evenodd')
      ctx.beginPath()
      ring.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
      ctx.closePath()
      ctx.fillStyle = 'rgba(249, 115, 22, 0.45)'
      ctx.fill()
      ctx.restore()
    },
  })
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * His fields on the real satellite photo near Bečanj. Scenario shapes are in local metres; they are
 * placed on the photo here and read back in metres, so areas and rules never depend on the map.
 */
export function createFarmMap(target: HTMLElement, s: Scenario, opts: FarmMapOptions) {
  const coord = (p: Point) => toMercator(p, s.place)
  const ring = (p: Polygon) => [[...p.map(coord), coord(p[0])]]
  const point = (c: number[]): Point => fromMercator(c, s.place)

  const shapes = new VectorSource()
  const labels = new VectorSource()
  const notes = new VectorSource()
  const extra = new VectorSource()
  const flagged = new VectorSource()

  const shape = (poly: Polygon, role: MapRole, into = shapes) => {
    const f = new Feature<Geometry>(new OlPolygon(ring(poly)))
    f.setStyle(mapStyle(role))
    into.addFeature(f)
    return f
  }
  const label = (into: VectorSource, at: Point, text: string, o?: Parameters<typeof labelStyle>[1]) => {
    const f = new Feature<Geometry>(new OlPoint(coord(at)))
    f.setStyle(labelStyle(text, o))
    into.addFeature(f)
  }
  /** A note on the photo that reads on any field and never catches a press. */
  const chips: Overlay[] = []
  const chip = (at: Point, text: string) => {
    const el = document.createElement('div')
    el.className = 'map-chip'
    el.textContent = text
    const o = new Overlay({ element: el, position: coord(at), positioning: 'center-center', stopEvent: false })
    chips.push(o)
    return o
  }
  /** Its name, just above its top edge, so the inside stays clear for what changed and the split areas. */
  const name = (poly: Polygon, text: string, strong: boolean) => {
    const c = centroid(poly)
    label(labels, { x: c.x, y: topEdgeAt(poly, c.x) - 3 }, text, { above: true, strong, size: strong ? 15 : 13 })
  }

  const focused = opts.focus ? s.fields.find((f) => f.id === opts.focus) : undefined
  const fields = opts.parcel ? [] : opts.only ? s.fields.filter((f) => opts.only!.includes(f.id)) : s.fields
  if (opts.parcel) shape(opts.parcel, 'field')

  let focusShape: Feature<Geometry> | null = null
  for (const f of fields) {
    // With a place in question (a parcel, farmland to pick), his fields are only there for orientation.
    const strong = (!focused && !opts.spot && !opts.lands?.length) || f.id === focused?.id
    const drawn = shape(f.polygon, strong ? 'field' : 'faint')
    if (f.id === focused?.id) focusShape = drawn
    // On a still preview only the field in question is named; on a map he moves around, every field is.
    if (strong || opts.interactive) name(f.polygon, en.fields[f.id], strong)
  }

  for (const f of opts.parcel ? [] : (opts.added ?? [])) {
    if (f.id === opts.skip) continue
    const strong = !focused && !opts.spot && !opts.lands?.length
    shape(f.polygon, strong ? 'field' : 'faint')
    if (strong || opts.interactive) name(f.polygon, f.name, strong)
  }
  if (opts.spot) {
    shape(opts.spot.polygon, 'spot')
    chip(centroid(opts.spot.polygon), opts.spot.label)
  }
  for (const l of opts.lands ?? []) {
    shape(l.polygon, 'land')
    chip(centroid(l.polygon), l.label)
  }

  // What changed, in place: the satellite flag, the road strip.
  const signal = focused?.signal
  let flagChip: Overlay | null = null
  if (signal?.kind === 'satellite_difference') {
    label(notes, signal.riverAt, copy.river, { strong: false, size: 13 })
    if (!opts.done) {
      shape(signal.flagPolygon, 'flag', flagged)
      flagChip = chip(centroid(signal.flagPolygon), copy.flag)
    }
  }
  if (opts.done && !opts.parcel && !opts.lands?.length) {
    const f = new Feature<Geometry>(new LineString(opts.done.line.map(coord)))
    f.setStyle(mapStyle(focused?.id === 'river' || !focused ? 'split' : 'faint'))
    shapes.addFeature(f)
    if (focused?.id === 'river') opts.done.parts.forEach((p) => chip(centroid(p.polygon), p.label))
  }
  if (signal?.kind === 'road_strip') {
    shape(signal.stripPolygon, 'strip')
    const b = bounds(signal.stripPolygon)
    chip({ x: (b.minX + b.maxX) / 2, y: b.minY - 16 }, copy.strip(formatHa(signal.stripHa)))
  }

  const extentOf = (polys: Polygon[]) => boundingExtent(polys.flat().map(coord))
  const all = [...s.fields.map((f) => f.polygon), ...(opts.added ?? []).map((f) => f.polygon), ...(s.bought ? [s.bought.polygon] : [])]
  const home = opts.parcel
    ? [opts.parcel]
    : opts.spot
      ? [opts.spot.polygon, ...(opts.lands ?? []).map((l) => l.polygon)]
      : opts.lands?.length
        ? [...s.fields.map((f) => f.polygon), ...opts.lands.map((l) => l.polygon)]
        : focused
        ? [focused.polygon]
        : fields.map((f) => f.polygon)

  const flagLayer = new VectorLayer({ source: flagged })
  const view = new View({
    maxZoom: 20,
    minZoom: 13,
    // He can look around, but not get lost: the view stays within a few kilometres of the farm.
    extent: buffer(extentOf(all), 3000),
    constrainOnlyCenter: true,
  })
  const map = new OlMap({
    target,
    layers: [
      new TileLayer({ source: new XYZ({ url: IMAGERY, maxZoom: 18, attributions: copy.imagery, crossOrigin: 'anonymous' }) }),
      new VectorLayer({ source: shapes }),
      flagLayer,
      new VectorLayer({ source: extra }),
      new VectorLayer({ source: labels, declutter: true }),
      new VectorLayer({ source: notes }),
    ],
    view,
    controls: opts.interactive
      ? [new Zoom({ zoomInTipLabel: copy.zoomIn, zoomOutTipLabel: copy.zoomOut }), new Attribution({ collapsible: false })]
      : [new Attribution({ collapsible: false })],
    // The map turns only with north up, so "top" and "bottom" of a field mean what he sees.
    // The wheel zooms only once the map has focus, so scrolling the page never gets stuck on it.
    interactions: opts.interactive
      ? defaultInteractions({ altShiftDragRotate: false, pinchRotate: false, mouseWheelZoom: false }).extend([new MouseWheelZoom({ condition: focusWithTabindex })])
      : [],
  })

  // An edge he drew past the registered farmland stays marked on every map until the land registry checks it.
  if (focused?.claimedHa !== undefined && focused.land && !opts.parcel) {
    const veil = new Feature<Geometry>(new OlPolygon(ring(focused.polygon)))
    veil.setStyle(outsideStyle(map, focused.land.map(coord)))
    shapes.addFeature(veil)
  }
  chips.forEach((o) => map.addOverlay(o))
  // Until the photo has drawn once, the map shimmers instead of sitting black.
  map.once('rendercomplete', () => target.setAttribute('data-ready', ''))

  const small = target.clientWidth < 640
  const edge = small ? 28 : 56
  // Clear of the zoom buttons on the left, and of the tools floating over the bottom.
  const padding = opts.interactive ? [edge, small ? 16 : edge, opts.docked ? edge + 76 : edge, small ? 64 : edge] : [20, 20, 20, 20]
  // Until he moves the map himself, it keeps his field framed when its size changes (the panel beside it grows and shrinks).
  let framing = false
  let moved = false
  let away = false
  const setAway = (v: boolean) => {
    if (v !== away) opts.onAway?.(v)
    away = v
  }
  const onMove = () => {
    if (framing) return
    moved = true
    setAway(true)
  }
  view.on('change:center', onMove)
  view.on('change:resolution', onMove)
  const fit = (polys: Polygon[], animate: boolean) => {
    framing = true
    view.fit(extentOf(polys), {
      padding,
      maxZoom: 18.5,
      duration: animate && !reducedMotion() ? 450 : undefined,
      callback: () => {
        framing = false
        moved = false
      },
    })
  }
  // A map inside something closed has no size yet: frame his fields the first time it gets one.
  const frameOnce = () => {
    const size = map.getSize()
    if (size && size[0] > 0 && size[1] > 0) fit(home, false)
    else map.once('change:size', frameOnce)
  }
  frameOnce()
  map.on('change:size', () => {
    const size = map.getSize()
    if (!moved && size && size[0] > 0 && size[1] > 0) fit(home, false)
  })

  return {
    map,
    shapes,
    extra,
    coord,
    ring,
    point,
    /** While he moves its edge, the field in question is drawn by the tool instead. */
    hideFocus: (hide: boolean) => focusShape?.setStyle(hide ? [] : mapStyle('field')),
    /** Shows or hides what the photo flagged, so he can compare it with his field. */
    showFlag: (on: boolean) => {
      flagChip?.getElement()?.toggleAttribute('hidden', !on)
      // A short fade, so the two views read as one photo with and without the flag.
      if (reducedMotion()) {
        flagLayer.setVisible(on)
        return
      }
      flagLayer.setVisible(true)
      const from = flagLayer.getOpacity()
      const to = on ? 1 : 0
      const start = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 200)
        flagLayer.setOpacity(from + (to - from) * t)
        if (t < 1) requestAnimationFrame(step)
        else flagLayer.setVisible(on)
      }
      requestAnimationFrame(step)
    },
    /** Back to the field in question (or the fields shown). */
    fitHome: (animate = true) => {
      fit(home, animate)
      setAway(false)
    },
    fitFarm: (animate = true) => {
      fit(all, animate)
      setAway(true)
    },
    destroy: () => map.setTarget(undefined),
  }
}
