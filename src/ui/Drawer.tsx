import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { ui } from '../copy/en'
import { Button } from './Button'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  returnFocusTo: RefObject<HTMLElement>
  children: ReactNode
}

// Non-modal: no focus trap. Esc closes and focus returns to the opener.
export function Drawer({ open, title, onClose, returnFocusTo, children }: Props) {
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
    <section className="drawer" role="dialog" aria-modal="false" aria-labelledby="drawer-title">
      <div className="drawer-head">
        <h2 id="drawer-title" ref={headingRef} tabIndex={-1}>{title}</h2>
        <Button onClick={onClose}>{ui.close}</Button>
      </div>
      {children}
    </section>
  )
}
