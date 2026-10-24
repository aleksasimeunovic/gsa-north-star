import type { Point } from '../data/scenarios'

/**
 * Where the scenario's local grid sits on the satellite photo: the lon/lat of local (0, 0) and how far
 * the grid is turned (degrees anticlockwise from east). Local x runs along the grid, local y points down it.
 * Areas and rules stay in local metres; only the map uses these coordinates.
 */
export interface Placement {
  lon: number
  lat: number
  rotationDeg: number
}

const EARTH_RADIUS = 6_378_137
const rad = (d: number) => (d * Math.PI) / 180

/** Web Mercator (EPSG:3857), the map's coordinates. */
export function lonLatToMercator(lon: number, lat: number): [number, number] {
  return [EARTH_RADIUS * rad(lon), EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + rad(lat) / 2))]
}

// Web Mercator stretches distances by 1 / cos(latitude); over one farm that is constant.
const frame = (at: Placement) => {
  const [x0, y0] = lonLatToMercator(at.lon, at.lat)
  const t = rad(at.rotationDeg)
  return { x0, y0, k: 1 / Math.cos(rad(at.lat)), cos: Math.cos(t), sin: Math.sin(t) }
}

export function toMercator(p: Point, at: Placement): [number, number] {
  const f = frame(at)
  const east = p.x * f.cos + p.y * f.sin
  const north = p.x * f.sin - p.y * f.cos
  return [f.x0 + east * f.k, f.y0 + north * f.k]
}

export function fromMercator(c: number[], at: Placement): Point {
  const f = frame(at)
  const east = (c[0] - f.x0) / f.k
  const north = (c[1] - f.y0) / f.k
  return { x: east * f.cos + north * f.sin, y: east * f.sin - north * f.cos }
}
