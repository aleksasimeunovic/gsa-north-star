import { useEffect, useId, useRef, useState } from 'react'
import { en, map as copy } from '../../copy/en'
import type { Field, FieldId, Polygon, Scenario } from '../../data/scenarios'
import { Button } from '../../ui/Button'
import { Icon } from '../../ui/Icon'
import { VisuallyHidden } from '../../ui/Layout'
import type { SplitDraft } from '../SplitTool'
import { createFarmMap, type FarmMap as Handle } from './olFarm'
import { SplitOnMap } from './SplitOnMap'

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
}

/** His fields on the real satellite photo. Loaded only when a map is shown. */
export default function FarmMap({ scenario, focus, only, mode, label, split, drawn, fill }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const [fm, setFm] = useState<Handle | null>(null)
  const [large, setLarge] = useState(false)
  const keysId = useId()
  const explore = mode === 'explore'
  const onlyKey = only?.join()

  useEffect(() => {
    if (!el.current) return
    const h = createFarmMap(el.current, scenario, { interactive: explore, focus, only, drawn })
    setFm(h)
    return () => {
      setFm(null)
      h.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, focus, onlyKey, explore, drawn])

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
    </div>
  )
}
