import { useId, type ReactNode } from 'react'
import { cn } from '../lib/utils'
import { Checkbox as Base } from './shadcn/checkbox'
import { useDensity } from './Density'
import { Icon } from './Icon'

/**
 * A checkbox; `hint` sits under the label and is read with it. `card` draws it as a selectable card.
 * `error` says what's missing, under it, and `id` lets an action take him straight to it.
 */
export function Checkbox({ id: given, label, hint, checked, error, invalid, onChange, card }: { id?: string; label: string; hint?: ReactNode; checked: boolean; error?: string; invalid?: boolean; onChange: (v: boolean) => void; card?: boolean }) {
  const own = useId()
  const id = given ?? own
  const compact = useDensity() === 'compact'
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-[var(--gap-inline)]',
        compact ? 'min-h-8 py-1' : 'min-h-11 py-2',
        card && 'rounded-xl border bg-card px-4 py-4 transition-colors hover:border-ring/50 has-[[data-state=checked]]:border-foreground has-[[data-state=checked]]:bg-muted/50',
        card && (invalid || error) && 'border-error',
      )}
    >
      <Base id={id} checked={checked} aria-invalid={!!error || invalid || undefined} aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <span className="flex flex-col gap-[var(--gap-text)]">
        <span className="font-medium leading-snug">{label}</span>
        {hint && (
          <span id={`${id}-hint`} className="flex flex-col gap-[var(--gap-row)] text-sm text-muted-foreground">
            {hint}
          </span>
        )}
        {error && (
          <span id={`${id}-error`} role="alert" className="flex items-center gap-[var(--gap-inline)] text-sm font-medium text-destructive">
            <Icon name="error" size="sm" />
            {error}
          </span>
        )}
      </span>
    </label>
  )
}

/** Several checkboxes answering one question. */
export function CheckboxGroup({ legend, options, value, error, onChange }: { legend: string; options: { value: string; label: string }[]; value: string[]; error?: string; onChange: (v: string[]) => void }) {
  return (
    <fieldset className="flex min-w-0 flex-col gap-[var(--gap-label)]" aria-invalid={!!error || undefined}>
      <legend className="mb-2 font-medium">{legend}</legend>
      {error && (
        <span className="flex items-center gap-[var(--gap-inline)] text-sm font-medium text-destructive" role="alert">
          <Icon name="error" size="sm" />
          {error}
        </span>
      )}
      {options.map((o) => (
        <Checkbox
          key={o.value}
          card
          invalid={!!error}
          label={o.label}
          checked={value.includes(o.value)}
          onChange={(on) => onChange(on ? [...value, o.value] : value.filter((v) => v !== o.value))}
        />
      ))}
    </fieldset>
  )
}
