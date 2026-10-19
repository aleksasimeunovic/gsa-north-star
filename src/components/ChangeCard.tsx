import { useState, type ReactNode } from 'react'
import { formatHa, ui } from '../copy/en'
import type { ChangeId } from '../logic/changes'
import { roundHa } from '../logic/geometry'
import type { YesNo } from '../state/actions'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Disclosure } from '../ui/Disclosure'
import { Field } from '../ui/Field'
import { Stack, Text } from '../ui/Layout'
import { RadioGroup } from '../ui/RadioGroup'
import { useApp } from './AppContext'
import { ConflictPanel } from './ConflictPanel'
import { changeTarget } from './targets'

const YES_NO = [
  { value: 'yes' as const, label: ui.yes },
  { value: 'no' as const, label: ui.no },
]

interface ShellProps {
  id: ChangeId
  title: string
  itemId: string
  record: ReactNode
  question: string
  why: string
  answer: YesNo | null
  onAnswer: (a: YesNo) => void
  /** Shown under the question while a follow-up is still needed. */
  followUp: ReactNode
  needsFollowUp: boolean
  outcome: ReactNode
}

/** One clear question per change. Answered cards collapse; answers stay editable. */
function ChangeShell(p: ShellProps) {
  const { derived } = useApp()
  const [editing, setEditing] = useState(false)
  const item = derived.items.find((i) => i.id === p.itemId)
  const showQuestion = p.answer === null || editing || p.needsFollowUp

  return (
    <Card id={changeTarget(p.id)} title={p.title} status={item?.status}>
      <Stack gap="sm">
        <Text>{p.record}</Text>
        {showQuestion ? (
          <>
            <RadioGroup
              inline
              legend={p.question}
              options={YES_NO}
              value={p.answer}
              onChange={(a) => {
                p.onAnswer(a)
                setEditing(false)
              }}
            />
            <Disclosure label={ui.why}>
              <Text>{p.why}</Text>
            </Disclosure>
            {p.answer !== null && p.followUp}
          </>
        ) : (
          <>
            {p.outcome}
            <div>
              <Button variant="link" onClick={() => setEditing(true)}>{ui.changeAnswer}</Button>
            </div>
          </>
        )}
      </Stack>
    </Card>
  )
}

function HerdChange({ onCarryOn }: { onCarryOn: () => void }) {
  const { derived, state, dispatch } = useApp()
  const herd = derived.scenario.herd!
  const a = state.answers.herd
  const item = derived.items.find((i) => i.id === 'herd')!
  const [count, setCount] = useState(a.ownCount?.toString() ?? '')
  const [error, setError] = useState<string | undefined>()

  const save = () => {
    const n = Number(count)
    if (count.trim() === '' || !Number.isInteger(n) || n < 0) return setError(ui.herd.countError)
    setError(undefined)
    dispatch({ type: 'set_herd_count', count: n })
  }

  return (
    <ChangeShell
      id="herd"
      itemId="herd"
      title={ui.herd.title}
      record={ui.herd.record(herd.registryCount, herd.lastYearDeclared ?? 0)}
      question={ui.herd.question(herd.registryCount)}
      why={ui.herd.why}
      answer={a.answer}
      onAnswer={(answer) => {
        dispatch({ type: 'answer_herd', answer })
        if (answer === 'no') dispatch({ type: 'set_herd_count', count: null })
      }}
      needsFollowUp={a.answer === 'no' && a.ownCount === null}
      followUp={
        a.answer === 'no' && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              save()
            }}
          >
            <Stack gap="sm">
              <Field
                label={ui.herd.countLabel}
                hint={ui.herd.countHint}
                error={error}
                inputMode="numeric"
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
              <div>
                <Button type="submit">{ui.herd.countSave}</Button>
              </div>
            </Stack>
          </form>
        )
      }
      outcome={
        item.status === 'complete' ? (
          <>
            <Text variant="strong">{ui.herd.done(a.answer === 'yes' ? herd.registryCount : (a.ownCount ?? 0))}</Text>
            <Text variant="small">{ui.herd.replaced}</Text>
          </>
        ) : (
          <ConflictPanel item={item} onCarryOn={onCarryOn} />
        )
      }
    />
  )
}

function RiverChange() {
  const { state, dispatch, go } = useApp()
  const a = state.answers.river
  const toLand = (
    <div>
      <Button onClick={() => go('land', 'item-field_river')}>{ui.river.openLand}</Button>
    </div>
  )
  return (
    <ChangeShell
      id="river"
      itemId="field_river"
      title={ui.river.title}
      record={ui.river.record}
      question={ui.river.question}
      why={ui.river.why}
      answer={a.answer}
      onAnswer={(answer) => dispatch({ type: 'answer_river', answer })}
      needsFollowUp={a.answer === 'no' && a.noOption === null}
      followUp={
        a.answer === 'no' && (
          <RadioGroup
            legend={ui.river.choose}
            value={a.noOption}
            onChange={(option) => dispatch({ type: 'river_no_option', option })}
            options={[
              { value: 'redraw', label: ui.river.redraw, hint: ui.river.redrawHint },
              { value: 'field_check', label: ui.river.fieldCheck, hint: ui.river.fieldCheckHint },
            ]}
          />
        )
      }
      outcome={
        a.answer === 'yes' ? (
          <>
            <Text variant="strong">{ui.river.done}</Text>
            <Text>{ui.river.next}</Text>
            {toLand}
          </>
        ) : a.noOption === 'redraw' ? (
          <>
            <Text>{ui.river.redrawNext}</Text>
            {toLand}
          </>
        ) : (
          <Banner>{ui.river.fieldCheckDone}</Banner>
        )
      }
    />
  )
}

function RoadChange() {
  const { derived, state, dispatch } = useApp()
  const field = derived.scenario.fields.find((f) => f.id === 'road')!
  const strip = field.signal?.kind === 'road_strip' ? field.signal.stripHa : 0
  const a = state.answers.road
  return (
    <ChangeShell
      id="road"
      itemId="field_road"
      title={ui.road.title}
      record={ui.road.record(formatHa(strip))}
      question={ui.road.question}
      why={ui.road.why}
      answer={a.answer}
      onAnswer={(answer) => dispatch({ type: 'answer_road', answer })}
      needsFollowUp={a.answer === 'no' && !a.correctionRequested}
      followUp={
        a.answer === 'no' && (
          <Stack gap="sm">
            <Text>{ui.road.noIntro}</Text>
            <div>
              <Button onClick={() => dispatch({ type: 'request_road_correction' })}>{ui.road.askCorrection}</Button>
            </div>
          </Stack>
        )
      }
      outcome={
        a.answer === 'yes' ? (
          <Text variant="strong">{ui.road.done(formatHa(strip), formatHa(roundHa(field.areaHa - strip)))}</Text>
        ) : (
          <Banner>{ui.road.correctionAsked}</Banner>
        )
      }
    />
  )
}

export function ChangeCard({ id, onCarryOn }: { id: ChangeId; onCarryOn: () => void }) {
  if (id === 'herd') return <HerdChange onCarryOn={onCarryOn} />
  if (id === 'river') return <RiverChange />
  return <RoadChange />
}
