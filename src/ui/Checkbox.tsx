import { useId, type ReactNode } from 'react'
import { useDensity } from './Density'

/** A checkbox; `hint` sits under the label and is read with it. */
export function Checkbox({ label, hint, checked, onChange }: { label: string; hint?: ReactNode; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId()
  return (
    <label className="checkbox" data-density={useDensity()}>
      <input type="checkbox" checked={checked} aria-describedby={hint ? id : undefined} onChange={(e) => onChange(e.target.checked)} />
      <span>
        {label}
        {hint && (
          <span id={id} className="hint">
            {hint}
          </span>
        )}
      </span>
    </label>
  )
}

/** Several checkboxes answering one question. */
export function CheckboxGroup({ legend, options, value, error, onChange }: { legend: string; options: { value: string; label: string }[]; value: string[]; error?: string; onChange: (v: string[]) => void }) {
  return (
    <fieldset className="radio-group" aria-invalid={!!error || undefined}>
      <legend>{legend}</legend>
      {error && <span className="error" role="alert">{error}</span>}
      {options.map((o) => (
        <Checkbox
          key={o.value}
          label={o.label}
          checked={value.includes(o.value)}
          onChange={(on) => onChange(on ? [...value, o.value] : value.filter((v) => v !== o.value))}
        />
      ))}
    </fieldset>
  )
}
