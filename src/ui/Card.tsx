import type { ReactNode } from 'react'
import type { Status } from '../logic/status'
import { useDensity } from './Density'
import { StatusBadge } from './StatusBadge'

interface Props {
  id?: string
  title: string
  status?: Status
  headingLevel?: 2 | 3
  children: ReactNode
}

export function Card({ id, title, status, headingLevel = 3, children }: Props) {
  const H = `h${headingLevel}` as const
  const headingId = id ? `${id}-title` : undefined
  return (
    <section id={id} tabIndex={-1} className="card" data-density={useDensity()} aria-labelledby={headingId}>
      <div className="card-head">
        <H id={headingId} className="card-title">{title}</H>
        {status && <StatusBadge status={status} />}
      </div>
      {children}
    </section>
  )
}
