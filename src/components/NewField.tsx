import { Suspense, useEffect, useMemo, useState } from 'react'
import { bar, drawField, en, fieldEdit as copy, formatDateYear, formatHa, map, tasks } from '../copy/en'
import { CROPS, type Crop, type Polygon } from '../data/scenarios'
import { areaWithout } from '../logic/geometry'
import { drawnHa, type DrawContext } from '../logic/drawing'
import { DrawIsland, useFieldDraw } from './DrawTool'
import type { TaskId } from '../logic/application'
import type { NewField } from '../state/actions'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { Field } from '../ui/Field'
import { Inline, Stack, Text } from '../ui/Layout'
import { MapStage, StageAction } from '../ui/MapStage'
import { RadioGroup } from '../ui/RadioGroup'
import { ActionBar } from './ActionBar'
import { useApp } from './AppContext'
import { FarmMap, MapFallback } from './TaskBodies'
import { ChoiceButtons } from '../ui/ChoiceButtons'
import { useYardDraft, YardIsland } from './YardTool'
import type { Flow } from './useApplicationFlow'


/** A new field in one line: its name, area and crop. */
export const fieldLine = (f: NewField) => copy.line(f.name, formatHa(f.areaHa), en.crops[f.crop].toLowerCase())

/** A still picture of the parcel he bought, his other fields faint around it. */
function BoughtPreview({ field }: { field?: NewField }) {
  const { derived } = useApp()
  const s = derived.scenario
  // Once he has drawn it, his field and its name; before that, the parcel as the land registry has it.
  const yard = s.bought!.yard
  const spot = field
    ? { polygon: field.polygon, label: field.name, yard: field.yard && { polygon: field.yard, label: copy.yard.house, settled: true } }
    : { polygon: s.bought!.polygon, label: tasks.title.field_bought, yard: yard && { polygon: yard, label: copy.yard.house } }
  return (
    <figure className="map-figure">
      <Suspense fallback={<MapFallback mode="preview" />}>
        <FarmMap scenario={s} mode="preview" skip={field?.id} spot={spot} label={`${map.title}: ${tasks.bought.context(formatDateYear(s.bought!.on))}`} />
      </Suspense>
    </figure>
  )
}

/**
 * The land registry shows a parcel in his name since last year: the place on the photo, and the way in to
 * answer beside the map, like the other land changes. Once added, the field in one line.
 */
