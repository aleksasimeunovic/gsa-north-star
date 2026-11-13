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
import { StepHeader } from '../ui/StepHeader'
import { Field } from '../ui/Field'
import { Inline, Stack, Text } from '../ui/Layout'
import { MapStage, PanelHead, StageAction } from '../ui/MapStage'
import { RadioGroup } from '../ui/RadioGroup'
import { ActionBar } from './ActionBar'
import { useApp } from './AppContext'
import { FarmMap, MapFallback } from './TaskBodies'
import { ChoiceButtons } from '../ui/ChoiceButtons'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useYardDraft, YardIsland } from './YardTool'
import type { Flow } from './useApplicationFlow'


/** A new field in one line: its name, area and crop. */
export const fieldLine = (f: NewField) => copy.line(f.name, formatHa(f.areaHa), en.crops[f.crop])

/** Deleting a field he added: red, apart from the way forward, and asked once more before it happens. */
function DeleteField({ name, onDelete }: { name?: string; onDelete: () => void }) {
  const [asking, setAsking] = useState(false)
  return (
    <>
      <Button variant="danger" className="action-apart" onClick={() => setAsking(true)}>
        <Icon name="delete" size="sm" />
        {copy.remove}
      </Button>
      <ConfirmDialog
        open={asking}
        title={copy.removeAsk(name)}
        confirm={copy.remove}
        cancel={copy.removeNo}
        onCancel={() => setAsking(false)}
        onConfirm={() => {
          setAsking(false)
          onDelete()
        }}
      >
        <p>{copy.removeNote}</p>
      </ConfirmDialog>
    </>
  )
}

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
    <Suspense fallback={<MapFallback mode="preview" />}>
      <FarmMap scenario={s} mode="preview" skip={field?.id} spot={spot} label={`${map.title}: ${tasks.bought.context(formatDateYear(s.bought!.on))}`} />
    </Suspense>
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
      {/* The same shape as the other land cards, so the preview takes the room the card has. */}
      <figure className="map-figure">
        <div className="map-link" onClick={() => go('review', 'field_bought')}>
          <BoughtPreview field={field} />
        </div>
      </figure>
    </Stack>
  )
}

/** A field he added: what it is, where, and a way back into it. */
export function AddedBody({ id }: { id: string }) {
  const { state, derived, go, dispatch } = useApp()
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
        <Inline>
          <Button onClick={() => go('field', field.id)}>{copy.change}</Button>
          <DeleteField name={field.name} onDelete={() => dispatch({ type: 'remove_field', id: field.id })} />
        </Inline>
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

  /** Any field he added can go: a saved one leaves his land, one just drawn is wiped, the parcel he bought isn't farmed. */
  const remove = () => {
    if (isBought) {
      dispatch({ type: 'answer_bought', answer: 'no' })
      return go('review', 'field_bought')
    }
    if (existing) {
      dispatch({ type: 'remove_field', id: existing.id })
      return back()
    }
    d.clear()
    setLandId(null)
    setStage('place')
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
  // Where he is, then the heading and what it introduces: two groups, a section apart.
  const head = (
    <>
      {(backFn || !(isBought || existing)) && <StepHeader step={step} of={isBought || existing ? 0 : of} label={isBought || existing ? '' : copy.step(step, of)} back={backFn && { label: bar.back, onClick: backFn }} />}
      <PanelHead id="field-title" title={stage === 'place' ? copy.place : stage === 'draw' ? (d.closed ? drawField.editTitle : drawField.title) : stage === 'yard' ? (yd.editing ? copy.yard.editTitle : copy.yard.title) : copy.details}>
        {polygon && stage !== 'draw' && <p className="hint">{yard ? copy.yard.without(formatHa(areaHa)) : formatHa(areaHa)}</p>}
        {/* Its edges decide its size, so the way back to them sits with the size. */}
        {stage === 'details' && drawing && (
          <div>
            <Button onClick={() => setStage('draw')}>
              <Icon name="edit" size="sm" />
              {copy.edges}
            </Button>
          </div>
        )}
        {stage === 'yard' && !yd.editing && <Text variant="secondary">{copy.yard.why}</Text>}
        {stage === 'place' && <Text>{copy.placeHint}</Text>}
        {stage === 'draw' && <Text variant="secondary">{d.closed ? drawField.editHint : d.corners.length === 0 ? drawField.start : d.corners.length < 3 ? drawField.next : drawField.three}</Text>}
      </PanelHead>
    </>
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
      <StageAction>
        {yd.editing ? (
          <Inline>
            <Button variant="primary" onClick={() => { setLeftOut(true); setStage('details') }}>{copy.yard.done}</Button>
          </Inline>
        ) : (
          // The heading asks; the three answers are three buttons of the same weight.
          <ChoiceButtons
            quiet
            legend={copy.yard.title}
            options={[
              { value: 'yes' as const, label: copy.yard.yes },
              { value: 'no' as const, label: copy.yard.no, icon: 'edit' as const },
              { value: 'none' as const, label: copy.yard.none, icon: 'no' as const },
            ]}
            onChoose={(v) => {
              if (v === 'no') return yd.setEditing(true)
              setLeftOut(v === 'yes')
              setStage('details')
            }}
          />
        )}
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
      {d.closed && (
        <StageAction>
          <Inline>
            <Button variant="primary" aria-disabled={!!d.issues.length || undefined} onClick={() => !d.issues.length && setStage('details')}>
              {drawField.continue}
              <Icon name="forward" size="sm" />
            </Button>
            {/* Deleting is there as soon as the field exists, so a wrong drawing never has to be undone corner by corner. */}
            <DeleteField name={existing?.name} onDelete={remove} />
          </Inline>
        </StageAction>
      )}
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
              className="flex flex-col gap-[var(--gap-section)]"
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
              <Field label={copy.name} example={copy.nameExample} error={nameError} value={name} onChange={(e) => setName(e.target.value)} />
              <RadioGroup legend={copy.crop} options={CROPS.map((c) => ({ value: c, label: en.crops[c] }))} value={crop} error={cropError} onChange={(c) => { setCrop(c); setCropError(undefined) }} />
              <StageAction>
                <Inline>
                  <Button type="submit" variant="primary">{existing ? copy.saveChanges : copy.save}</Button>
                  {(existing || drawing) && <DeleteField name={name.trim() || existing?.name} onDelete={remove} />}
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
          <StageAction>
            <div className="flex flex-col gap-[var(--gap-buttons)]">
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
