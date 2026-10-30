import { useState } from 'react'
import { en, formatDateYear, formatHa, records as copy, tasks } from '../copy/en'
import type { StepId, TaskId } from '../logic/application'
import type { Source } from '../logic/farm'
import { roundHa } from '../logic/geometry'
import { correctionOf, UNCHANGED, type Unchanged } from '../logic/status'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Icon } from '../ui/Icon'
import { SourceTag } from '../ui/SourceTag'
import { useApp } from './AppContext'
import { herdLine, newFieldRows } from './NewField'
import { taskSummary } from './TaskBodies'

/**
 * How he changes a line: open the task that asks about it, or type the right value, which goes to the
 * record's owner as a correction (his value and the record's are both kept until they check).
 */
type Edit = { open: TaskId } | { correct: { itemId: string; what?: string; numeric?: boolean; value: string } } | { screen: string }

export interface RecordRow {
  key: string
  label: string
  value: string
  /** A second line: the period it covers, or his value next to the record's. */
  sub?: string
  /** Where the line stands. Nothing for what GSA reuses without asking: there's nothing to confirm. */
  source?: Source
  edit?: Edit
}

/**
 * What GSA knows about this part of his farm right now, from government records and his own answers,
 * updated as he answers: the state of the registers, not last year's copy. He cares whether a line is true,
 * so it says whether he has confirmed it, and a pen changes it, in the place that asks about it or as a
 * correction to the record's owner.
 */
export function Records({ step, onOpen }: { step: StepId; onOpen: (id: TaskId) => void }) {
  const rows = useRecordRows(step)
  const { go } = useApp()
  if (!rows) return null
  return (
    <section className="records" aria-labelledby={`records-${step}`}>
      <h3 id={`records-${step}`} className="records-title">{copy.title}</h3>
      <RecordList rows={rows} onOpen={onOpen} />
      {step === 'land' && (
        <div className="records-foot">
          <Button variant="ghost" onClick={() => go('field', 'new')}>
            <Icon name="added" size="sm" /> {copy.addField}
          </Button>
        </div>
      )}
    </section>
  )
}

export function RecordList({ rows, onOpen }: { rows: RecordRow[]; onOpen: (id: TaskId) => void }) {
  return (
    <dl className="records-rows">
      {rows.map((r) => (
        <Row key={r.key} row={r} onOpen={onOpen} />
      ))}
    </dl>
  )
}

function Row({ row, onOpen }: { row: RecordRow; onOpen: (id: TaskId) => void }) {
  const { dispatch, go } = useApp()
  const [editing, setEditing] = useState(false)
  const e = row.edit
  if (editing && e && 'correct' in e) {
    return (
      <div className="records-row" data-editing>
        <CorrectionForm
          label={row.label}
          initial={e.correct.value}
          numeric={e.correct.numeric}
          onCancel={() => setEditing(false)}
          onSave={(value) => {
            dispatch({ type: 'ask_record_check', itemId: e.correct.itemId, what: e.correct.what, value })
            setEditing(false)
          }}
        />
      </div>
    )
  }
  const pen = () => (!e ? undefined : 'open' in e ? onOpen(e.open) : 'screen' in e ? go(...(e.screen.split('/') as [string, string])) : setEditing(true))
  return (
    <div className="records-row">
      <div className="records-text">
        <dt>{row.label}</dt>
        <dd className="records-value">{row.value}</dd>
        {row.sub && <dd className="records-sub">{row.sub}</dd>}
        {row.source && (
          <dd>
            <SourceTag source={row.source}>{copy.state[row.source]}</SourceTag>
          </dd>
        )}
      </div>
      {e && (
        <button type="button" className="records-pen" onClick={pen} aria-label={copy.edit(row.label)} title={copy.edit(row.label)}>
          <Icon name="edit" size="sm" />
        </button>
      )}
    </div>
  )
}

function CorrectionForm({ label, initial, numeric, onSave, onCancel }: { label: string; initial: string; numeric?: boolean; onSave: (v: string) => void; onCancel: () => void }) {
  const [value, setValue] = useState(initial)
  const [error, setError] = useState<string>()
  return (
    <form
      className="records-form"
      onSubmit={(ev) => {
        ev.preventDefault()
        const v = value.trim()
        if (!v || (numeric && !/^\d+$/.test(v))) return setError(numeric ? copy.numberError : copy.textError)
        if (v === initial) return onCancel()
        onSave(v)
      }}
    >
      <Field label={label} hint={copy.correctionHint} error={error} inputMode={numeric ? 'numeric' : undefined} value={value} autoFocus onChange={(ev) => setValue(ev.target.value)} />
      <div className="records-form-actions">
        <Button type="submit" variant="primary">{copy.save}</Button>
        <Button onClick={onCancel}>{copy.cancel}</Button>
      </div>
    </form>
  )
}

