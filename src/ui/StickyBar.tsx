import type { ReactNode } from 'react'

/** Always in reach at the bottom of the screen: back on the left, where he stands in the middle, forward on the right. */
export function StickyBar({ label, start, middle, end }: { label: string; start?: ReactNode; middle?: ReactNode; end?: ReactNode }) {
  return (
    <nav aria-label={label} className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 sm:flex-nowrap sm:py-3">
        <div className="order-1 w-full min-w-0 sm:order-2 sm:w-auto sm:flex-1">{middle}</div>
        {start && <div className="order-2 sm:order-1">{start}</div>}
        <div className="order-3 flex-1 sm:flex-none [&_button]:w-full sm:[&_button]:w-auto">{end}</div>
      </div>
    </nav>
  )
}
