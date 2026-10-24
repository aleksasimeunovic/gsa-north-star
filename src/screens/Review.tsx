import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { en, finish, map, tasks } from '../copy/en'
import type { FieldId } from '../data/scenarios'
import { ActionBar } from '../components/ActionBar'
import { useApp } from '../components/AppContext'
import { SplitControls, useSplitDraft } from '../components/SplitTool'
import { FarmMap, MapFacts, MapFallback, RiverInsight, mapContext, taskSummary } from '../components/TaskBodies'
import type { Flow } from '../components/useApplicationFlow'
import type { YesNo } from '../state/actions'
import { Button } from '../ui/Button'
import { ChoiceButtons } from '../ui/ChoiceButtons'
import { Stack, Text, VisuallyHidden } from '../ui/Layout'
import { Note } from '../ui/Note'

// Drawing where a field ends loads only when he needs it.
const FieldEditor = lazy(() => import('../components/FieldEditor'))

export type MapTask = 'field_river' | 'field_road' | 'field_upper'

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
  const Body = id === 'field_river' ? RiverReview : id === 'field_road' ? RoadReview : UpperReview

  return (
    <Stack gap="md">
      <header className="review-head">
        <h2 id="review-title" tabIndex={-1}>{en.fields[fieldId]}</h2>
        <Text>
          {item.status === 'action_required' ? mapContext(id) : taskSummary(id, derived, state)}{' '}
          {item.status === 'action_required' && <Note kind="ai" />}
        </Text>
      </header>
      <Body onAnswer={onAnswer} />
      <ActionBar
        back={{ label: map.back, onClick: back }}
        forwardIsPrimary={false}
        onPick={(task) => {
          go('welcome', `task-${task}`)
          flow.show(task)
        }}
      />
    </Stack>
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

type BodyProps = { onAnswer: () => void }

/** The satellite flags, Milan decides. Two crops: GSA's line where the photo changes, which he accepts or moves. */
function RiverReview({ onAnswer }: BodyProps) {
  const { derived, state, dispatch } = useApp()
  const field = derived.scenario.fields.find((f) => f.id === 'river')!
  const item = derived.items.find((i) => i.id === 'field_river')!
  const a = state.answers.river
  const draft = useSplitDraft(field, a.split)
  const [asking, setAsking] = useState(a.answer === null)
  const [editingSplit, setEditingSplit] = useState(false)
  const splitting = a.answer === 'yes' && !asking && (item.status === 'action_required' || editingSplit)
  const answer = (v: YesNo) => {
    onAnswer()
    setAsking(false)
    dispatch({ type: 'answer_river', answer: v })
  }

  return (
    <Stack gap="sm">
      <Suspense fallback={<MapFallback mode="explore" />}>
        <FarmMap
          scenario={derived.scenario}
          focus="river"
          mode="explore"
          label={`${map.title}: ${en.fields.river}. ${tasks.river.context}`}
          split={a.answer === 'yes' && !asking ? { field, d: draft, interactive: splitting } : undefined}
        />
      </Suspense>
      {asking && <RiverInsight />}
      {asking ? (
        <ChoiceButtons legend={tasks.river.question} hint={tasks.river.hint} options={options(tasks.river.yes, tasks.river.no)} onChoose={answer} />
      ) : (
        <AnswerLine legend={tasks.river.question} answer={a.answer === 'yes' ? tasks.river.answerYes : tasks.river.answerNo} onChange={() => setAsking(true)} />
      )}
      {a.answer === 'yes' &&
        !asking &&
        (splitting ? (
          <SplitControls
            field={field}
            d={draft}
            onConfirm={(split) => {
              onAnswer()
              dispatch({ type: 'set_split', split })
              setEditingSplit(false)
            }}
          />
        ) : (
          <div>
            <Button variant="link" onClick={() => setEditingSplit(true)}>{tasks.reviewSplit}</Button>
          </div>
        ))}
    </Stack>
  )
}

/** The strip the land map now calls road: its size and what it does to the payment, on the map, before he answers. */
function RoadReview({ onAnswer }: BodyProps) {
  const { derived, state, dispatch } = useApp()
  const a = state.answers.road
  const item = derived.items.find((i) => i.id === 'field_road')!
  const [asking, setAsking] = useState(a.answer === null)
  return (
    <Stack gap="sm">
      <Suspense fallback={<MapFallback mode="explore" />}>
        <FarmMap scenario={derived.scenario} focus="road" mode="explore" label={`${map.title}: ${en.fields.road}. ${tasks.road.context}`} />
      </Suspense>
      <MapFacts id="field_road" />
      {asking ? (
        <ChoiceButtons
          legend={tasks.road.question}
          options={options(tasks.road.yes, tasks.road.no)}
          onChoose={(v) => {
            onAnswer()
            setAsking(false)
            dispatch({ type: 'answer_road', answer: v })
          }}
        />
      ) : (
        <AnswerLine legend={tasks.road.question} answer={a.answer === 'yes' ? tasks.road.yes : tasks.road.no} onChange={() => setAsking(true)} />
      )}
      {item.status === 'awaiting_verification' && !asking && <Text>{tasks.road.correctionAsked}</Text>}
    </Stack>
  )
}

/** Last year's drawing runs into the neighbour's new one. Yes: GSA moves his edge. No: he draws where his field ends. */
function UpperReview({ onAnswer }: BodyProps) {
  const { derived, state, dispatch } = useApp()
  const s = derived.scenario
  const field = s.fields.find((f) => f.id === 'upper')!
  const item = derived.items.find((i) => i.id === 'field_upper')!
  const a = state.answers.upper
  const [asking, setAsking] = useState(a.answer === null)
  const [editing, setEditing] = useState(false)
  const drawing = a.answer === 'no' && !asking && (!a.drawn || editing)

  return (
    <Stack gap="sm">
      {drawing ? (
        <Suspense fallback={<MapFallback mode="explore" />}>
          <FieldEditor
            scenario={s}
            fieldId="upper"
            start={a.drawn ?? field.polygon}
            onSave={(polygon) => {
              onAnswer()
              dispatch({ type: 'set_upper_drawing', polygon })
              setEditing(false)
            }}
          />
        </Suspense>
      ) : (
        <Suspense fallback={<MapFallback mode="explore" />}>
          <FarmMap scenario={s} focus="upper" mode="explore" drawn={a.answer === 'no' ? a.drawn : null} label={`${map.title}: ${en.fields.upper}. ${tasks.upper.context}`} />
        </Suspense>
      )}
      {asking && <MapFacts id="field_upper" />}
      {asking ? (
        <ChoiceButtons
          legend={tasks.upper.question}
          options={options(tasks.upper.yes, tasks.upper.no)}
          onChoose={(v) => {
            onAnswer()
            setAsking(false)
            dispatch({ type: 'answer_upper', answer: v })
          }}
        />
      ) : (
        <AnswerLine legend={tasks.upper.question} answer={a.answer === 'yes' ? tasks.upper.answerYes : tasks.upper.answerNo} onChange={() => setAsking(true)} />
      )}
      {item.status === 'awaiting_verification' && (
        <Text variant="secondary">
          {tasks.upper.drawnOverlaps}. {finish.submit.awaitingNote} <Note kind="assumption" />
        </Text>
      )}
      {a.answer === 'no' && a.drawn && !editing && !asking && (
        <div>
          <Button variant="link" onClick={() => setEditing(true)}>{tasks.upper.redraw}</Button>
        </div>
      )}
    </Stack>
  )
}
