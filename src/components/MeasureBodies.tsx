import { Suspense, useRef, useState, type ReactNode } from 'react'
import { en, formatDinars, formatHa, formatNumber, split, tasks } from '../copy/en'
import type { Measure, MeasureId, Requirement, Suggestion } from '../data/scenarios'
import { fitting, goalGain, measureGaps, readyToApply, shown } from '../logic/status'
import { carriedFields, fieldChoices, newCrops, riverParts } from '../logic/farm'
import type { PartName } from '../logic/geometry'
import type { MeasureValue } from '../state/actions'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Checkbox, CheckboxGroup } from '../ui/Checkbox'
import { Checkbox as CheckboxBase } from '../ui/shadcn/checkbox'
import { Disclosure } from '../ui/Disclosure'
import { Drawer } from '../ui/Drawer'
import { Field } from '../ui/Field'
import { FileInput } from '../ui/FileInput'
import { Stack, Text, VisuallyHidden } from '../ui/Layout'
import { RadioGroup } from '../ui/RadioGroup'
import { Icon } from '../ui/Icon'
import { StatusBadge } from '../ui/StatusBadge'
import { useApp, type AppCtx } from './AppContext'
import { FarmMap, MapFallback } from './TaskBodies'

type Derived = AppCtx['derived']
type Inputs = Record<string, MeasureValue>

const t = tasks.measures
/** A field by name; once the river field is split, each part by where it sits on the map. */
const fieldName = (id: string) => (id.startsWith('river:') ? tasks.suggest.riverPart(split.part[id.slice(6) as PartName]) : en.fields[id as keyof typeof en.fields])
const req = (r: Requirement) => tasks.requirement[r.id]
const aboutThousand = (n: number) => formatDinars(Math.round(n / 1000) * 1000)
const quantity = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2))
const userReqs = (m: Measure) => m.requirements.filter((r) => r.kind !== 'auto')

/** What the measure pays, worked out on his own numbers where the rate is known. */
function amountLine(m: Measure, d: Derived): string {
  if (m.rateDinars && m.unit === 'ha') {
    const ha = d.farm.fields.totalHa
    return t.plant(formatHa(ha), formatNumber(m.rateDinars), aboutThousand(ha * m.rateDinars))
  }
  if (m.rateDinars && m.unit === 'cow_calved' && d.scenario.herd) {
    const n = d.scenario.herd.cowsCalved
    return t.cows(n, formatNumber(m.rateDinars), aboutThousand(n * m.rateDinars))
  }
  return t.pays[m.id] ?? ''
}

/** One short line under a measure's name: why it fits, or what it pays him. The rest is in its side panel. */
function shortLine(m: Measure, d: Derived, g: Suggestion | undefined, fresh: ReturnType<typeof newCrops>[number] | undefined): string {
  if (g) return g.evidence === 'green_all_winter' ? tasks.suggest.green_cover : tasks.suggest.insemination(g.count ?? 0)
  if (m.lastYear) return amountLine(m, d)
  if (m.id === 'certified_seed' && fresh) return t.newCrop(en.crops[fresh.crop].toLowerCase())
  return t.why[m.id] ?? ''
}

/**
 * Choosing measures, in the order that helps him decide: last year's, then the ones GSA recommends, then the
 * rest that fit, closed. Each is a checkbox: ticking it is his choice, and opens what it needs right under it.
 * It counts as applied once everything is in; a required answer left empty turns red once he moves on from
 * the measure. No apply button: the part's own Continue becomes the primary action once every ticked measure
 * is complete. Name and one line on the card; everything else about it opens in a side panel.
 */
