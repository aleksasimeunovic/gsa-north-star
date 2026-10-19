import type { Status } from '../logic/status'
import { en } from '../copy/en'

// Text plus icon shape, never colour alone.
const SHAPE: Record<Status, string> = { complete: '✓', action_required: '!', awaiting_verification: '◷' }

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className="status" data-status={status}>
      <span aria-hidden="true" className="status-icon">{SHAPE[status]}</span> {en.status[status]}
    </span>
  )
}
