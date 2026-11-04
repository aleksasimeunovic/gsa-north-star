import { useEffect, useRef, useState } from 'react'
import { en } from '../copy/en'
import { Icon } from './Icon'

/**
 * One line about what just happened, in the lower right above the action bar. It leaves on its own after a
 * while, but never while the pointer or focus is on it, so Undo stays reachable. Announced politely.
 */
export function Toast({ id, title, undo, onClose, seconds = 4 }: { id: number; title: string; undo?: { label: string; hint: string; onClick: () => void }; onClose: () => void; seconds?: number }) {
  const [paused, setPaused] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const close = useRef(onClose)
  close.current = onClose
  // It fades out before it goes, unless motion is reduced.
  const leave = () => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return close.current()
    setLeaving(true)
    window.setTimeout(() => close.current(), 180)
  }

  // Time left, kept across a pause, so the draining line and the toast end together.
  const left = useRef(seconds * 1000)
  useEffect(() => {
    setLeaving(false)
    left.current = seconds * 1000
  }, [id, seconds])
  useEffect(() => {
    if (paused) return
    const start = performance.now()
    const t = window.setTimeout(leave, left.current)
    return () => {
      window.clearTimeout(t)
      left.current = Math.max(0, left.current - (performance.now() - start))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, paused, seconds])

  return (
    <div
      key={id}
      className="toast"
      data-paused={paused || undefined}
      data-leaving={leaving || undefined}
      style={{ ['--toast-time' as string]: `${seconds}s` }}
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
      <button type="button" className="toast-action" aria-label={en.close} onClick={leave}>
        <Icon name="close" size="sm" />
      </button>
    </div>
  )
}
