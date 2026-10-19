import { useId, type SelectHTMLAttributes } from 'react'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
  error?: string
}

export function Select({ label, options, placeholder, error, ...rest }: Props) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">{label}</label>
      {error && <span id={`${id}-error`} className="error" role="alert">{error}</span>}
      <select id={id} aria-invalid={!!error || undefined} aria-describedby={error ? `${id}-error` : undefined} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
