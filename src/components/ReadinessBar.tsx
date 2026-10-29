import { forwardRef } from 'react'
import { en, tasks } from '../copy/en'
import type { Report } from '../logic/readiness'
import { Icon } from '../ui/Icon'
import { useApp } from './AppContext'

/**
 * Answers "Can I submit?" on every screen: the verdict, then the next action, not a count.
 * The count lives in the open part of the stepper and in the drawer this opens.
 */
/**
 * The bar speaks only when there's something beyond the questions he is working through: something to fix
 * (red), something to look at (a check or a lower payment, orange), or that he can submit (green). Questions
 * he hasn't reached are never counted here; the stepper and the part's outline show those, so the bar never
 * reads as a finish line that moves. It opens everything in the drawer.
 */
export const ReadinessBar = forwardRef<HTMLButtonElement, { onOpen: () => void; expanded: boolean; next?: string | null }>(function ReadinessBar({ onOpen, expanded }, ref) {
  const { derived } = useApp()
  const r = derived.report
  const h = en.readiness.headline
  const working = r.verdict === 'blocked' || r.verdict === 'renewal'
  const tone = r.errors.length ? 'error' : working ? (r.warnings.length ? 'warning' : null) : r.verdict === 'ready_with_warnings' ? 'warning' : r.verdict === 'submitted' ? null : 'complete'
  const text = r.errors.length ? h.fix(r.errors.length) : working ? h.look(r.warnings.length) : readinessHeadline(r)
  return (
    <div className="readiness" data-tone={tone ?? undefined} aria-live="polite" aria-atomic="true">
      {tone && (
        <button ref={ref} type="button" className="readiness-link" aria-haspopup="dialog" aria-expanded={expanded} onClick={onOpen}>
          <span className="readiness-icon"><Icon name={tone} /></span>
          <span className="readiness-lines">
            <span className="readiness-text">{text}</span>
          </span>
        </button>
      )}
    </div>
  )
})

/** The next thing to do, said as an action. */
export function nextActionLabel(id: string, items: { id: string; detail: string }[]) {
  const detail = items.find((i) => i.id === id)?.detail
  if (detail === 'receipts_unreadable') return tasks.unreadable.action
  if (detail === 'receipts_missing') return tasks.receiptsMissingTitle
  return tasks.action[id] ?? tasks.title[id]
}

export function readinessHeadline(r: Report) {
  const h = en.readiness.headline
  if (r.verdict === 'ready_with_warnings') return h.ready_with_warnings(r.warnings.length)
  return h[r.verdict]
}

/** The drawer's title: here, and only here, the count of what's left. */
export function readinessCount(r: Report) {
  const h = en.readiness.headline
  if (r.verdict === 'blocked') return h.count(r.errors.length + r.todo.length)
  return readinessHeadline(r)
}
