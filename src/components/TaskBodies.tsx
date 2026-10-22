import { useRef, useState } from 'react'
import { en, formatDateYear, formatDinars, formatHa, home, map, tasks } from '../copy/en'
import { milanCaseState } from '../logic/advisor'
import type { TaskId } from '../logic/application'
import { partNames, roundHa, splitPolygon } from '../logic/geometry'
import { impactOf, orderMeasures, type Item } from '../logic/status'
import type { YesNo } from '../state/actions'
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

function RiverBody({ advance }: Body) {
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
      {a.answer === 'no' && (
        <RadioGroup
          legend={tasks.river.choose}
          value={a.noOption}
          onChange={(option) => dispatch({ type: 'river_no_option', option })}
          options={[
            { value: 'redraw', label: tasks.river.redraw },
            { value: 'field_check', label: tasks.river.fieldCheck, hint: tasks.river.fieldCheckHint },
          ]}
        />
      )}
      {a.answer === 'no' && a.noOption === 'redraw' && !a.redrawn && (
        <Primary onClick={() => dispatch({ type: 'river_redrawn' })}>{tasks.river.saveRedraw}</Primary>
      )}
      {item.status === 'awaiting_verification' && item.paymentImpact && (
        <>
          <Text>{tasks.river.checkAsked}</Text>
          <Text variant="secondary">{en.impact.field_check_pending(formatHa(item.paymentImpact.areaHa), about(item.paymentImpact.amountDinars))}</Text>
          <Primary onClick={advance}>{en.continue}</Primary>
        </>
      )}
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
      {a.answer === 'no' && !a.correctionRequested && (
        <>
          <Text>{tasks.road.noIntro}</Text>
          <Primary onClick={() => dispatch({ type: 'request_road_correction' })}>{tasks.road.askCorrection}</Primary>
        </>
      )}
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
  const { derived, dispatch } = useApp()
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
      <Primary onClick={() => dispatch({ type: 'confirm', what: 'fields_other' })}>{tasks.fields.confirm}</Primary>
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
      </dl>
      {asked ? (
        <>
          <Text>{tasks.details.asked}</Text>
          <Primary onClick={advance}>{en.continue}</Primary>
        </>
      ) : (
        <>
          <Primary onClick={() => dispatch({ type: 'confirm', what: 'details' })}>{tasks.details.confirm}</Primary>
          <div>
            <Button variant="link" onClick={() => dispatch({ type: 'ask_record_check', itemId: 'details' })}>{tasks.details.wrong}</Button>
          </div>
        </>
      )}
    </Stack>
  )
}

function MeasuresBody() {
  const { derived, dispatch } = useApp()
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
              ? t.plant(formatHa(l.quantity), formatDinars(l.rateDinars))
              : t.cows(l.quantity, formatDinars(l.rateDinars))}
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
      <Primary onClick={() => dispatch({ type: 'confirm', what: 'measures' })}>{t.confirm}</Primary>
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
  return (
    <Stack gap="sm">
      <Text>{tasks.receipts.attached}</Text>
      <Primary onClick={() => dispatch({ type: 'confirm', what: 'receipts' })}>{tasks.receipts.confirm}</Primary>
    </Stack>
  )
}

export function TaskBody({ id, advance }: { id: TaskId; advance: () => void }) {
  switch (id) {
    case 'renewal':
      return <RenewalBody />
    case 'herd':
      return <HerdBody advance={advance} />
    case 'field_river':
      return <RiverBody advance={advance} />
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
  if (id === 'renewal') return d.list.tasks[0].status === 'complete' ? home.activeFarmer : tasks.renewal.body
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
      if (item.detail === 'river_redrawn') return tasks.river.redrawn
      if (item.status === 'awaiting_verification') return tasks.river.checkAsked
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
      return done ? `${names}. ${tasks.fields.done}.` : names
    }
    case 'details':
      return item.status === 'awaiting_verification' ? tasks.details.asked : done ? tasks.details.done : s.generalData.holder
    case 'measures':
      return tasks.measures.done(d.estimate.lines.length)
    case 'receipts':
      return item.detail === 'receipts_missing' ? tasks.receipts.needed : tasks.receipts.done
    default:
      return ''
  }
}

