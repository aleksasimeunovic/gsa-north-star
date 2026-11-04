import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { en, formatHa, map, split, tasks } from '../copy/en'
import type { Field, FieldId } from '../data/scenarios'
import { ActionBar } from '../components/ActionBar'
import { useApp } from '../components/AppContext'
import { CropsStep, EffectsStep, LineStep, LineTools, partLabels, useSplitDraft } from '../components/SplitTool'
import { FarmMap, MapFacts, MapFallback, RoadDispute, mapContext, taskSummary } from '../components/TaskBodies'
import type { Flow } from '../components/useApplicationFlow'
import type { YesNo } from '../state/actions'
import { Button } from '../ui/Button'
import { ChoiceButtons } from '../ui/ChoiceButtons'
import { Compare, Text, VisuallyHidden } from '../ui/Layout'
import { Answers } from '../ui/Fact'
import { MapStage, StageAction } from '../ui/MapStage'
import { Note } from '../ui/Note'
import { ToolSwitch } from '../ui/MapTools'


export type MapTask = 'field_river' | 'field_road'

/**
 * Review this boundary: the satellite photo at the place GSA found, large enough to look around,
 * with the one question about it. His answer is given with the map in front of him; once it settles
 * the field, he is back in his application to see what it changed.
 */
export function Review({ id, flow }: { id: MapTask; flow: Flow }) {
  const { derived, state, go } = useApp()
  const item = derived.items.find((i) => i.id === id)
  const answered = useRef(false)
  const fieldId = id.slice(6) as FieldId
  const back = () => go('welcome')

  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById('review-title')?.focus({ preventScroll: true })
  }, [id])

  useEffect(() => {
    if (answered.current && item && item.status !== 'action_required') go('welcome')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.answers])

  if (!item) return null
  const onAnswer = () => (answered.current = true)
  const Body = id === 'field_river' ? RiverReview : RoadReview
  const head = (
    <header className="review-head">
      <h2 id="review-title" tabIndex={-1}>{en.fields[fieldId]}</h2>
      <Text>{taskSummary(id, derived, state)}</Text>
    </header>
  )

  return (
    <>
      <Body onAnswer={onAnswer} head={head} />
      <ActionBar
        back={{ label: map.back, onClick: back }}
        forwardIsPrimary={false}
        next={item.status === 'action_required' ? id : null}
        onPick={(task) => {
          go('welcome', `task-${task}`)
          flow.show(task)
        }}
      />
    </>
  )
}

/** His answer, once given: one line he can still change. */
function AnswerLine({ legend, answer, onChange }: { legend: string; answer: string; onChange: () => void }) {
  return (
    <p className="answer">
      <span>{legend}</span> <strong>{answer}</strong>{' '}
      <Button variant="link" onClick={onChange}>
        {en.change}
        <VisuallyHidden>: {legend}</VisuallyHidden>
      </Button>
    </p>
  )
}

const options = (yes: string, no: string) => [
  { value: 'yes' as const, label: yes },
  { value: 'no' as const, label: no },
]

type BodyProps = { onAnswer: () => void; head: ReactNode }

type RiverStep = 'line' | 'crops' | 'effects'
const RIVER_STEPS: RiverStep[] = ['line', 'crops', 'effects']

/**
 * The satellite flags, Milan decides, and the field changes in three steps once he says something else
 * grows there: where the crop changes (GSA's line, which he pulls), what grows in each part, and what that
 * does to the rest of his application. Nothing counts until he confirms the split.
 */
