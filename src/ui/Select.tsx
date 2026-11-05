import { useId, type SelectHTMLAttributes } from 'react'
import { NativeSelect } from './shadcn/input'
import { Label } from './shadcn/label'
import { Icon } from './Icon'

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
  error?: string
}

export function Select({ id: given, label, options, placeholder, error, ...rest }: Props) {
  const own = useId()
  const id = given ?? own
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-base">{label}</Label>
      {error && (
        <span id={`${id}-error`} className="flex items-center gap-1.5 text-sm font-medium text-destructive" role="alert">
          <Icon name="error" size="sm" />
          {error}
        </span>
      )}
      {/* Our own chevron, as far from the right edge as the text is from the left. */}
      <div className="relative">
        <NativeSelect id={id} className="appearance-none pr-10" aria-invalid={!!error || undefined} aria-describedby={error ? `${id}-error` : undefined} {...rest}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </NativeSelect>
        <Icon name="expand" size="sm" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  )
}
