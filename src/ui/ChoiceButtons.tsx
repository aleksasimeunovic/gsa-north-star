import { useId } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'

interface Props<T extends string> {
  legend: string
  hint?: string
  /** `icon`: one sign per kind of answer everywhere: a tick for yes, a pen for "I'll change it", a cross for a flat no. Yes and no get theirs by value. */
  options: { value: T; label: string; icon?: 'yes' | 'no' | 'edit' }[]
  onChoose: (value: T) => void
  /** The heading above already asks it: the legend stays for screen readers only. */
  quiet?: boolean
}

/** One question answered with a large button per answer, for when answering moves him on. The first answer is
 *  the usual, positive one (GSA's best guess), so it is the primary action. */
export function ChoiceButtons<T extends string>({ legend, hint, options, onChoose, quiet }: Props<T>) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-[var(--gap-label)]">
      <p id={id} className={quiet ? 'sr-only' : 'text-base font-semibold'}>
        {legend}
        {hint && <span className="mt-0.5 block text-sm font-normal text-muted-foreground">{hint}</span>}
      </p>
      <div className="grid grid-cols-1 gap-[var(--gap-buttons)] sm:grid-cols-2">
        {options.map((o, i) => {
          const icon = o.icon ?? (o.value === 'yes' ? 'yes' : o.value === 'no' ? 'no' : undefined)
          return (
            <Button key={o.value} variant={i === 0 ? 'primary' : 'choice'} className={i === 0 ? 'justify-start text-left' : undefined} onClick={() => onChoose(o.value)}>
              {icon && <Icon name={icon} />}
              {o.label}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
