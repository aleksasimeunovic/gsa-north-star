import { useEffect, useState, type ReactNode } from 'react'
import { en, itemLabel, wiz } from '../copy/en'
import type { StepId } from '../logic/status'
import { neighbours } from '../logic/wizard'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Inline, Stack, Text } from '../ui/Layout'
import { StatusBadge } from '../ui/StatusBadge'
import { Stepper } from '../ui/Stepper'
import { useApp } from './AppContext'

export function WizardShell({ stepId, children }: { stepId: StepId; children: ReactNode }) {
  const { derived, dispatch, go } = useApp()
  const steps = derived.wizard.steps
  const step = steps.find((s) => s.id === stepId)!
  const { index, total, previous, next } = neighbours(steps, stepId)

  const open = derived.items.filter((i) => i.stepId === stepId && i.status === 'action_required')
  const [asking, setAsking] = useState(false)
  useEffect(() => setAsking(false), [stepId])

  const moveOn = () => {
    setAsking(false)
    if (next) go(next)
  }
  const onNext = () => {
    // Open items: say what's left first. He can still move on; readiness keeps track.
    if (open.length > 0 && !asking) return setAsking(true)
    if (open.length === 0) dispatch({ type: 'confirm_step', stepId })
    moveOn()
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

      {/* Always within reach: sticks to the bottom of the screen. Submit has its own bar. */}
      {stepId !== 'submit' && (
      <nav className="step-nav" aria-label={wiz.stepNav}>
        {asking && open.length > 0 && (
          <Banner tone="attention">
            <Stack gap="sm">
              <Text variant="strong">{wiz.stillOpen(open.map((i) => itemLabel(i.id)).join(', '))}</Text>
              <Inline>
                <Button
                  variant="primary"
                  onClick={() => {
                    setAsking(false)
                    // Stay on this step and bring the open item into view.
                    go(stepId, open[0].id === 'herd' ? 'change-herd' : `item-${open[0].id}`)
                  }}
                >
                  {wiz.finishIt}
                </Button>
                <Button onClick={moveOn}>{wiz.later}</Button>
              </Inline>
            </Stack>
          </Banner>
        )}
        <Button onClick={() => (previous ? go(previous) : go('welcome'))}>{previous ? wiz.back : wiz.backToOverview}</Button>
        {next && (
          <Button variant={asking ? 'secondary' : 'primary'} onClick={onNext} aria-expanded={open.length > 0 ? asking : undefined}>
            {step.mode === 'confirm' ? wiz.confirmNext : wiz.next}
          </Button>
        )}
      </nav>
      )}
    </Stack>
  )
}
