import { useState } from 'react'
import { en, formatDinars, formatHa, formatNumber, tasks } from '../copy/en'
import type { Measure, MeasureId, Requirement } from '../data/scenarios'
import type { TaskId } from '../logic/application'
import { fitting, measureGaps, shown } from '../logic/status'
import type { MeasureValue } from '../state/actions'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Checkbox, CheckboxGroup } from '../ui/Checkbox'
import { Disclosure } from '../ui/Disclosure'
import { Field } from '../ui/Field'
import { FileInput } from '../ui/FileInput'
import { Stack, Text } from '../ui/Layout'
import { RadioGroup } from '../ui/RadioGroup'
import { Icon } from '../ui/Icon'
import { StatusBadge } from '../ui/StatusBadge'
import { useApp, type AppCtx } from './AppContext'

type Derived = AppCtx['derived']
type Inputs = Record<string, MeasureValue>

const t = tasks.measures
const req = (r: Requirement) => tasks.requirement[r.id]
const aboutThousand = (n: number) => formatDinars(Math.round(n / 1000) * 1000)
const userReqs = (m: Measure) => m.requirements.filter((r) => r.kind !== 'auto')

/** What the measure pays, worked out on his own numbers where the rate is known. */
function amountLine(m: Measure, d: Derived): string {
  if (m.rateDinars && m.unit === 'ha') return t.plant(formatHa(d.farm.fields.totalHa), formatNumber(m.rateDinars), aboutThousand(d.farm.fields.totalHa * m.rateDinars))
  if (m.rateDinars && m.unit === 'cow_calved' && d.scenario.herd) {
    const n = d.scenario.herd.cowsCalved
    return t.cows(n, formatNumber(m.rateDinars), aboutThousand(n * m.rateDinars))
  }
  return t.pays[m.id] ?? ''
}

/** Before he chooses: whether a measure adds work, and what. */
export const needsLine = (m: Measure, filledFor: Requirement['kind'][] = []) => {
  // Only what's always asked; a follow-up question appears once an answer makes it needed.
  // What GSA fills in for him (the fields the satellite saw) isn't his to add.
  const always = userReqs(m).filter((r) => !r.when && !filledFor.includes(r.kind))
  return always.length ? t.youAdd(always.map((r) => req(r).short).join(', ')) : t.fromRecords
}

/**
 * Choosing measures, in the order that helps him decide: last year's (ticked), then the ones GSA found
 * evidence for on his farm (with that evidence), then the rest that fit, counted but closed. What a measure
 * would need from him shows once he ticks it, so the work is clear before he takes it on.
 */
