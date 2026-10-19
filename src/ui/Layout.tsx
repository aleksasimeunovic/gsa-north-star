import type { ElementType, ReactNode } from 'react'

export function Stack({ gap = 'md', as: As = 'div', children }: { gap?: 'sm' | 'md' | 'lg'; as?: ElementType; children: ReactNode }) {
  return <As className="stack" data-gap={gap}>{children}</As>
}

export function Inline({ children }: { children: ReactNode }) {
  return <div className="inline">{children}</div>
}

export function Text({ variant = 'body', as: As = 'p', children }: { variant?: 'body' | 'secondary' | 'small' | 'strong'; as?: ElementType; children: ReactNode }) {
  return <As className="text" data-variant={variant}>{children}</As>
}

export function VisuallyHidden({ as: As = 'span', children }: { as?: ElementType; children: ReactNode }) {
  return <As className="visually-hidden">{children}</As>
}

/** Two values side by side, both kept (record vs his answer). */
export function Compare({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="compare">
      {items.map((i) => (
        <div key={i.label}>
          <dt>{i.label}</dt>
          <dd>{i.value}</dd>
        </div>
      ))}
    </dl>
  )
}
