import { forwardRef } from 'react'
import { en, home, tasks } from '../copy/en'
import type { Report } from '../logic/readiness'
import { Icon } from '../ui/Icon'
import { useApp } from './AppContext'

// Work not done yet is neutral, never an error; orange asks him to look; done is a tick.
const SHAPE = { renewal: 'todo', blocked: 'todo', ready_with_warnings: 'warning', ready: 'complete', submitted: 'complete' } as const

/**
 * Answers "Can I submit?" on every screen: the verdict, then the next action, not a count.
 * The count lives in the open part of the stepper and in the drawer this opens.
 */
export const ReadinessBar = forwardRef<HTMLButtonElement, { onOpen: () => void; expanded: boolean; next?: string | null }>(function ReadinessBar({ onOpen, expanded, next: onScreen }, ref) {
  const { derived } = useApp()
  const r = derived.report
  // The next action is the one in front of him, or else the application's first.
  const next = onScreen ?? derived.list.next
  const nextLine = (r.verdict === 'blocked' || r.verdict === 'renewal') && next && next !== 'submit' ? home.nextAction(nextActionLabel(next, derived.items)) : null
  return (
    <div className="readiness" data-verdict={r.verdict} aria-live="polite" aria-atomic="true">
      <button ref={ref} type="button" className="readiness-link" aria-haspopup="dialog" aria-expanded={expanded} onClick={onOpen}>
        <span className="readiness-icon"><Icon name={SHAPE[r.verdict]} /></span>
        <span className="readiness-lines">
          <span className="readiness-text">{readinessHeadline(r)}</span>
          {nextLine && <span className="readiness-next">{nextLine}</span>}
        </span>
      </button>
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
