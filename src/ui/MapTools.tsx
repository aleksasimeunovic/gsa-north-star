import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { shapeTools } from '../copy/en'
import { Icon, type IconName } from './Icon'

/**
 * The tools for what he is doing on the map, floating over it, always in the same place and changing with
 * the step. A helper shows whether it is on with a dark fill and the word itself, so there is always an
 * overview of what's on. `on` undefined is a plain action.
 */
export function ToolIsland({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="tool-island" role="toolbar" aria-label={label}>
      {children}
    </div>
  )
}

export const ToolDivider = () => <span className="tool-divider" aria-hidden="true" />

/** `short`: a phone has no room for its caption, because undo and redo are known by their icons. */
/** `hint` shows above it when a mouse rests there or it has focus; `idle` says why it is grey while it is. */
export function ToolButton({ icon, caption, hint, idle, on, disabled, short, onClick }: { icon: IconName; caption: string; hint: string; idle?: string; on?: boolean; disabled?: boolean; short?: boolean; onClick: () => void }) {
  return (
    <button type="button" className="tool" data-on={on || undefined} data-short={short || undefined} aria-pressed={on} aria-label={hint} data-tip={disabled ? (idle ?? hint) : hint} aria-disabled={disabled || undefined} onClick={() => !disabled && onClick()}>
      <Icon name={icon} />
      <span>{caption}</span>
    </button>
  )
}

/** Two views of the same map, one at a time. The dark thumb slides to the one he picks. */
export function ToolSwitch<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const group = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null)
  useLayoutEffect(() => {
    const on = group.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
    if (on) setThumb({ left: on.offsetLeft, width: on.offsetWidth })
  }, [value, options.length])
  return (
    <div ref={group} className="tool-island" data-switch role="group" aria-label={label}>
      {thumb && <span className="tool-thumb" aria-hidden="true" style={{ translate: `${thumb.left}px 0`, width: thumb.width }} />}
      {options.map((o) => (
        <button key={o.value} type="button" className="tool-option" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Said on the map, above the tools, at the moment it happens. `error`: something he tried that can't be.
 * `action`: the one thing he can do about it, right there (turn snapping off).
 */
export function MapStatus({ children, error, icon, action }: { children: ReactNode; error?: boolean; icon?: IconName; action?: { label: string; onClick: () => void } }) {
  return (
    <p className="map-status" data-error={error || undefined} data-info={icon ? '' : undefined} role={error ? 'alert' : undefined}>
      <Icon name={icon ?? (error ? 'error' : 'warning')} size="sm" />
      {children}
      {action && (
        <button type="button" className="map-status-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </p>
  )
}

/**
 * The same tools wherever he moves a shape on the map: Undo, then Reset. Redo is only there once he has undone
 * something, so the island never holds a tool he can't use yet. Snapping has no tool: it works on its own.
 */
export function EditTools({ label, canUndo, canRedo, onUndo, onRedo, reset, short }: { label: string; canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void; reset?: { hint: string; idle?: string; disabled: boolean; onClick: () => void }; short?: boolean }) {
  const t = shapeTools
  return (
    <ToolIsland label={label}>
      <ToolButton icon="undo" caption={t.undo} hint={t.undoHint} idle={t.undoIdle} short={short} disabled={!canUndo} onClick={onUndo} />
      {canRedo && <ToolButton icon="redo" caption={t.redo} hint={t.redoHint} short={short} onClick={onRedo} />}
      {reset && (
        <>
          <ToolDivider />
          <ToolButton icon="reset" caption={t.reset} hint={reset.hint} idle={reset.idle} disabled={reset.disabled} onClick={reset.onClick} />
        </>
      )}
    </ToolIsland>
  )
}

/**
 * Snapping said where it happens: that a point joined an edge, with the way to stop it; and, while it is off,
 * that points stay where he puts them, with the way back.
 */
export function SnapStatus({ on, joined, onChange, children }: { on: boolean; joined: boolean; onChange: (on: boolean) => void; children?: ReactNode }) {
  if (on && joined)
    return (
      <MapStatus icon="snap" action={{ label: shapeTools.snapStop, onClick: () => onChange(false) }}>
        {shapeTools.joined} {children}
      </MapStatus>
    )
  if (!on) return <MapStatus icon="info" action={{ label: shapeTools.snapStart, onClick: () => onChange(true) }}>{shapeTools.snapOff}</MapStatus>
  return null
}

/** How to take a point out, said above the tools while he has one selected: there is no button for it. */
export function RemoveHint() {
  return (
    <MapStatus icon="info">
      <span className="fine-only">{shapeTools.removeMouse}</span>
      <span className="coarse-only">{shapeTools.removeTouch}</span>
    </MapStatus>
  )
}
