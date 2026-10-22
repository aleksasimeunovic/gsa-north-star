import { en } from '../copy/en'
import { useApp } from './AppContext'

const SHAPE = { waiting_for_renewal: '!', action_required: '!', ready_to_submit: '✓', submitted: '✓' } as const

/** In the header, on every screen: answers "Is my application ready?" and leads to the next action. */
export function ReadinessBar() {
  const { derived, go } = useApp()
  const r = derived.readiness
  const next = derived.list.next
  const headline = r.state === 'action_required' ? en.readiness.action(r.blockers.length) : en.readiness.headline[r.state]

  return (
    <section className="readiness" aria-label={en.readiness.label} data-state={r.state}>
      <div aria-live="polite" aria-atomic="true">
        <button
          type="button"
          className="readiness-link"
          onClick={() => (r.state === 'submitted' ? go('receipt') : go('welcome', next ? `task-${next}` : undefined))}
        >
          <span aria-hidden="true" className="readiness-icon">{SHAPE[r.state]}</span> <span className="readiness-text">{headline}</span>
        </button>
      </div>
    </section>
  )
}