export function MeasuresBody() {
  const { derived, state, dispatch } = useApp()
  const s = derived.scenario
  const stored = state.answers.measures
  const fit = fitting(s)
  const suggested = s.suggestions.filter((g) => fit.some((m) => m.id === g.measureId))
  const isSuggested = (id: MeasureId) => suggested.some((g) => g.measureId === id)
  const last = fit.filter((m) => m.lastYear)
  const ofSuggestions = suggested.map((g) => fit.find((m) => m.id === g.measureId)!)
  const more = fit.filter((m) => !m.lastYear && !isSuggested(m.id))
  const others = s.measures.filter((m) => !m.fits)
  const [chosen, setChosen] = useState<MeasureId[]>(stored.chosen)
  const changed = !stored.confirmed || chosen.length !== stored.chosen.length || chosen.some((id) => !stored.chosen.includes(id))

  const option = (m: Measure) => {
    const on = chosen.includes(m.id)
    const g = suggested.find((x) => x.measureId === m.id)
    return (
      <li key={m.id}>
        <Checkbox
          card
          label={en.measures[m.id]}
          checked={on}
          onChange={(v) => {
            setChosen(v ? [...chosen, m.id] : chosen.filter((x) => x !== m.id))
          }}
          hint={
            <>
              {g && <span className="measure-line" data-strong>{g.evidence === 'green_all_winter' ? tasks.suggest.green_cover : tasks.suggest.insemination(g.count ?? 0)}</span>}
              <span className="measure-line">{amountLine(m, derived)}</span>
              {!g && !m.lastYear && <span className="measure-line">{t.why[m.id]}</span>}
              {on && needsLine(m, g?.fields ? ['fields'] : []) !== t.fromRecords && (
                <span className="measure-line" data-strong>{needsLine(m, g?.fields ? ['fields'] : [])}</span>
              )}
            </>
          }
        />
      </li>
    )
  }

  return (
    <Stack gap="md">
      <Text>{t.lead(fit.length)}</Text>
      <section className="measure-group" aria-labelledby="m-last">
        <h4 id="m-last" className="group-title">{t.groupLast}</h4>
        <ul className="measure-list">{last.map(option)}</ul>
      </section>
      {ofSuggestions.length > 0 && (
        <section className="measure-group" data-suggested aria-labelledby="m-suggested">
          <h4 id="m-suggested" className="group-title">
            <Icon name="change" /> {t.groupSuggested(ofSuggestions.length)}
          </h4>
          <ul className="measure-list">{ofSuggestions.map(option)}</ul>
        </section>
      )}
      {more.length > 0 && (
        <Disclosure label={t.groupMore(more.length)}>
          <Stack gap="sm">
            <ul className="measure-list">{more.map(option)}</ul>
            {others.length > 0 && (
              <Text variant="small">
                {t.others(others.map((m) => `${en.measures[m.id].toLowerCase()} (${t.why[m.id].toLowerCase()})`).join(', '))}
              </Text>
            )}
          </Stack>
        </Disclosure>
      )}
      {changed && (
        <div>
          <Button
            variant="primary"
            disabled={chosen.length === 0}
            onClick={() => dispatch({ type: 'choose_measures', chosen: fit.map((m) => m.id).filter((id) => chosen.includes(id)) })}
          >
            {t.confirm(chosen.length)}
          </Button>
        </div>
      )}
    </Stack>
  )
}

/** Something GSA already has: shown as done, with where it came from. */
function AutoLine({ m, r, d }: { m: Measure; r: Requirement; d: Derived }) {
  const a = tasks.auto
  const receipts = d.items.find((i) => i.id === 'receipts')
  const value =
    r.id === 'land'
      ? a.land(formatHa(d.farm.fields.totalHa), d.farm.fields.count)
      : r.id === 'receipts'
        ? receipts?.detail === 'receipts_missing'
          ? a.receiptsMissing
          : a.receipts(d.scenario.documents.flatMap((x) => x.files).length)
        : r.id === 'calvings'
          ? a.calvings(d.scenario.herd?.cowsCalved ?? 0)
          : a.fertiliser_receipt
  const missing = r.id === 'receipts' && receipts?.detail === 'receipts_missing'
  return (
    <p className="auto-line" key={`${m.id}.${r.id}`}>
      <StatusBadge status={missing ? 'action_required' : 'complete'} iconOnly /> <strong>{req(r).label}</strong>: {value}
    </p>
  )
}

/** One input, chosen by what the measure needs: a file, a number, words, a choice, fields or a promise. */
function RequirementInput({ r, value, error, onChange }: { r: Requirement; value: MeasureValue | undefined; error?: string; onChange: (v: MeasureValue) => void }) {
  const { derived } = useApp()
  const c = req(r)
  switch (r.kind) {
    case 'upload':
      return (
        <Stack gap="sm">
          {typeof value === 'string' && value && <Text>{t.attached(value)}</Text>}
          {error && <span className="error" role="alert">{error}</span>}
          <FileInput label={c.label} hint={c.hint} onFile={onChange} />
        </Stack>
      )
    case 'number':
      return <Field label={c.label} hint={c.hint} error={error} inputMode="numeric" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
    case 'text':
      return <Field label={c.label} hint={c.hint} error={error} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
    case 'longtext':
      return <Field multiline rows={3} label={c.label} hint={c.hint} error={error} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
    case 'choice':
      return (
        <div>
          {error && <span className="error" role="alert">{error}</span>}
          <RadioGroup
            legend={c.label}
            hint={c.hint}
            options={(r.options ?? []).map((o) => ({ value: o, label: c.options?.[o] ?? o }))}
            value={(value as string) ?? null}
            onChange={onChange}
          />
        </div>
      )
    case 'fields':
      return (
        <CheckboxGroup
          legend={c.label}
          error={error}
          options={derived.scenario.fields.filter((f) => f.arable).map((f) => ({ value: f.id, label: `${en.fields[f.id]}, ${formatHa(f.areaHa)}` }))}
          value={(value as string[]) ?? []}
          onChange={onChange}
        />
      )
    case 'confirm':
      return (
        <div>
          {error && <span className="error" role="alert">{error}</span>}
          <Checkbox label={c.label} checked={value === true} onChange={onChange} />
        </div>
      )
    default:
      return null
  }
}

