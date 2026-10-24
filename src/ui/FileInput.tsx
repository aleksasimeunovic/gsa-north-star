import { useId } from 'react'
import { Icon } from './Icon'

/** Upload from computer or phone (the phone offers its camera), as a drop area. */
export function FileInput({ label, hint, onFile }: { label: string; hint?: string; onFile: (name: string) => void }) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-input bg-muted/60 px-4 py-6 text-center transition-colors hover:border-ring hover:bg-accent/50 focus-within:ring-[3px] focus-within:ring-ring/40"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-card text-primary shadow-xs">
        <Icon name="upload" />
      </span>
      <span className="font-medium">{label}</span>
      {hint && <span id={`${id}-hint`} className="text-sm text-muted-foreground">{hint}</span>}
      <input
        id={id}
        type="file"
        accept="image/*,application/pdf"
        className="sr-only"
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f.name)
        }}
      />
    </label>
  )
}
