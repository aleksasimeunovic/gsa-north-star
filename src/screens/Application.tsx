import { bar, home } from '../copy/en'
import { isMapChange } from '../logic/application'
import { daysLeft } from '../logic/readiness'
import { ActionBar } from '../components/ActionBar'
import { useApp } from '../components/AppContext'
import { EstimateBlock } from '../components/EstimateBlock'
import { FarmPicture } from '../components/FarmPicture'
import { TaskList } from '../components/TaskList'
import { useApplicationFlow } from '../components/useApplicationFlow'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Stack, Text } from '../ui/Layout'
import { Note } from '../ui/Note'
import { Review } from './Review'

/**
 * Welcome back: one obvious next action, what's done, what can wait, and the way forward always in reach.
 * Reviewing a boundary on the map happens here too, so what his answer changed is waiting when he comes back.
 */
export function Application({ target, review }: { target: string | null; review?: string | null }) {
  const { derived, state, go } = useApp()
  const { scenario } = derived
  const flow = useApplicationFlow(target)
  const submitted = !!state.answers.submittedAt

  if (review && isMapChange(review as never) && !submitted) return <Review id={review as never} flow={flow} />

  return (
    <Stack gap="lg">
      <header>
        <h1>{home.greeting}</h1>
        <Text>
          {home.deadline(daysLeft(scenario.today, scenario.window.closes), scenario.window.closes)} <Note kind="eu_mandate" />
        </Text>
      </header>

      {submitted && (
        <Banner tone="success">
          <Text variant="strong">{home.submitted}</Text>
          <Button variant="link" onClick={() => go('receipt')}>{home.seeReceipt}</Button>
        </Banner>
      )}

      {/* Desktop: his farm and the estimate in a sticky side column. Mobile: below the list. */}
      <div className="app-layout">
        <TaskList flow={flow} />
        <aside className="app-side">
          <FarmPicture />
          <EstimateBlock />
        </aside>
      </div>

      {!submitted && (
        <ActionBar
          back={flow.back && { label: bar.back, onClick: flow.back }}
          forward={{
            label: flow.forward === 'submit' ? bar.toSubmit : bar.next(flow.title(flow.forward)),
            onClick: () => (flow.forward === 'submit' ? go('submit') : flow.show(flow.forward)),
          }}
          forwardIsPrimary={flow.forwardIsPrimary}
          onPick={(id) => flow.show(id)}
        />
      )}
    </Stack>
  )
}
