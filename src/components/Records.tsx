import { useEffect, useRef, useState, type ReactNode } from 'react'
import { en, formatDate, formatDateYear, formatHa, records as copy, tasks } from '../copy/en'
import type { StepId, TaskId } from '../logic/application'
import { riverParts, type Source } from '../logic/farm'
import { roundHa } from '../logic/geometry'
import { correctionOf, UNCHANGED, type Unchanged } from '../logic/status'
import { Account } from '../ui/Account'
import { Button } from '../ui/Button'
import { Drawer } from '../ui/Drawer'
import { Field } from '../ui/Field'
import { Icon } from '../ui/Icon'
import { SourceTag } from '../ui/SourceTag'
import { useApp, type AppCtx } from './AppContext'

/**
 * How he changes a line: open the task that asks about it, or type the right value, which goes to the
 * record's owner as a correction (his value and the record's are both kept until they check).
 */
type Edit = { open: TaskId } | { correct: { itemId: string; what?: string; numeric?: boolean; value: string } } | { screen: string }

export interface RecordRow {
  key: string
  label: string
  value: string
  /** How the value is shown, when it is more than words (an account number he can reveal). */
  show?: ReactNode
  /** A short second line: the period it covers, or his value next to the record's. */
  sub?: string
  /** What it is made of, one per line: the crops in a field and their areas, last year next to today. */
  lines?: { label: string; value?: string }[]
  /** Something wrong with it, said in red. */
  problem?: string
  /** Where the line stands. Nothing for what GSA reuses without asking: there's nothing to confirm. */
  source?: Source
  edit?: Edit
}

type Kind = 'details' | 'animals' | 'land' | 'documents'
const KINDS: Kind[] = ['details', 'animals', 'land', 'documents']

/**
 * What GSA has about this part, right now: his details on the first part, then his animals, his fields and his
 * documents, each in its own shape. A line says where it stands, and a pen changes it, in the place that asks
 * about it or as a correction to the record's owner. Where there is more than fits beside the task, it opens
 * in a side panel: every detail, every animal, every field.
 */
