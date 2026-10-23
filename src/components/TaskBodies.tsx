import { useRef, useState } from 'react'
import { en, formatDate, formatDateYear, formatDinars, formatHa, formatNumber, home, map, tasks } from '../copy/en'
import { milanCaseState } from '../logic/advisor'
import type { Task, TaskId } from '../logic/application'
import { partNames, roundHa, splitPolygon } from '../logic/geometry'
import { impactOf, orderMeasures, type Item, type ItemId } from '../logic/status'
import type { Confirmable, YesNo } from '../state/actions'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Disclosure } from '../ui/Disclosure'
import { Field } from '../ui/Field'
import { FileInput } from '../ui/FileInput'
import { Compare, Stack, Text, VisuallyHidden } from '../ui/Layout'
import { Note } from '../ui/Note'
import { RadioGroup } from '../ui/RadioGroup'
import { Toggle } from '../ui/Toggle'
import { useApp, type AppCtx } from './AppContext'
import { FieldMap, MapKey } from './FieldMap'
import { SendToJelena } from './SendToJelena'
import { SplitControls, SplitOverlay, useSplitDraft } from './SplitTool'

type Derived = AppCtx['derived']
type Body = { advance: () => void }

const itemOf = (d: Derived, id: string) => d.items.find((i) => i.id === id) as Item
const about = (n: number) => formatDinars(Math.abs(Math.round(n / 100) * 100))
const aboutThousand = (n: number) => formatDinars(Math.round(n / 1000) * 1000)
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
    <RadioGroup
      inline
      legend={legend}
      hint={hint}
      options={YES_NO}
      value={value}
      onChange={(a) => {
        onAnswer(a)
        setEditing(false)
        requestAnimationFrame(() => line.current?.focus())
      }}
    />
  )
}

const Primary = ({ onClick, children }: { onClick: () => void; children: string }) => (
  <div>
    <Button variant="primary" onClick={onClick}>{children}</Button>
  </div>
)

function RenewalBody() {
  const { go } = useApp()
  return (
    <Stack gap="sm">
      <Text>{tasks.renewal.body}</Text>
      <Primary onClick={() => go('renewal')}>{tasks.renewal.button}</Primary>
    </Stack>
  )
}

function HerdBody({ advance }: Body) {
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
    if (count.trim() === '' || !Number.isInteger(n) || n < 0) return setError(tasks.herd.countError)
    setError(undefined)
    dispatch({ type: 'set_herd_count', count: n })
  }

  return (
    <Stack gap="sm">
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
              <Button type="submit" variant="primary">{tasks.herd.countSave}</Button>
            </div>
          </Stack>
        </form>
      )}
      {c && (
        <>
          <Text>{tasks.herd.keepBoth}</Text>
          <Text>{tasks.herd.sameEstimate}</Text>
          <Text variant="secondary">
            {tasks.herd.canSubmit} <Note kind="assumption" />
          </Text>
          {jelena ? (
            <Banner>{tasks.jelena.state[jelena]}</Banner>
          ) : composing ? (
            <SendToJelena itemId="herd" onDone={() => setComposing(false)} />
          ) : (
            <div>
              <Button onClick={() => setComposing(true)}>{tasks.herd.sendJelena}</Button>
            </div>
          )}
          {!composing && <Primary onClick={advance}>{en.continue}</Primary>}
        </>
      )}
    </Stack>
  )
}

function RiverBody() {
  const { derived, state, dispatch } = useApp()
  const field = derived.scenario.fields.find((f) => f.id === 'river')!
  const item = itemOf(derived, 'field_river')
  const a = state.answers.river
  const svgRef = useRef<SVGSVGElement>(null)
  const draft = useSplitDraft(field, a.split)
  const [editingSplit, setEditingSplit] = useState(false)
  const splitting = a.answer === 'yes' && (item.status === 'action_required' || editingSplit)

  return (
    <Stack gap="sm">
      {a.answer === null && <Text>{tasks.river.context}</Text>}
      <figure className="map-figure">
        <FieldMap
          scenario={derived.scenario}
          focus="river"
          svgRef={svgRef}
          label={`${map.title}: ${en.fields.river}`}
          overlay={a.answer === 'yes' ? (unit) => <SplitOverlay field={field} d={draft} svgRef={svgRef} unit={unit} interactive={splitting} /> : undefined}
        />
        {a.answer === null && (
          <figcaption className="text" data-variant="small">
            {tasks.river.source} <Note kind="eu_mandate" />
          </figcaption>
        )}
      </figure>
      <Question
        legend={tasks.river.question}
        hint={tasks.river.hint}
        value={a.answer}
        answer={a.answer === 'yes' ? tasks.river.answerYes : tasks.river.answerNo}
        onAnswer={(answer) => dispatch({ type: 'answer_river', answer })}
      />
      {a.answer === 'yes' &&
        (splitting ? (
          <SplitControls
            field={field}
            d={draft}
            onConfirm={(split) => {
              dispatch({ type: 'set_split', split })
              setEditingSplit(false)
            }}
          />
        ) : (
          <div>
            <Button variant="link" onClick={() => setEditingSplit(true)}>{en.change}</Button>
          </div>
        ))}
    </Stack>
  )
}

