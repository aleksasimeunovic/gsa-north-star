import { Suspense, useRef, useState, type ReactNode } from 'react'
import { en, formatDinars, formatHa, formatNumber, map, split, tasks } from '../copy/en'
import type { Measure, MeasureId, Requirement, Suggestion } from '../data/scenarios'
import { fitting, measureGaps, readyToApply, shown } from '../logic/status'
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

/** A receipt this measure relies on is missing or can't be read. */
function receiptProblem(m: Measure, d: Derived): boolean {
  const receipts = d.items.find((i) => i.id === 'receipts')?.detail
  return m.requirements.some((r) => r.id === 'receipts') && (receipts === 'receipts_unreadable' || receipts === 'receipts_missing')
}

/** Whether the records are enough, or what only he can add: a suggestion is never the same as being eligible. */
function basisLine(m: Measure, d: Derived): string {
  const receipts = m.requirements.some((r) => r.id === 'receipts') ? d.items.find((i) => i.id === 'receipts')?.detail : undefined
  const needs = [
    ...userReqs(m).filter((r) => !r.when).map((r) => req(r).short),
    ...(receipts === 'receipts_unreadable' ? [tasks.auto.blurryShort] : receipts === 'receipts_missing' ? [req({ id: 'receipts', kind: 'auto' }).short] : []),
  ]
  return needs.length ? t.basis.adds(needs.join(', ')) : t.basis.records
}

/**
 * Choosing measures, in the order that helps him decide: last year's, then the ones GSA recommends, then the
 * rest that fit, closed. Each is a checkbox: ticking it is his choice, and opens what it needs right under it.
 * It counts as applied once everything is in; a required answer left empty turns red once he moves on from
 * the measure. No apply button: the part's own Continue becomes the primary action once every ticked measure
 * is complete. On the card: its name, why it may fit, and whether GSA's records are enough or what he adds.
 * Ticked, it says what GSA already has, what is still needed from him, what the state still checks and what it
 * does to his estimate. Measures that don't fit are listed last with the reason, and never with advice on how
 * to qualify: that is planning his farm, not his application.
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
  const fresh = newCrops(derived.scenario, state.answers)[0]
  // A crop he sows for the first time is a reason too: the split carries through to what GSA recommends.
  const isRecommended = (m: Measure) => !m.lastYear && (isSuggested(m.id) || (m.id === 'certified_seed' && !!fresh))
  const recommended = [...ofSuggestions, ...fit.filter((m) => isRecommended(m) && !isSuggested(m.id))]
  const more = fit.filter((m) => !m.lastYear && !isRecommended(m))
  const not = s.measures.filter((m) => !m.fits)
  const [moreOpen, setMoreOpen] = useState(more.some((m) => chosen.includes(m.id)))
  // A ticked measure shows what's missing in red only once he has moved on from it.
  const [touched, setTouched] = useState<MeasureId[]>([])
  const [about, setAbout] = useState<Measure | null>(null)
  const opener = useRef<HTMLElement | null>(null)

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
    // A receipt it relies on can't be read: the same fact as in Documents, so it never reads as applied.
    const toFix = on && ready && receiptProblem(m, derived)
    const box = `apply-${m.id}`
    return (
      <li
        key={m.id}
        id={`measure-${m.id}`}
        className="measure-option"
        data-on={on || undefined}
        data-state={on ? (toFix || invalid ? 'error' : ready ? 'applied' : 'open') : undefined}
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
              {!on && <span className="measure-basis">{basisLine(m, derived)}</span>}
            </span>
          </label>
          {on && ready && !toFix && (
            <span className="measure-state" data-ready>
              <Icon name="complete" size="sm" /> {t.applied}
            </span>
          )}
          {toFix && (
            <span className="measure-state" data-fix>
              <Icon name="error" size="sm" /> {t.toFix}
            </span>
          )}
          <button
            type="button"
            className="measure-about"
            aria-haspopup="dialog"
            aria-label={t.aboutOpen(en.measures[m.id])}
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
            g={g}
            showErrors={invalid}
            onChange={(k, v) => draft(chosen, { ...inputs, [k]: v })}
          />
        )}
      </li>
    )
  }

  return (
    <Stack gap="section">
      <section className="measure-group" aria-labelledby="m-last">
        <h4 id="m-last" className="group-title">{t.groupLast}</h4>
        <ul className="measure-list">{last.map(option)}</ul>
      </section>
      {recommended.length > 0 && (
        <section className="measure-group" data-recommended aria-labelledby="m-suggested">
          <div className="measure-group-head">
            <h4 id="m-suggested" className="group-title">{t.groupSuggested}</h4>
            <Text variant="small">{t.suggestedLead}</Text>
          </div>
          <ul className="measure-list">{recommended.map(option)}</ul>
        </section>
      )}
      {/* The rest of the full list, closed: two rows of one list. */}
      <div className="measure-rest">
        {more.length > 0 && (
          <Disclosure label={t.groupMore(more.length)} open={moreOpen} onOpenChange={setMoreOpen}>
            <ul className="measure-list">{more.map(option)}</ul>
          </Disclosure>
        )}
        {not.length > 0 && (
          <Disclosure label={t.groupNot(not.length)}>
            <ul className="measure-list">
              {not.map((m) => (
                <li key={m.id}>
                  {/* The whole row opens the reason: with nothing to tick, the row is the target. */}
                  <button
                    type="button"
                    className="measure-not"
                    aria-haspopup="dialog"
                    onClick={(e) => {
                      opener.current = e.currentTarget
                      setAbout(m)
                    }}
                  >
                    <span className="measure-text">
                      <span className="measure-name">{en.measures[m.id]}</span>
                      <span className="measure-line">{t.notFit[m.id]}</span>
                    </span>
                    <Icon name="details_open" />
                  </button>
                </li>
              ))}
            </ul>
          </Disclosure>
        )}
      </div>
      <Drawer open={!!about} title={about ? en.measures[about.id] : ''} onClose={() => setAbout(null)} returnFocusTo={opener}>
        {about && (about.fits ? <MeasurePanel m={about} g={suggested.find((x) => x.measureId === about.id)} recommended={isRecommended(about)} /> : <NotFitPanel m={about} />)}
      </Drawer>
    </Stack>
  )
}

