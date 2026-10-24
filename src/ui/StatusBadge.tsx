import type { Status } from '../logic/status'
import { en } from '../copy/en'
import { Icon } from './Icon'

// Text plus icon shape, never colour alone. iconOnly keeps the text for screen readers and as a tooltip.
export function StatusBadge({ status, iconOnly }: { status: Status; iconOnly?: boolean }) {
  if (iconOnly) {
    return (
      <span className="status" data-status={status} data-icon-only="true" title={en.status[status]}>
        <Icon name={status} />
        <span className="visually-hidden">{en.status[status]}</span>
      </span>
    )
  }
  return (
    <span className="status" data-status={status}>
      <Icon name={status} size="sm" /> {en.status[status]}
    </span>
  )
}
