import type { Source } from '../logic/farm'
import { cn } from '../lib/utils'
import { Icon } from './Icon'

const ICON = { records: 'todo', confirmed: 'complete', checking: 'awaiting_verification' } as const
const TONE: Record<Source, string> = { records: 'text-muted-foreground', confirmed: 'text-success font-medium', checking: 'text-warning-text' }
const MARK_TONE: Record<Source, string> = { records: 'text-muted-foreground', confirmed: 'text-success', checking: 'text-warning' }

/** Where a fact stands: text plus an icon shape, never colour alone. */
export function SourceTag({ source, children }: { source: Source; children: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', TONE[source])}>
      <Icon name={ICON[source]} size="sm" /> {children}
    </span>
  )
}

/** The same state as a mark that leads a row, so a list can be scanned down its left edge. */
export function SourceMark({ source }: { source: Source }) {
  return (
    <span className={cn('inline-flex shrink-0', MARK_TONE[source])}>
      <Icon name={ICON[source]} />
    </span>
  )
}
