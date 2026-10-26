import { useEffect, useRef, useState, type ReactNode } from 'react'
import { en } from '../copy/en'
import { Button } from './Button'
import { Icon } from './Icon'

/**
 * A short message about what just happened, in the lower right above the action bar. It leaves on its own after a while,
 * but never while the pointer or focus is on it, so Undo stays reachable. Announced politely.
 */
export function Toast({ id, title, children, action, onClose, seconds = 4 }: { id: number; title: string; children?: ReactNode; action?: ReactNode; onClose: () => void; seconds?: number }) {
  const [paused, setPaused] = useState(false)
  const close = useRef(onClose)
  close.current = onClose

  useEffect(() => {
    if (paused) return
    const t = window.setTimeout(() => close.current(), seconds * 1000)
    return () => window.clearTimeout(t)
  }, [id, paused, seconds])

  return (
    <div
      key={id}
      className="toast"
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="toast-icon"><Icon name="complete" /></span>
      <div className="toast-body">
        <p className="toast-title">{title}</p>
        {children}
      </div>
      <div className="toast-actions">
        {action}
        <Button variant="ghost" onClick={onClose} aria-label={en.close}>
          <Icon name="close" size="sm" />
        </Button>
      </div>
    </div>
  )
}
