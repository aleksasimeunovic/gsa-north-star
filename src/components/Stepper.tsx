import { steps as copy } from '../copy/en'
import { Icon } from '../ui/Icon'
import { Progress } from '../ui/Progress'
import { useApp } from './AppContext'
import { stepIcon } from './taskIcon'
import type { Flow } from './useApplicationFlow'

/**
 * The parts of his application, generated around his farm: a part with nothing for his farm is left out.
 * Each says what's left in it, and any part can be opened. On a phone it shrinks to where he is and a bar.
 */
export function Stepper({ flow }: { flow: Flow }) {
  const { derived } = useApp()
  const list = derived.list.steps
  const at = flow.index + 1
  const part = flow.step
  return (
    <nav aria-label={copy.label} className="stepper">
      {/* On a phone: the part he is in and how far along it he is. */}
      <p className="stepper-compact" aria-hidden="true">
        <strong>{copy.name[part.id]}</strong> <span>{part.id === 'submit' ? copy.of(at, list.length) : copy.status(part.left)}</span>
      </p>
      <div className="stepper-bar">
        {part.id === 'submit' ? <Progress value={at} max={list.length} /> : <Progress value={part.tasks.length - part.left} max={part.tasks.length} />}
      </div>
      <ol>
        {list.map((s, i) => {
          const current = s.id === flow.step.id
          const done = s.id !== 'submit' && s.left === 0
          const status = s.id === 'submit' ? '' : copy.status(s.left)
          return (
            <li key={s.id} data-state={current ? 'current' : done ? 'done' : 'todo'}>
              <button type="button" aria-current={current ? 'step' : undefined} onClick={() => flow.goStep(s.id)}>
                <span className="step-mark" aria-hidden="true">{done ? <Icon name="check" /> : <Icon name={stepIcon(s.id)} />}
                  <span className="sr-only">{i + 1}</span></span>
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
