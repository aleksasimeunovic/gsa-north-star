import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from './Button'
import { Icon } from './Icon'

interface Props {
  open: boolean
  title: string
  children?: ReactNode
  confirm: string
  cancel: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Asked before something is deleted. The browser's own dialog: Esc closes it, focus stays inside while it is
 * open and returns to the button that opened it. Focus starts on the way out, so Enter never deletes by accident.
 */
export function ConfirmDialog({ open, title, children, confirm, cancel, onConfirm, onCancel }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      className="confirm-dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onCancel()
      }}
      onClick={(e) => e.target === ref.current && onCancel()}
    >
      {open && (
        <div className="confirm-dialog-body">
          <h2 id={titleId}>{title}</h2>
          {children}
          <div className="confirm-dialog-actions">
            <Button autoFocus onClick={onCancel}>{cancel}</Button>
            <Button variant="destructive" onClick={onConfirm}>
              <Icon name="delete" size="sm" />
              {confirm}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  )
}
