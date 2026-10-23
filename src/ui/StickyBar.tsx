import type { ReactNode } from 'react'

/** Always in reach at the bottom of the screen: back on the left, where he stands in the middle, forward on the right. */
export function StickyBar({ label, start, middle, end }: { label: string; start?: ReactNode; middle?: ReactNode; end?: ReactNode }) {
  return (
    <nav className="sticky-bar" aria-label={label}>
      <div className="sticky-bar-inner">
        <div className="sticky-bar-start">{start}</div>
        <div className="sticky-bar-middle">{middle}</div>
        <div className="sticky-bar-end">{end}</div>
      </div>
    </nav>
  )
}
