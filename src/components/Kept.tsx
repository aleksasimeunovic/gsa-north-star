import { useState, type ReactNode } from 'react'
import { formatDinars, kept as copy, tasks } from '../copy/en'
import type { StepId } from '../logic/application'
import { UNCHANGED, correctionAsked, type Unchanged } from '../logic/status'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { SourceTag } from '../ui/SourceTag'
import { useApp } from './AppContext'

type Row = { key: string; label: string; value: string; action: ReactNode }

/**
 * What GSA kept from last year and reuses without asking, under the part's outline: his name, address and
 * active farmer status in Your details, the cows that calved in Animals. Closed until he wants it, in quiet
 * zebra rows, so it shows GSA remembers him without competing with the next action. If something did change,
 * he asks for a correction right on its row, and the record's owner checks it.
 */
export function Kept({ step }: { step: StepId }) {
  const rows = useRows(step)
  const [open, setOpen] = useState(false)
  if (!rows) return null
  const id = `kept-${step}`
  return (
    <section className="kept" data-open={open || undefined} aria-labelledby={`${id}-title`}>
      <button type="button" className="kept-head" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <span className="kept-icon"><Icon name="kept" size="sm" /></span>
        <span className="kept-titles">
          <span id={`${id}-title`} className="kept-title">{copy.title}</span>
          <span className="kept-hint">{rows.summary}</span>
        </span>
        <span className="kept-chevron"><Icon name="expand" size="sm" /></span>
      </button>
      <div id={id} hidden={!open}>
        <p className="kept-note">{copy.hint}</p>
        <dl className="kept-rows">
          {rows.rows.map((r) => (
            <div key={r.key} className="kept-row">
              <dt>{r.label}</dt>
              <dd className="kept-value">{r.value}</dd>
              <dd className="kept-action">{r.action}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function useRows(step: StepId): { summary: string; rows: Row[] } | null {
  const { derived, state, dispatch } = useApp()
  const s = derived.scenario
  const checking = (label: string) => <SourceTag source="checking">{label}</SourceTag>

  if (step === 'details') {
    const g = s.generalData
    const c = tasks.details
    const value: Record<Unchanged, string> = { holder: g.holder, place: g.place, active: c.activeYes }
    return {
      summary: [g.holder, g.place.split(',')[0], c.active.toLowerCase()].join(', '),
      rows: UNCHANGED.map((w) => ({
        key: w,
        label: c[w],
        value: value[w],
        action: correctionAsked(state.answers, w) ? (
          checking(c.asked)
        ) : (
          <Button variant="link" onClick={() => dispatch({ type: 'ask_record_check', itemId: 'details', what: w })}>
            {copy.change}
            <span className="sr-only">: {c[w]}</span>
          </Button>
        ),
      })),
    }
  }
  if (step === 'animals' && s.herd) {
    const n = s.herd.cowsCalved
    const rate = s.measures.find((m) => m.id === 'cows_raising_calves')?.rateDinars ?? 0
    const asked = state.answers.requests.some((r) => r.kind === 'record_check' && r.itemId === 'calvings')
    return {
      summary: copy.calvingsShort(n),
      rows: [
        {
          key: 'calvings',
          label: copy.calvings,
          value: copy.calvingsValue(n, formatDinars(n * rate)),
          action: asked ? (
            checking(tasks.calvings.asked(n))
          ) : (
            <Button variant="link" onClick={() => dispatch({ type: 'ask_record_check', itemId: 'calvings' })}>
              {copy.askRegistry}
            </Button>
          ),
        },
      ],
    }
  }
  return null
}
