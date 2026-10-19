import { useRef, useState } from 'react'
import { en, ui } from '../copy/en'
import { VisuallyHidden } from '../ui/Layout'
import { Note } from '../ui/Note'
import { useApp } from './AppContext'
import { ReadinessDrawer } from './ReadinessDrawer'

const SHAPE = { waiting_for_renewal: '!', action_required: '!', ready_to_submit: '✓', submitted: '✓' } as const

/** In the header, on every screen: answers "Is my application ready?". The line itself opens the details. */
export function ReadinessBar() {
  const { derived } = useApp()
  const r = derived.readiness
  const [open, setOpen] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)

  const headline = r.state === 'action_required' ? en.thingsNeedAction(r.blockers.length) : ui.readiness.headline[r.state]

  return (
    <section className="readiness" aria-labelledby="readiness-title" data-state={r.state}>
      <VisuallyHidden as="h2">
        <span id="readiness-title">{ui.readiness.label}</span>
      </VisuallyHidden>
      <div aria-live="polite" aria-atomic="true">
        <button ref={opener} type="button" className="readiness-link" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
          <span aria-hidden="true" className="readiness-icon">{SHAPE[r.state]}</span> <span className="readiness-text">{headline}</span>
        </button>
      </div>
      <Note kind="north_star" />
      <ReadinessDrawer open={open} onClose={() => setOpen(false)} returnFocusTo={opener} />
    </section>
  )
}
