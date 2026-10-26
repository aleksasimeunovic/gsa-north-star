import { home } from '../copy/en'
import { KINDS } from '../logic/application'
import { Icon } from '../ui/Icon'
import { Progress } from '../ui/Progress'
import { StatusBadge } from '../ui/StatusBadge'
import type { Flow } from './useApplicationFlow'

/**
 * Everything in this part at a glance, by kind (changes GSA found, his choices, what he confirms):
 * what's done, what's in front of him now, and what comes after. Any of it opens in the top slot.
 */
export function StepOutline({ flow }: { flow: Flow }) {
  const { tasks } = flow.step
  if (!tasks.length) return null
  const count = (status: string) => tasks.filter((t) => t.status === status).length
  return (
    <section className="step-outline" aria-labelledby="outline-title">
      <div className="outline-head">
        <h3 id="outline-title" className="group-title">{home.outline(count('action_required'))}</h3>
        <Progress value={tasks.length - count('action_required')} max={tasks.length} />
      </div>
      {KINDS.map((kind) => {
        const ofKind = tasks.filter((t) => t.kind === kind)
        if (!ofKind.length) return null
        return (
          <div key={kind} className="outline-group" data-kind={kind}>
            {kind !== 'change' && (
              <p className="outline-kind">
                <Icon name={kind} size="sm" />
                {home.kind[kind]}
              </p>
            )}
            <ul className="outline-list">
              {ofKind.map((t) => {
                const now = t.id === flow.focus
                return (
                  <li key={t.id} data-status={t.status} data-now={now || undefined}>
                    {/* One button per row, so the hover covers the mark and the name together. */}
                    <button type="button" className="outline-row" aria-current={now ? 'true' : undefined} onClick={() => flow.show(t.id)}>
                      {t.status === 'action_required' ? (
                        <span className="outline-mark">
                          <Icon name={now ? 'now' : 'todo'} size="sm" />
                        </span>
                      ) : (
                        <StatusBadge status={t.status} iconOnly />
                      )}
                      <span className="row-title">{flow.title(t.id)}</span>
                      {t.status === 'action_required' && <span className="visually-hidden">, {now ? home.now : home.todo}</span>}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
