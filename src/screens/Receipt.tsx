import { useState } from 'react'
import { finish, formatDateYear, formatTime } from '../copy/en'
import { useApp } from '../components/AppContext'
import { taskSummary } from '../components/TaskBodies'
import { taskTitle } from '../components/useApplicationFlow'
import { referenceNumber } from '../logic/submit'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { Note } from '../ui/Note'
import { StatusBadge } from '../ui/StatusBadge'

// Date follows the prototype clock; the time is real.
/** Never ambiguous: submitted, when, which number, what next. */
export function Receipt() {
  const { derived, state, dispatch, go } = useApp()
  const at = state.answers.submittedAt!
  const awaiting = derived.readiness.awaiting
  const ref = referenceNumber(at)
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ref)
      setCopied(true)
    } catch {
      // Older browsers: copy from a hidden field instead.
      const field = Object.assign(document.createElement('textarea'), { value: ref })
      document.body.append(field)
      field.select()
      setCopied(document.execCommand('copy'))
      field.remove()
    }
  }

  return (
    <div className="receipt">
      <section className="receipt-card" aria-labelledby="receipt-title">
        <span className="receipt-mark"><Icon name="complete" size="lg" /></span>
        <h1 tabIndex={-1} id="receipt-title">{finish.receipt.title}</h1>
        <p className="receipt-when">{finish.receipt.when(`${formatDateYear(derived.scenario.today)}, ${formatTime(at)}`)}</p>
        <dl className="receipt-ref">
          <dt>{finish.receipt.reference}</dt>
          <dd className="receipt-ref-row">
            <span>{ref}</span>
            <Button variant="ghost" onClick={copy} aria-label={finish.receipt.copy}>
              <Icon name={copied ? 'check' : 'copy'} />
            </Button>
          </dd>
        </dl>
        <p className="hint" aria-live="polite">{copied ? finish.receipt.copied : finish.receipt.referenceNote}</p>
      </section>

      <section className="receipt-section" aria-labelledby="next-title">
        <h2 id="next-title">{finish.receipt.nextTitle}</h2>
        <ol className="timeline">
          {finish.receipt.next.map((n, i) => (
            <li key={n}>
              <span className="timeline-dot">{i + 1}</span> {n}
            </li>
          ))}
        </ol>
      </section>

      {awaiting.length > 0 && (
        <section className="receipt-section" aria-labelledby="still-title">
          <h2 id="still-title">{finish.submit.awaitingTitle}</h2>
          <ul className="status-list">
            {awaiting.map((i) => (
              <li key={i.id}>
                <StatusBadge status={i.status} iconOnly />
                <span>
                  <strong>{taskTitle(i.id)}</strong>
                  <span className="hint">{taskSummary(i.id, derived, state)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="receipt-section" aria-labelledby="amend-title">
        <h2 id="amend-title">{finish.receipt.amendTitle}</h2>
        <p className="hint">
          {finish.receipt.amendText} <Note kind="assumption" />
        </p>
        <div>
          <Button
            onClick={() => {
              dispatch({ type: 'amend' })
              go('welcome')
            }}
          >
            {finish.receipt.amend}
          </Button>
        </div>
      </section>
    </div>
  )
}