function RiverReview({ onAnswer, head }: BodyProps) {
  const { derived, state, dispatch } = useApp()
  const field = derived.scenario.fields.find((f) => f.id === 'river')!
  const record = derived.base.fields.find((f) => f.id === 'river')!
  const item = derived.items.find((i) => i.id === 'field_river')!
  const a = state.answers.river
  const draft = useSplitDraft(record, a.split)
  const [asking, setAsking] = useState(a.answer === null)
  const [step, setStep] = useState<RiverStep | null>(a.answer === 'yes' && item.status === 'action_required' ? 'line' : null)
  const [view, setView] = useState<'photo' | 'field'>('photo')
  const go = (to: RiverStep | null) => {
    setStep(to)
    requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      document.querySelector('.map-stage-panel')?.scrollTo(0, 0)
      document.getElementById('split-title')?.focus({ preventScroll: true })
    })
  }
  const answer = (v: YesNo) => {
    if (v === 'no') onAnswer()
    setAsking(false)
    dispatch({ type: 'answer_river', answer: v })
    go(v === 'yes' ? 'line' : null)
  }
  const titles = { line: split.lineTitle, crops: split.cropsTitle, effects: split.effectsTitle }

  return (
    <MapStage
      label={en.fields.river}
      working={step !== null}
      map={
        <Suspense fallback={<MapFallback mode="explore" fill />}>
          <FarmMap
            scenario={derived.scenario}
            focus="river"
            mode="explore"
            fill
            hideFlag={step !== null || view === 'field'}
            label={`${map.title}: ${en.fields.river}. ${mapContext(derived.scenario, 'field_river')}`}
            split={
              step
                ? {
                    d: draft,
                    interactive: step === 'line' && draft.editing,
                    labels: partLabels(draft, step),
                    onPickPart: step === 'crops' ? (i) => document.getElementById(`part-crop-${i}`)?.focus() : undefined,
                  }
                : undefined
            }
            dock={
              step === 'line' && draft.editing ? (
                <LineTools d={draft} />
              ) : !step && a.answer === null ? (
                <ToolSwitch
                  label={map.title}
                  options={[
                    { value: 'photo', label: tasks.river.showPhoto },
                    { value: 'field', label: tasks.river.showField },
                  ]}
                  value={view}
                  onChange={setView}
                />
              ) : undefined
            }
          />
        </Suspense>
      }
    >
      {step ? (
        <header className="split-head">
          <p className="hint">{split.step(RIVER_STEPS.indexOf(step) + 1)}</p>
          <h2 id="split-title" tabIndex={-1}>{titles[step]}</h2>
        </header>
      ) : (
        head
      )}
      {!step && a.answer === null && <RiverCompare field={field} />}
      {step === 'line' && (
        <LineStep
          d={draft}
          onBack={() => {
            setAsking(true)
            go(null)
          }}
          onNext={() => go('crops')}
        />
      )}
      {step === 'crops' && <CropsStep d={draft} onBack={() => go('line')} onNext={() => go('effects')} />}
      {step === 'effects' && (
        <EffectsStep
          d={draft}
          onBack={() => go('crops')}
          onConfirm={(s) => {
            onAnswer()
            dispatch({ type: 'set_split', split: s })
            go(null)
          }}
        />
      )}
      {!step &&
        (asking ? (
          <StageAction>
            {/* Asked neutrally: the photo can't see what he planted. "Something else" leads to the split. */}
            <ChoiceButtons
              legend={tasks.river.question}
              options={[
                { value: 'same' as const, label: tasks.river.same },
                { value: 'other' as const, label: tasks.river.other },
              ]}
              onChoose={(v) => answer(v === 'other' ? 'yes' : 'no')}
            />
          </StageAction>
        ) : (
          <>
            <AnswerLine legend={tasks.river.question} answer={a.answer === 'yes' ? tasks.river.other : tasks.river.same} onChange={() => setAsking(true)} />
            {a.answer === 'yes' && (
              <div>
                <Button variant="link" onClick={() => go('line')}>{tasks.changeSplit}</Button>
              </div>
            )}
            {item.conflict && <RiverDispute counted={item.conflict.record} claimed={item.conflict.his} />}
          </>
        ))}
    </MapStage>
  )
}

/** His edge goes past the registered farmland: both areas kept, who settles it and what happens next. */
function RiverDispute({ counted, claimed }: { counted: number; claimed: number }) {
  const t = tasks.river
  return (
    <>
      <Compare
        items={[
          { label: tasks.road.landMap, value: formatHa(counted) },
          { label: tasks.road.yours, value: formatHa(claimed) },
        ]}
      />
      <Answers items={tasks.settled(tasks.landWho, tasks.landChecks(t.edge, formatHa(counted)), t.counts(formatHa(claimed)))} />
      <Note kind="assumption" />
    </>
  )
}

/** Last year's field beside what the photo flags. */
function RiverCompare({ field }: { field: Field }) {
  const ha = field.signal?.kind === 'satellite_difference' ? field.signal.flagHa : 0
  const t = tasks.river
  return (
    <Compare
      items={[
        { label: t.lastYear, value: t.lastYearValue(formatHa(field.areaHa), en.crops[field.cropLastYear].toLowerCase()) },
        { label: t.different, value: t.differentValue(formatHa(ha)) },
      ]}
    />
  )
}

/** The strip the land map now calls road: its size and what it does to the payment, on the map, before he answers. */
function RoadReview({ onAnswer, head }: BodyProps) {
  const { derived, state, dispatch } = useApp()
  const a = state.answers.road
  const item = derived.items.find((i) => i.id === 'field_road')!
  const [asking, setAsking] = useState(a.answer === null)
  const disputed = item.status === 'awaiting_verification' && !asking
  return (
    <MapStage
      label={en.fields.road}
      map={
        <Suspense fallback={<MapFallback mode="explore" fill />}>
          <FarmMap scenario={derived.scenario} focus="road" mode="explore" fill label={`${map.title}: ${en.fields.road}. ${mapContext(derived.scenario, 'field_road')}`} />
        </Suspense>
      }
    >
      {head}
      {asking && <MapFacts id="field_road" />}
      {asking ? (
        <StageAction>
          <ChoiceButtons
            legend={tasks.road.question}
            options={options(tasks.road.yes, tasks.road.no)}
            onChoose={(v) => {
              // Saying the land map is wrong keeps him here, to see who settles it and what happens next.
              if (v === 'yes') onAnswer()
              setAsking(false)
              dispatch({ type: 'answer_road', answer: v })
            }}
          />
        </StageAction>
      ) : (
        <AnswerLine legend={tasks.road.question} answer={a.answer === 'yes' ? tasks.road.yes : tasks.road.no} onChange={() => setAsking(true)} />
      )}
      {disputed && <RoadDispute />}
    </MapStage>
  )
}
