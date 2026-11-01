import { useEffect, useRef, useState } from 'react'
import { en } from '../copy/en'
import { Icon } from './Icon'

/**
 * One line about what just happened, in the lower right above the action bar. It leaves on its own after a
 * while, but never while the pointer or focus is on it, so Undo stays reachable. Announced politely.
 */
export function Toast({ id, title, undo, onClose, seconds = 4 }: { id: number; title: string; undo?: { label: string; hint: string; onClick: () => void }; onClose: () => void; seconds?: number }) {
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
      <p className="toast-title">{title}</p>
      {undo && (
        <button type="button" className="toast-action" aria-label={undo.hint} onClick={undo.onClick}>
          {undo.label}
        </button>
      )}
      <button type="button" className="toast-action" aria-label={en.close} onClick={onClose}>
        <Icon name="close" size="sm" />
      </button>
    </div>
  )
}