/** Everything about a measure he can apply for, in his terms: why it fits, what it could pay, what he gives. */
function NotFitPanel({ m }: { m: Measure }) {
  return (
    <div className="panel-sections">
      {m.lacks && (
        <PanelSection title={t.notPanel.why}>
          <Text>{t.lacks[m.lacks.kind](m.lacks.left)}</Text>
        </PanelSection>
      )}
      <PanelSection title={t.notPanel.for}>
        <Text>{t.notFit[m.id]}</Text>
      </PanelSection>
    </div>
  )
}

function MeasurePanel({ m, g, recommended }: { m: Measure; g?: Suggestion; recommended: boolean }) {
  const { derived, state } = useApp()
  const p = t.panel
  const fresh = newCrops(derived.scenario, state.answers)[0]
  const own = userReqs(m)
  const known = m.requirements.filter((r) => r.kind === 'auto')
  const checks = tasks.suggest.checks[m.id]
  return (
    <div className="panel-sections">
      <PanelSection title={recommended ? p.whyRecommended : p.why}>
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
 * Under a ticked measure, always in the same order: why GSA suggests it (only where it does, with the evidence
 * on the map), what GSA already has, what is still needed from him, then what the state still checks and what
 * it does to his estimate. A required answer left empty is red once he has moved on. An answer that rules it
 * out says so.
 */
function MeasureFields({ m, inputs, g, showErrors, onChange }: { m: Measure; inputs: Inputs; g?: Suggestion; showErrors: boolean; onChange: (key: string, v: MeasureValue) => void }) {
  const { derived, state } = useApp()
  const b = t.body
  const gaps = measureGaps(m, inputs)
  const ruledOut = m.requirements.find((r) => r.blocks !== undefined && inputs[`${m.id}.${r.id}`] === r.blocks)
  const visible = m.requirements.filter((r) => shown(m, r, inputs))
  const auto = visible.filter((r) => r.kind === 'auto')
  const own = visible.filter((r) => r.kind !== 'auto')
  const suggestedFields = g?.fields && carriedFields(g.fields, derived.scenario, state.answers)
  const checks = tasks.suggest.checks[m.id]
  return (
    <div className="measure-fields">
      {ruledOut && <Banner tone="attention">{req(ruledOut).ruledOut}</Banner>}
      {g && (
        <BodyPart title={b.why}>
          <Text>{g.evidence === 'green_all_winter' ? tasks.suggest.long.green_all_winter : tasks.suggest.long.inseminations(g.count ?? 0)}</Text>
          {suggestedFields && <FieldsOnMap ids={suggestedFields} label={en.measures[m.id]} show={t.showThese} />}
        </BodyPart>
      )}
      {(auto.length > 0 || g) && (
        <BodyPart title={b.has}>
          {g && <HasLine>{g.evidence === 'green_all_winter' ? tasks.suggest.has.green_all_winter : tasks.suggest.has.inseminations(g.count ?? 0)}</HasLine>}
          {auto.map((r) => (
            <Stack key={r.id} gap="sm">
              <AutoLine r={r} d={derived} />
              {r.id === 'land' && <FieldsOnMap ids={[...derived.scenario.fields.map((f) => f.id as string), ...state.answers.newFields.map((f) => f.id)]} label={en.measures[m.id]} show={t.showAll} />}
            </Stack>
          ))}
        </BodyPart>
      )}
      {own.length > 0 && (
        <BodyPart title={b.add}>
          {own.map((r) => (
            <Stack key={r.id} gap="sm">
              {/* The fields GSA's evidence was about: suggested, never ticked for him. One tap uses them. */}
              {r.kind === 'fields' && suggestedFields && !(inputs[`${m.id}.${r.id}`] as string[] | undefined)?.length && (
                <div>
                  <Button onClick={() => onChange(`${m.id}.${r.id}`, suggestedFields)}>
                    {/* The evidence line above names the fields; the button stays one line. */}
                    {tasks.suggest.useFields}
                    <VisuallyHidden>: {suggestedFields.map((f) => fieldName(f)).join(', ')}</VisuallyHidden>
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
          ))}
        </BodyPart>
      )}
      {checks && (
        <BodyPart title={b.checks}>
          <Text>{checks}</Text>
        </BodyPart>
      )}
      <BodyPart title={b.estimate}>
        <Text>{m.rateDinars ? amountLine(m, derived) : t.panel.noRate}</Text>
      </BodyPart>
    </div>
  )
}

/** One group inside a ticked measure: a small label, then what belongs to it. */
function BodyPart({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="measure-part">
      <h5 className="label-title">{title}</h5>
      {children}
    </section>
  )
}

/** Something GSA already has, marked neutrally: green is only for what he has finished. */
function HasLine({ children, missing }: { children: ReactNode; missing?: boolean }) {
  return (
    <p className="auto-line">
      {missing ? <StatusBadge mark="error" iconOnly /> : <span className="auto-mark"><Icon name="check" size="sm" /></span>}
      <span>{children}</span>
    </p>
  )
}

/** The shape and name of a field he can choose: a whole field, a part of the river field, or one he added. */
function useFieldShape() {
  const { derived, state } = useApp()
  const s = derived.scenario
  const parts = riverParts(s, state.answers)
  return (id: string) => {
    const part = parts?.find((p) => p.id === id)
    if (part) return { polygon: part.polygon, label: fieldName(id) }
    const f = s.fields.find((x) => x.id === id)
    if (f) return { polygon: f.polygon, label: fieldName(id) }
    const added = state.answers.newFields.find((x) => x.id === id)
    return added ? { polygon: added.polygon, label: added.name } : null
  }
}

/** Beside each field he can choose: that one field on the photo, in a side panel, so he knows which land it is. */
function FieldMapButton({ id }: { id: string }) {
  const { derived } = useApp()
  const shape = useFieldShape()(id)
  const [open, setOpen] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)
  if (!shape) return null
  return (
    <>
      <Button ref={opener} variant="ghost" aria-label={t.showOne(shape.label)} onClick={() => setOpen(true)}>
        <Icon name="map" size="sm" />
        <span className="max-sm:sr-only">{t.showMap}</span>
      </Button>
      <Drawer open={open} title={shape.label} onClose={() => setOpen(false)} returnFocusTo={opener}>
        {open && (
          <figure className="measure-map">
            <Suspense fallback={<MapFallback mode="preview" />}>
              <FarmMap scenario={derived.scenario} mode="explore" label={`${map.title}: ${shape.label}`} highlight={[shape]} />
            </Suspense>
          </figure>
        )}
      </Drawer>
    </>
  )
}

/**
 * The fields a measure covers, on the photo on request: they stand out, his other fields stay faint. Only
 * there once a field is chosen, so the button always has something to show.
 */
function FieldsOnMap({ ids, label, show }: { ids: string[]; label: string; show: string }) {
  const { derived } = useApp()
  const [open, setOpen] = useState(false)
  const s = derived.scenario
  const toShape = useFieldShape()
  const shapes = ids.flatMap((id) => toShape(id) ?? [])
  if (!shapes.length) return null
  return (
    <div className="flex flex-col gap-[var(--gap-inline)]">
      <div>
        <Button aria-expanded={open} onClick={() => setOpen(!open)}>
          <Icon name="map" size="sm" />
          {open ? t.hideMap : show}
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

/** Something GSA already has, shown so he sees it counts; a receipt it can't read says so and where to fix it. */
function AutoLine({ r, d }: { r: Requirement; d: Derived }) {
  const a = tasks.auto
  const receipts = d.items.find((i) => i.id === 'receipts')?.detail
  const files = d.scenario.documents.flatMap((x) => x.files).length
  const problem = r.id === 'receipts' && (receipts === 'receipts_missing' || receipts === 'receipts_unreadable')
  const value =
    r.id === 'land'
      ? a.land(formatHa(d.farm.fields.totalHa), d.farm.fields.count)
      : r.id === 'receipts'
        ? receipts === 'receipts_missing'
          ? a.receiptsMissing
          : receipts === 'receipts_unreadable'
            ? a.receiptsBlurry(files)
            : a.receipts(files)
        : r.id === 'calvings'
          ? a.calvings(d.scenario.herd?.cowsCalved ?? 0)
          : a.fertiliser_receipt
  return (
    <HasLine missing={problem}>
      <strong>{req(r).label}</strong>: {value}
    </HasLine>
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
      return <Field label={c.label} hint={c.hint} example={c.example} error={error} focusOnError={false} inputMode="numeric" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
    case 'text':
      return <Field label={c.label} hint={c.hint} example={c.example} error={error} focusOnError={false} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
    case 'longtext':
      return <Field multiline rows={3} label={c.label} hint={c.hint} example={c.example} error={error} focusOnError={false} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />
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
          aside={(id) => <FieldMapButton id={id} />}
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
