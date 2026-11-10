import { Fill, Stroke, Style, Text } from 'ol/style'

// Map styles on the satellite photo: white lines with a dark halo so they read on any field.
// Greyscale like the rest of the prototype; the design system replaces these later.
const white = '#fff'
const halo = 'rgba(0,0,0,0.6)'
// Labels on the map use the body font token, so a new type pair reaches the canvas too.
let font: string | null = null
const bodyFont = () =>
  (font ??= (typeof document !== 'undefined' && getComputedStyle(document.documentElement).getPropertyValue('--font-body').trim()) || 'system-ui, sans-serif')

function pattern(size: number, draw: (ctx: CanvasRenderingContext2D) => void): CanvasPattern | string {
  if (typeof document === 'undefined') return 'rgba(255,255,255,0.3)'
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  if (!ctx) return 'rgba(255,255,255,0.3)'
  draw(ctx)
  return ctx.createPattern(c, 'repeat') ?? 'rgba(255,255,255,0.3)'
}

/** A colour token from the theme as rgba, so the map's red is the app's red (the canvas reads it back as pixels). */
function token(name: string, fallback: string, alpha = 1): string {
  if (typeof document === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!ctx) return fallback
  ctx.fillStyle = v
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return `rgba(${r},${g},${b},${alpha})`
}

let patterns: { hatch: CanvasPattern | string } | null = null
const fills = () =>
  (patterns ??= {
    // Hatched: land that changed hands (the road strip).
    hatch: pattern(12, (ctx) => {
      ctx.fillStyle = 'rgba(0,0,0,0.45)'
      ctx.fillRect(0, 0, 12, 12)
      ctx.strokeStyle = white
      ctx.lineWidth = 2.5
      ctx.beginPath()
      for (const o of [-12, 0, 12]) {
        ctx.moveTo(o, 12)
        ctx.lineTo(o + 12, 0)
      }
      ctx.stroke()
    }),
  })

const line = (width: number, dash?: number[]) => [
  new Style({ stroke: new Stroke({ color: halo, width: width + 3, lineDash: dash }) }),
  new Style({ stroke: new Stroke({ color: white, width, lineDash: dash }) }),
]

export function labelStyle(text: string, opts: { strong?: boolean; align?: 'left' | 'center'; size?: number; above?: boolean } = {}): Style {
  const { strong = true, align = 'center', size = 15, above = false } = opts
  return new Style({
    text: new Text({
      text,
      font: `${strong ? 600 : 400} ${size}px ${bodyFont()}`,
      fill: new Fill({ color: white }),
      stroke: new Stroke({ color: halo, width: 4 }),
      textAlign: align,
      textBaseline: above ? 'bottom' : align === 'left' ? 'top' : 'middle',
      overflow: true,
    }),
  })
}

/**
 * - field: his field in question, or every field on the whole-farm map
 * - faint: his other fields, for orientation
 * - land: registered farmland he can put a field on
 * - flag: what the satellite flagged, a light veil and a dashed line, so the photo underneath stays readable
 * - editing: an outline he is moving (road, yard): a light veil and a solid edge, so the edge he follows stays visible
 * - strip: what changed hands, hatched so it never relies on colour
 * - split: the line that splits a field
 * - guide: the edge in the photo, once the line has left it
 * - spot: land in question that isn't his field yet (the parcel he bought)
 * - hover: the part of his field under the pointer, when tapping it does something
 * - error: a part with something wrong (no crop yet), veiled red with a red edge, so the map points at what the panel says
 * - lit: fields a measure covers, brighter than the rest
 */
export type MapRole = 'field' | 'faint' | 'land' | 'flag' | 'editing' | 'strip' | 'split' | 'guide' | 'spot' | 'hover' | 'error' | 'lit'

export function mapStyle(role: MapRole): Style[] {
  switch (role) {
    case 'field':
      return [new Style({ fill: new Fill({ color: 'rgba(255,255,255,0.04)' }) }), ...line(2.5)]
    case 'faint':
      return line(1.5, [6, 5])
    case 'land':
      return line(2, [14, 8])
    case 'flag':
      return [new Style({ fill: new Fill({ color: 'rgba(255,255,255,0.16)' }) }), ...line(2, [8, 5])]
    case 'editing':
      return [new Style({ fill: new Fill({ color: 'rgba(255,255,255,0.2)' }) }), ...line(2.5)]
    case 'strip':
      return [new Style({ fill: new Fill({ color: fills().hatch }) }), ...line(2)]
    case 'split':
      return line(3)
    case 'guide':
      return line(1.5, [6, 5])
    case 'hover':
      return [new Style({ fill: new Fill({ color: 'rgba(255,255,255,0.22)' }) })]
    case 'error':
      return [new Style({ fill: new Fill({ color: token('--error', 'rgb(220 38 38)', 0.35) }) }), new Style({ stroke: new Stroke({ color: halo, width: 6 }) }), new Style({ stroke: new Stroke({ color: token('--error', 'rgb(220 38 38)'), width: 3 }) })]
    case 'lit':
      return [new Style({ fill: new Fill({ color: 'rgba(255,255,255,0.28)' }) }), ...line(3)]
    case 'spot':
      return [new Style({ fill: new Fill({ color: 'rgba(255,255,255,0.18)' }) }), ...line(3, [10, 6])]
  }
}

/** How a field he draws reads: white while it's fine, orange while something is left to do, red where it can't be. */
export type DrawMark = 'ok' | 'look' | 'error'
const markColour = (mark: DrawMark, alpha = 1) =>
  mark === 'error' ? token('--error', 'rgb(220 38 38)', alpha) : mark === 'look' ? token('--warning', 'rgb(249 115 22)', alpha) : `rgba(255,255,255,${alpha})`

/**
 * - shape: the field as it would be, filled lightly so the photo stays readable
 * - path: the edges he has placed
 * - band: from his last corner to the cross, and back to his first, dashed: not placed yet
 */
export function drawStyle(part: 'shape' | 'path' | 'band', mark: DrawMark): Style[] {
  const colour = markColour(mark)
  if (part === 'shape') return [new Style({ fill: new Fill({ color: markColour(mark, mark === 'ok' ? 0.18 : 0.3) }) })]
  const width = part === 'band' ? 2 : 3
  const dash = part === 'band' ? [8, 6] : undefined
  return [new Style({ stroke: new Stroke({ color: halo, width: width + 3, lineDash: dash }) }), new Style({ stroke: new Stroke({ color: colour, width, lineDash: dash }) })]
}

/** The land his drawing takes from a field he already declares, veiled orange. */
export const overlapColour = () => token('--warning', 'rgb(249 115 22)', 0.55)
