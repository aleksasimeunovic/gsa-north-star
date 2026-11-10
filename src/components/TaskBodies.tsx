import { lazy, Suspense, useRef, useState } from 'react'
import { draw, en, finish, formatDate, formatDateYear, formatDinars, formatHa, formatNumber, home, map, tasks } from '../copy/en'
import type { FieldId, Polygon } from '../data/scenarios'
import { milanCaseState, milanOutcome } from '../logic/advisor'
import { isMapChange, type Task, type TaskId } from '../logic/application'
import { riverParts } from '../logic/farm'
import { roundHa, sameLine, scaledHa } from '../logic/geometry'
import { impactOf, type Item, type ItemId } from '../logic/status'
import type { Confirmable, YesNo } from '../state/actions'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { FileInput } from '../ui/FileInput'
import { Compare, Stack, Text, VisuallyHidden } from '../ui/Layout'
import { Problem } from '../ui/Problem'
import { Answers } from '../ui/Fact'
import { Account } from '../ui/Account'
import { Note } from '../ui/Note'
import { StageAction } from '../ui/MapStage'
import { ChoiceButtons } from '../ui/ChoiceButtons'
import { useApp, type AppCtx } from './AppContext'
import { MeasuresBody, measureSummary } from './MeasureBodies'
import { AddedBody, BoughtBody, fieldLine } from './NewField'

// Maps load only when one is shown.
export const FarmMap = lazy(() => import('./map/FarmMap'))
export const MapFallback = ({ mode, fill }: { mode: 'preview' | 'explore'; fill?: boolean }) => (
  <div className="map-frame" data-mode={mode} data-fill={fill || undefined}>
    <div className="farm-map" data-loading>{draw.loading}</div>
  </div>
)

type Derived = AppCtx['derived']

export const itemOf = (d: Derived, id: string) => d.items.find((i) => i.id === id) as Item
const about = (n: number) => formatDinars(Math.abs(Math.round(n / 100) * 100))
const YES_NO = [
  { value: 'yes' as const, label: en.yes },
  { value: 'no' as const, label: en.no },
]

/** One clear question. Once answered it shrinks to one line he can still change. */
function Question({ legend, hint, value, answer, onAnswer }: { legend: string; hint?: string; value: YesNo | null; answer?: string; onAnswer: (a: YesNo) => void }) {
  const [editing, setEditing] = useState(false)
  const line = useRef<HTMLParagraphElement>(null)
  if (value !== null && !editing) {
    return (
      <p className="answer" ref={line} tabIndex={-1}>
        <span>{legend}</span> <strong>{answer ?? (value === 'yes' ? en.yes : en.no)}</strong>{' '}
        <Button onClick={() => setEditing(true)}>
          {en.change}
          <VisuallyHidden>: {legend}</VisuallyHidden>
        </Button>
      </p>
    )
  }
  // The answer is the task's action, so it sits where every task's action sits: pinned at the bottom of the card.
  return (
    <StageAction>
      <ChoiceButtons
        legend={legend}
        hint={hint}
        options={YES_NO}
        onChoose={(a) => {
          onAnswer(a)
          setEditing(false)
          requestAnimationFrame(() => line.current?.focus())
        }}
      />
    </StageAction>
  )
}

// The action a task is for stays in view while he scrolls the card.
const Primary = ({ onClick, children }: { onClick: () => void; children: string }) => (
  <StageAction>
    <Button variant="primary" onClick={onClick}>{children}</Button>
  </StageAction>
)

function RenewalBody() {
  const { go } = useApp()
  return (
    <Stack gap="section">
      <Text>{tasks.renewal.body}</Text>
      <Primary onClick={() => go('renewal')}>{tasks.renewal.button}</Primary>
    </Stack>
  )
}

