import { useId } from 'react'

/** Upload from computer or phone (the phone offers its camera). */
export function FileInput({ label, hint, onFile }: { label: string; hint?: string; onFile: (name: string) => void }) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">{label}</label>
      {hint && <span id={`${id}-hint`} className="hint">{hint}</span>}
      <input
        id={id}
        type="file"
        accept="image/*,application/pdf"
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f.name)
        }}
      />
    </div>
  )
}
