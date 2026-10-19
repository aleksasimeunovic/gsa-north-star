import { useState, type ReactNode } from 'react'
import { en, wiz } from '../copy/en'
import type { StepId } from '../logic/status'
import { neighbours } from '../logic/wizard'
import { Button } from '../ui/Button'
import { Inline, Stack } from '../ui/Layout'
import { StatusBadge } from '../ui/StatusBadge'
import { Stepper } from '../ui/Stepper'
import { Toggle } from '../ui/Toggle'
import { useApp } from './AppContext'
import { CompareView } from './CompareView'

export function WizardShell({ stepId, children }: { stepId: StepId; children: ReactNode }) {
  const { derived, dispatch, go } = useApp()
  const [compare, setCompare] = useState(false)
  const steps = derived.wizard.steps
  const step = steps.find((s) => s.id === stepId)!
  const { index, total, previous, next } = neighbours(steps, stepId)

  const onNext = () => {
    // Moving on records the step as passed; anything still open stays in readiness.
    if (step.status !== 'action_required') dispatch({ type: 'confirm_step', stepId })
    if (next) go(next)
  }

  return (
    <Stack gap="lg">
      <Stepper
        label={wiz.progressLabel}
        current={index}
        stepOf={wiz.stepOf(index + 1, total)}
        steps={steps.map((s) => ({ id: s.id, name: en.steps[s.id], status: s.id === 'submit' ? undefined : s.status }))}
        onSelect={(id) => go(id)}
      />
      <header className="step-head">
        <h1 tabIndex={-1} id="step-title">{en.steps[stepId]}</h1>
        {stepId !== 'submit' && <StatusBadge status={step.status} />}
      </header>

      {children}

      <Inline>
        <Button onClick={() => (previous ? go(previous) : go('welcome'))}>{previous ? wiz.back : wiz.backToOverview}</Button>
        {next && (
          <Button variant="primary" onClick={onNext}>
            {step.mode === 'confirm' ? wiz.confirmNext : wiz.next}
          </Button>
        )}
      </Inline>

      <section aria-label={wiz.compareToggle}>
        <Stack gap="sm">
          <Toggle label={wiz.compareToggle} checked={compare} onChange={setCompare} />
          {compare && <CompareView />}
        </Stack>
      </section>
    </Stack>
  )
}
