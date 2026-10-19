import { finish } from '../copy/en'
import { useApp } from '../components/AppContext'
import { isRenewed } from '../logic/readiness'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Stack, Text } from '../ui/Layout'

/** Renewal is a gate, never a finish line. */
export function Renewal() {
  const { derived, state, dispatch, go } = useApp()
  const renewed = isRenewed(derived.scenario, state.answers)

  if (renewed) {
    return (
      <Stack gap="md">
        <Banner tone="success">
          <h1 tabIndex={-1}>{finish.renewal.doneTitle}</h1>
          <Text variant="strong">{finish.renewal.doneNext}</Text>
        </Banner>
        <div>
          <Button variant="primary" onClick={() => go('welcome')}>{finish.renewal.continue}</Button>
        </div>
      </Stack>
    )
  }
  return (
    <Stack gap="md">
      <h1 tabIndex={-1}>{finish.renewal.title}</h1>
      <Text>{finish.renewal.why}</Text>
      <Text variant="secondary">{finish.renewal.prepare}</Text>
      <div>
        <Button variant="primary" onClick={() => dispatch({ type: 'renew' })}>{finish.renewal.button}</Button>
      </div>
      <Text variant="small">{finish.renewal.mockNote}</Text>
    </Stack>
  )
}
