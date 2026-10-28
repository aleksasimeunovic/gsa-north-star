import type { ElementType, ReactNode } from 'react'
import { cn } from '../lib/utils'

// sm and md for items, group for groups in a block, section for the parts of a task (map, what GSA reads, the action).
const GAP = { sm: 'gap-2', md: 'gap-4', lg: 'gap-8', group: 'gap-[var(--gap-group)]', section: 'gap-[var(--gap-section)]' }

export function Stack({ gap = 'md', as: As = 'div', children }: { gap?: keyof typeof GAP; as?: ElementType; children: ReactNode }) {
  return <As className={cn('flex flex-col', GAP[gap])}>{children}</As>
}

export function Inline({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
}

const TEXT = { body: '', secondary: 'text-muted-foreground', small: 'text-sm text-muted-foreground', strong: 'font-semibold' }

export function Text({ variant = 'body', as: As = 'p', children }: { variant?: 'body' | 'secondary' | 'small' | 'strong'; as?: ElementType; children: ReactNode }) {
  return <As className={TEXT[variant]}>{children}</As>
}

export function VisuallyHidden({ as: As = 'span', children }: { as?: ElementType; children: ReactNode }) {
  return <As className="sr-only">{children}</As>
}

/** Two values side by side, both kept (record vs his answer). */
export function Compare({ items, long }: { items: { label: string; value: ReactNode }[]; long?: boolean }) {
  // Long values (account numbers) stack on a phone, so each reads on one line.
  return (
    <dl className={cn('grid gap-2', long ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2')}>
      {items.map((i) => (
        <div key={i.label} className="rounded-xl bg-muted px-4 py-3">
          <dt className="text-sm text-muted-foreground">{i.label}</dt>
          <dd className="text-2xl font-semibold tracking-tight [&_p]:text-sm [&_p]:font-normal">{i.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Facts as label and value rows, like a confirmation card. */
export function KeyValues({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y rounded-xl border">
      {items.map((i) => (
        <div key={i.label} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5 px-4 py-3">
          <dt className="text-sm text-muted-foreground">{i.label}</dt>
          <dd className="font-medium">{i.value}</dd>
        </div>
      ))}
    </dl>
  )
}
