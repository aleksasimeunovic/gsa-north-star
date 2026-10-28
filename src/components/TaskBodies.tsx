import { lazy, Suspense, useRef, useState } from 'react'
import { draw, en, finish, formatDate, formatDinars, formatHa, formatNumber, home, map, tasks } from '../copy/en'
import type { FieldId } from '../data/scenarios'
import { milanCaseState } from '../logic/advisor'
import { isMapChange, type Task, type TaskId } from '../logic/application'
import { partNames, polygonAreaHa, roundHa, splitPolygon } from '../logic/geometry'
import { impactOf, type Item, type ItemId } from '../logic/status'
import type { Confirmable, YesNo } from '../state/actions'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { FileInput } from '../ui/FileInput'
import { Compare, Stack, Text, VisuallyHidden } from '../ui/Layout'
import { Problem } from '../ui/Problem'
import { Note } from '../ui/Note'
import { StageAction } from '../ui/MapStage'
import { ChoiceButtons } from '../ui/ChoiceButtons'
import { useApp, type AppCtx } from './AppContext'
import { SendToJelena } from './SendToJelena'
import { MeasuresBody, measureSummary } from './MeasureBodies'

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
        <Button variant="link" onClick={() => setEditing(true)}>
          {en.change}
          <VisuallyHidden>: {legend}</VisuallyHidden>
        </Button>
      </p>
    )
  }
  return (
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
  const [composing, setComposing] = useState(false)
  const jelena = milanCaseState(state)
  const c = item.conflict

  const save = () => {
    const n = Number(count)
    if (!Number.isInteger(n) || n < 0) return setError(tasks.herd.countError)
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
      <div><Note kind="tested" /></div>
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
          <Stack gap="sm">
            <Field label={tasks.herd.countLabel} hint={tasks.herd.countHint} error={error} inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
            <div>
              <Button type="submit" variant="primary" disabled={count.trim() === ''}>{tasks.herd.countSave}</Button>
            </div>
          </Stack>
        </form>
      )}
      {c && (
        <>
          <Text>{tasks.herd.keepBoth}</Text>
          <Text variant="secondary">
            {tasks.herd.canSubmit} <Note kind="assumption" />
          </Text>
          {jelena === 'waiting_farmer' ? (
            <ReplyToJelena />
          ) : jelena ? (
            <Banner>{tasks.jelena.state[jelena]}</Banner>
          ) : composing ? (
            <SendToJelena itemId="herd" onDone={() => setComposing(false)} />
          ) : (
            <div>
              <Button onClick={() => setComposing(true)}>{tasks.herd.sendJelena}</Button>
            </div>
          )}
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
      <Primary onClick={() => dispatch({ type: 'reply_to_jelena', note: note.trim() })}>{tasks.jelena.reply}</Primary>
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
      {a.answer === null && (
        <Text variant="small">
          <Note kind="assumption" />
        </Text>
      )}
    </Stack>
  )
}

/** The facts a map change needs before he answers: the size of the strip and what it does to the payment. */
export function MapFacts({ id }: { id: 'field_river' | 'field_road' | 'field_upper' }) {
  const { derived, state } = useApp()
  const s = derived.scenario
  const field = s.fields.find((f) => `field_${f.id}` === id)!
  const signal = field.signal
  if (signal?.kind === 'road_strip') {
    return (
      <ul className="facts">
        <li>{tasks.road.area(formatHa(field.areaHa), formatHa(roundHa(field.areaHa - signal.stripHa)))}</li>
        <li>{tasks.road.payment(about(impactOf(s, signal.stripHa, 'road_took_area').amountDinars))}</li>
      </ul>
    )
  }
  if (signal?.kind === 'overlap' && state.answers.upper.answer === null) {
    return (
      <ul className="facts">
        <li>{tasks.upper.overlap(formatHa(signal.overlapHa))}</li>
        <li>{tasks.road.payment(about(impactOf(s, signal.overlapHa, 'overlap_removed').amountDinars))}</li>
      </ul>
    )
  }
  return null
}

