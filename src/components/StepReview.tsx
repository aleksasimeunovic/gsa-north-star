import { en, steps as copy } from '../copy/en'
import type { IconName } from '../ui/Icon'

const ICON: Partial<Record<string, IconName>> = { error: 'error', look: 'warning', done: 'complete' }
import { Icon } from '../ui/Icon'
import { useApp } from './AppContext'
import { stepIcon } from './taskIcon'
import type { Flow } from './useApplicationFlow'

/** Every part of his application in one list, each with where it stands; a part with work left opens it. */
export function StepReview({ flow, title }: { flow: Flow; title: string }) {
  const { derived } = useApp()
  const parts = derived.list.steps.filter((s) => s.id !== 'submit')
  return (
    <section className="review-list" aria-labelledby="review-list-title">
      <h3 id="review-list-title" className="group-title">{title}</h3>
      <ul>
        {parts.map((s) => {
          // The same marks as the stepper: neutral for work left, red only for something to fix, orange to look at.
          const mark = s.errors ? 'error' : s.left ? 'todo' : s.look ? 'look' : 'done'
          return (
          <li key={s.id} data-mark={mark}>
            <button type="button" onClick={() => flow.goStep(s.id)}>
              <span className="review-icon"><Icon name={ICON[mark] ?? stepIcon(s.id)} /></span>
              <span className="review-text">
                <span className="review-name">{copy.name[s.id]}</span>
                <span className="review-status">{mark === 'error' ? en.mark.error : mark === 'look' ? (s.waiting ? en.mark.waiting : en.mark.payment) : copy.status(s.left)}</span>
              </span>
              <Icon name="disclose" />
            </button>
          </li>
          )
        })}
      </ul>
    </section>
  )
}
