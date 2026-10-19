import { en, ui } from '../copy/en'
import { useApp } from '../components/AppContext'
import type { StepId } from '../logic/status'
import { Button } from '../ui/Button'
import { Stack, Text } from '../ui/Layout'
import { StatusBadge } from '../ui/StatusBadge'

// Temporary until Phase 3 and 4 build the steps.
export function StepPlaceholder({ stepId }: { stepId: StepId }) {
  const { derived, go } = useApp()
  const step = derived.wizard.steps.find((s) => s.id === stepId)
  return (
    <Stack gap="md">
      <h1>
        {en.steps[stepId]} {step && <StatusBadge status={step.status} />}
      </h1>
      <Text>{ui.placeholder.body}</Text>
      <div>
        <Button onClick={() => go('welcome')}>{ui.back}</Button>
      </div>
    </Stack>
  )
}
