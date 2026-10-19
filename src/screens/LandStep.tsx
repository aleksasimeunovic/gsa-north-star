import { useEffect, useRef, useState } from 'react'
import { en, formatHa, ui, wiz } from '../copy/en'
import type { FieldId } from '../data/scenarios'
import { overlapping, roundHa } from '../logic/geometry'
import type { Status } from '../logic/status'
import { useApp } from '../components/AppContext'
import { ChangeCard } from '../components/ChangeCard'
import { FieldMap, MapLegend } from '../components/FieldMap'
import { SplitControls, SplitOverlay, useSplitDraft } from '../components/SplitTool'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Stack, Text } from '../ui/Layout'
import { StatusBadge } from '../ui/StatusBadge'
import { Note } from '../ui/Note'

/** Land: map-first. Opens on the changed field; all fields still shown. */
export function LandStep({ target }: { target: string | null }) {
  const { derived, state, dispatch, go } = useApp()
  const { scenario, items, wizard } = derived
  const step = wizard.steps.find((s) => s.id === 'land')!
  const fromTarget = target?.startsWith('item-field_') ? (target.slice(11) as FieldId) : null
  const fromFocus = step.focusItemId?.startsWith('field_') ? (step.focusItemId.slice(6) as FieldId) : null
  const [selected, setSelected] = useState<FieldId>(fromTarget ?? fromFocus ?? scenario.fields[0].id)
  useEffect(() => {
    if (fromTarget) setSelected(fromTarget)
  }, [fromTarget])

  const statusOf = (id: FieldId): Status => items.find((i) => i.id === `field_${id}`)!.status
  const river = scenario.fields.find((f) => f.id === 'river')
  const svgRef = useRef<SVGSVGElement>(null)
  const draft = useSplitDraft(river ?? scenario.fields[0], state.answers.river.split)
  const [editingSplit, setEditingSplit] = useState(false)

  const riverYes = !scenario.firstYear && state.answers.river.answer === 'yes'
  const splitting = selected === 'river' && riverYes && (!state.answers.river.split || editingSplit)
  const showSplit = riverYes && (splitting || !!state.answers.river.split)

  const field = scenario.fields.find((f) => f.id === selected)!
  const parcels = overlapping(field.polygon, scenario.parcels).map((p) => p.label).join(' and ')
  const blocks = overlapping(field.polygon, scenario.blocks).map((p) => p.label).join(' and ')
  const carryOn = () => go('land', `item-field_${selected}`)

  const panelBody = () => {
    if (scenario.firstYear) return <Text>{en.itemDetail.field_to_draw}</Text>
    const sig = field.signal
    if (sig?.kind === 'satellite_difference') {
      const r = state.answers.river
      if (r.answer === null || (r.answer === 'no' && r.noOption === null)) return <ChangeCard bare id="river" onCarryOn={carryOn} />
      if (r.answer === 'yes') {
        if (splitting)
          return (
            <SplitControls
              field={field}
              d={draft}
              onConfirm={(split) => {
                dispatch({ type: 'set_split', split })
                setEditingSplit(false)
              }}
            />
          )
        const s = r.split!
        return (
          <Stack gap="sm">
            <Text variant="strong">
              {wiz.split.done(
                `${draft.result ? formatHa(draft.result.areasHa[0]) : ''} ${en.crops[s.crops[0]!].toLowerCase()}`,
                `${draft.result ? formatHa(draft.result.areasHa[1]) : ''} ${en.crops[s.crops[1]!].toLowerCase()}`,
              )}
            </Text>
            <div>
              <Button variant="link" onClick={() => setEditingSplit(true)}>{wiz.split.edit}</Button>
            </div>
          </Stack>
        )
      }
      if (r.noOption === 'redraw') {
        return r.redrawn ? (
          <Text>{en.itemDetail.river_redrawn}</Text>
        ) : (
          <Stack gap="sm">
            <Text>{ui.river.redrawNext}</Text>
            <Text variant="small">{wiz.land.redrawSimplified}</Text>
            <div>
              <Button onClick={() => dispatch({ type: 'river_redrawn' })}>{wiz.land.redrawConfirm}</Button>
            </div>
          </Stack>
        )
      }
      return <Banner>{ui.river.fieldCheckDone}</Banner>
    }
    if (sig?.kind === 'road_strip') {
      const r = state.answers.road
      if (r.answer === null || (r.answer === 'no' && !r.correctionRequested)) return <ChangeCard bare id="road" onCarryOn={carryOn} />
      const left = formatHa(roundHa(field.areaHa - sig.stripHa))
      if (r.answer === 'yes')
        return (
          <Stack gap="sm">
            <Text variant="strong">{ui.road.done(formatHa(sig.stripHa), left)}</Text>
            <Text>{wiz.land.roadArea(left)}</Text>
          </Stack>
        )
      return <Banner>{ui.road.correctionAsked}</Banner>
    }
    return <Text>{wiz.land.unchanged}</Text>
  }

  return (
    <Stack gap="md">
      <Text>{scenario.firstYear ? wiz.land.introFirst : wiz.land.intro}</Text>
      <div><Note kind="tested" /></div>
      <div className="land-layout">
        <div className="land-map">
          <FieldMap
            scenario={scenario}
            selectedId={selected}
            statusOf={statusOf}
            onSelect={setSelected}
            svgRef={svgRef}
            overlay={showSplit && river && <SplitOverlay field={river} d={draft} svgRef={svgRef} interactive={splitting} />}
          />
        </div>
        <div className="land-side">
          <Card id={`item-field_${selected}`} title={en.fields[selected]} status={statusOf(selected)}>
            <Stack gap="sm">
              <Text variant="small">
                {formatHa(field.areaHa)} · {wiz.land.lastYearCrop(en.crops[field.cropLastYear])}
              </Text>
              {panelBody()}
              <Text variant="small">
                {blocks && wiz.land.inBlock(blocks)} {parcels && wiz.land.onParcels(parcels)}
              </Text>
            </Stack>
          </Card>
        </div>
      </div>

      <section aria-labelledby="fields-title">
        <h2 id="fields-title">{wiz.land.fieldsTitle}</h2>
        <ul className="field-list">
          {scenario.fields.map((f) => (
            <li key={f.id}>
              <button type="button" className="field-row" aria-pressed={selected === f.id} onClick={() => setSelected(f.id)}>
                <span className="field-row-name">{en.fields[f.id]}</span>
                <span className="field-row-meta">
                  {formatHa(f.areaHa)} · {en.crops[f.cropLastYear]}
                </span>
              </button>
              <StatusBadge status={statusOf(f.id)} />
            </li>
          ))}
        </ul>
      </section>

      <MapLegend />
    </Stack>
  )
}
