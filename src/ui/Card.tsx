import type { ReactNode } from 'react'
import type { Status } from '../logic/status'
import { cn } from '../lib/utils'
import { Card as Base } from './shadcn/card'
import { useDensity } from './Density'
import { StatusBadge } from './StatusBadge'

interface Props {
  id?: string
  title: string
  status?: Status
  headingLevel?: 2 | 3
  /** Low: a supporting block, its title at body size (the estimate is never the hero). */
  emphasis?: 'normal' | 'low'
  children: ReactNode
}

export function Card({ id, title, status, headingLevel = 3, emphasis = 'normal', children }: Props) {
  const H = `h${headingLevel}` as const
  const headingId = id ? `${id}-title` : undefined
  const compact = useDensity() === 'compact'
  return (
    <section id={id} tabIndex={-1} aria-labelledby={headingId} className="scroll-mt-40">
      <Base className={cn(compact && 'gap-3 p-4 rounded-xl')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <H id={headingId} className={cn(emphasis === 'low' ? 'text-base' : 'text-lg')}>{title}</H>
          {status && <StatusBadge status={status} />}
        </div>
        <div className="flex flex-col gap-3">{children}</div>
      </Base>
    </section>
  )
}
