import { useId } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'

interface Props<T extends string> {
  legend: string
  hint?: string
  options: { value: T; label: string }[]
  onChoose: (value: T) => void
}

/** One question answered with a large button per answer, for when answering moves him on. */
export function ChoiceButtons<T extends string>({ legend, hint, options, onChoose }: Props<T>) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-3">
      <p id={id} className="text-base font-semibold">
        {legend}
        {hint && <span className="mt-0.5 block text-sm font-normal text-muted-foreground">{hint}</span>}
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((o) => (
          <Button key={o.value} variant="choice" onClick={() => onChoose(o.value)}>
            {(o.value === 'yes' || o.value === 'no') && <Icon name={o.value === 'yes' ? 'yes' : 'no'} />}
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
