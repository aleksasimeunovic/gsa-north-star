import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'
import { en } from '../copy/en'
import { cn } from '../lib/utils'
import { Button } from './Button'
import { Icon } from './Icon'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  returnFocusTo: RefObject<HTMLElement>
  children: ReactNode
  /** prototype: clearly outside GSA. */
  variant?: 'default' | 'prototype'
}

// A sheet from the right. Non-modal: no focus trap. Esc closes and focus returns to the opener.
export function Drawer({ open, title, onClose, returnFocusTo, children, variant = 'default' }: Props) {
  const titleId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const wasOpen = useRef(false)

  useEffect(() => {
    if (open) headingRef.current?.focus()
    else if (wasOpen.current) returnFocusTo.current?.focus()
    wasOpen.current = open
  }, [open, returnFocusTo])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className={cn(
        'fixed inset-y-0 right-0 z-40 flex w-[min(440px,100vw)] flex-col gap-4 overflow-y-auto border-l bg-popover px-6 pb-32 shadow-2xl',
        variant === 'prototype' && 'border-l-2 border-dashed border-meta',
      )}
    >
      <div className="sticky top-0 z-10 -mx-6 flex items-center justify-between gap-2 border-b bg-popover px-6 py-4">
        <h2 id={titleId} ref={headingRef} tabIndex={-1} className="text-xl">{title}</h2>
        <Button variant="ghost" onClick={onClose} aria-label={en.close}>
          <Icon name="close" />
        </Button>
      </div>
      {children}
    </section>
  )
}
