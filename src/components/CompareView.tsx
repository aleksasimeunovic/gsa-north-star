import { en, wiz } from '../copy/en'
import { TESTED_STEPS } from '../logic/wizard'
import { Stack, Text } from '../ui/Layout'
import { Table } from '../ui/Table'
import { useApp } from './AppContext'
import { Note } from '../ui/Note'

/** Tested 8-step wizard vs the steps generated around his farm. */
export function CompareView() {
  const { derived } = useApp()
  return (
    <Stack gap="sm">
      <Text variant="strong">{wiz.compareSummary(TESTED_STEPS.length, derived.wizard.steps.length)}</Text>
      <div>
        <Note kind="tested" /> <Note kind="north_star" />
      </div>
      <Table
        caption={wiz.compareTitle}
        head={[wiz.compareHead.tested, wiz.compareHead.now, wiz.compareHead.what]}
        rows={derived.compare.map((c) => ({
          key: c.tested,
          cells: [en.testedSteps[c.tested], c.becomes ? en.steps[c.becomes] : wiz.notThisYear, en.fate[c.fate]],
        }))}
      />
    </Stack>
  )
}
