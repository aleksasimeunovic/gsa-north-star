import type { Status } from '../logic/status'
import { en } from '../copy/en'

// Text plus icon shape, never colour alone. iconOnly keeps the text for screen readers and as a tooltip.
const SHAPE: Record<Status, string> = { complete: '✓', action_required: '!', awaiting_verification: '◷' }

export function StatusBadge({ status, iconOnly }: { status: Status; iconOnly?: boolean }) {
  if (iconOnly) {
    return (
      <span className="status" data-status={status} data-icon-only="true" title={en.status[status]}>
        <span aria-hidden="true" className="status-icon">{SHAPE[status]}</span>
        <span className="visually-hidden">{en.status[status]}</span>
      </span>
    )
  }
  return (
    <span className="status" data-status={status}>
      <span aria-hidden="true" className="status-icon">{SHAPE[status]}</span> {en.status[status]}
    </span>
  )
}
