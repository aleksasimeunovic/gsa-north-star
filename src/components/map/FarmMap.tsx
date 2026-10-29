import { useEffect, useId, useRef, useState } from 'react'
import { en, map as copy } from '../../copy/en'
import type { Field, FieldId, Polygon, Scenario } from '../../data/scenarios'
import { Button } from '../../ui/Button'
import { Icon } from '../../ui/Icon'
import { VisuallyHidden } from '../../ui/Layout'
import type { SplitDraft } from '../SplitTool'
import { createFarmMap, type FarmMap as Handle } from './olFarm'
import { SplitOnMap } from './SplitOnMap'
import { EdgeOnMap } from './EdgeOnMap'
import type { EdgeDraft } from '../EdgeTool'
import { OutlineOnMap } from './OutlineOnMap'
import type { OutlineDraft } from '../NewField'
import { useApp } from '../AppContext'

interface Props {
  scenario: Scenario
  focus?: FieldId
  only?: FieldId[]
  /** 'preview': a still picture of the place on a card. 'explore': a map he moves around. */
  mode: 'preview' | 'explore'
  label: string
  /** The split line, drawn on the map; he moves it when interactive. */
  split?: { field: Field; d: SplitDraft; interactive: boolean }
  /** His own drawing of the field, once he has one. */
  drawn?: Polygon | null
  /** Fills a map stage: as large as the screen allows, with its tools on the map. */
  fill?: boolean
  /** Where the field ends, as one line he moves. */
  edge?: { field: Field; d: EdgeDraft }
  /** Someone else's parcel, alone on the photo (Jelena's case preview). */
  parcel?: Polygon
  /** A place in question that isn't his field yet (the parcel he bought). */
  spot?: { polygon: Polygon; label: string }
  /** Registered farmland he can tap to put a field on. */
  lands?: { id: string; polygon: Polygon; label: string }[]
  onPickLand?: (id: string) => void
  /** A field's outline, with a handle on each side; the field itself is left out while he draws it. */
  outline?: { d: OutlineDraft; label: string }
  /** An added field to leave out, because it is the one being changed. */
  skip?: string
}

/** His fields on the real satellite photo. Loaded only when a map is shown. */
export default function FarmMap({ scenario, focus, only, mode, label, split, drawn, fill, edge, parcel, spot, lands, onPickLand, outline, skip }: Props) {
  const { state } = useApp()
  const added = state.answers.newFields
  const addedKey = added.map((f) => `${f.id}:${f.name}:${f.polygon.map((p) => `${p.x},${p.y}`).join(' ')}`).join('|')
  const pick = useRef(onPickLand)
  pick.current = onPickLand
  const el = useRef<HTMLDivElement>(null)
  const [fm, setFm] = useState<Handle | null>(null)
  const [large, setLarge] = useState(false)
  const keysId = useId()
  const explore = mode === 'explore'
  const onlyKey = only?.join()

  useEffect(() => {
    if (!el.current) return
    const h = createFarmMap(el.current, scenario, { interactive: explore, focus, only, drawn, parcel, added, spot, lands, skip })
    // A tap on registered farmland picks it: one large target, never a point to place.
    if (lands?.length) {
      h.map.on('singleclick', (e) => {
        const p = h.point(e.coordinate)
        const hit = lands.find((l) => {
          const b = l.polygon
          const xs = b.map((q) => q.x)
          const ys = b.map((q) => q.y)
          return p.x >= Math.min(...xs) && p.x <= Math.max(...xs) && p.y >= Math.min(...ys) && p.y <= Math.max(...ys)
        })
        if (hit) pick.current?.(hit.id)
      })
    }
    setFm(h)
    return () => {
      setFm(null)
      h.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, focus, onlyKey, explore, drawn, addedKey, spot?.label, lands?.length, skip])

  useEffect(() => fm?.map.updateSize(), [fm, large])

  return (
    <div className="map-frame" data-mode={mode} data-size={large ? 'large' : undefined} data-fill={fill || undefined}>
      {/* Above the map (on it, when it fills a stage), so they stay put while the map moves. */}
      {explore && (
        <div className="map-tools">
          {(focus || only) && (
            <Button onClick={() => fm?.fitHome()}>
              <Icon name="land" />
              {focus ? copy.backTo(en.fields[focus]) : copy.backToFields}
            </Button>
          )}
          <Button onClick={() => fm?.fitFarm()}>
            <Icon name="map" />
            {copy.wholeFarm}
          </Button>
          {!fill && (
            <Button onClick={() => setLarge(!large)}>
              <Icon name={large ? 'smaller' : 'larger'} />
              {large ? copy.smaller : copy.larger}
            </Button>
          )}
        </div>
      )}
      <div
        ref={el}
        className="farm-map"
        role={explore ? 'application' : 'img'}
        aria-label={label}
        aria-describedby={explore ? keysId : undefined}
        tabIndex={explore ? 0 : undefined}
      />
      {explore && (
        <VisuallyHidden>
          <span id={keysId}>{copy.keys}</span>
        </VisuallyHidden>
      )}
      {split && fm && <SplitOnMap fm={fm} {...split} />}
      {edge && fm && <EdgeOnMap fm={fm} {...edge} />}
      {outline && fm && <OutlineOnMap fm={fm} d={outline.d} label={outline.label} />}
    </div>
  )
}
