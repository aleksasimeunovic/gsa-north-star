import type { StepId, TaskId } from '../logic/application'
import type { IconName } from '../ui/Icon'

/** What each task and part is about, as an icon name. */
export function taskIcon(id: TaskId): IconName {
  if (id === 'bank' || id === 'household' || id === 'details') return id
  if (id === 'herd') return 'animals'
  if (id === 'pigs' || id === 'calvings') return id
  if (id === 'field_meadow') return 'meadow'
  if (id === 'fields_other') return 'map'
  if (id.startsWith('field_')) return 'land'
  if (id === 'measures' || id.startsWith('measure_')) return 'measures'
  if (id === 'receipt_unreadable' || id === 'receipts') return 'receipt'
  return 'same'
}

export const stepIcon = (id: StepId): IconName => id
