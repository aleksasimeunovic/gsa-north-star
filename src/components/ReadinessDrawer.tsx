import type { RefObject } from 'react'
import type { Task, TaskId } from '../logic/application'
import { Drawer } from '../ui/Drawer'
import { Icon } from '../ui/Icon'
import { StatusBadge } from '../ui/StatusBadge'
import { useApp } from './AppContext'
import { readinessHeadline } from './ReadinessBar'
import { taskSummary } from './TaskBodies'
import { taskTitle } from './useApplicationFlow'

/**
 * Only what still needs him, each one a step away. Done work and work waiting for a check stay out:
 * they ask nothing of him.
 */
export function ReadinessDrawer({ open, onClose, onPick, returnFocusTo }: { open: boolean; onClose: () => void; onPick: (id: TaskId) => void; returnFocusTo: RefObject<HTMLElement> }) {
  const { derived, state } = useApp()
  const { list } = derived
  const receiptsMissing = derived.items.some((i) => i.detail === 'receipts_missing')
  return (
    <Drawer open={open} title={readinessHeadline(derived)} onClose={onClose} returnFocusTo={returnFocusTo}>
      <ul className="drawer-list">
        {list.todo.map((t: Task) => (
          <li key={t.id}>
            <button type="button" className="drawer-row" onClick={() => onPick(t.id)}>
              <StatusBadge status={t.status} iconOnly />
              <span>
                <strong>{taskTitle(t.id, receiptsMissing)}</strong>
                <span className="hint">{taskSummary(t.id, derived, state)}</span>
              </span>
              <Icon name="disclose" />
            </button>
          </li>
        ))}
      </ul>
    </Drawer>
  )
}
