import type { ElementType, ReactNode } from 'react'
import { cn } from '../lib/utils'

// By relation (index.css): text, sm (inline), item, md and group, lg and section. Never a bare number.
const GAP = {
  text: 'gap-[var(--gap-text)]',
  sm: 'gap-[var(--gap-inline)]',
  item: 'gap-[var(--gap-item)]',
  md: 'gap-[var(--gap-group)]',
  group: 'gap-[var(--gap-group)]',
  lg: 'gap-[var(--gap-section)]',
  section: 'gap-[var(--gap-section)]',
}

export function Stack({ gap = 'md', as: As = 'div', children }: { gap?: keyof typeof GAP; as?: ElementType; children: ReactNode }) {
  return <As className={cn('flex flex-col', GAP[gap])}>{children}</As>
}

export function Inline({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-[var(--gap-inline)]">{children}</div>
}

const TEXT = { body: '', secondary: 'text-muted-foreground', small: 'text-sm text-muted-foreground', strong: 'font-semibold' }

export function Text({ variant = 'body', as: As = 'p', children }: { variant?: 'body' | 'secondary' | 'small' | 'strong'; as?: ElementType; children: ReactNode }) {
  return <As className={TEXT[variant]}>{children}</As>
}

export function VisuallyHidden({ as: As = 'span', children }: { as?: ElementType; children: ReactNode }) {
  return <As className="sr-only">{children}</As>
}

/** Two values side by side, both kept (record vs his answer). */
export function Compare({ items }: { items: { label: string; value: ReactNode }[] }) {
  // One under the other, so the two values read as a before and after (last year, then the registry today).
  return (
    <dl className="grid grid-cols-1 gap-[var(--gap-inline)]">
      {items.map((i) => (
        <div key={i.label} className="rounded-xl bg-muted px-4 py-3">
          <dt className="text-sm text-muted-foreground">{i.label}</dt>
          <dd className="text-lg leading-snug font-semibold [&_p]:text-sm [&_p]:font-normal">{i.value}</dd>
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
