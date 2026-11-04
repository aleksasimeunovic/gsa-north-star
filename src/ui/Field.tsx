import { useEffect, useId, useRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../lib/utils'
import { Input, Textarea } from './shadcn/input'
import { Label } from './shadcn/label'
import { Icon } from './Icon'

interface Common {
  label: string
  hint?: string
  error?: string
}

type InputProps = Common & InputHTMLAttributes<HTMLInputElement> & { multiline?: false }
type TextareaProps = Common & TextareaHTMLAttributes<HTMLTextAreaElement> & { multiline: true }

export function Field(props: InputProps | TextareaProps) {
  const id = useId()
  const { label, hint, error } = props
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  // When an error appears, focus goes to the field, so he can fix it straight away.
  const wrap = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (error) wrap.current?.querySelector<HTMLElement>('input, textarea')?.focus()
  }, [error])
  return (
    <div ref={wrap} className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-base">{label}</Label>
      {hint && <span id={`${id}-hint`} className="text-sm text-muted-foreground">{hint}</span>}
      {error && (
        <span id={`${id}-error`} className="flex items-center gap-1.5 text-sm font-medium text-destructive" role="alert">
          <Icon name="error" size="sm" />
          {error}
        </span>
      )}
      {props.multiline ? (
        <Textarea {...strip(props)} id={id} aria-describedby={describedBy} aria-invalid={!!error || undefined} />
      ) : (
        <Input
          {...strip(props)}
          id={id}
          aria-describedby={describedBy}
          aria-invalid={!!error || undefined}
          className={cn(props.inputMode === 'numeric' && 'max-w-48')}
        />
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function strip({ label: _l, hint: _h, error: _e, multiline: _m, ...rest }: any) {
  return rest
}
