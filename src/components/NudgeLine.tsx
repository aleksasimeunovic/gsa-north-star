import { en, nudge as copy } from '../copy/en'
import { fitting } from '../logic/status'
import { Text } from '../ui/Layout'
import { Note } from '../ui/Note'
import { useApp, type AppCtx } from './AppContext'

/** GSA's next-step line, in his own numbers. Empty when there's nothing to say. */
export function nudgeText(d: AppCtx['derived']): string {
  const n = d.nudge
  const s = d.scenario
  const l = copy.line
  const measureName = () => (n.to && n.to.startsWith('measure_') ? en.measures[n.to.slice(8) as keyof typeof en.measures] : '')
  switch (n.detail) {
    case 'herd_unanswered':
      return l.herd_unanswered(s.herd!.registryCount, s.herd!.lastYearDeclared ?? 0)
    case 'herd_needs_count':
    case 'herd_jelena_asks':
    case 'river_unanswered':
    case 'river_needs_split':
    case 'road_unanswered':
    case 'upper_unanswered':
    case 'upper_needs_drawing':
    case 'receipts_missing':
    case 'same':
    case 'renewal':
    case 'submit':
      return l[n.detail]
    case 'pigs_unanswered':
      return l.pigs_unanswered(s.pigs!.registryCount)
    case 'measures_to_choose':
      return l.measures_to_choose(fitting(s).length, s.measures.filter((m) => m.lastYear).length)
    case 'measure_needs_input':
      return l.measure_needs_input(measureName(), n.missing?.length ?? 1)
    case 'measure_ruled_out':
      return l.measure_ruled_out(measureName())
    default:
      return ''
  }
}

export function NudgeLine() {
  const { derived } = useApp()
  const text = nudgeText(derived)
  if (!text) return null
  return (
    <div className="nudge">
      <Text variant="strong">
        <span aria-hidden="true" className="after-icon">→</span> {text} <Note kind="ai" />
      </Text>
    </div>
  )
}
