import { forwardRef } from 'react'
import { en } from '../copy/en'
import type { Report } from '../logic/readiness'
import { Icon } from '../ui/Icon'
import { useApp } from './AppContext'

const SHAPE = { renewal: 'error', blocked: 'error', ready_with_warnings: 'warning', ready: 'complete', submitted: 'complete' } as const

/** Answers "Can I submit?" on every screen, and opens what stops him and what to look at. */
export const ReadinessBar = forwardRef<HTMLButtonElement, { onOpen: () => void; expanded: boolean }>(function ReadinessBar({ onOpen, expanded }, ref) {
  const { derived } = useApp()
  const v = derived.report.verdict
  return (
    <div className="readiness" data-verdict={v} aria-live="polite" aria-atomic="true">
      <button ref={ref} type="button" className="readiness-link" aria-haspopup="dialog" aria-expanded={expanded} onClick={onOpen}>
        <span className="readiness-icon"><Icon name={SHAPE[v]} /></span> <span className="readiness-text">{readinessHeadline(derived.report)}</span>
      </button>
    </div>
  )
})

export function readinessHeadline(r: Report) {
  const h = en.readiness.headline
  if (r.verdict === 'blocked') return h.blocked(r.errors.length)
  if (r.verdict === 'ready_with_warnings') return h.ready_with_warnings(r.warnings.length)
  return h[r.verdict]
}
