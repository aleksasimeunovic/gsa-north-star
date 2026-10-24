import { steps as copy } from '../copy/en'
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
        {parts.map((s) => (
          <li key={s.id} data-state={s.left ? 'todo' : 'done'}>
            <button type="button" onClick={() => flow.goStep(s.id)}>
              <span className="review-icon"><Icon name={s.left ? stepIcon(s.id) : 'check'} /></span>
              <span className="review-text">
                <span className="review-name">{copy.name[s.id]}</span>
                <span className="review-status">{copy.status(s.left, s.waiting)}</span>
              </span>
              <Icon name="disclose" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
