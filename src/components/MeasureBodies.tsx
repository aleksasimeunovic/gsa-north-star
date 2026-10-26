import { useState } from 'react'
import { en, formatDinars, formatHa, formatNumber, tasks } from '../copy/en'
import type { Measure, MeasureId, Requirement } from '../data/scenarios'
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
import { StageAction } from '../ui/MapStage'
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

/**
 * Choosing measures, in the order that helps him decide: last year's, then the ones GSA found evidence for
 * on his farm (with that evidence), then the rest that fit, counted but closed. Ticking a measure opens what
 * it needs from him right under it, so choosing and filling in are one step. He can apply with something
 * still empty (nothing he typed is lost), but the task stays open, and blocks submitting, until every
 * measure he chose has everything it needs.
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
  const [draft, setDraft] = useState<Inputs>(stored.inputs)
  const sameChoice = chosen.length === stored.chosen.length && chosen.every((id) => stored.chosen.includes(id))
  const sameInputs = Object.keys(draft).every((k) => JSON.stringify(draft[k]) === JSON.stringify(stored.inputs[k]))
  const changed = !stored.confirmed || !sameChoice || !sameInputs
  // Once he has applied, an empty field says so; before that, each measure only says what's missing.
  const [tried, setTried] = useState(stored.confirmed)

  const toggle = (m: Measure, on: boolean) => {
    setChosen((c) => (on ? [...c.filter((x) => x !== m.id), m.id] : c.filter((x) => x !== m.id)))
    // A suggested measure comes with the fields its evidence was about.
    const g = suggested.find((x) => x.measureId === m.id)
    const pick = m.requirements.find((r) => r.kind === 'fields')
    const key = pick && `${m.id}.${pick.id}`
    if (on && g?.fields && key) setDraft((d) => (d[key] === undefined ? { ...d, [key]: g.fields! } : d))
  }

  const apply = () => {
    const ids = fit.map((m) => m.id).filter((id) => chosen.includes(id))
    // Only what he can see is kept.
    const inputs = Object.fromEntries(
      Object.entries(draft).filter(([k]) => {
        const [mid, rid] = k.split('.')
        const m = fit.find((x) => x.id === mid)
        const r = m?.requirements.find((x) => x.id === rid)
        return !!m && !!r && ids.includes(m.id) && shown(m, r, draft)
      }),
    )
    dispatch({ type: 'choose_measures', chosen: ids, inputs })
    setTried(true)
  }

  const option = (m: Measure) => {
    const on = chosen.includes(m.id)
    const g = suggested.find((x) => x.measureId === m.id)
    return (
      <li key={m.id} className="measure-option" data-on={on || undefined}>
        <Checkbox
          card
          label={en.measures[m.id]}
          checked={on}
          onChange={(v) => toggle(m, v)}
          hint={
            <>
              {g && <span className="measure-line" data-strong>{g.evidence === 'green_all_winter' ? tasks.suggest.green_cover : tasks.suggest.insemination(g.count ?? 0)}</span>}
              <span className="measure-line">{amountLine(m, derived)}</span>
              {!g && !m.lastYear && <span className="measure-line">{t.why[m.id]}</span>}
            </>
          }
        />
        {on && (
          <MeasureFields
            m={m}
            draft={draft}
            showErrors={tried}
            onChange={(k, v) => setDraft((d) => ({ ...d, [k]: v }))}
            onLeaveOut={() => toggle(m, false)}
          />
        )}
      </li>
    )
  }

  return (
    <Stack gap="group">
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
      {/* Nothing to apply for until he ticks one; once applied, the button comes back only when he changes something. */}
      {changed && chosen.length > 0 && (
        <StageAction>
          <Button variant="primary" onClick={apply}>{t.confirm(chosen.length)}</Button>
        </StageAction>
      )}
    </Stack>
  )
}

/**
 * Under a ticked measure: what GSA has from records and what he adds, each in the form that fits it, then
 * where the measure stands. Green only once everything is in; until then it says what's missing, and once
 * he has applied, each empty field says so. An answer that rules the measure out offers to leave it out.
 */
function MeasureFields({ m, draft, showErrors, onChange, onLeaveOut }: { m: Measure; draft: Inputs; showErrors: boolean; onChange: (key: string, v: MeasureValue) => void; onLeaveOut: () => void }) {
  const { derived } = useApp()
  const gaps = measureGaps(m, draft)
  const ruledOut = m.requirements.find((r) => r.blocks !== undefined && draft[`${m.id}.${r.id}`] === r.blocks)
  const own = userReqs(m)
  return (
    <div className="measure-fields">
      {m.requirements
        .filter((r) => shown(m, r, draft))
        .map((r) =>
          r.kind === 'auto' ? (
            <AutoLine key={r.id} r={r} d={derived} />
          ) : (
            <RequirementInput
              key={r.id}
              r={r}
              value={draft[`${m.id}.${r.id}`]}
              error={showErrors && gaps.missing.includes(r.id) ? t.error[r.kind] : undefined}
              onChange={(v) => onChange(`${m.id}.${r.id}`, v)}
            />
          ),
        )}
      {ruledOut ? (
        <>
          <Banner tone="attention">{req(ruledOut).ruledOut}</Banner>
          <div>
            <Button onClick={onLeaveOut}>{t.leaveOut}</Button>
          </div>
        </>
      ) : (
        own.length > 0 && (
          <p className="measure-state" data-ready={!gaps.missing.length || undefined}>
            <Icon name={gaps.missing.length ? 'action_required' : 'complete'} size="sm" />
            {gaps.missing.length ? t.add(gapNames(m, gaps.missing)) : t.ready}
          </p>
        )
      )}
    </div>
  )
}

/** Something GSA already has: shown as done, with where it came from. */
function AutoLine({ r, d }: { r: Requirement; d: Derived }) {
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
  // From records, so it's marked as a record, not as done: green is only for what he has finished.
  return (
    <p className="auto-line">
      {missing ? <StatusBadge status="action_required" iconOnly /> : <span className="auto-mark"><Icon name="records" size="sm" /></span>} <strong>{req(r).label}</strong>: {value}
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

/** One line for the measures task: what's chosen, or which chosen measures still need him and what. */
export function measureSummary(d: Derived, inputs: Inputs): string {
  const item = d.items.find((i) => i.id === 'measures')
  if (item?.detail !== 'measures_incomplete') return t.chosen(d.farm.measures.chosen, d.farm.measures.fitting)
  return item
    .missing!.map((id) => {
      const m = d.scenario.measures.find((x) => x.id === id)!
      const g = measureGaps(m, inputs)
      return `${en.measures[m.id]}: ${g.ruledOut ? t.ruledOut.toLowerCase() : t.add(gapNames(m, g.missing))}`
    })
    .join('. ')
}

const gapNames = (m: Measure, missing: string[]) => m.requirements.filter((r) => missing.includes(r.id)).map((r) => req(r).short).join(', ')
