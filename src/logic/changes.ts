import type { Scenario } from '../data/scenarios'
import type { Answers } from '../state/actions'

export type ChangeId = 'herd' | 'pigs' | 'river' | 'road' | 'upper' | 'meadow'

/** What may have changed since last year, found from records and signals. */
export function detectChanges(s: Scenario): ChangeId[] {
  const changes: ChangeId[] = []
  if (s.herd && s.herd.lastYearDeclared !== null && s.herd.lastYearDeclared !== s.herd.registryCount) changes.push('herd')
  if (s.pigs && s.pigs.registryCount !== s.pigs.lastYearDeclared) changes.push('pigs')
  for (const f of s.fields) {
    if (f.signal?.kind === 'satellite_difference') changes.push('river')
    if (f.signal?.kind === 'road_strip') changes.push('road')
    if (f.signal?.kind === 'overlap') changes.push('upper')
    if (f.signal?.kind === 'yearly_use') changes.push('meadow')
  }
  return changes
}

export const isAnswered = (id: ChangeId, a: Answers) => a[id].answer !== null
