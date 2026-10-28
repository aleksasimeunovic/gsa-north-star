import type { ReactNode } from 'react'
import { Icon } from './Icon'

/** Something GSA knows, with where it comes from and when. What it means is said separately, if at all. */
export function Fact({ source, children }: { source: string; children: ReactNode }) {
  return (
    <p className="flex flex-col gap-1">
      <span>{children}</span>
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icon name="records" size="sm" /> {source}
      </span>
    </p>
  )
}

/** Plain questions, each with its plain answer: for a state he needs to understand at a glance. */
export function Answers({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid gap-3 rounded-xl border p-4">
      {items.map(([q, a]) => (
        <div key={q} className="grid gap-0.5">
          <dt className="text-sm text-muted-foreground">{q}</dt>
          <dd className="font-medium">{a}</dd>
        </div>
      ))}
    </dl>
  )
}