function HerdBody() {
  const { derived, state, dispatch } = useApp()
  const herd = derived.scenario.herd!
  const item = itemOf(derived, 'herd')
  const a = state.answers.herd
  const [count, setCount] = useState(a.ownCount?.toString() ?? '')
  const [error, setError] = useState<string | undefined>()
  const jelena = milanCaseState(state)
  const c = item.conflict

  const save = () => {
    const n = Number(count)
    if (count.trim() === '' || !Number.isInteger(n) || n < 0) return setError(tasks.herd.countError)
    setError(undefined)
    dispatch({ type: 'set_herd_count', count: n })
  }

  return (
    <Stack gap="section">
      {/* The same two boxes turn into the disagreement once he gives his own number. */}
      <div aria-live="polite">
        <Compare
          items={
            c
              ? [
                  { label: tasks.herd.registryShort, value: c.record },
                  { label: tasks.herd.yoursToday, value: c.his },
                ]
              : [
                  { label: tasks.herd.lastYear, value: herd.lastYearDeclared ?? '' },
                  { label: tasks.herd.registry, value: herd.registryCount },
                ]
          }
        />
      </div>
      <Note kind="tested" />
      <Question
        legend={tasks.herd.question(herd.registryCount)}
        value={a.answer}
        onAnswer={(answer) => dispatch({ type: 'answer_herd', answer })}
      />
      {a.answer === 'no' && a.ownCount === null && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          {/* The button right under the field, never pinned over it, so the field is never cut off. */}
          <Stack gap="group">
            <Field label={tasks.herd.countLabel} hint={tasks.herd.countHint} error={error} inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
            <div>
              <Button type="submit" variant="primary">{tasks.herd.countSave}</Button>
            </div>
          </Stack>
        </form>
      )}
      {c && (
        <>
          {/* The one exception, said as four plain answers: done, who, anything to do, what next. */}
          <Answers items={herdSettled(!!jelena, c.record)} />
          <Note kind="assumption" />
          {/* His part is done: nothing to send on. If Jelena already has it, he sees what she did. */}
          {jelena === 'waiting_farmer' ? <ReplyToJelena /> : jelena && <Banner>{tasks.jelena.state[jelena]}</Banner>}
        </>
      )}
    </Stack>
  )
}

/** Jelena sent the problem back with a question: his reply hands the next step back to her. */
function ReplyToJelena() {
  const { dispatch } = useApp()
  const [note, setNote] = useState('')
  return (
    <Stack gap="section">
      <Banner tone="attention">{tasks.jelena.asks}</Banner>
      <Field multiline label={tasks.jelena.replyLabel} value={note} rows={3} onChange={(e) => setNote(e.target.value)} />
      <div>
        <Button variant="primary" onClick={() => dispatch({ type: 'reply_to_jelena', note: note.trim() })}>{tasks.jelena.reply}</Button>
      </div>
    </Stack>
  )
}

/** Animals in the registry he didn't declare: one question decides whether there's anything to do. */
function PigsBody() {
  const { derived, state, dispatch } = useApp()
  const n = derived.scenario.pigs!.registryCount
  const a = state.answers.pigs
  return (
    <Stack gap="section">
      <Compare
        items={[
          { label: tasks.herd.lastYear, value: derived.scenario.pigs!.lastYearDeclared },
          { label: tasks.herd.registry, value: n },
        ]}
      />
      <Question
        legend={tasks.pigs.question}
        hint={tasks.pigs.hint}
        value={a.answer}
        answer={a.answer === 'yes' ? tasks.pigs.answerYes : tasks.pigs.answerNo}
        onAnswer={(answer) => dispatch({ type: 'answer_pigs', answer })}
      />
    </Stack>
  )
}

/** The facts a map change needs before he answers: the size of the strip and what it does to the payment. */
export function MapFacts({ id }: { id: 'field_river' | 'field_road' }) {
  const { derived } = useApp()
  const s = derived.scenario
  const field = s.fields.find((f) => `field_${f.id}` === id)!
  const signal = field.signal
  if (signal?.kind === 'road_strip') {
    // Once he has said how much the road took, his own outline's size.
    const took = itemOf(derived, id).paymentImpact?.reason === 'road_took_area' ? itemOf(derived, id).paymentImpact!.areaHa : signal.stripHa
    return (
      <ul className="facts">
        <li>{tasks.road.area(formatHa(field.areaHa), formatHa(roundHa(field.areaHa - took)))}</li>
        <li>{tasks.road.payment(about(impactOf(s, took, 'road_took_area').amountDinars))}</li>
      </ul>
    )
  }
  return null
}

/**
 * He says the land map is wrong about the strip. Both areas side by side, who settles it, what he has
 * to do and what happens next, in the same words as the herd. The rule is an assumption.
 */
export function RoadDispute() {
  const { derived } = useApp()
  const s = derived.scenario
  const field = s.fields.find((f) => f.id === 'road')!
  const strip = field.signal?.kind === 'road_strip' ? field.signal.stripHa : 0
  // His side: the whole field, or what his own outline of the road leaves.
  const c = itemOf(derived, 'field_road').conflict
  const left = formatHa(c?.record ?? roundHa(field.areaHa - strip))
  const whole = formatHa(c?.his ?? field.areaHa)
  return (
    <>
      <Compare
        items={[
          { label: tasks.road.landMap, value: left },
          { label: tasks.road.yours, value: whole },
        ]}
      />
      <Answers items={tasks.settled(tasks.landWho, tasks.landChecks(tasks.road.strip, left), tasks.road.gain(whole, about(impactOf(s, (c ? c.his - c.record : strip), 'road_pending_correction').amountDinars)))} />
      <Note kind="assumption" />
    </>
  )
}

