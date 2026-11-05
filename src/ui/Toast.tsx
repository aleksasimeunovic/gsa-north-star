import { useEffect, useRef, useState } from 'react'
import { en } from '../copy/en'
import { Icon } from './Icon'

/**
 * What just happened, in a bold line with its sign (saved, sent for a check, added, no longer needed), and
 * under it what comes next. One line about what just happened, in the lower right above the action bar. It leaves on its own after a
 * while, but never while the pointer or focus is on it, so Undo stays reachable. Announced politely.
 */
export type ToastKind = 'done' | 'waiting' | 'added' | 'removed'
const ICON = { done: 'complete', waiting: 'warning', added: 'added', removed: 'removed' } as const

export function Toast({ id, kind = 'done', title, detail, undo, onClose, seconds = 5 }: { id: number; kind?: ToastKind; title: string; detail?: string; undo?: { label: string; hint: string; onClick: () => void }; onClose: () => void; seconds?: number }) {
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
      <span className="toast-icon" data-kind={kind}>
        <Icon name={ICON[kind]} size="md" />
      </span>
      <p className="toast-text">
        <span className="toast-title">{title}</span>
        {detail && <span className="toast-detail">{detail}</span>}
      </p>
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
