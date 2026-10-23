import { forwardRef } from 'react'
import { en } from '../copy/en'
import { useApp } from './AppContext'

const SHAPE = { waiting_for_renewal: '!', action_required: '!', ready_to_submit: '✓', submitted: '✓' } as const

/** Answers "Is my application ready?" on every screen, and opens the list of what's left. */
export const ReadinessBar = forwardRef<HTMLButtonElement, { onOpen: () => void; expanded: boolean }>(function ReadinessBar({ onOpen, expanded }, ref) {
  const { derived } = useApp()
  const r = derived.readiness
  const headline = r.state === 'action_required' ? en.readiness.left(derived.list.todo.length) : en.readiness.headline[r.state]
  return (
    <div className="readiness" data-state={r.state} aria-live="polite" aria-atomic="true">
      <button ref={ref} type="button" className="readiness-link" aria-haspopup="dialog" aria-expanded={expanded} onClick={onOpen}>
        <span aria-hidden="true" className="readiness-icon">{SHAPE[r.state]}</span> <span className="readiness-text">{headline}</span>
      </button>
    </div>
  )
})

export const readinessHeadline = (d: ReturnType<typeof useApp>['derived']) =>
  d.readiness.state === 'action_required' ? en.readiness.left(d.list.todo.length) : en.readiness.headline[d.readiness.state]
