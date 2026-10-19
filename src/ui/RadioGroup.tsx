import { useId } from 'react'
import { useDensity } from './Density'

interface Option<T extends string> {
  value: T
  label: string
  hint?: string
}

interface Props<T extends string> {
  legend: string
  options: Option<T>[]
  value: T | null
  onChange: (value: T) => void
  inline?: boolean
}

export function RadioGroup<T extends string>({ legend, options, value, onChange, inline }: Props<T>) {
  const name = useId()
  return (
    <fieldset className="radio-group" data-inline={inline || undefined} data-density={useDensity()}>
      <legend>{legend}</legend>
      {options.map((o) => (
        <label key={o.value} className="radio">
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
          <span>
            {o.label}
            {o.hint && <span className="hint">{o.hint}</span>}
          </span>
        </label>
      ))}
    </fieldset>
  )
}
