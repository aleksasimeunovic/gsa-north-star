import type { ReactNode } from 'react'
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
export function ToolButton({ icon, caption, hint, on, disabled, short, onClick }: { icon: IconName; caption: string; hint: string; on?: boolean; disabled?: boolean; short?: boolean; onClick: () => void }) {
  return (
    <button type="button" className="tool" data-on={on || undefined} data-short={short || undefined} aria-pressed={on} aria-label={hint} title={hint} disabled={disabled} onClick={onClick}>
      <Icon name={icon} />
      <span>{caption}</span>
    </button>
  )
}

/** Two views of the same map, one at a time. */
export function ToolSwitch<T extends string>({ label, options, value, onChange }: { label: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="tool-island" data-switch role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className="tool-option" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Said on the map, above the tools, at the moment it happens. `error`: something he tried that can't be. */
export function MapStatus({ children, error }: { children: ReactNode; error?: boolean }) {
  return (
    <p className="map-status" data-error={error || undefined} role={error ? 'alert' : undefined}>
      <Icon name={error ? 'error' : 'warning'} size="sm" />
      {children}
    </p>
  )
}
