import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'

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
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">{label}</label>
      {hint && <span id={`${id}-hint`} className="hint">{hint}</span>}
      {error && <span id={`${id}-error`} className="error" role="alert">{error}</span>}
      {props.multiline ? (
        <textarea {...strip(props)} id={id} aria-describedby={describedBy} aria-invalid={!!error || undefined} />
      ) : (
        <input {...strip(props)} id={id} aria-describedby={describedBy} aria-invalid={!!error || undefined} />
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function strip({ label: _l, hint: _h, error: _e, multiline: _m, ...rest }: any) {
  return rest
}
