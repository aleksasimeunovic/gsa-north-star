import { steps as copy } from '../copy/en'
import { useApp } from './AppContext'
import type { Flow } from './useApplicationFlow'

/**
 * The parts of his application, generated around his farm: a part with nothing for his farm is left out.
 * Each says whether it is done or how much is left, and any part can be opened.
 */
export function Stepper({ flow }: { flow: Flow }) {
  const { derived } = useApp()
  const list = derived.list.steps
  return (
    <nav aria-label={copy.label} className="stepper">
      <ol>
        {list.map((s, i) => {
          const current = s.id === flow.step.id
          const done = s.id !== 'submit' && s.left === 0
          return (
            <li key={s.id} data-state={current ? 'current' : done ? 'done' : 'todo'}>
              <button type="button" aria-current={current ? 'step' : undefined} onClick={() => flow.goStep(s.id)}>
                <span className="step-mark" aria-hidden="true">{done && !current ? '✓' : i + 1}</span>
                <span className="step-name">{copy.name[s.id]}</span>
                <span className="visually-hidden">
                  {', '}
                  {s.id === 'submit' ? '' : done ? copy.done : copy.left(s.left)}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