/** The rows for one part, from the scenario's records and his answers so far. */
export function useRecordRows(step: StepId): RecordRow[] | null {
  const { derived, state } = useApp()
  const s = derived.scenario
  const a = state.answers
  const item = (id: string) => derived.items.find((i) => i.id === id)
  const sourceOf = (id: string): Source => {
    const st = item(id)?.status
    return st === 'complete' ? 'confirmed' : st === 'awaiting_verification' ? 'checking' : 'records'
  }

  if (step === 'details') return detailRows(derived, a)

  if (step === 'animals') {
    if (!s.herd) return null
    const rows: RecordRow[] = []
    const herd = item('herd')
    rows.push({ key: 'herd', label: copy.cattle, value: String(s.herd.registryCount), sub: herdLine(herd), source: sourceOf('herd'), edit: { open: 'herd' } })
    if (s.pigs && s.pigs.registryCount > 0) {
      const pigs = item('pigs')
      rows.push({ key: 'pigs', label: copy.pigs, value: String(s.pigs.registryCount), sub: pigs?.status === 'complete' ? taskSummary('pigs', derived, state) : undefined, source: sourceOf('pigs'), edit: { open: 'pigs' } })
    }
    const asked = correctionOf(a, 'calvings')
    rows.push({
      key: 'calvings',
      label: copy.calvings,
      value: String(s.herd.cowsCalved),
      sub: asked ? copy.youSaid(asked) : copy.period(formatDateYear(s.herd.calvingPeriod.from), formatDateYear(s.herd.calvingPeriod.to)),
      source: asked ? 'checking' : undefined,
      edit: { correct: { itemId: 'calvings', numeric: true, value: asked ?? String(s.herd.cowsCalved) } },
    })
    return rows
  }

  if (step === 'land') {
    const rows: RecordRow[] = s.fields.map((f) => {
      const id = f.signal ? `field_${f.id}` : 'fields_other'
      const it = item(id)
      const lost = it?.status === 'complete' ? (it.paymentImpact?.areaHa ?? 0) : 0
      const out = it?.detail === 'meadow_out'
      const split = it?.detail === 'river_split_done'
      return {
        key: f.id,
        label: en.fields[f.id],
        value: out ? copy.leftOut : split ? taskSummary(id as TaskId, derived, state) : copy.fieldValue(formatHa(roundHa(f.areaHa - lost)), en.crops[f.cropLastYear].toLowerCase()),
        sub: it?.status === 'awaiting_verification' ? taskSummary(id as TaskId, derived, state) : undefined,
        source: sourceOf(id),
        edit: { open: id as TaskId },
      }
    })
    return [...rows, ...newFieldRows(derived, state)]
  }
  return null
}

/** His details: what the farm register and his bank say, each changed in place. Also the review before he signs. */
export function detailRows(derived: ReturnType<typeof useApp>['derived'], a: ReturnType<typeof useApp>['state']['answers']): RecordRow[] {
  const g = derived.scenario.generalData
  const c = tasks.details
  const value: Record<Unchanged, string> = { holder: g.holder, place: g.place, active: c.activeYes }
  const rows: RecordRow[] = UNCHANGED.map((w) => {
    const asked = correctionOf(a, 'details', w)
    return {
      key: w,
      label: c[w],
      value: value[w],
      sub: asked ? copy.youSaid(asked) : undefined,
      source: asked ? 'checking' : undefined,
      // Active farmer status is renewed, not corrected.
      edit: w === 'active' ? undefined : { correct: { itemId: 'details', what: w, value: asked ?? value[w] } },
    }
  })
  if (g.account) {
    const bank = derived.items.find((i) => i.id === 'bank')
    const ending = bank?.detail === 'bank_own' ? (a.bank.account ?? '').slice(-4) : g.account.newEnding
    rows.push({
      key: 'bank',
      label: tasks.title.bank,
      value: tasks.bank.ending(ending),
      source: bank?.status === 'complete' ? 'confirmed' : 'records',
      edit: { open: 'bank' },
    })
  }
  return rows
}