/** The herd disagreement's four answers, in the same words wherever they appear. */
export const herdSettled = (jelena: boolean, reg: number) => tasks.settled(jelena ? tasks.herd.withJelena : tasks.herd.registryOnly, tasks.herd.waiting(reg))

/** What GSA found, said in one line, with when: a possibility at most, never what it means. */
export function mapContext(s: Derived['scenario'], id: 'field_river' | 'field_road') {
  const sig = s.fields.find((f) => `field_${f.id}` === id)?.signal
  if (sig?.kind === 'road_strip') return tasks.road.context(formatDateYear(sig.seen))
  return tasks.river.context
}

/**
 * A change on the land shows the place, not a description: a still picture of the satellite photo with
 * what changed highlighted, the facts, and one way in: review the boundary on the map.
 */
function MapChangeCard({ id }: { id: 'field_river' | 'field_road' }) {
  const { derived, state, go } = useApp()
  const fieldId = id.slice(6) as FieldId
  const item = itemOf(derived, id)
  const unanswered = item.detail.endsWith('_unanswered')

  return (
    <Stack gap="md">
      <figure className="map-figure">
        <div className="map-link" onClick={() => go('review', id)}>
          <Suspense fallback={<MapFallback mode="preview" />}>
            <FarmMap
              scenario={derived.scenario}
              focus={fieldId}
              mode="preview"
              roadStrip={roadStripOf(derived, state.answers.road.strip)}
              label={`${map.title}: ${en.fields[fieldId]}. ${mapContext(derived.scenario, id)}`}
            />
          </Suspense>
        </div>
      </figure>
      {/* The strip's size and what it does to the payment, before he answers and after: plain facts. */}
      {(unanswered || (id === 'field_road' && item.status === 'complete')) && <MapFacts id={id} />}
      {id === 'field_road' && item.status === 'awaiting_verification' && <RoadDispute />}
      {id !== 'field_road' && item.status === 'awaiting_verification' && (
        <Text variant="secondary">
          {finish.submit.awaitingNote} <Note kind="assumption" />
        </Text>
      )}
    </Stack>
  )
}

/** His own outline of the road and its share of the land map's strip, or nothing if he kept the land map's. */
const roadStripOf = (d: Derived, strip?: Polygon) => {
  const road = d.scenario.fields.find((f) => f.id === 'road')
  const sig = road?.signal
  return strip && sig?.kind === 'road_strip' && !sameLine(strip, sig.stripPolygon) ? { polygon: strip, ha: scaledHa(sig.stripPolygon, sig.stripHa, strip, road!.polygon) } : undefined
}

/** The way into the map, beside the task's heading, so the map gets the room under it. */
export function MapReviewButton({ id }: { id: TaskId }) {
  const { derived, state, go } = useApp()
  if (id === 'field_bought') {
    const item = itemOf(derived, id)
    const unanswered = state.answers.bought.answer === null
    const todo = item.status === 'action_required'
    return (
      <Button variant={todo ? 'primary' : 'secondary'} onClick={() => (todo && !unanswered ? go('field', 'bought') : go('review', id))}>
        {unanswered ? tasks.reviewParcel : todo ? tasks.bought.draw : en.change}
        <VisuallyHidden>: {tasks.title.field_bought}</VisuallyHidden>
      </Button>
    )
  }
  if (id !== 'field_river' && id !== 'field_road') return null
  const item = itemOf(derived, id)
  const action = item.detail === 'river_needs_split' ? tasks.reviewSplit : tasks.review
  return (
    <Button variant={item.status === 'action_required' ? 'primary' : 'secondary'} onClick={() => go('review', id)}>
      {item.status === 'action_required' ? action : en.change}
      <VisuallyHidden>: {en.fields[id.slice(6) as FieldId]}</VisuallyHidden>
    </Button>
  )
}

/** Confirming something GSA already has: one button, gone once confirmed. */
function ConfirmButton({ id, what }: { id: ItemId; what: Confirmable }) {
  const { derived, dispatch } = useApp()
  if (itemOf(derived, id).status !== 'action_required') return null
  return <Primary onClick={() => dispatch({ type: 'confirm', what })}>{tasks.confirm}</Primary>
}

