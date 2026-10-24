import type { Status } from '../logic/status'
import { en } from '../copy/en'
import { cn } from '../lib/utils'
import { Badge } from './shadcn/badge'
import { Icon } from './Icon'

const TONE = { complete: 'success', action_required: 'warning', awaiting_verification: 'info' } as const
const ICON_TONE = { complete: 'text-success', action_required: 'text-warning', awaiting_verification: 'text-info' }

// Text plus icon shape, never colour alone. iconOnly keeps the text for screen readers and as a tooltip.
export function StatusBadge({ status, iconOnly }: { status: Status; iconOnly?: boolean }) {
  if (iconOnly) {
    return (
      <span className={cn('inline-flex shrink-0', ICON_TONE[status])} title={en.status[status]}>
        <Icon name={status} />
        <span className="sr-only">{en.status[status]}</span>
      </span>
    )
  }
  return (
    <Badge variant={TONE[status]}>
      <Icon name={status} size="sm" /> {en.status[status]}
    </Badge>
  )
}
