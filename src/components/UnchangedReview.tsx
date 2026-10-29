import { tasks } from '../copy/en'
import { Card } from '../ui/Card'
import { useApp } from './AppContext'
import { detailRows, RecordList } from './Records'

/**
 * What GSA reuses without asking: unchanged since last year, nothing to declare, so never a task and never
 * counted. Shown together once, before he signs, in the same rows as his details, each changed with its pen.
 */
export function UnchangedReview() {
  const { derived, state, go } = useApp()
  const rows = detailRows(derived, state.answers).filter((r) => r.key !== 'bank')
  return (
    <Card id="unchanged" title={tasks.details.title} headingLevel={3} emphasis="low">
      <RecordList rows={rows} onOpen={() => go('welcome')} />
    </Card>
  )
}
