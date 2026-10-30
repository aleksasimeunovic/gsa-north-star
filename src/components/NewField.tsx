import { Suspense, useEffect, useState } from 'react'
import { bar, en, fieldEdit as copy, formatDateYear, formatHa, formatNumber, map, records, tasks } from '../copy/en'
import { CROPS, LAND_MEASURES, type Crop, type MeasureId, type Polygon } from '../data/scenarios'
import type { TaskId } from '../logic/application'
import { polygonAreaHa, roundHa } from '../logic/geometry'
import type { Item } from '../logic/status'
import type { NewField } from '../state/actions'
import { Button } from '../ui/Button'
import { Checkbox } from '../ui/Checkbox'
import { Field } from '../ui/Field'
import { Inline, Stack, Text } from '../ui/Layout'
import { MapStage, StageAction } from '../ui/MapStage'
import { RadioGroup } from '../ui/RadioGroup'
import { ActionBar } from './ActionBar'
import { useApp, type AppCtx } from './AppContext'
import type { RecordRow } from './Records'
import { FarmMap, MapFallback } from './TaskBodies'
import type { Flow } from './useApplicationFlow'

type Derived = AppCtx['derived']
type State = AppCtx['state']

/** A new field in one line: its name, area and crop. */
export const fieldLine = (f: NewField) => copy.line(f.name, formatHa(roundHa(polygonAreaHa(f.polygon))), en.crops[f.crop].toLowerCase())

/** The herd's second line in his records: his own number next to the registry's, while it is checked. */
export function herdLine(item?: Item): string | undefined {
  if (item?.detail === 'herd_settled') return undefined
  return item?.conflict ? records.youSaid(String(item.conflict.his)) : undefined
}

/** The parcel he bought and the fields he added, as lines in his land records. */
export function newFieldRows(derived: Derived, state: State): RecordRow[] {
  const s = derived.scenario
  const a = state.answers
  const rows: RecordRow[] = []
  if (s.bought) {
    const field = a.newFields.find((f) => f.landId === 'bought')
    rows.push(
      field
        ? { key: 'bought', label: field.name, value: fieldLine(field).slice(field.name.length + 2), source: 'confirmed', edit: { screen: 'field/bought' } }
        : a.bought.answer === 'no'
          ? { key: 'bought', label: tasks.title.field_bought, value: tasks.bought.notFarmed, source: 'confirmed', edit: { open: 'field_bought' } }
          : { key: 'bought', label: tasks.title.field_bought, value: formatHa(s.bought.areaHa), source: 'records', edit: { open: 'field_bought' } },
    )
  }
  for (const f of a.newFields.filter((x) => x.landId !== 'bought')) {
    rows.push({ key: f.id, label: f.name, value: fieldLine(f).slice(f.name.length + 2), source: 'confirmed', edit: { screen: `field/${f.id}` } })
  }
  return rows
}

/** A still picture of the parcel he bought, his other fields faint around it. */
function BoughtPreview({ field }: { field?: NewField }) {
  const { derived } = useApp()
  const s = derived.scenario
  // Once he has drawn it, his field and its name; before that, the parcel as the land registry has it.
  const spot = field ? { polygon: field.polygon, label: field.name } : { polygon: s.bought!.polygon, label: tasks.title.field_bought }
  return (
    <figure className="map-figure">
      <Suspense fallback={<MapFallback mode="preview" />}>
        <FarmMap scenario={s} mode="preview" skip={field?.id} spot={spot} label={`${map.title}: ${tasks.bought.context(formatDateYear(s.bought!.on))}`} />
      </Suspense>
    </figure>
  )
}

/**
 * The land registry shows a parcel in his name since last year. The fact, the place on the photo, and his
 * question: does he farm it this year? Yes adds the whole parcel as a field; No leaves it out.
 */