/** What GSA reads in the river field's satellite photo, so the dotted area means something to him. */
export function RiverInsight() {
  return (
    <ul className="insight">
      {tasks.river.insight.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  )
}

/** What GSA found, said in one line, before he answers. */
export const mapContext = (id: 'field_river' | 'field_road' | 'field_upper') =>
  id === 'field_river' ? tasks.river.context : id === 'field_road' ? tasks.road.context : tasks.upper.context

/**
 * A change on the land shows the place, not a description: a still picture of the satellite photo with
 * what changed highlighted, the facts, and one way in: review the boundary on the map.
 */
function MapChangeCard({ id }: { id: 'field_river' | 'field_road' | 'field_upper' }) {
  const { derived, state, go } = useApp()
  const fieldId = id.slice(6) as FieldId
  const item = itemOf(derived, id)
  const unanswered = item.detail.endsWith('_unanswered')
  const review = () => go('review', id)
  const action =
    item.detail === 'river_needs_split' ? tasks.reviewSplit : item.detail === 'upper_needs_drawing' ? tasks.reviewDraw : tasks.review

  return (
    <Stack gap="section">
      <Text>
        {unanswered ? mapContext(id) : taskSummary(id, derived, state)}{' '}
        {unanswered && id === 'field_river' && (
          <>
            <Note kind="eu_mandate" /> <Note kind="ai" />
          </>
        )}
      </Text>
      <figure className="map-figure">
        <div className="map-link" onClick={review}>
          <Suspense fallback={<MapFallback mode="preview" />}>
            <FarmMap
              scenario={derived.scenario}
              focus={fieldId}
              mode="preview"
              drawn={id === 'field_upper' ? state.answers.upper.drawn : null}
              label={`${map.title}: ${en.fields[fieldId]}. ${mapContext(id)}`}
            />
          </Suspense>
        </div>
      </figure>
      {unanswered && id === 'field_river' && <RiverInsight />}
      {unanswered && <MapFacts id={id} />}
      {item.status === 'awaiting_verification' && (
        <Text variant="secondary">
          {finish.submit.awaitingNote} <Note kind="assumption" />
        </Text>
      )}
      <StageAction>
        <Button variant={item.status === 'action_required' ? 'primary' : 'secondary'} onClick={review}>
          {item.status === 'action_required' ? action : en.change}
          <VisuallyHidden>: {en.fields[fieldId]}</VisuallyHidden>
        </Button>
      </StageAction>
    </Stack>
  )
}

/** Confirming something GSA already has: one button, gone once confirmed. */
function ConfirmButton({ id, what }: { id: ItemId; what: Confirmable }) {
  const { derived, dispatch } = useApp()
  if (itemOf(derived, id).status !== 'action_required') return null
  return <Primary onClick={() => dispatch({ type: 'confirm', what })}>{tasks.confirm}</Primary>
}

/** Fields with nothing new: on the map he can move around, named, confirmed in one tap. */
function FieldsBody() {
  const { derived } = useApp()
  const s = derived.scenario
  const same = s.fields.filter((f) => !f.signal)
  return (
    <Stack gap="section">
      <Suspense fallback={<MapFallback mode="explore" />}>
        <FarmMap scenario={s} only={same.map((f) => f.id)} mode="explore" label={map.title} />
      </Suspense>
      <ul className="plain-list">
        {same.map((f) => (
          <li key={f.id}>
            <strong>{en.fields[f.id]}</strong> {tasks.fields.row(formatHa(f.areaHa), en.crops[f.cropLastYear])}
          </li>
        ))}
      </ul>
      <ConfirmButton id="fields_other" what="fields_other" />
    </Stack>
  )
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
      <Stack gap="sm">
        <Text>{tasks.receipts.needed}</Text>
        <FileInput label={tasks.receipts.upload} onFile={() => dispatch({ type: 'attach_document', documentId: 'input_receipts' })} />
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
      <Compare
        items={[
          { label: b.registered, value: <>{b.ending(acc.ending)} <Text variant="small" as="span">{b.closed}</Text></> },
          { label: b.fromBank, value: b.ending(acc.newEnding) },
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
          <Stack gap="sm">
            <Field label={b.label} hint={b.hint} error={error} inputMode="numeric" value={value} onChange={(e) => setValue(e.target.value)} />
            <div>
              <Button type="submit" variant="primary" disabled={value.trim() === ''}>{b.save}</Button>
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
            <Button variant="link" onClick={() => dispatch({ type: 'ask_record_check', itemId: 'calvings' })}>{tasks.calvings.wrong}</Button>
          </div>
        )
      )}
    </Stack>
  )
}

/** The satellite saw no mowing or grazing: the place, the rule in one line, and whether he will look after it. */
function MeadowBody() {
  const { derived, state, dispatch } = useApp()
  const a = state.answers.meadow
  const m = tasks.meadow
  return (
    <Stack gap="section">
      {a.answer === null && (
        <Text>
          {m.context} <Note kind="ai" />
        </Text>
      )}
      <figure className="map-figure">
        <Suspense fallback={<MapFallback mode="preview" />}>
          <FarmMap scenario={derived.scenario} focus="meadow" mode="preview" label={`${map.title}: ${en.fields.meadow}. ${m.context}`} />
        </Suspense>
      </figure>
      <Question
        legend={m.question}
        hint={m.hint}
        value={a.answer}
        answer={a.answer === 'yes' ? m.answerYes : m.answerNo}
        onAnswer={(answer) => dispatch({ type: 'answer_meadow', answer })}
      />
    </Stack>
  )
}

