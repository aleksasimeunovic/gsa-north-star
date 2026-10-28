import type { Source } from '../logic/farm'
import { cn } from '../lib/utils'
import { Icon } from './Icon'

const ICON = { records: 'records', confirmed: 'complete', checking: 'awaiting_verification' } as const
const TONE: Record<Source, string> = { records: 'text-muted-foreground', confirmed: 'text-success font-medium', checking: 'text-warning-text' }

/** Where a fact comes from: text plus an icon shape, never colour alone. */
export function SourceTag({ source, children }: { source: Source; children: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', TONE[source])}>
      <Icon name={ICON[source]} size="sm" /> {children}
    </span>
  )
}
