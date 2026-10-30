import { useState } from 'react'
import { en, formatDinars, formatHa, formatNumber, tasks } from '../copy/en'
import type { Measure, MeasureId, Requirement } from '../data/scenarios'
import { fitting, measureGaps, readyToApply, shown } from '../logic/status'
import { polygonAreaHa, roundHa } from '../logic/geometry'
import type { MeasureValue, NewField } from '../state/actions'
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
function amountLine(m: Measure, d: Derived, added: NewField[]): string {
  if (m.rateDinars && m.unit === 'ha') {
    // A field he added counts only where he applies for this measure on it, as in the estimate.
    const ha = roundHa(added.filter((f) => !f.measures.includes(m.id)).reduce((left, f) => left - polygonAreaHa(f.polygon), d.farm.fields.totalHa))
    return t.plant(formatHa(ha), formatNumber(m.rateDinars), aboutThousand(ha * m.rateDinars))
  }
  if (m.rateDinars && m.unit === 'cow_calved' && d.scenario.herd) {
    const n = d.scenario.herd.cowsCalved
    return t.cows(n, formatNumber(m.rateDinars), aboutThousand(n * m.rateDinars))
  }
  return t.pays[m.id] ?? ''
}

/**
 * Choosing measures, in the order that helps him decide: last year's, then the ones GSA recommends (with its
 * reason), then the rest that fit, closed. Choosing a measure opens what it needs right under it. It only
 * counts as applied once everything every chosen measure needs is in and he applies, so each measure says
 * where it stands and the one action is what's missing, until it can be Apply. What he types is kept as he goes.
 */