/**
 * His input receipts, declared again every year with new evidence: the files listed, and one tap to confirm.
 * A receipt GSA can't read is an error in its row, and sending a clearer one comes before confirming.
 */
function ReceiptsBody() {
  const { derived, dispatch } = useApp()
  const detail = itemOf(derived, 'receipts').detail
  if (detail === 'receipts_missing') {
    return (
      <Stack gap="section">
        <Text>{tasks.receipts.needed}</Text>
        <StageAction>
          <FileInput label={tasks.receipts.upload} onFile={() => dispatch({ type: 'attach_document', documentId: 'input_receipts' })} />
        </StageAction>
      </Stack>
    )
  }
  const doc = derived.scenario.documents.find((d) => d.attached)
  const blurry = detail === 'receipts_unreadable' ? doc?.unreadable : undefined
  return (
    <Stack gap="section">
      <ul className="plain-list">
        {(doc?.files ?? []).map((f) => (
          <li key={f.name} data-error={f.name === blurry || undefined}>
            <strong>{f.name}</strong> {formatDate(f.date)}
            {f.name === blurry && <Problem>{tasks.unreadable.context}</Problem>}
          </li>
        ))}
      </ul>
      {blurry ? (
        <StageAction>
          <FileInput label={tasks.unreadable.upload} hint={tasks.unreadable.hint} onFile={() => dispatch({ type: 'attach_document', documentId: 'unreadable_receipt' })} />
        </StageAction>
      ) : (
        <ConfirmButton id="receipts" what="receipts" />
      )}
    </Stack>
  )
}

/** The bank closed the account payments went to and sent the new one: one question instead of typing a number. */
function BankBody() {
  const { derived, state, dispatch } = useApp()
  const acc = derived.scenario.generalData.account!
  const a = state.answers.bank
  const b = tasks.bank
  const [value, setValue] = useState(a.account ?? '')
  const [error, setError] = useState<string | undefined>()
  const save = () => {
    const digits = value.replace(/\D/g, '')
    if (digits.length !== 18) return setError(b.error)
    setError(undefined)
    dispatch({ type: 'set_bank_account', account: digits })
  }
  return (
    <Stack gap="section">
      <Compare long
        items={[
          { label: b.registered, value: <Account number={acc.number} /> },
          { label: b.fromBank, value: <Account number={acc.newNumber} /> },
        ]}
      />
      <Question
        legend={b.question(acc.newEnding)}
        value={a.answer}
        answer={a.answer === 'yes' ? b.answerYes : b.answerNo}
        onAnswer={(answer) => dispatch({ type: 'answer_bank', answer })}
      />
      {a.answer === 'no' && a.account === null && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          {/* Wide enough for the whole number, and the button right under it, never floating over it. */}
          <Stack gap="group">
            <Field label={b.label} hint={b.hint} error={error} inputMode="numeric" width="long" value={value} onChange={(e) => setValue(e.target.value)} />
            <div>
              <Button type="submit" variant="primary">{b.save}</Button>
            </div>
          </Stack>
        </form>
      )}
    </Stack>
  )
}

/** The calvings the cow payment is worked out on: the registry's number and what it pays, confirmed in one tap. */
function CalvingsBody() {
  const { derived, dispatch } = useApp()
  const herd = derived.scenario.herd!
  const item = itemOf(derived, 'calvings')
  const rate = derived.scenario.measures.find((m) => m.id === 'cows_raising_calves')?.rateDinars ?? 0
  return (
    <Stack gap="section">
      <Compare items={[{ label: tasks.calvings.source, value: herd.cowsCalved }]} />
      <Text>{tasks.calvings.lead(herd.cowsCalved)}</Text>
      <Text variant="small">{tasks.measures.cows(herd.cowsCalved, formatNumber(rate), formatDinars(herd.cowsCalved * rate))}</Text>
      <ConfirmButton id="calvings" what="calvings" />
      {item.status === 'awaiting_verification' ? (
        <Text>{tasks.calvings.asked(herd.cowsCalved)}</Text>
      ) : (
        item.status === 'action_required' && (
          <div>
            <Button onClick={() => dispatch({ type: 'ask_record_check', itemId: 'calvings' })}>{tasks.calvings.wrong}</Button>
          </div>
        )
      )}
    </Stack>
  )
}

