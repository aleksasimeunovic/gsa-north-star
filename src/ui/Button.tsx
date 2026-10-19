import type { ButtonHTMLAttributes } from 'react'
import { useDensity } from './Density'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'link' }

export function Button({ variant = 'secondary', type = 'button', ...rest }: Props) {
  return <button type={type} data-variant={variant} data-density={useDensity()} className="btn" {...rest} />
}