export function BoughtBody() {
  const { state, go } = useApp()
  const field = state.answers.newFields.find((f) => f.landId === 'bought')
  return (
    <Stack gap="section">
      <div className="map-link" onClick={() => go('review', 'field_bought')}>
        <BoughtPreview field={field} />
      </div>
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

type Stage = 'place' | 'draw' | 'yard' | 'details'

/**
 * Adding a field on the satellite photo, the land taken whole as the record has it: where it is (the parcel
 * he bought, or registered farmland he taps), then its name and crop. Saved whole at the end, so nothing
 * half-done counts. It joins his land, so the measures he chooses cover it like his other fields.
 */
export function FieldEditor({ id, flow }: { id: string; flow: Flow }) {
  const { derived, state, dispatch, go } = useApp()
  const s = derived.scenario
  const existing = state.answers.newFields.find((f) => f.id === id || (id === 'bought' && f.landId === 'bought'))
  const isBought = id === 'bought'
  const [landId, setLandId] = useState<string | null>(existing?.landId ?? (isBought ? 'bought' : null))
  const land = landId === 'bought' ? s.bought! : s.otherLand.find((l) => l.id === landId)
  // A field he draws can go on any registered farmland, his own fields included, but can't take land he declares.
  const ctx = useMemo<DrawContext>(() => {
    const others = state.answers.newFields.filter((f) => f.id !== existing?.id)
    return {
      farmland: [...s.otherLand.map((l) => l.polygon), ...s.fields.flatMap((f) => [f.polygon, ...(f.land ? [f.land] : [])]), ...(s.bought ? [s.bought.polygon] : [])],
      fields: [...s.fields.map((f) => ({ name: en.fields[f.id], polygon: f.polygon })), ...others.map((f) => ({ name: f.name, polygon: f.polygon }))],
    }
  }, [s, state.answers.newFields, existing?.id])
  const d = useFieldDraw(ctx, existing?.landId === 'drawn' ? existing.polygon : undefined)
  const drawing = landId === 'drawn'
  const polygon = drawing ? (d.closed ? d.corners : undefined) : (existing?.polygon ?? land?.polygon)
  const recordHa = drawing ? drawnHa(d.corners) : (land?.areaHa ?? existing?.areaHa ?? 0)
  // A house the photo shows on the parcel he bought: GSA's outline, or the one he saved.
  const yardStart = landId === 'bought' ? (existing?.yard ?? s.bought?.yard) : undefined
  const yd = useYardDraft(polygon ?? [], recordHa, yardStart ?? [])
  const [leftOut, setLeftOut] = useState(existing ? !!existing.yard : true)
  const yard = yardStart && leftOut ? yd.yard : undefined
  const areaHa = polygon ? areaWithout(polygon, recordHa, yard) : 0
  const [stage, setStage] = useState<Stage>(polygon ? (yardStart ? 'yard' : 'details') : 'place')
  const toDraw = () => {
    setLandId('drawn')
    setStage('draw')
  }
  const [name, setName] = useState(existing?.name ?? '')
  const [nameError, setNameError] = useState<string>()
  const [cropError, setCropError] = useState<string>()
  const [crop, setCrop] = useState<Crop | null>(existing?.crop ?? null)
  // With the land already known, there is no place to pick; a field he draws has the drawing as its own step.
  const of = drawing ? 3 : 2
  const step = stage === 'place' ? 1 : stage === 'draw' || !drawing ? 2 : 3
  const title = existing?.name ?? (isBought ? tasks.title.field_bought : copy.yourField)
  const back = () => go('welcome')

  useEffect(() => {
    window.scrollTo(0, 0)
    document.querySelector('.map-stage-panel')?.scrollTo(0, 0)
    document.getElementById('field-title')?.focus({ preventScroll: true })
  }, [stage, yd.editing, d.closed])

  // On a keyboard, undo and redo work as everywhere else while he edits the yard.
  useEffect(() => {
    if (!yd.editing || stage !== 'yard') return
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) yd.redo()
        else yd.undo()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  })

  const save = (shape: Polygon) => {
    const field: NewField = { id: existing?.id ?? (isBought ? 'bought' : `f${Date.now().toString(36)}`), landId: landId!, polygon: shape, areaHa: drawing ? drawnHa(shape) : areaHa, name: name.trim(), crop: crop!, ...(yard ? { yard } : {}) }
    dispatch({ type: 'save_field', field })
    const task: TaskId = isBought ? 'field_bought' : `added_${field.id}`
    go('welcome')
    flow.show(task)
  }

  // Back sits beside the step, as on every map task, and never loses what he has done.
  const backFn =
    stage === 'draw'
      ? () => (d.closed && !existing ? d.undo() : setStage(existing ? 'details' : 'place'))
      : stage === 'yard'
        ? yd.editing
          ? () => yd.setEditing(false)
          : isBought
            ? () => go('review', 'field_bought')
            : undefined
        : stage === 'details'
          ? yardStart
            ? () => setStage('yard')
            : !(isBought || existing)
              ? () => {
                  if (drawing) return setStage('draw')
                  setLandId(null)
                  setStage('place')
                }
              : undefined
          : undefined
  const stepHint = !(isBought || existing) && <p className="hint">{copy.step(step, of)}</p>
  const head = (
    <header className="review-head">
      {backFn ? (
        <div className="split-nav">
          <Button onClick={backFn}>
            <Icon name="back" size="sm" />
            {bar.back}
          </Button>
          {stepHint}
        </div>
      ) : (
        stepHint
      )}
      <h2 id="field-title" tabIndex={-1}>
        {stage === 'place' ? copy.place : stage === 'draw' ? (d.closed ? drawField.editTitle : drawField.title) : stage === 'yard' ? (yd.editing ? copy.yard.editTitle : copy.yard.title) : copy.details}
      </h2>
      {polygon && stage !== 'draw' && <p className="hint">{yard ? copy.yard.without(formatHa(areaHa)) : formatHa(areaHa)}</p>}
    </header>
  )

  const yardStage = polygon && stage === 'yard' && (
    <MapStage
      label={title}
      working={yd.editing}
      answering={!yd.editing}
      map={
        <Suspense fallback={<MapFallback mode="explore" fill />}>
          <FarmMap
            scenario={s}
            mode="explore"
            fill
            label={`${map.title}: ${title}`}
            spot={{ polygon, label: title, above: true }}
            skip={existing?.id}
            yard={{ d: yd, interactive: yd.editing }}
            dock={yd.editing ? <YardIsland d={yd} /> : undefined}
          />
        </Suspense>
      }
    >
      {head}
      {!yd.editing && <Text variant="secondary">{copy.yard.why}</Text>}
      <StageAction>
        <Stack gap="sm">
          {yd.editing ? (
            <Inline>
              <Button variant="primary" onClick={() => { setLeftOut(true); setStage('details') }}>{copy.yard.done}</Button>
            </Inline>
          ) : (
            <ChoiceButtons
              legend={copy.yard.title}
              options={[
                { value: 'yes' as const, label: copy.yard.yes },
                { value: 'no' as const, label: copy.yard.no },
              ]}
              onChoose={(v) => {
                if (v === 'yes') {
                  setLeftOut(true)
                  setStage('details')
                } else yd.setEditing(true)
              }}
            />
          )}
          {!yd.editing && (
            <div>
              <Button onClick={() => { setLeftOut(false); setStage('details') }}>{copy.yard.none}</Button>
            </div>
          )}
        </Stack>
      </StageAction>
    </MapStage>
  )

  // Drawing it corner by corner, then pulling its edges into place.
  const drawStage = stage === 'draw' && (
    <MapStage
      key="draw"
      label={title}
      working
      map={
        <Suspense fallback={<MapFallback mode="explore" fill />}>
          <FarmMap
            scenario={s}
            mode="explore"
            fill
            label={`${map.title}: ${drawField.title}`}
            lands={s.otherLand.map((l) => ({ id: l.id, polygon: l.polygon, label: '' }))}
            skip={existing?.id}
            draw={{ d, fields: ctx.fields.map((f) => f.polygon) }}
            dock={<DrawIsland d={d} onCreate={d.close} />}
          />
        </Suspense>
      }
    >
      {head}
      {/* The area, always measured: what he has, or what he would have with a corner at the cross. */}
      {d.preview.length >= 3 && (
        <p className="draw-area" data-mark={d.mark} aria-hidden="true">
          {formatHa(d.areaHa)}
        </p>
      )}
      <Text variant="secondary">{d.closed ? drawField.editHint : d.corners.length === 0 ? <>{drawField.start} <span className="fine-only">{drawField.startMouse}</span></> : d.corners.length < 3 ? drawField.next : drawField.three}</Text>
      <StageAction>
        <Inline>
          {d.closed && (
            <Button variant="primary" aria-disabled={!!d.issues.length || undefined} onClick={() => !d.issues.length && setStage('details')}>
              {drawField.continue}
              <Icon name="forward" size="sm" />
            </Button>
          )}
        </Inline>
      </StageAction>
    </MapStage>
  )

  return (
    <>
      {drawStage ? (
        drawStage
      ) : yardStage ? (
        yardStage
      ) : polygon ? (
        <MapStage
          label={title}
          map={
            <Suspense fallback={<MapFallback mode="explore" fill />}>
              <FarmMap scenario={s} mode="explore" fill label={`${map.title}: ${title}`} spot={{ polygon, label: title, above: !!yard }} skip={existing?.id} yard={yard ? { d: yd, interactive: false, settled: true } : undefined} />
            </Suspense>
          }
        >
          {head}
            <form
              className="flex flex-col gap-6"
              onSubmit={(e) => {
                e.preventDefault()
                setNameError(name.trim() ? undefined : copy.nameError)
                setCropError(crop ? undefined : copy.cropError)
                if (!name.trim() || !crop) {
                  // The name field takes focus itself; with the name in, focus goes to the crops.
                  if (name.trim()) (e.currentTarget.querySelector('[role=radio]') as HTMLElement | null)?.focus()
                  return
                }
                save(polygon)
              }}
            >
              <Field label={copy.name} hint={copy.nameHint} error={nameError} value={name} onChange={(e) => setName(e.target.value)} />
              <RadioGroup legend={copy.crop} options={CROPS.map((c) => ({ value: c, label: en.crops[c] }))} value={crop} error={cropError} onChange={(c) => { setCrop(c); setCropError(undefined) }} />
              {drawing && (
                <div>
                  <Button onClick={() => setStage('draw')}>{copy.edges}</Button>
                </div>
              )}
              {existing && !isBought && (
                <div>
                  <Button
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
                  <Button type="submit" variant="primary">{existing ? copy.saveChanges : copy.save}</Button>
                </Inline>
              </StageAction>
            </form>
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
            <div className="flex flex-col gap-[var(--gap-inline)]">
              {s.otherLand.map((l) => (
                <Button
                  key={l.id}
                  variant="choice"
                  onClick={() => {
                    setLandId(l.id)
                    setStage('details')
                  }}
                >
                  {copy.landChoice(copy.landNames[l.id] ?? copy.landLabel, formatHa(l.areaHa))}
                </Button>
              ))}
              {/* Only part of it, or somewhere else: he draws it himself. */}
              <Button variant="choice" onClick={toDraw}>
                <Icon name="edit" size="sm" />
                {copy.draw}
              </Button>
            </div>
          </StageAction>
        </MapStage>
      )}
      <ActionBar back={{ label: <span>{map.back}<span className="back-more">{map.backMore}</span></span>, onClick: back }} forwardIsPrimary={false} next={null} onPick={(task) => flow.show(task)} />
    </>
  )
}
