import { tasks } from '../copy/en'
import { UNCHANGED, correctionAsked, type Unchanged } from '../logic/status'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { SourceTag } from '../ui/SourceTag'
import { useApp } from './AppContext'

/**
 * What GSA reuses without asking: unchanged since last year, nothing to declare, so never a task and never
 * counted. Shown together once, before he signs, each with its own way to ask for a correction.
 */
export function UnchangedReview() {
  const { derived, state, dispatch } = useApp()
  const g = derived.scenario.generalData
  const c = tasks.details
  const value: Record<Unchanged, string> = { holder: g.holder, place: g.place, active: c.activeYes }
  return (
    <Card id="unchanged" title={c.title} headingLevel={3} emphasis="low">
      <SourceTag source="records">{c.source}</SourceTag>
      <dl className="unchanged">
        {UNCHANGED.map((w) => (
          <div key={w} className="unchanged-row">
            <dt>{c[w]}</dt>
            <dd>{value[w]}</dd>
            <dd>
              {correctionAsked(state.answers, w) ? (
                <SourceTag source="checking">{c.asked}</SourceTag>
              ) : (
                <Button variant="link" onClick={() => dispatch({ type: 'ask_record_check', itemId: 'details', what: w })}>
                  {c.wrong}
                  <span className="sr-only">: {c[w]}</span>
                </Button>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
