import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

// shadcn/ui Button (MIT), with a taller comfortable size for Milan.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-normal text-center rounded-lg text-sm font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:border-ring",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover',
        outline: 'border border-input bg-card shadow-xs hover:bg-accent hover:text-accent-foreground hover:border-ring/50',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground justify-start text-left px-1',
        prototype: 'border border-dashed border-meta bg-meta-surface text-meta',
      },
      size: {
        default: 'min-h-[var(--control-h)] px-5 text-base',
        sm: 'min-h-9 px-3',
        lg: 'min-h-14 px-6 text-base rounded-xl',
        icon: 'size-11',
        inline: 'min-h-0 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export const Button = React.forwardRef<HTMLButtonElement, React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }>(
  function Button({ className, variant, size, asChild = false, ...props }, ref) {
    const Comp = asChild ? Slot : 'button'
    return <Comp ref={ref} data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
  },
)
