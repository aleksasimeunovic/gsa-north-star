import type { ReactNode, RefObject } from 'react'
import { en, steps } from '../copy/en'
import type { TaskId } from '../logic/application'
import type { Severity } from '../logic/readiness'
import { Drawer } from '../ui/Drawer'
import { Icon } from '../ui/Icon'
import { useApp } from './AppContext'
import { readinessCount } from './ReadinessBar'
import { taskSummary } from './TaskBodies'
import { taskTitle } from './useApplicationFlow'

const ICON = { error: 'error', todo: 'todo', look: 'warning', info: 'info' } as const

/**
 * Only what went wrong and what to look at, never the work he simply hasn't reached: what to fix (red),
 * then what he can submit with but should look at (a check, a lower payment). Each row takes him to the
 * place it is about.
 */
export function ReadinessDrawer({ open, onClose, onPick, returnFocusTo }: { open: boolean; onClose: () => void; onPick: (id: TaskId) => void; returnFocusTo: RefObject<HTMLElement> }) {
  const { derived } = useApp()
  return (
    <Drawer open={open} title={readinessCount(derived.report)} onClose={onClose} returnFocusTo={returnFocusTo}>
      <ActionPoints onPick={onPick} />
    </Drawer>
  )
}

/** The action points themselves: the same rows in the drawer and on Check and submit. */
export function ActionPoints({ onPick, todo }: { onPick: (id: TaskId) => void; todo?: boolean }) {
  const { derived, state } = useApp()
  const r = derived.report
  const receiptsMissing = derived.items.some((i) => i.detail === 'receipts_missing')
  const title = (id: TaskId) => taskTitle(id, receiptsMissing)
  return (
    <>
      {r.errors.length > 0 && (
        <Group severity="error">
          {r.errors.map((id) => (
            <Row key={id} severity="error" title={title(id)} hint={taskSummary(id, derived, state)} onClick={() => onPick(id)} />
          ))}
        </Group>
      )}
      {todo && <TodoPoints onPick={onPick} />}
      {r.warnings.length > 0 && (
        <Group severity="look">
          {r.warnings.map((w) => (
            <Row key={w.id} severity="look" title={title(w.id)} hint={taskSummary(w.id, derived, state)} onClick={() => onPick(w.id)} />
          ))}
        </Group>
      )}
    </>
  )
}

/**
 * On Check and submit, what's simply not done yet, one row per part, so "Not ready" never reads as if the one
 * thing to fix were all that's left. Neutral: work not done is not an error.
 */
function TodoPoints({ onPick }: { onPick: (id: TaskId) => void }) {
  const { derived } = useApp()
  const parts = derived.list.steps
    .map((s) => ({ s, todo: s.tasks.filter((t) => t.mark === 'todo') }))
    .filter((p) => p.s.id !== 'submit' && p.todo.length > 0)
  if (!parts.length) return null
  return (
    <Group severity="todo">
      {parts.map(({ s, todo }) => (
        <Row key={s.id} severity="todo" title={steps.name[s.id]} hint={steps.left(s.id, todo.length)} onClick={() => onPick(todo[0].id)} />
      ))}
    </Group>
  )
}

function Group({ severity, children }: { severity: Severity; children: ReactNode }) {
  return (
    <section className="drawer-group" data-severity={severity} aria-label={en.readiness.group[severity]}>
      <ul className="drawer-list">{children}</ul>
    </section>
  )
}

/** One thing in the drawer. A row that leads somewhere is one button with one hover, edge to edge. */
function Row({ severity, title, hint, onClick }: { severity: Severity; title: string; hint?: string; onClick?: () => void }) {
  const body = (
    <>
      {/* The kind (stops you, look at this, good to know) is the icon's tooltip; the shape and colour say it at a glance. */}
      <span className="drawer-mark" data-severity={severity} title={en.readiness.group[severity]}>
        <Icon name={ICON[severity]} />
        <span className="sr-only">{en.readiness.group[severity]}: </span>
      </span>
      <span className="drawer-text">
        <strong>{title}</strong>
        {hint && <span className="hint">{hint}</span>}
      </span>
      {onClick && <Icon name="disclose" />}
    </>
  )
  return <li>{onClick ? <button type="button" className="drawer-row" onClick={onClick}>{body}</button> : <div className="drawer-row" data-static>{body}</div>}</li>
}
