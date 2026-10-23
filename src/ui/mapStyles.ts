import type { FeatureLike } from 'ol/Feature'
import MultiPoint from 'ol/geom/MultiPoint'
import type Polygon from 'ol/geom/Polygon'
import { Circle, Fill, Stroke, Style, Text } from 'ol/style'

// Greyscale map styles for the drawing map. The design system replaces these later.
const ink = '#111'
const muted = '#777'
const label = (text: string, bold = true) =>
  new Text({ text, font: `${bold ? 600 : 400} 14px system-ui, sans-serif`, fill: new Fill({ color: ink }), stroke: new Stroke({ color: '#fff', width: 4 }), overflow: true })

export type MapRole = 'land' | 'neighbour' | 'other' | 'mine' | 'mine_problem'

export function mapStyle(role: MapRole, text?: string): Style[] {
  switch (role) {
    case 'land':
      return [new Style({ stroke: new Stroke({ color: ink, width: 2, lineDash: [10, 6] }) })]
    case 'neighbour':
      return [new Style({ fill: new Fill({ color: 'rgba(0,0,0,0.12)' }), stroke: new Stroke({ color: muted, width: 1.5 }), text: text ? label(text, false) : undefined })]
    case 'other':
      return [new Style({ fill: new Fill({ color: '#fff' }), stroke: new Stroke({ color: muted, width: 1 }) })]
    case 'mine':
    case 'mine_problem':
      return [
        new Style({
          fill: new Fill({ color: 'rgba(0,0,0,0.05)' }),
          stroke: new Stroke({ color: ink, width: role === 'mine' ? 3 : 4, lineDash: role === 'mine' ? undefined : [6, 4] }),
          text: text ? label(text) : undefined,
        }),
        corners,
      ]
  }
}

/** His field's corners, always shown, so he can see what to drag. */
const corners = new Style({
  image: new Circle({ radius: 9, fill: new Fill({ color: '#fff' }), stroke: new Stroke({ color: ink, width: 3 }) }),
  geometry: (f: FeatureLike) => new MultiPoint((f.getGeometry() as Polygon).getCoordinates()[0]),
})

/** The corner under his finger: large enough to grab. */
export const vertexStyle = new Style({
  image: new Circle({ radius: 11, fill: new Fill({ color: '#fff' }), stroke: new Stroke({ color: ink, width: 3 }) }),
})
