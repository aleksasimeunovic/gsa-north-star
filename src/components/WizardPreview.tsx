import { en, ui } from '../copy/en'
import { TESTED_STEPS, type AssemblyRow, type Step } from '../logic/wizard'
import { Card } from '../ui/Card'
import { Stack, Text } from '../ui/Layout'
import { StatusBadge } from '../ui/StatusBadge'
import { useApp } from './AppContext'
import { Note } from '../ui/Note'

type Entry =
  | { key: string; waiting: true; row: AssemblyRow }
  | { key: string; waiting: false; step: Step; includes: string[] }

/** Reassembles as he answers: tested steps waiting on an answer stay until it comes. */
export function WizardPreview() {
  const { derived } = useApp()
  const { wizard, assembly } = derived

  const entries = wizard.steps.flatMap((step): Entry[] => {
    const rows = assembly.filter((r) => r.becomes === step.id)
    const waiting = rows.filter((r) => r.waitingOn.length > 0)
    if (waiting.length > 0) return waiting.map((r) => ({ key: r.tested, waiting: true, row: r }))
    return [{ key: step.id, waiting: false, step, includes: rows.map((r) => en.testedSteps[r.tested]) }]
  })

  return (
    <Card id="preview" title={ui.preview.title} headingLevel={2}>
      <Stack gap="sm">
        <Text variant="secondary" as="p">
          <span aria-live="polite">{ui.preview.count(entries.length, TESTED_STEPS.length)}</span> <Note kind="north_star" />
        </Text>
        <ol className="preview-list">
          {entries.map((e) =>
            e.waiting ? (
              <li key={e.key} data-waiting="true">
                <Text variant="strong" as="span">{en.testedSteps[e.row.tested]}</Text>
                <Text variant="small">{ui.preview.waiting}</Text>
              </li>
            ) : (
              <li key={e.key}>
                <Text variant="strong" as="span">{en.steps[e.step.id]}</Text>{' '}
                {e.step.id !== 'submit' && <StatusBadge status={e.step.status} />}
                <Text variant="small">
                  {e.step.id === 'submit' ? en.fate.signed_once : en.stepMode[e.step.mode]}
                  {e.includes.length > 0 && `. ${ui.preview.includes}: ${e.includes.join(', ')}`}
                </Text>
              </li>
            ),
          )}
        </ol>
      </Stack>
    </Card>
  )
}
