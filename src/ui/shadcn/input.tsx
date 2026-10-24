import * as React from 'react'
import { cn } from '../../lib/utils'

const field =
  'w-full min-w-0 rounded-lg border border-input bg-card px-3 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20'

// shadcn/ui Input and Textarea (MIT).
export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input data-slot="input" className={cn(field, 'min-h-[var(--control-h)] py-2 file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent-foreground', className)} {...props} />
}
export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea data-slot="textarea" className={cn(field, 'min-h-24 py-3', className)} {...props} />
}
export function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return <select data-slot="select" className={cn(field, 'min-h-[var(--control-h)] py-2 cursor-pointer', className)} {...props} />
}
