import { steps, tasks } from '../copy/en'
import type { Step, Task, TaskId } from '../logic/application'
import { severityOf } from '../logic/severity'
import { Icon } from '../ui/Icon'
import { StatusBadge } from '../ui/StatusBadge'
import { useApp } from './AppContext'
import { Row } from './ReadinessDrawer'
import { taskSummary } from './TaskBodies'
import { stepIcon } from './taskIcon'
import { taskTitle } from './useApplicationFlow'

// What needs him first: what's wrong, then what's left, then what to look at; what's done comes after.
const ORDER = { error: 0, todo: 1, waiting: 2, payment: 2, done: 3 } as const

/**
 * His application part by part, as he is about to declare it. Each part says where it stands, then what he
 * still has to do there, said as the thing to do and leading to it, then what he declared. Nothing else on
 * the page repeats it.
 */
export function PartSummary({ onPick }: { onPick: (id: TaskId) => void }) {
  const { derived } = useApp()
  const parts = derived.list.steps.filter((s) => s.id !== 'submit')
  return (
    <div className="part-summaries">
      {parts.map((s) => (
        <Part key={s.id} step={s} onPick={onPick} />
      ))}
    </div>
  )
}

function Part({ step, onPick }: { step: Step; onPick: (id: TaskId) => void }) {
  const { derived, state } = useApp()
  const receiptsMissing = derived.items.some((i) => i.detail === 'receipts_missing')
  const sorted = [...step.tasks].sort((a, b) => ORDER[a.mark] - ORDER[b.mark])
  const unreadable = derived.items.some((i) => i.detail === 'receipts_unreadable')
  // What's left is said as the thing to do: the task's action, or the fix for what's wrong.
  const title = (t: Task) => {
    if (t.mark === 'error' && t.id === 'receipts' && unreadable) return tasks.unreadable.action
    if (t.mark === 'todo') return tasks.action[t.id] ?? taskTitle(t.id, receiptsMissing)
    return taskTitle(t.id, receiptsMissing)
  }
  return (
    <section className="part-summary" aria-labelledby={`part-${step.id}`}>
      <header className="part-summary-head">
        <span className="part-summary-icon" aria-hidden="true">
          <Icon name={stepIcon(step.id)} />
        </span>
        <h3 id={`part-${step.id}`}>{steps.name[step.id]}</h3>
        <PartState step={step} />
      </header>
      <ul className="drawer-list">
        {sorted.map((t) => {
          const severity = severityOf(t.mark)
          return (
            <Row
              key={t.id}
              severity={severity ?? 'done'}
              title={title(t)}
              hint={taskSummary(t.id, derived, state)}
              // What isn't done leads to where he finishes it; what's done leads to where he can change it.
              onClick={() => onPick(t.id)}
            />
          )
        })}
      </ul>
    </section>
  )
}

/** Where the part stands, in the same words and marks as the stepper. */
function PartState({ step }: { step: Step }) {
  if (step.errors) return <StatusBadge mark="error" />
  if (step.left) return <span className="part-summary-left">{steps.left(step.id, step.left)}</span>
  if (step.look) return <StatusBadge mark="waiting" />
  return <StatusBadge mark="done" />
}

