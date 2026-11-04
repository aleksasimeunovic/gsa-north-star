import type OlMap from 'ol/Map'

const SIZE = 132
const ZOOM = 2
/** How far above the finger the loupe floats, so the finger never covers it. */
const LIFT = 96

/**
 * A magnifier for a finger: while he drags a point on a touch screen, his finger covers exactly the spot he is
 * placing. The loupe floats above it and shows that spot twice as large, with a mark at the point, so he can
 * see the edge he is following. Drawn from the map's own canvases, so it shows the photo, his field and the
 * line as they are at that moment. Only for touch; a mouse pointer covers nothing.
 */
export function createLoupe(map: OlMap, pointAt: () => number[] | null) {
  const viewport = map.getViewport()
  const el = document.createElement('div')
  el.className = 'map-loupe'
  el.setAttribute('aria-hidden', 'true')
  const canvas = document.createElement('canvas')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = canvas.height = SIZE * dpr
  el.appendChild(canvas)
  viewport.appendChild(el)
  const ctx = canvas.getContext('2d')
  let finger: number[] | null = null

  const draw = () => {
    const point = finger && pointAt()
    if (!finger || !point || !ctx) return
    const [px, py] = point
    const w = viewport.clientWidth
    const h = viewport.clientHeight
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // Every layer's canvas, in order: the photo, then his field, the line and the labels.
    const span = SIZE / ZOOM
    viewport.querySelectorAll<HTMLCanvasElement>('.ol-layer canvas, canvas.ol-layer').forEach((c) => {
      if (!c.width || c === canvas) return
      const sx = c.width / w
      const sy = c.height / h
      try {
        ctx.drawImage(c, (px - span / 2) * sx, (py - span / 2) * sy, span * sx, span * sy, 0, 0, canvas.width, canvas.height)
      } catch {
        // A canvas that can't be drawn just leaves the loupe without it.
      }
    })
    // The point itself is marked by the loupe's own centre dot (CSS), drawn like its handle.
    // Above the finger; below it if the finger is near the top of the map.
    const [fx, fy] = finger
    const left = Math.min(Math.max(fx - SIZE / 2, 8), w - SIZE - 8)
    const top = fy - LIFT - SIZE / 2 < 8 ? fy + LIFT - SIZE / 2 : fy - LIFT - SIZE / 2
    el.style.transform = `translate(${left}px, ${top}px)`
  }
  map.on('postrender', draw)

  return {
    /** Where his finger is, in map pixels; the loupe shows the point he moves, wherever it lands. */
    show: (at: number[]) => {
      finger = at
      el.dataset.on = ''
      draw()
    },
    hide: () => {
      finger = null
      delete el.dataset.on
    },
    destroy: () => {
      map.un('postrender', draw)
      el.remove()
    },
  }
}
