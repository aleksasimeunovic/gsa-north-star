import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { tasks } from '../copy/en'

/** 18 digits as the bank writes them: 3, 13, 2. */
export const formatAccount = (n: string) => {
  const d = n.replace(/\D/g, '')
  return d.length === 18 ? `${d.slice(0, 3)}-${d.slice(3, 16)}-${d.slice(16)}` : n
}

/**
 * An account number, hidden to its last four digits until he asks to see it whole with the eye. Hidden, each
 * digit keeps its place under a dot, so the number is as long either way and the eye never moves.
 */
export function Account({ number }: { number: string }) {
  const [shown, setShown] = useState(false)
  const digits = number.replace(/\D/g, '')
  const label = shown ? tasks.bank.hide : tasks.bank.show
  const Eyes = shown ? EyeOff : Eye
  const whole = formatAccount(number)
  let left = digits.length - 4
  return (
    <span className="inline-flex max-w-full items-center gap-x-[var(--gap-inline)] tabular-nums">
      <span className="min-w-0 shrink" aria-hidden="true">
        {whole.split(/(?<=-)/).map((group, g) => (
          // Groups break between them first; on a narrow phone a long group breaks too, the same hidden or shown.
          <span key={g} className="break-all">
            {[...group].map((c, i) => {
              const hide = /\d/.test(c) && left-- > 0 && !shown
              return hide ? (
                <span key={i} className="account-mask">{c}</span>
              ) : (
                <span key={i}>{c}</span>
              )
            })}
          </span>
        ))}
      </span>
      <span className="sr-only">{shown ? whole : tasks.bank.ending(digits.slice(-4))}</span>
      <button
        type="button"
        className="inline-flex size-9 flex-none items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[var(--hover)] hover:text-foreground focus-visible:outline-2 focus-visible:outline-[var(--ring)] [@media(pointer:coarse)]:size-11"
        aria-label={label}
        aria-pressed={shown}
        title={label}
        onClick={() => setShown(!shown)}
      >
        <Eyes size={18} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </span>
  )
}
