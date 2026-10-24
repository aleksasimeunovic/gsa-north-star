import { useId, type SelectHTMLAttributes } from 'react'
import { NativeSelect } from './shadcn/input'
import { Label } from './shadcn/label'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
  error?: string
}

export function Select({ label, options, placeholder, error, ...rest }: Props) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-base">{label}</Label>
      {error && <span id={`${id}-error`} className="text-sm font-medium text-destructive" role="alert">{error}</span>}
      <NativeSelect id={id} aria-invalid={!!error || undefined} aria-describedby={error ? `${id}-error` : undefined} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </NativeSelect>
    </div>
  )
}
