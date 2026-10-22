import type { Scenario } from '../data/scenarios'
import type { Answers } from '../state/actions'

export type ChangeId = 'herd' | 'river' | 'road'

/** What may have changed since last year, found from records and signals. */
export function detectChanges(s: Scenario): ChangeId[] {
  const changes: ChangeId[] = []
  if (s.herd && s.herd.lastYearDeclared !== null && s.herd.lastYearDeclared !== s.herd.registryCount) changes.push('herd')
  for (const f of s.fields) {
    if (f.signal?.kind === 'satellite_difference') changes.push('river')
    if (f.signal?.kind === 'road_strip') changes.push('road')
  }
  return changes
}

export const isAnswered = (id: ChangeId, a: Answers) => a[id].answer !== null
