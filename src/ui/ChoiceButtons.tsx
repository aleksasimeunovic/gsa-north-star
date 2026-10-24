import { useId } from 'react'
import { Button } from './Button'

interface Props<T extends string> {
  legend: string
  hint?: string
  options: { value: T; label: string }[]
  onChoose: (value: T) => void
}

/** One question answered with a button per answer, for when answering moves him on. */
export function ChoiceButtons<T extends string>({ legend, hint, options, onChoose }: Props<T>) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} className="choice-buttons">
      <p id={id} className="choice-legend">
        {legend}
        {hint && <span className="hint">{hint}</span>}
      </p>
      <div className="choice-row">
        {options.map((o) => (
          <Button key={o.value} variant="choice" onClick={() => onChoose(o.value)}>
            {o.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
