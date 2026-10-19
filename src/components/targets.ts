import type { ChangeId } from '../logic/changes'
import type { Item } from '../logic/status'

// Where each item is fixed: its change card while that change is open, otherwise its step.
const CHANGE_OF: Record<string, ChangeId> = { herd: 'herd', field_river: 'river', field_road: 'road' }

export const changeTarget = (id: ChangeId) => `change-${id}`

export function itemTarget(item: Item, changes: ChangeId[]): [string, string] {
  const change = CHANGE_OF[item.id]
  if (change && changes.includes(change)) return ['welcome', changeTarget(change)]
  return [item.stepId, `item-${item.id}`]
}
