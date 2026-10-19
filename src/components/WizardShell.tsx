import type { ReactNode } from 'react'
import { en, wiz } from '../copy/en'
import type { StepId } from '../logic/status'
import { neighbours } from '../logic/wizard'
import { Button } from '../ui/Button'
import { Stack } from '../ui/Layout'
import { StatusBadge } from '../ui/StatusBadge'
import { Stepper } from '../ui/Stepper'
import { useApp } from './AppContext'

export function WizardShell({ stepId, children }: { stepId: StepId; children: ReactNode }) {
  const { derived, dispatch, go } = useApp()
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
        {stepId !== 'submit' && <StatusBadge status={step.status} iconOnly />}
      </header>

      {children}

      {/* Always within reach: sticks to the bottom of the screen. */}
      <nav className="step-nav" aria-label={wiz.stepNav}>
        <Button onClick={() => (previous ? go(previous) : go('welcome'))}>{previous ? wiz.back : wiz.backToOverview}</Button>
        {next && (
          <Button variant="primary" onClick={onNext}>
            {step.mode === 'confirm' ? wiz.confirmNext : wiz.next}
          </Button>
        )}
      </nav>
    </Stack>
  )
}