// Each kind of decision gets its own body: a number, a map, a drawing, a choice of measures, a form.
export function TaskBody({ task }: { task: Task }) {
  const id = task.id
  if (isMapChange(id)) return <MapChangeCard id={id} />
  if (id.startsWith('added_')) return <AddedBody id={id} />
  switch (id) {
    case 'renewal':
      return <RenewalBody />
    case 'bank':
      return <BankBody />
    case 'herd':
      return <HerdBody />
    case 'pigs':
      return <PigsBody />
    case 'calvings':
      return <CalvingsBody />
    case 'field_bought':
      return <BoughtBody />
    case 'measures':
      return <MeasuresBody />
    case 'receipts':
      return <ReceiptsBody />
    default:
      return null
  }
}

/** The one line a collapsed task shows: what's there, or how it ended. */
export function taskSummary(id: TaskId, d: Derived, state: AppCtx['state']): string {
  const s = d.scenario
  const jelena = milanCaseState(state)
  if (id === 'renewal') return d.list.todo.some((t) => t.id === 'renewal') ? tasks.renewal.body : home.activeFarmer
  if (id === 'measures') return measureSummary(d, state.answers.measures.inputs)
  const added = state.answers.newFields.find((f) => `added_${f.id}` === id || (id === 'field_bought' && f.landId === 'bought'))
  if (added) return fieldLine(added)
  const item = itemOf(d, id)
  const done = item.status === 'complete'
  const g = s.generalData
  switch (id) {
    case 'bank':
      if (item.detail === 'bank_new') return tasks.bank.paidTo(g.account!.newEnding)
      if (item.detail === 'bank_own') return tasks.bank.paidTo((state.answers.bank.account ?? '').slice(-4))
      if (item.detail === 'bank_needs_account') return tasks.bank.label
      return tasks.bank.context(formatDate(g.account!.closedOn))
    case 'calvings': {
      const v = state.answers.requests.find((r) => r.kind === 'record_check' && r.itemId === 'calvings')?.value
      if (item.status !== 'awaiting_verification') return tasks.calvings.done(s.herd!.cowsCalved)
      return v ? tasks.calvings.askedWith(v, s.herd!.cowsCalved) : tasks.calvings.asked(s.herd!.cowsCalved)
    }
    case 'herd': {
      const h = s.herd!
      if (item.detail === 'herd_settled') return tasks.herd.outcome[milanOutcome(state) ?? 'kept'](state.answers.herd.ownCount ?? h.registryCount, h.registryCount)
      if (item.conflict) return jelena && jelena !== 'assigned' ? tasks.jelena.state[jelena] : tasks.herd.waiting(item.conflict.record)
      if (done) return tasks.herd.done(h.registryCount)
      return item.detail === 'herd_needs_count' ? tasks.herd.countLabel : tasks.herd.summary(h.registryCount, h.lastYearDeclared ?? 0)
    }
    case 'field_river': {
      const parts = riverParts(s, state.answers)
      if ((item.detail === 'river_split_done' || item.detail === 'river_past_land') && parts) {
        const [x, y] = parts.map((p) => tasks.river.part(en.crops[p.crop], formatHa(p.ha)))
        const both = tasks.river.split(x, y)
        return item.conflict ? `${both}. ${tasks.river.pastLand(formatHa(item.conflict.record))}` : both
      }
      if (item.detail === 'river_one_crop') return `${tasks.river.oneCrop}, ${tasks.river.mayCheck}`
      return mapContext(s, id)
    }
    case 'field_road': {
      const f = s.fields.find((x) => x.id === 'road')!
      const strip = item.paymentImpact?.areaHa ?? 0
      if (done && item.paymentImpact) return `${tasks.road.done(formatHa(roundHa(f.areaHa - strip)))}, ${tasks.road.payment(about(item.paymentImpact.amountDinars)).toLowerCase()}`
      if (item.status === 'awaiting_verification') return tasks.road.correctionAsked
      return mapContext(s, id)
    }
    case 'pigs':
      if (item.detail === 'pigs_household') return tasks.pigs.household
      if (item.detail === 'pigs_declared') return tasks.pigs.declared(s.pigs!.registryCount)
      return tasks.pigs.context(s.pigs!.registryCount)
    case 'field_bought':
      if (item.detail === 'bought_not_farmed') return tasks.bought.notFarmed
      if (item.detail === 'bought_needs_field') return tasks.work.bought_add
      return tasks.bought.context(formatDateYear(s.bought!.on))
    case 'details':
      return tasks.details.asked
    case 'receipts':
      if (item.detail === 'receipts_missing') return tasks.receipts.needed
      if (item.detail === 'receipts_unreadable') return tasks.unreadable.context
      return tasks.receipts.files(Math.max(1, s.documents.flatMap((x) => x.files).length))
    default:
      return ''
  }
}

