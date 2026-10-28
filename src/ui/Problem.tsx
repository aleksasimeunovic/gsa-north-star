import type { ReactNode } from 'react'
import { Icon } from './Icon'

/** Something wrong he must fix, said in place: red, always with a cross and words. */
export function Problem({ children }: { children: ReactNode }) {
  return (
    <span className="mt-1 flex items-start gap-1.5 text-sm font-medium text-error">
      <Icon name="error" size="sm" className="mt-0.5" />
      <span>{children}</span>
    </span>
  )
}