export function BoughtBody({ Question }: { Question: (p: { legend: string; value: 'yes' | 'no' | null; answer?: string; onAnswer: (a: 'yes' | 'no') => void }) => JSX.Element }) {
  const { derived, state, dispatch, go } = useApp()
  const s = derived.scenario
  const a = state.answers.bought
  const field = state.answers.newFields.find((f) => f.landId === 'bought')
  const b = tasks.bought
  return (
    <Stack gap="section">
      {a.answer === null ? (
        <Text>{b.context(formatDateYear(s.bought!.on))}</Text>
      ) : (
        field && <Text>{fieldLine(field)}</Text>
      )}
      <BoughtPreview field={field} />
      <Question legend={b.question} value={a.answer} answer={a.answer === 'yes' ? b.yes : b.no} onAnswer={(answer) => dispatch({ type: 'answer_bought', answer })} />
      {a.answer === 'yes' && (
        <StageAction>
          <Button variant={field ? 'secondary' : 'primary'} onClick={() => go('field', 'bought')}>
            {field ? copy.change : b.draw}
          </Button>
        </StageAction>
      )}
    </Stack>
  )
}

/** A field he added: what it is, where, and a way back into it. */
export function AddedBody({ id }: { id: string }) {
  const { state, derived, go } = useApp()
  const field = state.answers.newFields.find((f) => `added_${f.id}` === id)
  if (!field) return null
  return (
    <Stack gap="section">
      <Text>{fieldLine(field)}</Text>
      <figure className="map-figure">
        <Suspense fallback={<MapFallback mode="preview" />}>
          <FarmMap scenario={derived.scenario} mode="preview" skip={field.id} spot={{ polygon: field.polygon, label: field.name }} label={`${map.title}: ${field.name}`} />
        </Suspense>
      </figure>
      <StageAction>
        <Button onClick={() => go('field', field.id)}>{copy.change}</Button>
      </StageAction>
    </Stack>
  )
}

type Stage = 'place' | 'details' | 'measures'

/**
 * Adding a field on the satellite photo, the land taken whole as the record has it: where it is (the parcel
 * he bought, or registered farmland he taps), its name and crop, then the measures he applies for on it.
 * Saved whole at the end, so nothing half-done counts.
 */
