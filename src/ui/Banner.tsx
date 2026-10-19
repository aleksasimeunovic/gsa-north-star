import type { ReactNode } from 'react'

// tone is semantic; the design system decides how it looks.
export function Banner({ tone = 'info', children }: { tone?: 'info' | 'success' | 'attention'; children: ReactNode }) {
  return <div className="banner" data-tone={tone}>{children}</div>
}
