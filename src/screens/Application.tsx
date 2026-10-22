import { home } from '../copy/en'
import { isAnswered } from '../logic/changes'
import { daysLeft, isRenewed } from '../logic/readiness'
import { useApp } from '../components/AppContext'
import { EstimateBlock } from '../components/EstimateBlock'
import { TaskList } from '../components/TaskList'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Stack, Text } from '../ui/Layout'
import { Note } from '../ui/Note'

/** Welcome back: opens with what GSA knows, and his application as one list. */
export function Application({ target }: { target: string | null }) {
  const { derived, state, go } = useApp()
  const { scenario } = derived

  return (
    <Stack gap="lg">
      <header>
        <h1>{home.greeting}</h1>
        <Text>
          {home.deadline(scenario.window.closes)} <strong>{home.daysLeft(daysLeft(scenario.today, scenario.window.closes))}.</strong>{' '}
          <Note kind="eu_mandate" />
        </Text>
        {isRenewed(scenario, state.answers) && <Text variant="secondary">{home.activeFarmer}</Text>}
        {derived.changes.some((c) => !isAnswered(c, state.answers)) && <Text variant="secondary">{home.changesIntro(derived.changes.length)}</Text>}
      </header>

      {state.answers.submittedAt && (
        <Banner tone="success">
          <Text variant="strong">{home.submitted}</Text>
          <Button variant="link" onClick={() => go('receipt')}>{home.seeReceipt}</Button>
        </Banner>
      )}

      <TaskList target={target} />
      <EstimateBlock />
    </Stack>
  )
}