export function MeasuresBody() {
  const { derived, state, dispatch } = useApp()
  const s = derived.scenario
  const { chosen, inputs } = state.answers.measures
  const fit = fitting(s)
  const suggested = s.suggestions.filter((g) => fit.some((m) => m.id === g.measureId))
  const isSuggested = (id: MeasureId) => suggested.some((g) => g.measureId === id)
  const last = fit.filter((m) => m.lastYear)
  const ofSuggestions = suggested.map((g) => fit.find((m) => m.id === g.measureId)!)
  const more = fit.filter((m) => !m.lastYear && !isSuggested(m.id))
  const [moreOpen, setMoreOpen] = useState(more.some((m) => chosen.includes(m.id)))
  // A ticked measure shows what's missing in red only once he has moved on from it.
  const [touched, setTouched] = useState<MeasureId[]>([])
  const [about, setAbout] = useState<Measure | null>(null)
  const opener = useRef<HTMLElement | null>(null)
  const fresh = newCrops(derived.scenario, state.answers)[0]

  // Nothing is ticked or filled in for him: GSA prepares, only Milan declares.
  const draft = (next: MeasureId[], nextInputs: Inputs) => {
    // Only what he can see is kept.
    const kept = Object.fromEntries(
      Object.entries(nextInputs).filter(([k]) => {
        const [mid, rid] = k.split('.')
        const m = fit.find((x) => x.id === mid)
        const r = m?.requirements.find((x) => x.id === rid)
        return !!m && !!r && next.includes(m.id) && shown(m, r, nextInputs)
      }),
    )
    dispatch({ type: 'draft_measures', chosen: fit.map((m) => m.id).filter((id) => next.includes(id)), inputs: kept })
  }
  const toggle = (m: Measure, on: boolean) => {
    if (!on) setTouched((ts) => ts.filter((x) => x !== m.id))
    draft(on ? [...chosen, m.id] : chosen.filter((x) => x !== m.id), inputs)
  }

  const option = (m: Measure) => {
    const on = chosen.includes(m.id)
    const g = suggested.find((x) => x.measureId === m.id)
    const ready = readyToApply(m, inputs)
    const invalid = on && !ready && touched.includes(m.id)
    const box = `apply-${m.id}`
    return (
      <li
        key={m.id}
        id={`measure-${m.id}`}
        className="measure-option"
        data-on={on || undefined}
        data-state={on ? (ready ? 'applied' : invalid ? 'error' : 'open') : undefined}
        onBlur={(e) => {
          if (on && !ready && !e.currentTarget.contains(e.relatedTarget as Node | null)) setTouched((ts) => (ts.includes(m.id) ? ts : [...ts, m.id]))
        }}
      >
        <div className="measure-head">
          <label htmlFor={box} className="measure-check">
            <CheckboxBase id={box} checked={on} aria-invalid={invalid || undefined} onCheckedChange={(v) => toggle(m, v === true)} />
            <span className="measure-text">
              <span className="measure-name">{en.measures[m.id]}</span>
              <span className="measure-line">{shortLine(m, derived, g, fresh)}</span>
            </span>
          </label>
          {on && ready && (
            <span className="measure-state" data-ready>
              <Icon name="complete" size="sm" /> {t.applied}
            </span>
          )}
          <button
            type="button"
            className="measure-about"
            aria-haspopup="dialog"
            aria-label={t.goalOpen(en.measures[m.id])}
            onClick={(e) => {
              opener.current = e.currentTarget
              setAbout(m)
            }}
          >
            <Icon name="details_open" />
          </button>
        </div>
        {on && (
          <MeasureFields
            m={m}
            inputs={inputs}
            suggestedFields={g?.fields}
            showErrors={invalid}
            onChange={(k, v) => draft(chosen, { ...inputs, [k]: v })}
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
      <Drawer open={!!about} title={about ? en.measures[about.id] : ''} onClose={() => setAbout(null)} returnFocusTo={opener}>
        {about && <MeasurePanel m={about} g={suggested.find((x) => x.measureId === about.id)} />}
      </Drawer>
    </Stack>
  )
}

/** Everything about a measure he can apply for, in his terms: why it fits, what it could pay, what he gives. */
function MeasurePanel({ m, g }: { m: Measure; g?: Suggestion }) {
  const { derived, state } = useApp()
  const p = t.panel
  const fresh = newCrops(derived.scenario, state.answers)[0]
  const own = userReqs(m)
  const known = m.requirements.filter((r) => r.kind === 'auto')
  const checks = tasks.suggest.checks[m.id]
  return (
    <div className="panel-sections">
      <PanelSection title={p.why}>
        <Text>{shortLine({ ...m, lastYear: false }, derived, g, fresh)}</Text>
      </PanelSection>
      <PanelSection title={p.pays}>
        <Text>{m.rateDinars ? amountLine(m, derived) : t.pays[m.id]}</Text>
        {!m.rateDinars && <Text variant="small">{p.noRate}</Text>}
      </PanelSection>
      {own.length > 0 && (
        <PanelSection title={p.give}>
          <ul className="panel-list">{own.map((r) => <li key={r.id}>{req(r).label}</li>)}</ul>
          {known.length > 0 && <Text variant="small">{p.known(known.map((r) => req(r).short).join(', '))}</Text>}
        </PanelSection>
      )}
      {checks && (
        <PanelSection title={p.checks}>
          <Text>{checks}</Text>
        </PanelSection>
      )}
    </div>
  )
}

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel-section">
      <h3 className="panel-title">{title}</h3>
      {children}
    </section>
  )
}

/**
 * Under a ticked measure: what GSA already has and what he adds, each in the form that fits it.
 * A required answer left empty is red once he has moved on. An answer that rules it out says so.
 */
function MeasureFields({ m, inputs, suggestedFields, showErrors, onChange }: { m: Measure; inputs: Inputs; suggestedFields?: string[]; showErrors: boolean; onChange: (key: string, v: MeasureValue) => void }) {
  const { derived, state } = useApp()
  const gaps = measureGaps(m, inputs)
  const ruledOut = m.requirements.find((r) => r.blocks !== undefined && inputs[`${m.id}.${r.id}`] === r.blocks)
  return (
    <div className="measure-fields">
      {ruledOut && <Banner tone="attention">{req(ruledOut).ruledOut}</Banner>}
      {m.requirements
        .filter((r) => shown(m, r, inputs))
        .map((r) =>
          r.kind === 'auto' ? (
            <Stack key={r.id} gap="sm">
              <AutoLine r={r} d={derived} />
              {r.id === 'land' && <FieldsOnMap ids={[...derived.scenario.fields.map((f) => f.id as string), ...state.answers.newFields.map((f) => f.id)]} label={en.measures[m.id]} />}
            </Stack>
          ) : (
            <Stack key={r.id} gap="sm">
              {/* The fields GSA's evidence was about: suggested, never ticked for him. One tap uses them. */}
              {r.kind === 'fields' && suggestedFields && !(inputs[`${m.id}.${r.id}`] as string[] | undefined)?.length && (
                <div>
                  <Button onClick={() => onChange(`${m.id}.${r.id}`, carriedFields(suggestedFields, derived.scenario, state.answers))}>
                    {/* The evidence line above names the fields; the button stays one line. */}
                    {tasks.suggest.useFields}
                    <VisuallyHidden>: {carriedFields(suggestedFields, derived.scenario, state.answers).map((f) => fieldName(f)).join(', ')}</VisuallyHidden>
                  </Button>
                </div>
              )}
              <RequirementInput
                r={r}
                value={inputs[`${m.id}.${r.id}`]}
                error={showErrors && gaps.missing.includes(r.id) ? t.error[r.kind] : undefined}
                onChange={(v) => onChange(`${m.id}.${r.id}`, v)}
              />
              {r.kind === 'fields' && (
                <FieldsOnMap ids={carriedFields((inputs[`${m.id}.${r.id}`] as string[] | undefined) ?? [], derived.scenario, state.answers)} label={en.measures[m.id]} />
              )}
            </Stack>
          ),
        )}
    </div>
  )
}

/**
 * The fields a measure covers, on the photo on request: they stand out, his other fields stay faint. Only
 * there once a field is chosen, so the button always has something to show.
 */
function FieldsOnMap({ ids, label }: { ids: string[]; label: string }) {
  const { derived, state } = useApp()
  const [open, setOpen] = useState(false)
  const s = derived.scenario
  const parts = riverParts(s, state.answers)
  const shapes = ids.flatMap((id) => {
    const part = parts?.find((p) => p.id === id)
    if (part) return [{ polygon: part.polygon, label: fieldName(id) }]
    const f = s.fields.find((x) => x.id === id)
    if (f) return [{ polygon: f.polygon, label: fieldName(id) }]
    const added = state.answers.newFields.find((x) => x.id === id)
    return added ? [{ polygon: added.polygon, label: added.name }] : []
  })
  if (!shapes.length) return null
  return (
    <div className="flex flex-col gap-[var(--gap-inline)]">
      <div>
        <Button variant="link" aria-expanded={open} onClick={() => setOpen(!open)}>
          <Icon name="map" size="sm" />
          {open ? t.hideMap : t.showMap(shapes.length)}
        </Button>
      </div>
      {open && (
        <figure className="measure-map">
          <Suspense fallback={<MapFallback mode="preview" />}>
            <FarmMap scenario={s} mode="explore" label={`${label}: ${shapes.map((x) => x.label).join(', ')}`} highlight={shapes} />
          </Suspense>
        </figure>
      )}
    </div>
  )
}

/** A rough figure for his household: the nearest thousand, so it never reads as a promise. */
const goalAbout = (m: Measure) => aboutThousand(goalGain(m.goal!))

/**
 * What he still lacks for the measures that don't fit his farm yet: what to do and what it could mean for his
 * household, in a line each. The name opens everything about the measure in a side panel.
 */
export function MeasureGoals() {
  const { derived } = useApp()
  const goals = derived.scenario.measures.filter((m) => m.goal)
  const [open, setOpen] = useState<Measure | null>(null)
  const opener = useRef<HTMLElement | null>(null)
  if (!goals.length) return null
  return (
    <section className="records" aria-labelledby="goals-title">
      <h3 id="goals-title" className="records-title"><Icon name="goal" size="sm" /> {t.goalsTitle}</h3>
      <dl className="records-rows">
        {goals.map((m) => (
          <div key={m.id} className="records-row">
            <div className="records-text">
              <dt>
                <button
                  type="button"
                  className="goal-open"
                  aria-haspopup="dialog"
                  aria-label={t.goalOpen(en.measures[m.id])}
                  onClick={(e) => {
                    opener.current = e.currentTarget
                    setOpen(m)
                  }}
                >
                  {en.measures[m.id]} <Icon name="details_open" size="sm" />
                </button>
              </dt>
              <dd className="records-value">{t.goal[m.goal!.kind](m.goal!.left)}</dd>
              <dd className="goal-gain">{t.gain(goalAbout(m))}</dd>
            </div>
          </div>
        ))}
      </dl>
      <Drawer open={!!open} title={open ? en.measures[open.id] : ''} onClose={() => setOpen(null)} returnFocusTo={opener}>
        {open && <GoalPanel m={open} />}
      </Drawer>
    </section>
  )
}

/**
 * Everything about a measure he can't apply for yet, in the order he cares about: what he is missing,
 * what it could mean for his household, then what he'd give and what the state checks.
 */
function GoalPanel({ m }: { m: Measure }) {
  const g = m.goal!
  const p = t.goalPanel
  const about = t.goalAbout[m.id]!
  return (
    <div className="panel-sections">
      <Text>{about.pays}</Text>
      <PanelSection title={p.need}>
        <ul className="panel-list">
          {[t.goal[g.kind](g.left), ...about.steps].map((x) => <li key={x}>{x}</li>)}
        </ul>
        <Text variant="small">{p.then}</Text>
      </PanelSection>
      <PanelSection title={p.household}>
        <Text>{t.gain(goalAbout(m))}</Text>
        <Text variant="small">{p.working[g.gain.unit](quantity(g.gain.quantity), formatNumber(g.gain.rateDinars))}. {p.caveat}</Text>
      </PanelSection>
      <PanelSection title={p.provide}>
        <Text>{about.provide}</Text>
      </PanelSection>
      <PanelSection title={p.checks}>
        <Text>{about.checks}</Text>
      </PanelSection>
    </div>
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

const ErrorLine = ({ children }: { children: string }) => (
  <span className="error" role="alert">
    <Icon name="error" size="sm" /> {children}
  </span>
)

/** One input, chosen by what the measure needs: a file, a number, words, a choice, fields or a promise. */
function RequirementInput({ r, value, error, onChange }: { r: Requirement; value: MeasureValue | undefined; error?: string; onChange: (v: MeasureValue) => void }) {
  const { derived, state } = useApp()
  const c = req(r)
  switch (r.kind) {
    case 'upload':
      return (
        <Stack gap="sm">
          {typeof value === 'string' && value && <Text>{t.attached(value)}</Text>}
          {error && <ErrorLine>{error}</ErrorLine>}
          <FileInput label={c.label} hint={c.hint} invalid={!!error} onFile={onChange} />
        </Stack>
      )
    case 'number':
      return <Field label={c.label} hint={c.hint} error={error} focusOnError={false} inputMode="numeric" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
    case 'text':
      return <Field label={c.label} hint={c.hint} error={error} focusOnError={false} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
    case 'longtext':
      return <Field multiline rows={3} label={c.label} hint={c.hint} error={error} focusOnError={false} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
    case 'choice':
      return (
        <div>
          {error && <ErrorLine>{error}</ErrorLine>}
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
          options={fieldChoices(derived.scenario, state.answers).map((f) => ({ value: f.id, label: `${fieldName(f.id)}, ${formatHa(f.ha)}` }))}
          value={carriedFields((value as string[]) ?? [], derived.scenario, state.answers)}
          onChange={onChange}
        />
      )
    case 'confirm':
      return (
        <div>
          <Checkbox label={c.label} checked={value === true} error={error} onChange={onChange} />
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
