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

  return (
    <div className="receipt">
      <section className="receipt-card" aria-labelledby="receipt-title">
        <span className="receipt-mark"><Icon name="complete" size="lg" /></span>
        <h1 tabIndex={-1} id="receipt-title">{finish.receipt.title}</h1>
        <p className="receipt-when">{finish.receipt.when(`${formatDateYear(derived.scenario.today)}, ${formatTime(at)}`)}</p>
        <dl className="receipt-ref">
          <dt>{finish.receipt.reference}</dt>
          <dd>{referenceNumber(at)}</dd>
        </dl>
        <p className="hint">{finish.receipt.referenceNote}</p>
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
          <ul className="plain-list">
            {awaiting.map((i) => (
              <li key={i.id} className="receipt-waiting">
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
