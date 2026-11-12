import { forwardRef } from 'react'
import { en, tasks } from '../copy/en'
import { outstanding, type Report } from '../logic/readiness'
import { Icon } from '../ui/Icon'
import { useApp } from './AppContext'

/**
 * Answers "Can I submit?" on every screen: the verdict, then the next action, not a count.
 * The count lives in the open part of the stepper and in the drawer this opens.
 */
/**
 * While anything is left, the bar says how much, everything counted: what to fix and what he hasn't done yet,
 * so one blurry receipt never reads as the only thing between him and submitting. Red only when something is
 * wrong; otherwise the orange sign for work not done. It opens all of it in the drawer.
 */
export const ReadinessBar = forwardRef<HTMLButtonElement, { onOpen: () => void; expanded: boolean; next?: string | null }>(function ReadinessBar({ onOpen, expanded }, ref) {
  const { derived } = useApp()
  const r = derived.report
  const working = r.verdict === 'blocked' || r.verdict === 'renewal'
  const o = outstanding(r)
  const tone = working ? (o.fix ? 'error' : 'warning') : r.verdict === 'ready_with_warnings' ? 'warning' : r.verdict === 'submitted' ? null : 'complete'
  const text = readinessCount(r)
  return (
    <div className="readiness" data-tone={tone ?? undefined} aria-live="polite" aria-atomic="true">
      {tone && (
        <button ref={ref} type="button" className="readiness-link" aria-haspopup="dialog" aria-expanded={expanded} onClick={onOpen}>
          <span className="readiness-icon"><Icon name={tone} /></span>
          <span className="readiness-lines">
            <span className="readiness-text">{text}</span>
          </span>
          <span className="readiness-chevron"><Icon name="disclose" size="sm" /></span>
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

/** The verdict in a few words, the same in the bar, the drawer's title and the Summary. */
export function readinessCount(r: Report) {
  if (r.verdict === 'renewal') return en.readiness.headline.renewal
  if (r.verdict !== 'blocked') return readinessHeadline(r)
  const o = outstanding(r)
  return en.readiness.headline.left(o.left, o.fix)
}
