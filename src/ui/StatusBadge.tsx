import type { Mark } from '../logic/severity'
import { en } from '../copy/en'
import { cn } from '../lib/utils'
import { Badge } from './shadcn/badge'
import { Icon, type IconName } from './Icon'

// One warning sign, always orange: still to confirm or do, or something to look at; the words say which.
// Done is a green tick, red is an error.
export const MARK_ICON: Record<Mark, IconName> = { done: 'complete', todo: 'warning', waiting: 'warning', error: 'error' }
const TONE = { done: 'success', todo: 'outline', waiting: 'warning', error: 'error' } as const
const ICON_TONE: Record<Mark, string> = { done: 'text-success', todo: 'text-warning', waiting: 'text-warning', error: 'text-error' }

// Text plus icon shape, never colour alone. iconOnly keeps the text for screen readers and as a tooltip.
export function StatusBadge({ mark, iconOnly }: { mark: Mark; iconOnly?: boolean }) {
  if (iconOnly) {
    return (
      <span className={cn('inline-flex shrink-0', ICON_TONE[mark])} title={en.mark[mark]}>
        <Icon name={MARK_ICON[mark]} />
        <span className="sr-only">{en.mark[mark]}</span>
      </span>
    )
  }
  return (
    <Badge variant={TONE[mark]}>
      <Icon name={MARK_ICON[mark]} size="sm" /> {en.mark[mark]}
    </Badge>
  )
}
