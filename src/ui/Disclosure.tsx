import { useId, useState, type ReactNode } from 'react'
import { Icon } from './Icon'

export function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <div className="disclosure">
      <button type="button" className="disclosure-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <Icon name="disclose" /> {label}
      </button>
      <div id={id} hidden={!open} className="disclosure-body">{children}</div>
    </div>
  )
}
