import { en, steps as copy } from '../copy/en'
import { Icon } from '../ui/Icon'
import { Progress } from '../ui/Progress'
import { useApp } from './AppContext'
import { stepIcon } from './taskIcon'
import { stepMark, type StepId } from '../logic/application'
import type { Flow } from './useApplicationFlow'

const ICON = { done: 'complete', look: 'warning', error: 'error' } as const

/**
 * The parts of his application, generated around his farm: a part with nothing for his farm is left out.
 * The open part says what's left in it, and any part can be opened. On a phone it shrinks to where he is
 * and a bar. A part's mark comes from the same status signal as every screen: a tick when done, orange for
 * something to look at, red only for something wrong. Work not done yet stays neutral.
 */
export function Stepper({ flow, onStep = flow.goStep }: { flow: Flow; onStep?: (id: StepId) => void }) {
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
          const mark = stepMark(s, flow.step.id)
          // What's left is said for the part he is in; elsewhere only what to fix or look at.
          const status = current && s.id !== 'submit' ? copy.status(s.left) : mark === 'error' ? en.mark.error : mark === 'look' ? (s.waiting ? en.mark.waiting : en.mark.payment) : ''
          return (
            <li key={s.id} data-state={current ? 'current' : 'todo'} data-mark={mark}>
              <button type="button" aria-current={current ? 'step' : undefined} onClick={() => onStep(s.id)}>
                <span className="step-mark" aria-hidden="true">
                  <Icon name={mark === 'part' ? stepIcon(s.id) : ICON[mark]} />
                  <span className="sr-only">{i + 1}</span>
                </span>
                <span className="step-text">
                  <span className="step-name">{copy.name[s.id]}</span>
                  {status && <span className="step-status">{status}</span>}
                  {mark === 'done' && <span className="sr-only">{en.mark.done}</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
