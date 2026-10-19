import { useRef, useState } from 'react'
import { en, ui } from '../copy/en'
import { Button } from '../ui/Button'
import { Inline, Text, VisuallyHidden } from '../ui/Layout'
import { useApp } from './AppContext'
import { ReadinessDrawer } from './ReadinessDrawer'
import { Note } from '../ui/Note'

const SHAPE = { waiting_for_renewal: '!', action_required: '!', ready_to_submit: '✓', submitted: '✓' } as const

/** In the header, on every screen: answers "Is my application ready?". Never ranked by money. */
export function ReadinessBar() {
  const { derived } = useApp()
  const r = derived.readiness
  const [open, setOpen] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)

  const headline =
    r.state === 'action_required' ? ui.readiness.label && en.thingsNeedAction(r.blockers.length) : en.applicationState[r.state]

  return (
    <section className="readiness" aria-labelledby="readiness-title" data-state={r.state}>
      <VisuallyHidden as="h2">
        <span id="readiness-title">{ui.readiness.label}</span>
      </VisuallyHidden>
      <div aria-live="polite" aria-atomic="true">
        <Text variant="strong">
          <span aria-hidden="true" className="readiness-icon">{SHAPE[r.state]}</span> {headline}
        </Text>
      </div>
      <Inline>
        <Note kind="north_star" />
        <Button ref={opener} aria-expanded={open} onClick={() => setOpen(true)}>
          {ui.readiness.open}
        </Button>
      </Inline>
      <ReadinessDrawer open={open} onClose={() => setOpen(false)} returnFocusTo={opener} />
    </section>
  )
}
