import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { Button as Base } from './shadcn/button'
import { useDensity } from './Density'

type Variant = 'primary' | 'secondary' | 'link' | 'choice' | 'prototype' | 'ghost'
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

// Semantic variants mapped onto shadcn's. Density decides the size; every variant but link is the same height.
const MAP = { primary: 'default', secondary: 'outline', link: 'link', choice: 'outline', prototype: 'prototype', ghost: 'ghost' } as const

export const Button = forwardRef<HTMLButtonElement, Props>(function Button({ variant = 'secondary', type = 'button', className, ...rest }, ref) {
  const compact = useDensity() === 'compact'
  const size = variant === 'link' ? 'inline' : compact ? 'sm' : 'default'
  return (
    <Base
      ref={ref}
      type={type}
      variant={MAP[variant]}
      size={size}
      data-variant={variant}
      className={[variant === 'choice' ? 'justify-start text-left font-medium' : '', className].filter(Boolean).join(' ')}
      {...rest}
    />
  )
})
