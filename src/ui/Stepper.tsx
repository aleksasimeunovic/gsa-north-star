import type { Status } from '../logic/status'
import { useDensity } from './Density'
import { StatusBadge } from './StatusBadge'

interface Props {
  label: string
  current: number // 0-based
  steps: { id: string; name: string; status?: Status }[]
  stepOf: string
  onSelect: (id: string) => void
}

// Progress counts only the steps he has.
export function Stepper({ label, current, steps, stepOf, onSelect }: Props) {
  return (
    <nav aria-label={label} className="stepper" data-density={useDensity()}>
      <p className="stepper-count">{stepOf}</p>
      <progress max={steps.length} value={current + 1} aria-label={stepOf} />
      <ol className="stepper-list">
        {steps.map((s, i) => (
          <li key={s.id}>
            <button type="button" className="stepper-step" aria-current={i === current ? 'step' : undefined} onClick={() => onSelect(s.id)}>
              {s.name}
            </button>
            {s.status && <StatusBadge status={s.status} iconOnly />}
          </li>
        ))}
      </ol>
    </nav>
  )
}
