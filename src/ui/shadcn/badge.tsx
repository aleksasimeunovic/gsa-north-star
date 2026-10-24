import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

// shadcn/ui Badge (MIT), with status tones. Status is always text plus an icon, never colour alone.
export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        outline: 'border-border text-foreground bg-card',
        success: 'border-transparent bg-success-surface text-success',
        warning: 'border-warning-border bg-warning-surface text-warning-text [&_svg]:text-warning',
        info: 'border-info-border bg-info-surface text-info',
        meta: 'border-dashed border-meta bg-meta-surface text-meta',
      },
    },
    defaultVariants: { variant: 'outline' },
  },
)

export function Badge({ className, variant, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}
