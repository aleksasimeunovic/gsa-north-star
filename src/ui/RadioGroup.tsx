import { useId } from 'react'
import { cn } from '../lib/utils'
import { RadioGroup as Base, RadioGroupItem } from './shadcn/radio-group'
import { useDensity } from './Density'
import { Icon } from './Icon'

interface Option<T extends string> {
  value: T
  label: string
  hint?: string
}

interface Props<T extends string> {
  legend: string
  hint?: string
  options: Option<T>[]
  value: T | null
  onChange: (value: T) => void
  inline?: boolean
  /** What's missing, said under the question. */
  error?: string
}

/** One question, each answer a selectable card. */
export function RadioGroup<T extends string>({ legend, hint, options, value, onChange, inline, error }: Props<T>) {
  const id = useId()
  const compact = useDensity() === 'compact'
  return (
    <div role="group" aria-labelledby={`${id}-legend`} className="flex min-w-0 flex-col gap-[var(--gap-item)]">
      <p id={`${id}-legend`} className="text-base font-semibold">
        {legend}
        {hint && <span className="mt-0.5 block text-sm font-normal text-muted-foreground">{hint}</span>}
      </p>
      {error && (
        <span role="alert" className="flex items-center gap-[var(--gap-inline)] text-sm font-medium text-destructive">
          <Icon name="error" size="sm" />
          {error}
        </span>
      )}
      <Base aria-invalid={!!error || undefined} value={value ?? ''} onValueChange={(v) => onChange(v as T)} aria-labelledby={`${id}-legend`} className={cn(inline && 'grid-cols-1 sm:grid-cols-2')}>
        {options.map((o) => (
          <label
            key={o.value}
            htmlFor={`${id}-${o.value}`}
            className={cn(
              'flex cursor-pointer items-center gap-[var(--gap-inline)] rounded-xl border bg-card px-4 transition-colors hover:border-ring/50 has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-muted/50',
              compact ? 'min-h-9 py-2' : 'min-h-14 py-3',
            )}
          >
            <RadioGroupItem id={`${id}-${o.value}`} value={o.value} />
            <span className="flex flex-col">
              <span className="font-medium">{o.label}</span>
              {o.hint && <span className="text-sm text-muted-foreground">{o.hint}</span>}
            </span>
          </label>
        ))}
      </Base>
    </div>
  )
}