// Each kind of decision gets its own body: a number, a map, a drawing, a choice of measures, a form.
export function TaskBody({ task }: { task: Task }) {
  const id = task.id
  if (isMapChange(id)) return <MapChangeCard id={id} />
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
    case 'field_meadow':
      return <MeadowBody />
    case 'fields_other':
      return <FieldsBody />
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
  const item = itemOf(d, id)
  const done = item.status === 'complete'
  const g = s.generalData
  switch (id) {
    case 'bank':
      if (item.detail === 'bank_new') return tasks.bank.paidTo(g.account!.newEnding)
      if (item.detail === 'bank_own') return tasks.bank.paidTo((state.answers.bank.account ?? '').slice(-4))
      if (item.detail === 'bank_needs_account') return tasks.bank.label
      return tasks.bank.context(formatDate(g.account!.closedOn))
    case 'calvings':
      return item.status === 'awaiting_verification' ? tasks.calvings.asked(s.herd!.cowsCalved) : tasks.calvings.done(s.herd!.cowsCalved)
    case 'field_meadow':
      if (item.detail === 'meadow_kept') return tasks.meadow.kept
      if (item.detail === 'meadow_out') return tasks.meadow.out(formatHa(item.paymentImpact?.areaHa ?? 0))
      return tasks.meadow.context
    case 'herd': {
      const h = s.herd!
      if (item.conflict) return `${tasks.herd.differs(item.conflict.his, item.conflict.record)}, ${jelena ? tasks.jelena.state[jelena].toLowerCase() : tasks.herd.willCheck}`
      if (done) return tasks.herd.done(h.registryCount)
      return item.detail === 'herd_needs_count' ? tasks.herd.countLabel : tasks.herd.summary(h.registryCount, h.lastYearDeclared ?? 0)
    }
    case 'field_river': {
      const sp = state.answers.river.split
      const r = sp && splitPolygon(s.fields.find((f) => f.id === 'river')!.polygon, sp.line[0], sp.line[1])
      if (item.detail === 'river_split_done' && sp && r) {
        // Top part first, as on the map.
        const order = partNames(r.parts)[0] === 'top' || partNames(r.parts)[0] === 'left' ? [0, 1] : [1, 0]
        const [x, y] = order.map((i) => tasks.river.part(en.crops[sp.crops[i]!], formatHa(r.areasHa[i])))
        return tasks.river.split(x, y)
      }
      if (item.detail === 'river_one_crop') return `${tasks.river.answerNo}, ${tasks.river.mayCheck}`
      return tasks.river.context
    }
    case 'field_road': {
      const f = s.fields.find((x) => x.id === 'road')!
      const strip = f.signal?.kind === 'road_strip' ? f.signal.stripHa : 0
      if (done && item.paymentImpact) return `${tasks.road.done(formatHa(roundHa(f.areaHa - strip)))}, ${tasks.road.payment(about(item.paymentImpact.amountDinars)).toLowerCase()}`
      if (item.status === 'awaiting_verification') return tasks.road.correctionAsked
      return tasks.road.context
    }
    case 'pigs':
      if (item.detail === 'pigs_household') return tasks.pigs.household
      if (item.detail === 'pigs_declared') return tasks.pigs.declared(s.pigs!.registryCount)
      return tasks.pigs.context(s.pigs!.registryCount)
    case 'field_upper': {
      const f = s.fields.find((x) => x.id === 'upper')!
      const drawn = state.answers.upper.drawn
      if (item.detail === 'upper_moved' && f.signal?.kind === 'overlap') return tasks.upper.moved(formatHa(roundHa(f.areaHa - f.signal.overlapHa)))
      if (item.detail === 'upper_drawn' && drawn) return tasks.upper.drawn(formatHa(roundHa(polygonAreaHa(drawn))))
      if (item.detail === 'upper_drawn_overlaps') return tasks.upper.drawnOverlaps
      if (item.detail === 'upper_needs_drawing') return draw.how
      return tasks.upper.context
    }
    case 'fields_other': {
      const names = s.fields.filter((f) => !f.signal).map((f) => en.fields[f.id]).join(', ')
      return names
    }
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

