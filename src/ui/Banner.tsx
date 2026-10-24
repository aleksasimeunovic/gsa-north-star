import type { ReactNode } from 'react'
import { Alert } from './shadcn/alert'

// tone is semantic; the theme decides how it looks.
export function Banner({ tone = 'info', children }: { tone?: 'info' | 'success' | 'attention'; children: ReactNode }) {
  return <Alert variant={tone === 'attention' ? 'warning' : tone === 'success' ? 'success' : 'default'}>{children}</Alert>
}
