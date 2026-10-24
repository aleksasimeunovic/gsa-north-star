import { useId } from 'react'
import { cn } from '../lib/utils'
import { RadioGroup as Base, RadioGroupItem } from './shadcn/radio-group'
import { useDensity } from './Density'

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
}

/** One question, each answer a selectable card. */
export function RadioGroup<T extends string>({ legend, hint, options, value, onChange, inline }: Props<T>) {
  const id = useId()
  const compact = useDensity() === 'compact'
  return (
    <div role="group" aria-labelledby={`${id}-legend`} className="flex min-w-0 flex-col gap-3">
      <p id={`${id}-legend`} className="text-base font-semibold">
        {legend}
        {hint && <span className="mt-0.5 block text-sm font-normal text-muted-foreground">{hint}</span>}
      </p>
      <Base value={value ?? ''} onValueChange={(v) => onChange(v as T)} aria-labelledby={`${id}-legend`} className={cn(inline && 'grid-cols-1 sm:grid-cols-2')}>
        {options.map((o) => (
          <label
            key={o.value}
            htmlFor={`${id}-${o.value}`}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 transition-colors hover:border-ring/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent/40',
              compact ? 'min-h-9 py-1.5' : 'min-h-14 py-3',
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
