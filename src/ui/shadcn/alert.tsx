import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

// shadcn/ui Alert (MIT), with the app's tones.
const alertVariants = cva('relative w-full rounded-xl border px-4 py-3 text-sm flex flex-col gap-1', {
  variants: {
    variant: {
      default: 'bg-card text-card-foreground',
      success: 'bg-success-surface border-transparent text-foreground',
      warning: 'bg-warning-surface border-warning-border text-foreground',
      info: 'bg-info-surface border-info-border text-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
})

export function Alert({ className, variant, ...props }: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}