export function FieldEditor({ id, flow }: { id: string; flow: Flow }) {
  const { derived, state, dispatch, go } = useApp()
  const s = derived.scenario
  const existing = state.answers.newFields.find((f) => f.id === id || (id === 'bought' && f.landId === 'bought'))
  const isBought = id === 'bought'
  const [landId, setLandId] = useState<string | null>(existing?.landId ?? (isBought ? 'bought' : null))
  const polygon = existing?.polygon ?? (landId === 'bought' ? s.bought!.polygon : s.otherLand.find((l) => l.id === landId)?.polygon)
  const [stage, setStage] = useState<Stage>(polygon ? 'details' : 'place')
  const [name, setName] = useState(existing?.name ?? '')
  const [nameError, setNameError] = useState<string>()
  const [crop, setCrop] = useState<Crop | null>(existing?.crop ?? null)
  const [chosen, setChosen] = useState<MeasureId[]>(existing?.measures ?? [])
  // With the land already known, there is no place to pick.
  const of = isBought || existing ? 2 : 3
  const step = stage === 'place' ? 1 : stage === 'details' ? of - 1 : of
  const title = existing?.name ?? (isBought ? tasks.title.field_bought : copy.yourField)
  const back = () => go('welcome')

  useEffect(() => {
    window.scrollTo(0, 0)
    document.querySelector('.map-stage-panel')?.scrollTo(0, 0)
    document.getElementById('field-title')?.focus({ preventScroll: true })
  }, [stage])

  const save = (shape: Polygon) => {
    const field: NewField = { id: existing?.id ?? (isBought ? 'bought' : `f${Date.now().toString(36)}`), landId: landId!, polygon: shape, name: name.trim(), crop: crop!, measures: chosen }
    dispatch({ type: 'save_field', field })
    const task: TaskId = isBought ? 'field_bought' : `added_${field.id}`
    go('welcome')
    flow.show(task)
  }

  const head = (
    <header className="review-head">
      <p className="hint">{copy.step(step, of)}</p>
      <h2 id="field-title" tabIndex={-1}>{stage === 'place' ? copy.place : stage === 'details' ? copy.details : copy.measures}</h2>
      {polygon && <p className="hint">{formatHa(roundHa(polygonAreaHa(polygon)))}</p>}
    </header>
  )

  return (
    <>
      {polygon ? (
        <MapStage
          label={title}
          map={
            <Suspense fallback={<MapFallback mode="explore" fill />}>
              <FarmMap scenario={s} mode="explore" fill label={`${map.title}: ${title}`} spot={{ polygon, label: title }} skip={existing?.id} />
            </Suspense>
          }
        >
          {head}
          {stage === 'measures' ? (
            <>
              <div className="flex flex-col gap-2">
                {LAND_MEASURES.filter((m) => s.measures.find((x) => x.id === m)?.fits).map((m) => {
                  const rate = s.measures.find((x) => x.id === m)?.rateDinars
                  return (
                    <Checkbox
                      key={m}
                      card
                      label={en.measures[m]}
                      hint={rate ? copy.perHa(formatNumber(rate)) : tasks.measures.pays[m]}
                      checked={chosen.includes(m)}
                      onChange={(on) => setChosen(on ? [...chosen, m] : chosen.filter((x) => x !== m))}
                    />
                  )
                })}
              </div>
              <StageAction>
                <Inline>
                  <Button onClick={() => setStage('details')}>{bar.back}</Button>
                  <Button variant="primary" onClick={() => save(polygon)}>{existing ? copy.saveChanges : chosen.length ? copy.save : copy.saveNone}</Button>
                </Inline>
              </StageAction>
            </>
          ) : (
            <form
              className="flex flex-col gap-6"
              onSubmit={(e) => {
                e.preventDefault()
                if (!name.trim()) return setNameError(copy.nameError)
                setNameError(undefined)
                if (crop) setStage('measures')
              }}
            >
              <Field label={copy.name} hint={copy.nameHint} error={nameError} value={name} onChange={(e) => setName(e.target.value)} />
              <RadioGroup legend={copy.crop} options={CROPS.map((c) => ({ value: c, label: en.crops[c] }))} value={crop} onChange={setCrop} />
              {existing && !isBought && (
                <div>
                  <Button
                    variant="link"
                    onClick={() => {
                      dispatch({ type: 'remove_field', id: existing.id })
                      back()
                    }}
                  >
                    {copy.remove}
                  </Button>
                </div>
              )}
              <StageAction>
                <Inline>
                  {of === 3 && (
                    <Button
                      onClick={() => {
                        setLandId(null)
                        setStage('place')
                      }}
                    >
                      {bar.back}
                    </Button>
                  )}
                  <Button type="submit" variant="primary" disabled={!crop}>{copy.next}</Button>
                </Inline>
              </StageAction>
            </form>
          )}
        </MapStage>
      ) : (
        <MapStage
          label={copy.titleNew}
          map={
            <Suspense fallback={<MapFallback mode="explore" fill />}>
              <FarmMap
                scenario={s}
                mode="explore"
                fill
                label={`${map.title}: ${copy.placeHint}`}
                lands={s.otherLand.map((l) => ({ id: l.id, polygon: l.polygon, label: copy.landLabel }))}
                onPickLand={(lid) => {
                  setLandId(lid)
                  setStage('details')
                }}
              />
            </Suspense>
          }
        >
          {head}
          <Text>{copy.placeHint}</Text>
          <StageAction>
            <div className="flex flex-col gap-2">
              {s.otherLand.map((l) => (
                <Button
                  key={l.id}
                  variant="choice"
                  onClick={() => {
                    setLandId(l.id)
                    setStage('details')
                  }}
                >
                  {copy.landChoice(copy.landNames[l.id] ?? copy.landLabel, formatHa(roundHa(polygonAreaHa(l.polygon))))}
                </Button>
              ))}
            </div>
          </StageAction>
        </MapStage>
      )}
      <ActionBar back={{ label: map.back, onClick: back }} forwardIsPrimary={false} next={null} onPick={(task) => flow.show(task)} />
    </>
  )
}
