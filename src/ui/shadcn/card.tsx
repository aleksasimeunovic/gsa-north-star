import * as React from 'react'
import { cn } from '../../lib/utils'

// shadcn/ui Card (MIT), softened: larger radius, a quiet shadow on a warm page.
export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card" className={cn('bg-card text-card-foreground flex flex-col gap-5 rounded-2xl border p-6 shadow-card', className)} {...props} />
}
export function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-header" className={cn('flex flex-col gap-1.5', className)} {...props} />
}
export function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('flex flex-col gap-4', className)} {...props} />
}