export function MeasuresBody() {
  const { derived, state, dispatch } = useApp()
  const s = derived.scenario
  const { chosen, inputs, confirmed } = state.answers.measures
  const fit = fitting(s)
  const suggested = s.suggestions.filter((g) => fit.some((m) => m.id === g.measureId))
  const isSuggested = (id: MeasureId) => suggested.some((g) => g.measureId === id)
  const last = fit.filter((m) => m.lastYear)
  const ofSuggestions = suggested.map((g) => fit.find((m) => m.id === g.measureId)!)
  const more = fit.filter((m) => !m.lastYear && !isSuggested(m.id))
  // The measures he chose, in the order he sees them.
  const picked = [...last, ...ofSuggestions, ...more].filter((m) => chosen.includes(m.id))
  const open = picked.filter((m) => !readyToApply(m, inputs))
  const [moreOpen, setMoreOpen] = useState(more.some((m) => chosen.includes(m.id)))
  // An empty field says so only once he has asked for what's missing.
  const [tried, setTried] = useState(false)

  // Nothing is chosen or filled in for him: GSA prepares, only Milan declares.
  const toggle = (m: Measure, on: boolean) =>
    dispatch({ type: 'draft_measures', chosen: on ? [...chosen.filter((x) => x !== m.id), m.id] : chosen.filter((x) => x !== m.id), inputs })

  const showMissing = () => {
    setTried(true)
    setMoreOpen(true)
    requestAnimationFrame(() => {
      const el = document.getElementById(`measure-${open[0].id}`)
      el?.scrollIntoView({ block: 'start', behavior: 'smooth' })
      el?.querySelector<HTMLElement>('.measure-fields input, .measure-fields textarea, .measure-fields button')?.focus({ preventScroll: true })
    })
  }

  const apply = () => {
    const ids = fit.map((m) => m.id).filter((id) => chosen.includes(id))
    // Only what he can see is kept.
    const kept = Object.fromEntries(
      Object.entries(inputs).filter(([k]) => {
        const [mid, rid] = k.split('.')
        const m = fit.find((x) => x.id === mid)
        const r = m?.requirements.find((x) => x.id === rid)
        return !!m && !!r && ids.includes(m.id) && shown(m, r, inputs)
      }),
    )
    dispatch({ type: 'choose_measures', chosen: ids, inputs: kept })
  }

  const option = (m: Measure) => {
    const on = chosen.includes(m.id)
    const g = suggested.find((x) => x.measureId === m.id)
    const own = userReqs(m)
    return (
      <li key={m.id} id={`measure-${m.id}`} className="measure-option" data-on={on || undefined}>
        <div className="measure-head">
          <span className="measure-text">
            <span className="measure-name">{en.measures[m.id]}</span>
            {/* Why GSA recommends it, what the state still checks, what he provides. */}
            {g && <span className="measure-line text-sm" data-strong>{g.evidence === 'green_all_winter' ? tasks.suggest.green_cover : tasks.suggest.insemination(g.count ?? 0)}</span>}
            <span className="measure-line text-sm text-muted-foreground">{amountLine(m, derived, state.answers.newFields)}</span>
            {!g && !m.lastYear && <span className="measure-line text-sm text-muted-foreground">{t.why[m.id]}</span>}
            {g && tasks.suggest.checks[m.id] && <span className="measure-line text-sm text-muted-foreground">{tasks.suggest.checks[m.id]}</span>}
            {g && !on && own.length > 0 && <span className="measure-line text-sm text-muted-foreground">{tasks.suggest.provide(own.map((r) => req(r).short).join(', '))}</span>}
          </span>
          <Button onClick={() => toggle(m, !on)}>
            {on ? t.leaveOut : m.lastYear ? t.chooseAgain : t.choose}
            <span className="sr-only">: {en.measures[m.id]}</span>
          </Button>
        </div>
        {on && (
          <MeasureFields
            m={m}
            inputs={inputs}
            applied={confirmed}
            suggestedFields={g?.fields}
            showErrors={tried}
            onChange={(k, v) => dispatch({ type: 'draft_measures', chosen, inputs: { ...inputs, [k]: v } })}
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
            <Icon name="change" /> {t.groupSuggested}
          </h4>
          <ul className="measure-list">{ofSuggestions.map(option)}</ul>
        </section>
      )}
      {more.length > 0 && (
        <Disclosure label={t.groupMore(more.length)} open={moreOpen} onOpenChange={setMoreOpen}>
          <ul className="measure-list">{more.map(option)}</ul>
        </Disclosure>
      )}
      {/* One action: what's missing until nothing is, then Apply. Nothing to do until he chooses one, or once he has applied. */}
      {picked.length > 0 && (open.length > 0 || !confirmed) && (
        <StageAction>
          <p className="measure-progress" aria-live="polite">
            {open.length ? t.notApplied(picked.length - open.length, picked.length, en.measures[open[0].id]) : t.allFilled}
          </p>
          {open.length ? (
            <Button variant="primary" onClick={showMissing}>{t.fillIn}</Button>
          ) : (
            <Button variant="primary" onClick={apply}>{t.confirm(picked.length)}</Button>
          )}
        </StageAction>
      )}
    </Stack>
  )
}

/**
 * Under a chosen measure: where it stands first (still to fill in, ready to apply, applied), then what GSA
 * already has and what he adds, each in the form that fits it. An answer that rules it out says so.
 */
function MeasureFields({ m, inputs, applied, suggestedFields, showErrors, onChange }: { m: Measure; inputs: Inputs; applied: boolean; suggestedFields?: string[]; showErrors: boolean; onChange: (key: string, v: MeasureValue) => void }) {
  const { derived } = useApp()
  const gaps = measureGaps(m, inputs)
  const ruledOut = m.requirements.find((r) => r.blocks !== undefined && inputs[`${m.id}.${r.id}`] === r.blocks)
  return (
    <div className="measure-fields">
      {ruledOut ? (
        <Banner tone="attention">{req(ruledOut).ruledOut}</Banner>
      ) : (
        <p className="measure-state" data-ready={!gaps.missing.length || undefined}>
          <Icon name={gaps.missing.length ? 'todo' : 'complete'} size="sm" />
          {gaps.missing.length ? t.stillToFill(gapNames(m, gaps.missing)) : applied ? t.applied : t.ready}
        </p>
      )}
      {m.requirements
        .filter((r) => shown(m, r, inputs))
        .map((r) =>
          r.kind === 'auto' ? (
            <AutoLine key={r.id} r={r} d={derived} />
          ) : (
            <Stack key={r.id} gap="sm">
              {/* The fields GSA's evidence was about: suggested, never ticked for him. One tap uses them. */}
              {r.kind === 'fields' && suggestedFields && !(inputs[`${m.id}.${r.id}`] as string[] | undefined)?.length && (
                <div>
                  <Button onClick={() => onChange(`${m.id}.${r.id}`, suggestedFields)}>
                    {tasks.suggest.useFields(suggestedFields.map((f) => en.fields[f as keyof typeof en.fields]).join(', '))}
                  </Button>
                </div>
              )}
              <RequirementInput
                r={r}
                value={inputs[`${m.id}.${r.id}`]}
                error={showErrors && gaps.missing.includes(r.id) ? t.error[r.kind] : undefined}
                onChange={(v) => onChange(`${m.id}.${r.id}`, v)}
              />
            </Stack>
          ),
        )}
    </div>
  )
}

/** What he still lacks for the measures that don't fit his farm yet: what to do, in one line each. */
export function MeasureGoals() {
  const { derived } = useApp()
  const goals = derived.scenario.measures.filter((m) => m.goal)
  if (!goals.length) return null
  return (
    <section className="records" aria-labelledby="goals-title">
      <h3 id="goals-title" className="records-title"><Icon name="goal" size="sm" /> {t.goalsTitle}</h3>
      <dl className="records-rows">
        {goals.map((m) => (
          <div key={m.id} className="records-row">
            <div className="records-text">
              <dt>{en.measures[m.id]}</dt>
              <dd className="records-value">{t.goal[m.goal!.kind](m.goal!.left)}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}

/** Something GSA already has, shown so he sees it counts. */
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
  // Already there, so it's marked neutrally: green is only for what he has finished.
  return (
    <p className="auto-line">
      {missing ? <StatusBadge mark="error" iconOnly /> : <span className="auto-mark"><Icon name="check" size="sm" /></span>}
      <span>
        <strong>{req(r).label}</strong>: {value}
      </span>
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
  if (item?.detail === 'measures_chosen') return t.appliedFor(d.farm.measures.chosen)
  if (item?.detail !== 'measures_incomplete') return t.chosen(d.farm.measures.chosen, d.farm.measures.fitting)
  return item
    .missing!.map((id) => {
      const m = d.scenario.measures.find((x) => x.id === id)!
      const g = measureGaps(m, inputs)
      return `${en.measures[m.id]}: ${g.ruledOut ? t.ruledOut.toLowerCase() : t.stillToFill(gapNames(m, g.missing)).toLowerCase()}`
    })
    .join('. ')
}

const gapNames = (m: Measure, missing: string[]) => m.requirements.filter((r) => missing.includes(r.id)).map((r) => req(r).short).join(', ')