/**
 * One measure he chose that needs something from him. What GSA has is shown done; what he adds
 * is asked in the form that fits it. An answer that rules the measure out is said at once, with a way out.
 */
export function MeasureBody({ taskId }: { taskId: TaskId }) {
  const { derived, state, dispatch } = useApp()
  const m = derived.scenario.measures.find((x) => `measure_${x.id}` === taskId)!
  const stored = state.answers.measures
  const [draft, setDraft] = useState<Inputs>(() => Object.fromEntries(Object.entries(stored.inputs).filter(([k]) => k.startsWith(`${m.id}.`))))
  const [tried, setTried] = useState(false)
  const gaps = measureGaps(m, draft)
  const ruledOut = m.requirements.find((r) => r.blocks !== undefined && draft[`${m.id}.${r.id}`] === r.blocks)

  const save = () => {
    if (gaps.missing.length) {
      setTried(true)
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`#${taskId}-form [role='alert']`)?.scrollIntoView({ block: 'center' }))
      return
    }
    // Only what he can see is kept.
    dispatch({ type: 'save_measure', measureId: m.id, inputs: Object.fromEntries(Object.entries(draft).filter(([k]) => m.requirements.some((r) => `${m.id}.${r.id}` === k && shown(m, r, draft)))) })
  }

  return (
    <Stack gap="sm">
      <Text variant="small">{amountLine(m, derived)}</Text>
      <form
        id={`${taskId}-form`}
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <Stack gap="md">
          {m.requirements
            .filter((r) => shown(m, r, draft))
            .map((r) =>
              r.kind === 'auto' ? (
                <AutoLine key={r.id} m={m} r={r} d={derived} />
              ) : (
                <RequirementInput
                  key={r.id}
                  r={r}
                  value={draft[`${m.id}.${r.id}`]}
                  error={tried && gaps.missing.includes(r.id) ? t.error[r.kind] : undefined}
                  onChange={(v) => setDraft({ ...draft, [`${m.id}.${r.id}`]: v })}
                />
              ),
            )}
          {ruledOut ? (
            <>
              <Banner tone="attention">{req(ruledOut).ruledOut}</Banner>
              <div>
                <Button variant="primary" onClick={() => dispatch({ type: 'choose_measures', chosen: stored.chosen.filter((id) => id !== m.id) })}>
                  {t.leaveOut}
                </Button>
              </div>
            </>
          ) : (
            <div>
              <Button type="submit" variant="primary">{t.save}</Button>
            </div>
          )}
        </Stack>
      </form>
    </Stack>
  )
}

/** One line for a collapsed measure task, or the choosing task. */
export function measureSummary(id: TaskId, d: Derived): string {
  if (id === 'measures') return t.chosen(d.farm.measures.chosen, d.farm.measures.fitting)
  const item = d.items.find((i) => i.id === id)
  if (!item) return ''
  if (item.detail === 'measure_ruled_out') return t.ruledOut
  if (item.missing?.length) {
    const m = d.scenario.measures.find((x) => `measure_${x.id}` === id)!
    return t.needs(m.requirements.filter((r) => item.missing!.includes(r.id)).map((r) => req(r).short).join(', '))
  }
  return t.ready
}
