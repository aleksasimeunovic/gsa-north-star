import type { RefObject } from 'react'
import { readinessCopy as copy } from '../copy/en'
import type { Task, TaskId } from '../logic/application'
import { Button } from '../ui/Button'
import { Drawer } from '../ui/Drawer'
import { Text } from '../ui/Layout'
import { Note } from '../ui/Note'
import { StatusBadge } from '../ui/StatusBadge'
import { useApp } from './AppContext'
import { readinessHeadline } from './ReadinessBar'
import { taskSummary } from './TaskBodies'
import { taskTitle } from './useApplicationFlow'

/**
 * Everything in his application by status, each one a step away: what needs him and why,
 * what waits for a check (and that it doesn't block), and what's done, so a mistake is easy to go back to.
 */
export function ReadinessDrawer({ open, onClose, onPick, returnFocusTo }: { open: boolean; onClose: () => void; onPick: (id: TaskId) => void; returnFocusTo: RefObject<HTMLElement> }) {
  const { derived, state } = useApp()
  const { list } = derived
  const receiptsMissing = derived.items.some((i) => i.detail === 'receipts_missing')
  const group = (title: string, tasks: Task[], action: string, note?: string) =>
    tasks.length > 0 && (
      <section className="drawer-group">
        <h3 className="group-title">{title}</h3>
        {note && (
          <Text variant="small">
            {note} <Note kind="assumption" />
          </Text>
        )}
        <ul className="drawer-list">
          {tasks.map((t) => (
            <li key={t.id}>
              <StatusBadge status={t.status} iconOnly />
              <div>
                <strong>{taskTitle(t.id, receiptsMissing)}</strong>
                <span className="hint">{taskSummary(t.id, derived, state)}</span>
              </div>
              <Button variant="link" onClick={() => onPick(t.id)}>
                {action}
                <span className="visually-hidden">: {taskTitle(t.id, receiptsMissing)}</span>
              </Button>
            </li>
          ))}
        </ul>
      </section>
    )
  return (
    <Drawer open={open} title={readinessHeadline(derived)} onClose={onClose} returnFocusTo={returnFocusTo}>
      {group(copy.needs(list.todo.length), list.todo, copy.open)}
      {group(copy.waiting(list.waiting.length), list.waiting, copy.open, copy.waitingNote)}
      {group(copy.done(list.done.length), list.done, copy.change)}
    </Drawer>
  )
}
