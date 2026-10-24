import { steps as copy } from '../copy/en'
import { Icon } from '../ui/Icon'
import { Progress } from '../ui/Progress'
import { useApp } from './AppContext'
import type { Flow } from './useApplicationFlow'

/**
 * The parts of his application, generated around his farm: a part with nothing for his farm is left out.
 * Each says what's left in it, and any part can be opened. On a phone it shrinks to where he is and a bar.
 */
export function Stepper({ flow }: { flow: Flow }) {
  const { derived } = useApp()
  const list = derived.list.steps
  const at = flow.index + 1
  return (
    <nav aria-label={copy.label} className="stepper">
      <p className="stepper-compact" aria-hidden="true">
        <span>{copy.of(at, list.length)}</span> <strong>{copy.name[flow.step.id]}</strong>
      </p>
      <Progress value={at} max={list.length} />
      <ol>
        {list.map((s, i) => {
          const current = s.id === flow.step.id
          const done = s.id !== 'submit' && s.left === 0
          const status = s.id === 'submit' ? '' : copy.status(s.left, s.waiting)
          return (
            <li key={s.id} data-state={current ? 'current' : done ? 'done' : 'todo'}>
              <button type="button" aria-current={current ? 'step' : undefined} onClick={() => flow.goStep(s.id)}>
                <span className="step-mark" aria-hidden="true">{done ? <Icon name="check" size="sm" /> : i + 1}</span>
                <span className="step-text">
                  <span className="step-name">{copy.name[s.id]}</span>
                  {status && <span className="step-status">{status}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
