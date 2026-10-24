import { home } from '../copy/en'
import { KINDS } from '../logic/application'
import { StatusBadge } from '../ui/StatusBadge'
import type { Flow } from './useApplicationFlow'

/**
 * Everything in this part at a glance, by kind (changes GSA found, his choices, what he confirms):
 * what's done, what's in front of him now, and what comes after. Any of it opens in the top slot.
 */
export function StepOutline({ flow }: { flow: Flow }) {
  const { tasks } = flow.step
  if (!tasks.length) return null
  const done = tasks.filter((t) => t.status !== 'action_required').length
  return (
    <section className="outline" aria-labelledby="outline-title">
      <h3 id="outline-title" className="group-title">{home.outline(done, tasks.length)}</h3>
      {KINDS.map((kind) => {
        const ofKind = tasks.filter((t) => t.kind === kind)
        if (!ofKind.length) return null
        return (
          <div key={kind} className="outline-group" data-kind={kind}>
            <p className="outline-kind">
              <span aria-hidden="true" className="kind-mark" />
              {home.kind[kind]}
            </p>
            <ul className="outline-list">
              {ofKind.map((t) => {
                const now = t.id === flow.focus
                return (
                  <li key={t.id} data-status={t.status} data-now={now || undefined}>
                    {t.status === 'action_required' ? (
                      <span className="outline-mark" aria-hidden="true">{now ? '→' : '○'}</span>
                    ) : (
                      <StatusBadge status={t.status} iconOnly />
                    )}
                    <button type="button" className="row-title" aria-current={now ? 'true' : undefined} onClick={() => flow.show(t.id)}>
                      {flow.title(t.id)}
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
