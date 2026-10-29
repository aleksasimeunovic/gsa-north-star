import { home } from '../copy/en'
import { Icon } from '../ui/Icon'
import { Progress } from '../ui/Progress'
import { StatusBadge } from '../ui/StatusBadge'
import type { Flow } from './useApplicationFlow'

/**
 * Everything in this part at a glance, in order (changes GSA found come first, since they shape the rest):
 * what's done, what's in front of him now, and what comes after. Any of it opens in the top slot.
 */
export function StepOutline({ flow }: { flow: Flow }) {
  const { tasks } = flow.step
  if (!tasks.length) return null
  const count = (status: string) => tasks.filter((t) => t.status === status).length
  return (
    <section className="step-outline" aria-labelledby="outline-title">
      <div className="outline-head">
        <h3 id="outline-title" className="group-title">{home.outline(tasks.length - count('action_required'), tasks.length)}</h3>
        <div className="outline-progress">
          <Progress value={tasks.length - count('action_required')} max={tasks.length} />
        </div>
      </div>
      <ul className="outline-list">
        {tasks.map((t) => {
          const now = t.id === flow.focus
          return (
            <li key={t.id} data-mark={t.mark} data-now={now || undefined}>
              {/* One button per row, so the hover covers the mark and the name together. */}
              <button type="button" className="outline-row" aria-current={now ? 'true' : undefined} onClick={() => flow.show(t.id)}>
                {now ? (
                  <span className="outline-mark">
                    <Icon name="now" size="sm" />
                  </span>
                ) : (
                  <StatusBadge mark={t.mark} iconOnly />
                )}
                <span className="row-title">{flow.title(t.id)}</span>
                {now && <span className="row-now">{home.now}</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
