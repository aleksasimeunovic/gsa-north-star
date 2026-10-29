import 'ol/ol.css'
import Feature from 'ol/Feature'
import OlMap from 'ol/Map'
import View from 'ol/View'
import Attribution from 'ol/control/Attribution'
import Zoom from 'ol/control/Zoom'
import { focusWithTabindex } from 'ol/events/condition'
import { boundingExtent, buffer } from 'ol/extent'
import type Geometry from 'ol/geom/Geometry'
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
import { bounds, centroid, landOf } from '../../logic/geometry'
import { fromMercator, toMercator } from '../../logic/geo'
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
  /** Drawing where the field ends: the field itself is left out (he draws it) and registered farmland is shown. */
  editing?: boolean
  /** His own drawing of the field in question, shown instead of last year's line. */
  drawn?: Polygon | null
  /** Someone else's parcel, shown alone and framed. */
  parcel?: Polygon
  /** Fields he added this year, drawn and named like the rest. */
  added?: { id: string; polygon: Polygon; name: string }[]
  /** A place in question that isn't a field yet (the parcel he bought): outlined, named, and framed. */
  spot?: { polygon: Polygon; label: string }
  /** Registered farmland he can put a field on, outlined and named so he can tap it. */
  lands?: { id: string; polygon: Polygon; label: string }[]
  /** Leave this added field out: it is being drawn. */
  skip?: string
}

export type FarmMap = ReturnType<typeof createFarmMap>

export { landOf }

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

  const shape = (poly: Polygon, role: MapRole) => {
    const f = new Feature<Geometry>(new OlPolygon(ring(poly)))
    f.setStyle(mapStyle(role))
    shapes.addFeature(f)
  }
  const label = (into: VectorSource, at: Point, text: string, o?: Parameters<typeof labelStyle>[1]) => {
    const f = new Feature<Geometry>(new OlPoint(coord(at)))
    f.setStyle(labelStyle(text, o))
    into.addFeature(f)
  }

  const focused = opts.focus ? s.fields.find((f) => f.id === opts.focus) : undefined
  const fields = opts.parcel ? [] : opts.only ? s.fields.filter((f) => opts.only!.includes(f.id)) : s.fields
  if (opts.parcel) shape(opts.parcel, 'field')

  // Registered farmland is drawn but not labelled: it explains itself when it stops a corner.
  if (opts.editing && focused) shape(landOf(s, focused), 'land')
  for (const f of fields) {
    if (opts.editing && f.id === focused?.id) continue
    // With a place in question (a parcel, farmland to pick), his fields are only there for orientation.
    const strong = (!focused && !opts.spot && !opts.lands?.length) || f.id === focused?.id
    shape(f.id === focused?.id && opts.drawn ? opts.drawn : f.polygon, strong ? 'field' : 'faint')
    // On a still preview only the field in question is named; on a map he moves around, every field is.
    if (strong || opts.interactive) {
      const b = bounds(f.polygon)
      // Named just above its top edge, so the inside stays clear for what changed and the split areas.
      label(labels, { x: b.minX + 2, y: b.minY - 2 }, en.fields[f.id], { align: 'left', above: true, strong, size: strong ? 15 : 13 })
    }
  }

  for (const f of opts.parcel ? [] : (opts.added ?? [])) {
    if (f.id === opts.skip) continue
    const strong = !focused && !opts.spot && !opts.lands?.length
    shape(f.polygon, strong ? 'field' : 'faint')
    if (strong || opts.interactive) {
      const b = bounds(f.polygon)
      label(labels, { x: b.minX + 2, y: b.minY - 2 }, f.name, { align: 'left', above: true, strong, size: strong ? 15 : 13 })
    }
  }
  if (opts.spot) {
    shape(opts.spot.polygon, 'spot')
    const b = bounds(opts.spot.polygon)
    label(notes, { x: b.minX + 2, y: b.minY - 2 }, opts.spot.label, { align: 'left', above: true, size: 15 })
  }
  for (const l of opts.lands ?? []) {
    shape(l.polygon, 'land')
    label(notes, centroid(l.polygon), l.label, { size: 14 })
  }

  // What changed, in place: the satellite flag, the road strip, the neighbour's line.
  const signal = focused?.signal
  if (signal?.kind === 'satellite_difference' && !opts.editing) {
    shape(signal.flagPolygon, 'flag')
    const b = bounds(signal.flagPolygon)
    label(notes, { x: (b.minX + b.maxX) / 2, y: b.maxY - 4 }, copy.flag, { above: true, size: 14 })
  }
  if (signal?.kind === 'not_mown' && focused) {
    shape(focused.polygon, 'flag')
    label(notes, centroid(focused.polygon), copy.notMown)
  }
  if (signal?.kind === 'road_strip' && !opts.editing) {
    shape(signal.stripPolygon, 'strip')
    const b = bounds(signal.stripPolygon)
    label(notes, { x: (b.minX + b.maxX) / 2, y: b.minY - 14 }, copy.strip(formatHa(signal.stripHa)))
  }
  if (signal?.kind === 'overlap') {
    shape(signal.neighbourPolygon, 'neighbour')
    label(notes, centroid(signal.neighbourPolygon), copy.neighbour, { strong: false, size: 13 })
    if (!opts.editing && !opts.drawn) {
      shape(signal.overlapPolygon, 'overlap')
      const b = bounds(signal.overlapPolygon)
      label(notes, { x: (b.minX + b.maxX) / 2, y: b.minY - 14 }, copy.both(formatHa(signal.overlapHa)))
    }
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
      ? [focused.polygon, ...(signal?.kind === 'overlap' ? [signal.neighbourPolygon] : [])]
      : fields.map((f) => f.polygon)

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
      new TileLayer({ source: new XYZ({ url: IMAGERY, maxZoom: 18, attributions: copy.imagery }) }),
      new VectorLayer({ source: shapes }),
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

  const padding = opts.interactive ? [56, 56, 56, 56] : [20, 20, 20, 20]
  const fit = (polys: Polygon[], animate: boolean) =>
    view.fit(extentOf(polys), { padding, maxZoom: 18.5, duration: animate && !reducedMotion() ? 300 : undefined })
  // A map inside something closed has no size yet: frame his fields the first time it gets one.
  const frameOnce = () => {
    const size = map.getSize()
    if (size && size[0] > 0 && size[1] > 0) fit(home, false)
    else map.once('change:size', frameOnce)
  }
  frameOnce()

  return {
    map,
    shapes,
    extra,
    coord,
    ring,
    point,
    /** Back to the field in question (or the fields shown). */
    fitHome: (animate = true) => fit(home, animate),
    fitFarm: (animate = true) => fit(all, animate),
    destroy: () => map.setTarget(undefined),
  }
}