function RoadBody({ advance }: Body) {
  const { derived, state, dispatch } = useApp()
  const s = derived.scenario
  const field = s.fields.find((f) => f.id === 'road')!
  const strip = field.signal?.kind === 'road_strip' ? field.signal.stripHa : 0
  const a = state.answers.road
  const item = itemOf(derived, 'field_road')

  return (
    <Stack gap="sm">
      {a.answer === null && <Text>{tasks.road.context}</Text>}
      <FieldMap scenario={s} focus="road" label={`${map.title}: ${en.fields.road}`} />
      {/* Size and payment impact, before he answers. */}
      <ul className="facts">
        <li>{tasks.road.area(formatHa(field.areaHa), formatHa(roundHa(field.areaHa - strip)))}</li>
        <li>{tasks.road.payment(about(impactOf(s, strip, 'road_took_area').amountDinars))}</li>
      </ul>
      <Question legend={tasks.road.question} value={a.answer} onAnswer={(answer) => dispatch({ type: 'answer_road', answer })} />
      {item.status === 'awaiting_verification' && (
        <>
          <Text>{tasks.road.correctionAsked}</Text>
          <Primary onClick={advance}>{en.continue}</Primary>
        </>
      )}
    </Stack>
  )
}

function FieldsBody() {
  const { derived } = useApp()
  const s = derived.scenario
  const same = s.fields.filter((f) => !f.signal)
  const [plots, setPlots] = useState(false)
  return (
    <Stack gap="sm">
      <FieldMap scenario={s} highlight={same.map((f) => f.id)} showPlots={plots} label={map.title} />
      <MapKey />
      <Toggle label={map.plots} checked={plots} onChange={setPlots} />
      <ul className="plain-list">
        {same.map((f) => (
          <li key={f.id}>
            <strong>{en.fields[f.id]}</strong> {tasks.fields.row(formatHa(f.areaHa), en.crops[f.cropLastYear])}
          </li>
        ))}
      </ul>
    </Stack>
  )
}

function DetailsBody({ advance }: Body) {
  const { derived, dispatch } = useApp()
  const g = derived.scenario.generalData
  const asked = itemOf(derived, 'details').status === 'awaiting_verification'
  return (
    <Stack gap="sm">
      <dl className="records">
        <dt>{tasks.details.holder}</dt>
        <dd>{g.holder}</dd>
        <dt>{tasks.details.place}</dt>
        <dd>{g.place}</dd>
        <dt>{tasks.details.active}</dt>
        <dd>{tasks.details.activeYes}</dd>
      </dl>
      {asked ? (
        <>
          <Text>{tasks.details.asked}</Text>
          <Primary onClick={advance}>{en.continue}</Primary>
        </>
      ) : (
        <div>
          <Button variant="link" onClick={() => dispatch({ type: 'ask_record_check', itemId: 'details' })}>{tasks.details.wrong}</Button>
        </div>
      )}
    </Stack>
  )
}

function MeasuresBody() {
  const { derived } = useApp()
  const { scenario: s, estimate } = derived
  const herd = s.herd
  const measures = orderMeasures(s.measures)
  const others = measures.filter((m) => !m.fits)
  const t = tasks.measures
  return (
    <Stack gap="sm">
      {/* What he gets, worked out on his own numbers. */}
      {estimate.lines.map((l) => (
        <div key={l.measureId} className="measure">
          <Text variant="strong">{en.measures[l.measureId]}</Text>
          <Text>
            {l.measureId === 'plant_production'
              ? t.plant(formatHa(l.quantity), formatNumber(l.rateDinars), aboutThousand(l.amountDinars))
              : t.cows(l.quantity, formatNumber(l.rateDinars), aboutThousand(l.amountDinars))}
          </Text>
          <Text variant="small">
            {l.measureId === 'plant_production'
              ? `${t.plantWhy} ${t.plantPart}`
              : `${t.cowsWhy(formatDateYear(herd!.calvingPeriod.from), formatDateYear(herd!.calvingPeriod.to))} ${t.cowsPart}`}
          </Text>
        </div>
      ))}
      <div><Note kind="tested" /></div>
      {others.length > 0 && (
        <Disclosure label={t.others(others.length)}>
          {others.map((m) => (
            <div key={m.id}>
              <Text variant="strong">{en.measures[m.id]}</Text>
              <Text variant="small">{t.doesNotFit} {m.id === 'eco_scheme' && t.ecoCondition}</Text>
            </div>
          ))}
        </Disclosure>
      )}
    </Stack>
  )
}

