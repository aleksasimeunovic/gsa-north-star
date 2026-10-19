import { useId, type SelectHTMLAttributes } from 'react'

type Props = SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: { value: string; label: string }[]; placeholder?: string }

export function Select({ label, options, placeholder, ...rest }: Props) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">{label}</label>
      <select id={id} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}
