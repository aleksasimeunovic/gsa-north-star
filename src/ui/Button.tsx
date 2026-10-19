import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { useDensity } from './Density'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'link' | 'prototype' }

export const Button = forwardRef<HTMLButtonElement, Props>(function Button({ variant = 'secondary', type = 'button', ...rest }, ref) {
  return <button ref={ref} type={type} data-variant={variant} data-density={useDensity()} className="btn" {...rest} />
})
