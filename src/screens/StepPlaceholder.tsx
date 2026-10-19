import { ui } from '../copy/en'
import type { StepId } from '../logic/status'
import { Text } from '../ui/Layout'

// Temporary until Phase 3 and 4 build the steps.
export function StepPlaceholder(_: { stepId: StepId }) {
  return <Text>{ui.placeholder.body}</Text>
}
