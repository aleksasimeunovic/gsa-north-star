import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { en, formatDateYear, formatHa, map as copy } from '../../copy/en'
import type { FieldId, Polygon, Scenario } from '../../data/scenarios'
import { riverParts } from '../../logic/farm'
import { Icon } from '../../ui/Icon'
import { VisuallyHidden } from '../../ui/Layout'
import type { SplitDraft } from '../SplitTool'
import { createFarmMap, type FarmMap as Handle } from './olFarm'
import { SplitOnMap } from './SplitOnMap'
import { YardOnMap } from './YardOnMap'
import { DrawOnMap } from './DrawOnMap'
import type { FieldDraw } from '../DrawTool'
import type { YardDraft } from '../YardTool'
import { useApp } from '../AppContext'

interface Props {
  scenario: Scenario
  focus?: FieldId
  only?: FieldId[]
  /** 'preview': a still picture of the place on a card. 'explore': a map he moves around. */
  mode: 'preview' | 'explore'
  label: string
  /** The split line, drawn on the map; he moves it when interactive. */
  split?: { d: SplitDraft; interactive: boolean; labels: [string, string]; onPickPart?: (i: 0 | 1) => void }
  /** Hide what the photo flagged, to compare it with last year's field. */
  /** His own outline of the road strip, drawn instead of the land map's. */
  roadStrip?: { polygon: Polygon; ha: number }
  hideFlag?: boolean
  /** Fills a map stage: as large as the screen allows, with its tools on the map. */
  fill?: boolean
  /** Someone else's parcel, alone on the photo (Jelena's case preview). */
  parcel?: Polygon
  /** A place in question that isn't his field yet (the parcel he bought). */
  spot?: { polygon: Polygon; label: string; yard?: { polygon: Polygon; label: string; settled?: boolean }; above?: boolean }
  /** The house and yard he leaves out of the spot; he moves it when interactive. */
  yard?: { d: YardDraft; interactive: boolean; settled?: boolean }
  /** Fields a measure covers, drawn bright. */
  highlight?: { polygon: Polygon; label: string }[]
  /** Registered farmland he can tap to put a field on. */
  lands?: { id: string; polygon: Polygon; label: string }[]
  onPickLand?: (id: string) => void
  /** An added field to leave out, because it is the one being changed. */
  skip?: string
  /** The tools for what he is doing here, floating over the bottom of the map. */
  dock?: ReactNode
  /** A field he draws corner by corner, and the fields it must stay clear of. */
  draw?: { d: FieldDraw; fields: Polygon[] }
}

/** His fields on the real satellite photo. Loaded only when a map is shown. */
export default function FarmMap({ roadStrip, scenario, focus, only, mode, label, split, hideFlag, fill, parcel, spot, yard, highlight, lands, onPickLand, skip, dock, draw }: Props) {
  const ownStrip = !!yard && focus === 'road'
  const { state } = useApp()
  const added = state.answers.newFields
  // While he edits the split the draft is on the map; otherwise, the split he confirmed.
  const parts = split ? null : riverParts(scenario, state.answers)
  const done = parts ? { line: state.answers.river.split!.line, parts: parts.map((p) => ({ polygon: p.polygon, label: `${en.crops[p.crop]}, ${formatHa(p.ha)}` })) } : undefined
  const doneKey = done ? JSON.stringify(done) : ''
  const splitOpen = !!split
  const addedKey = added.map((f) => `${f.id}:${f.name}:${f.polygon.map((p) => `${p.x},${p.y}`).join(' ')}`).join('|')
  const pick = useRef(onPickLand)
  pick.current = onPickLand
  const el = useRef<HTMLDivElement>(null)
  const [fm, setFm] = useState<Handle | null>(null)
  const [away, setAway] = useState(false)
  const keysId = useId()
  const explore = mode === 'explore'
  const onlyKey = only?.join()
  const backLabel = focus ? copy.backTo(en.fields[focus]) : copy.backToFields

  useEffect(() => {
    if (!el.current) return
    const h = createFarmMap(el.current, scenario, { interactive: explore, focus, only, parcel, added, spot, highlight, lands, skip, done, ownStrip, roadStrip, docked: !!dock, frame: draw ? lands?.map((l) => l.polygon) : undefined, onAway: setAway })
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
    setAway(false)
    return () => {
      setFm(null)
      h.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownStrip, roadStrip?.ha, scenario, focus, onlyKey, explore, addedKey, spot?.label, !!spot?.yard, highlight?.map((h) => h.label).join(), lands?.length, skip, doneKey, splitOpen])

  useEffect(() => fm?.showFlag(!hideFlag), [fm, hideFlag])
  const docked = !!dock
  useEffect(() => fm?.setDocked(docked), [fm, docked])

  return (
    <div className="map-frame" data-mode={mode} data-fill={fill || undefined}>
      {/* Under the zoom buttons. The way back appears only once he has moved away from his field. */}
      {explore && (
        <div className="map-tools">
          <button type="button" className="map-tool" aria-label={copy.wholeFarm} title={copy.wholeFarm} onClick={() => fm?.fitFarm()}>
            <Icon name="map" size="sm" />
          </button>
          {away && (
            <button type="button" className="map-tool" aria-label={backLabel} title={backLabel} onClick={() => fm?.fitHome()}>
              <Icon name="locate" size="sm" />
            </button>
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
      {/* When the photo was taken, on every map: what he sees may be older than what he knows. */}
      <p className="map-date">{copy.photoDate(formatDateYear(scenario.photoTaken))}</p>
      {explore && (
        <VisuallyHidden>
          <span id={keysId}>{copy.keys}</span>
        </VisuallyHidden>
      )}
      {dock && <div className="map-dock">{dock}</div>}
      {split && fm && <SplitOnMap fm={fm} {...split} />}
      {yard && fm && <YardOnMap fm={fm} {...yard} />}
      {draw && fm && <DrawOnMap fm={fm} {...draw} />}
    </div>
  )
}
