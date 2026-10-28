import * as React from 'react'
import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '../../lib/utils'

// shadcn/ui Progress (MIT).
export function Progress({ className, value, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root data-slot="progress" className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-border', className)} {...props}>
      <ProgressPrimitive.Indicator className="h-full w-full flex-1 rounded-full bg-muted-foreground transition-transform duration-500" style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
    </ProgressPrimitive.Root>
  )
}
