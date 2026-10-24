import { useRef, useState } from 'react'
import { bar } from '../copy/en'
import type { TaskId } from '../logic/application'
import { Button } from '../ui/Button'
import { StickyBar } from '../ui/StickyBar'
import { ReadinessBar } from './ReadinessBar'
import { ReadinessDrawer } from './ReadinessDrawer'

interface Step {
  label: string
  onClick: () => void
  disabled?: boolean
}

/**
 * Always at the bottom: Back, where he stands (opens everything that's left), and the way forward.
 * Forward is the primary action only when nothing in the open task is waiting for his answer.
 */
export function ActionBar({ back, forward, forwardIsPrimary, onPick }: { back?: Step; forward?: Step; forwardIsPrimary: boolean; onPick: (id: TaskId) => void }) {
  const [open, setOpen] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)
  return (
    <>
      <StickyBar
        label={bar.label}
        start={back && <Button onClick={back.onClick}>{back.label}</Button>}
        middle={<ReadinessBar ref={opener} expanded={open} onOpen={() => setOpen(true)} />}
        end={forward && <Button variant={forwardIsPrimary ? 'primary' : 'secondary'} onClick={forward.onClick} disabled={forward.disabled}>{forward.label}</Button>}
      />
      <ReadinessDrawer
        open={open}
        onClose={() => setOpen(false)}
        returnFocusTo={opener}
        onPick={(id) => {
          setOpen(false)
          onPick(id)
        }}
      />
    </>
  )
}
