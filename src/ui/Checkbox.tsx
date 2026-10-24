import { useId, type ReactNode } from 'react'
import { cn } from '../lib/utils'
import { Checkbox as Base } from './shadcn/checkbox'
import { useDensity } from './Density'

/** A checkbox; `hint` sits under the label and is read with it. `card` draws it as a selectable card. */
export function Checkbox({ label, hint, checked, onChange, card }: { label: string; hint?: ReactNode; checked: boolean; onChange: (v: boolean) => void; card?: boolean }) {
  const id = useId()
  const compact = useDensity() === 'compact'
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-3',
        compact ? 'min-h-8 py-1' : 'min-h-11 py-2',
        card && 'rounded-xl border bg-card px-4 py-4 transition-colors hover:border-ring/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-accent/40',
      )}
    >
      <Base id={id} checked={checked} aria-describedby={hint ? `${id}-hint` : undefined} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <span className="flex flex-col gap-0.5">
        <span className="font-medium leading-snug">{label}</span>
        {hint && (
          <span id={`${id}-hint`} className="flex flex-col gap-0.5 text-sm text-muted-foreground">
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
    <fieldset className="flex min-w-0 flex-col gap-2" aria-invalid={!!error || undefined}>
      <legend className="mb-2 font-medium">{legend}</legend>
      {error && <span className="text-sm font-medium text-destructive" role="alert">{error}</span>}
      {options.map((o) => (
        <Checkbox
          key={o.value}
          card
          label={o.label}
          checked={value.includes(o.value)}
          onChange={(on) => onChange(on ? [...value, o.value] : value.filter((v) => v !== o.value))}
        />
      ))}
    </fieldset>
  )
}