function ReceiptsBody() {
  const { derived, dispatch } = useApp()
  const missing = itemOf(derived, 'receipts').detail === 'receipts_missing'
  if (missing) {
    return (
      <Stack gap="sm">
        <Text>{tasks.receipts.needed}</Text>
        <FileInput label={tasks.receipts.upload} onFile={() => dispatch({ type: 'attach_document', documentId: 'input_receipts' })} />
      </Stack>
    )
  }
  const files = derived.scenario.documents.flatMap((d) => d.files)
  return (
    <ul className="plain-list">
      {files.map((f) => (
        <li key={f.name}>
          <strong>{f.name}</strong> {formatDate(f.date)}
        </li>
      ))}
    </ul>
  )
}

/** Everything that hasn't changed, each thing named and openable, confirmed in one tap. */
function SameBody({ task }: { task: Task }) {
  const { derived, state, dispatch } = useApp()
  const members = task.members ?? []
  const toConfirm = members.filter((id) => itemOf(derived, id).status === 'action_required')
  return (
    <Stack gap="sm">
      <ul className="same-list">
        {members.map((id) => (
          <li key={id}>
            <Disclosure label={tasks.title[id]}>
              <MemberBody id={id} />
            </Disclosure>
            <p className="task-summary">{taskSummary(id, derived, state)}</p>
          </li>
        ))}
      </ul>
      {toConfirm.length > 0 && (
        <Primary onClick={() => dispatch({ type: 'confirm_same', what: toConfirm as Confirmable[] })}>{tasks.same.confirm}</Primary>
      )}
    </Stack>
  )
}

function MemberBody({ id }: { id: ItemId }) {
  if (id === 'fields_other') return <FieldsBody />
  if (id === 'details') return <DetailsBody advance={() => {}} />
  if (id === 'measures') return <MeasuresBody />
  return <ReceiptsBody />
}

export function TaskBody({ task, advance }: { task: Task; advance: () => void }) {
  const id = task.id
  switch (id) {
    case 'same':
      return <SameBody task={task} />
    case 'renewal':
      return <RenewalBody />
    case 'herd':
      return <HerdBody advance={advance} />
    case 'field_river':
      return <RiverBody />
    case 'field_road':
      return <RoadBody advance={advance} />
    case 'fields_other':
      return <FieldsBody />
    case 'details':
      return <DetailsBody advance={advance} />
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
  if (id === 'same') return d.list.done.concat(d.list.todo).find((t) => t.id === 'same')?.members?.map((m) => tasks.title[m]).join(', ') ?? ''
  const item = itemOf(d, id)
  const done = item.status === 'complete'
  switch (id) {
    case 'herd': {
      const h = s.herd!
      if (item.conflict) return `${tasks.herd.differs(item.conflict.his, item.conflict.record)} ${jelena ? tasks.jelena.state[jelena] : tasks.herd.willCheck}`
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
      if (item.detail === 'river_one_crop') return `${tasks.river.answerNo}. ${tasks.river.mayCheck}`
      return tasks.river.context
    }
    case 'field_road': {
      const f = s.fields.find((x) => x.id === 'road')!
      const strip = f.signal?.kind === 'road_strip' ? f.signal.stripHa : 0
      if (done && item.paymentImpact) return `${tasks.road.done(formatHa(roundHa(f.areaHa - strip)))}. ${tasks.road.payment(about(item.paymentImpact.amountDinars))}.`
      if (item.status === 'awaiting_verification') return tasks.road.correctionAsked
      return tasks.road.context
    }
    case 'fields_other': {
      const names = s.fields.filter((f) => !f.signal).map((f) => en.fields[f.id]).join(', ')
      return names
    }
    case 'details':
      return item.status === 'awaiting_verification' ? tasks.details.asked : `${s.generalData.holder}, ${s.generalData.place}`
    case 'measures':
      return tasks.measures.done(d.estimate.lines.length)
    case 'receipts':
      return item.detail === 'receipts_missing' ? tasks.receipts.needed : tasks.receipts.files(Math.max(1, s.documents.flatMap((x) => x.files).length))
    default:
      return ''
  }
}

