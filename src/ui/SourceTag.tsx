import type { Source } from '../logic/farm'
import { cn } from '../lib/utils'
import { Icon } from './Icon'

const ICON = { records: 'warning', confirmed: 'complete', checking: 'warning' } as const
const TONE: Record<Source, string> = { records: 'text-muted-foreground [&_svg]:text-warning', confirmed: 'text-success font-medium', checking: 'text-warning-text [&_svg]:text-warning' }

/** Where a fact stands: text plus an icon shape, never colour alone. */
export function SourceTag({ source, children }: { source: Source; children: string }) {
  return (
    <span className={cn('inline-flex items-center gap-[var(--space-1)] text-xs', TONE[source])}>
      <Icon name={ICON[source]} size="sm" /> {children}
    </span>
  )
}
