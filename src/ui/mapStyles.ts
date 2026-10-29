import { Fill, Stroke, Style, Text } from 'ol/style'

// Map styles on the satellite photo: white lines with a dark halo so they read on any field.
// Greyscale like the rest of the prototype; the design system replaces these later.
const white = '#fff'
const halo = 'rgba(0,0,0,0.75)'

function pattern(size: number, draw: (ctx: CanvasRenderingContext2D) => void): CanvasPattern | string {
  if (typeof document === 'undefined') return 'rgba(255,255,255,0.3)'
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  if (!ctx) return 'rgba(255,255,255,0.3)'
  draw(ctx)
  return ctx.createPattern(c, 'repeat') ?? 'rgba(255,255,255,0.3)'
}

let patterns: { hatch: CanvasPattern | string; dots: CanvasPattern | string } | null = null
const fills = () =>
  (patterns ??= {
    // Hatched: land that changed hands (the road strip, the strip both of you declared).
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
    // Dotted: what the satellite flagged.
    dots: pattern(10, (ctx) => {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(0, 0, 10, 10)
      ctx.fillStyle = white
      ctx.beginPath()
      ctx.arc(5, 5, 1.8, 0, Math.PI * 2)
      ctx.fill()
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
      font: `${strong ? 700 : 400} ${size}px system-ui, -apple-system, sans-serif`,
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
 * - land: land the government has registered as farmland (shown only when drawing)
 * - neighbour: the neighbour's declared field
 * - flag / strip / overlap: what changed, patterned so it never relies on colour
 * - mine: his field as he moves its edge
 * - split: the line that splits a field
 * - spot: land in question that isn't his field yet (the parcel he bought)
 */
export type MapRole = 'field' | 'faint' | 'land' | 'neighbour' | 'flag' | 'strip' | 'overlap' | 'mine' | 'split' | 'spot'

export function mapStyle(role: MapRole): Style[] {
  switch (role) {
    case 'field':
      return [new Style({ fill: new Fill({ color: 'rgba(255,255,255,0.06)' }) }), ...line(3)]
    case 'faint':
      return line(1.5, [6, 5])
    case 'land':
      return line(2, [14, 8])
    case 'neighbour':
      return [new Style({ fill: new Fill({ color: 'rgba(0,0,0,0.4)' }) }), ...line(1.5, [4, 4])]
    case 'flag':
      return [new Style({ fill: new Fill({ color: fills().dots }) }), ...line(2, [8, 5])]
    case 'strip':
    case 'overlap':
      return [new Style({ fill: new Fill({ color: fills().hatch }) }), ...line(2)]
    case 'mine':
      return [new Style({ fill: new Fill({ color: 'rgba(255,255,255,0.12)' }) }), ...line(3)]
    case 'split':
      return line(4)
    case 'spot':
      return [new Style({ fill: new Fill({ color: 'rgba(255,255,255,0.18)' }) }), ...line(3, [10, 6])]
  }
}
