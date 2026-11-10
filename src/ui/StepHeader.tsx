import type { ReactNode } from 'react'
import { Icon } from './Icon'

/**
 * Where he is inside a task that takes a few steps: the way back to the step before, a mark per step with
 * the ones he has reached filled, and the words. Always above the step's heading, always the same shape.
 */
export function StepHeader({ step, of, label, back }: { step: number; of: number; label: string; back?: { label: ReactNode; onClick: () => void } }) {
  return (
    <div className="step-head">
      {back && (
        <button type="button" className="step-back" onClick={back.onClick}>
          <Icon name="back" size="sm" />
          {back.label}
        </button>
      )}
      {/* A task of one step has only the way back. */}
      {of > 0 && (
        <>
          <span className="step-marks" aria-hidden="true">
            {Array.from({ length: of }, (_, i) => (
              <span key={i} data-on={i < step || undefined} />
            ))}
          </span>
          <p className="hint">{label}</p>
        </>
      )}
    </div>
  )
}