export function Records({ step, onOpen }: { step: StepId; onOpen: (id: TaskId) => void }) {
  const kind = KINDS.find((k) => k === step)
  const rows = useRecordRows(step)
  const full = useAllRows(kind)
  const { go } = useApp()
  const [all, setAll] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)
  // A pen that leads somewhere else closes the panel on the way.
  useEffect(() => {
    const close = () => setAll(false)
    window.addEventListener('hashchange', close)
    return () => window.removeEventListener('hashchange', close)
  }, [])
  if (!rows || !kind) return null
  return (
    <section className="records" aria-labelledby={`records-${step}`}>
      <h3 id={`records-${step}`} className="records-title">{copy.titles[kind]}</h3>
      <RecordList rows={rows} onOpen={onOpen} />
      {(step === 'land' || full) && (
        <div className="records-foot">
          {step === 'land' && (
            <Button className="w-full" onClick={() => go('field', 'new')}>
              <Icon name="added" size="sm" /> {copy.addField}
            </Button>
          )}
          {full && (
            <Button ref={opener} className="w-full" onClick={() => setAll(true)}>
              {copy.more[kind]} <Icon name="disclose" size="sm" />
            </Button>
          )}
        </div>
      )}
      {full && (
        <Drawer open={all} title={copy.titles[kind]} onClose={() => setAll(false)} returnFocusTo={opener}>
          <RecordList
            rows={full}
            onOpen={(id) => {
              setAll(false)
              onOpen(id)
            }}
          />
        </Drawer>
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

/**
 * One line of what GSA has. A short fact reads label left, value right. Something made of parts (a field with
 * two crops, last year next to today) puts its name and total on the first line and each part on its own line
 * under it, so a long answer never squeezes the name. Then what's wrong, then where it stands.
 */
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
    <div className="records-row" data-parts={row.lines ? '' : undefined}>
      {/* First line: what it is, and where it stands. Second: the value, and the pen that changes it. */}
      <div className="records-head">
        <dt>{row.label}</dt>
        {row.source && (
          <dd>
            <SourceTag source={row.source}>{copy.state[row.source]}</SourceTag>
          </dd>
        )}
      </div>
      <div className="records-main">
        <dd className="records-value">{row.show ?? row.value}</dd>
        {e && (
          <button type="button" className="records-pen" onClick={pen} aria-label={copy.edit(row.label)} title={copy.edit(row.label)}>
            <Icon name="edit" size="sm" />
          </button>
        )}
      </div>
      {!!row.lines?.length && (
        <dd>
          <ul className="records-lines">
            {row.lines.map((l) => (
              <li key={l.label}>
                <span>{l.label}</span>
                {l.value && <span className="records-line-value">{l.value}</span>}
              </li>
            ))}
          </ul>
        </dd>
      )}
      {row.sub && <dd className="records-sub">{row.sub}</dd>}
      {row.problem && (
        <dd className="records-problem">
          <Icon name="error" size="sm" /> {row.problem}
        </dd>
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

type Derived = AppCtx['derived']
type State = AppCtx['state']
const sourceIn = (d: Derived) => (id: string): Source => {
  const st = d.items.find((i) => i.id === id)?.status
  return st === 'complete' ? 'confirmed' : st === 'awaiting_verification' ? 'checking' : 'records'
}

/** The rows beside the task, for one part. */
export function useRecordRows(step: StepId): RecordRow[] | null {
  const { derived, state } = useApp()
  if (step === 'details') return detailRows(derived, state.answers)
  if (step === 'animals') return animalRows(derived, state, false)
  if (step === 'land') return fieldRows(derived, state, false)
  if (step === 'documents') return documentRows(derived, state, false)
  return null
}

/** Everything about the part, for the side panel; null where the rows beside the task are already all there is. */
function useAllRows(kind: Kind | undefined): RecordRow[] | null {
  const { derived, state } = useApp()
  if (kind === 'details') return allDetails(derived, state)
  if (kind === 'animals') return animalRows(derived, state, true)
  if (kind === 'land') return fieldRows(derived, state, true)
  if (kind === 'documents') return documentRows(derived, state, true)
  return null
}

/** His animals. In the panel, each says last year next to the registry today, and his own answer. */
function animalRows(d: Derived, state: State, full: boolean): RecordRow[] | null {
  const s = d.scenario
  const a = state.answers
  if (!s.herd) return null
  const src = sourceIn(d)
  const herd = d.items.find((i) => i.id === 'herd')
  const his = herd?.conflict && herd.detail !== 'herd_settled' ? herd.conflict.his : null
  const rows: RecordRow[] = [
    {
      key: 'herd',
      label: copy.cattle,
      value: String(s.herd.registryCount),
      sub: his !== null && !full ? copy.youSaid(String(his)) : undefined,
      lines: full
        ? [
            { label: tasks.herd.lastYear, value: String(s.herd.lastYearDeclared ?? 0) },
            { label: tasks.herd.registry, value: String(s.herd.registryCount) },
            ...(his !== null ? [{ label: tasks.herd.yoursToday, value: String(his) }] : []),
          ]
        : undefined,
      source: src('herd'),
      edit: { open: 'herd' },
    },
  ]
  if (s.pigs && s.pigs.registryCount > 0) {
    const pigs = d.items.find((i) => i.id === 'pigs')
    const answer = pigs?.detail === 'pigs_household' ? tasks.pigs.answerYes : pigs?.detail === 'pigs_declared' ? tasks.pigs.answerNo : undefined
    rows.push({
      key: 'pigs',
      label: copy.pigs,
      value: String(s.pigs.registryCount),
      sub: full ? undefined : answer,
      lines: full ? [{ label: tasks.herd.lastYear, value: String(s.pigs.lastYearDeclared) }, { label: tasks.herd.registry, value: String(s.pigs.registryCount) }, ...(answer ? [{ label: answer }] : [])] : undefined,
      source: src('pigs'),
      edit: { open: 'pigs' },
    })
  }
  const asked = correctionOf(a, 'calvings')
  const period = copy.period(formatDateYear(s.herd.calvingPeriod.from), formatDateYear(s.herd.calvingPeriod.to))
  rows.push({
    key: 'calvings',
    label: copy.calvings,
    value: String(s.herd.cowsCalved),
    lines: full ? [{ label: period }] : undefined,
    sub: asked ? copy.youSaid(asked) : full ? undefined : period,
    source: asked ? 'checking' : src('calvings'),
    edit: { correct: { itemId: 'calvings', numeric: true, value: asked ?? String(s.herd.cowsCalved) } },
  })
  return rows
}

/**
 * His fields: the name and the area that counts on the first line, then what grows there, one crop per line
 * when there are two. A field waiting for a check says what counts until then in a few words. Beside the
 * task, the fields with a change and the ones he added, the rest in one line; in the panel, every field.
 */
function fieldRows(d: Derived, state: State, full: boolean): RecordRow[] {
  const s = d.scenario
  const a = state.answers
  const src = sourceIn(d)
  // A field's value is its area and what grows there: "2.40 ha (Wheat)", one line per crop when there are two.
  const area = (ha: number, c: keyof typeof en.crops) => copy.areaCrop(formatHa(ha), en.crops[c])
  const field = (key: string, label: string, parts: { ha: number; crop: keyof typeof en.crops }[], rest: Partial<RecordRow> = {}): RecordRow => {
    const values = parts.map((p) => area(p.ha, p.crop))
    return {
      key,
      label,
      value: values.join(', '),
      show: values.length > 1 ? <span className="records-values">{values.map((v) => <span key={v}>{v}</span>)}</span> : undefined,
      lines: [],
      ...rest,
    }
  }
  const rows: RecordRow[] = []
  for (const f of s.fields) {
    const id = `field_${f.id}` as TaskId
    const it = d.items.find((i) => i.id === id)
    if (!f.signal && !full) continue
    if (f.signal?.kind === 'satellite_difference') {
      const parts = riverParts(s, a)
      const counted = it?.conflict ? it.conflict.record : f.areaHa
      rows.push(field(f.id, en.fields[f.id], parts ? parts.map((p) => ({ ha: p.ha, crop: p.crop })) : [{ ha: counted, crop: f.cropLastYear }], { sub: it?.conflict ? copy.youSay(formatHa(it.conflict.his)) : undefined, source: src(id), edit: { open: id } }))
    } else if (f.signal?.kind === 'road_strip') {
      const left = roundHa(f.areaHa - f.signal.stripHa)
      const answered = it?.status !== 'action_required'
      rows.push(field(f.id, en.fields[f.id], [{ ha: answered ? left : f.areaHa, crop: f.cropLastYear }], { sub: it?.status === 'awaiting_verification' ? copy.youSay(formatHa(f.areaHa)) : undefined, source: src(id), edit: { open: id } }))
    } else rows.push(field(f.id, en.fields[f.id], [{ ha: f.areaHa, crop: f.cropLastYear }]))
  }
  if (s.bought) {
    const nf = a.newFields.find((f) => f.landId === 'bought')
    rows.push(
      nf
        ? field('bought', nf.name, [{ ha: nf.areaHa, crop: nf.crop }], { source: 'confirmed', edit: { screen: 'field/bought' } })
        : { key: 'bought', label: tasks.title.field_bought, value: formatHa(s.bought.areaHa), lines: [], sub: a.bought.answer === 'no' ? tasks.bought.notFarmed : undefined, source: a.bought.answer === 'no' ? 'confirmed' : 'records', edit: { open: 'field_bought' } },
    )
  }
  for (const f of a.newFields.filter((x) => x.landId !== 'bought')) rows.push(field(f.id, f.name, [{ ha: f.areaHa, crop: f.crop }], { source: 'confirmed', edit: { screen: `field/${f.id}` } }))
  const same = s.fields.filter((f) => !f.signal)
  if (!full && same.length) rows.push({ key: 'unchanged', label: copy.unchangedFields, value: formatHa(roundHa(same.reduce((n, f) => n + f.areaHa, 0))), lines: [], sub: same.map((f) => en.fields[f.id]).join(', ') })
  if (full) rows.push({ key: 'total', label: copy.total, value: formatHa(d.farm.fields.totalHa), lines: [], sub: copy.fieldCount(d.farm.fields.count) })
  return rows
}

/** His documents: beside the task, each document with how many files and what's wrong; in the panel, every file with its date. */
function documentRows(d: Derived, state: State, full: boolean): RecordRow[] | null {
  const docs = d.scenario.documents.filter((x) => x.attached || state.answers.attachedDocuments.includes(x.id))
  if (!docs.length) return null
  const sent = state.answers.attachedDocuments.includes('unreadable_receipt')
  const done = d.items.find((i) => i.id === 'receipts')?.status === 'complete'
  const source = done ? ('confirmed' as const) : ('records' as const)
  const edit = { open: 'receipts' as TaskId }
  const blurry = (name?: string) => (name && !sent ? tasks.unreadable.context : undefined)
  if (!full) return docs.map((doc) => ({ key: doc.id, label: tasks.title.receipts, value: copy.files(doc.files.length), lines: [], problem: blurry(doc.unreadable) && `${doc.unreadable}: ${tasks.unreadable.context.toLowerCase()}`, source: blurry(doc.unreadable) ? undefined : source, edit }))
  // A file with something wrong says only that: red is the one state that matters until it's fixed.
  return docs.flatMap((doc) =>
    doc.files.map((f) => {
      const problem = f.name === doc.unreadable ? blurry(f.name) : undefined
      return { key: f.name, label: f.name, value: formatDate(f.date), lines: [], problem, source: problem ? undefined : source, edit }
    }),
  )
}

/** His details: what the farm register and his bank say, each changed in place. Also the review before he signs. */
export function detailRows(derived: Derived, a: State['answers']): RecordRow[] {
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
    const number = bank?.detail === 'bank_own' ? (a.bank.account ?? '') : g.account.newNumber
    rows.push({
      key: 'bank',
      label: tasks.title.bank,
      value: tasks.bank.ending(number.replace(/\D/g, '').slice(-4)),
      show: <Account number={number} />,
      source: bank?.status === 'complete' ? 'confirmed' : 'records',
      edit: { open: 'bank' },
    })
  }
  return rows
}

/** His details in full for the panel: the farm number and phone sit with his name and address, where he looks for them. */
function allDetails(d: Derived, state: State): RecordRow[] {
  const g = d.scenario.generalData
  const rows = detailRows(d, state.answers)
  rows.splice(1, 0, { key: 'farm', label: copy.farmNumber, value: g.farmNumber })
  const phone = correctionOf(state.answers, 'details', 'phone')
  rows.splice(3, 0, { key: 'phone', label: copy.phone, value: g.phone, sub: phone ? copy.youSaid(phone) : undefined, source: phone ? 'checking' : undefined, edit: { correct: { itemId: 'details', what: 'phone', value: phone ?? g.phone } } })
  return rows
}
