import { ui, wiz } from '../copy/en'
import { useApp } from '../components/AppContext'
import { ChangeCard } from '../components/ChangeCard'
import { ConflictPanel } from '../components/ConflictPanel'
import { Stack, Text } from '../ui/Layout'

/** Herd: one confirmation when settled, the conflict when not, the question if unanswered. */
export function HerdStep() {
  const { derived, state, go } = useApp()
  const herd = derived.scenario.herd!
  const item = derived.items.find((i) => i.id === 'herd')!
  const a = state.answers.herd
  const carryOn = () => go('land')

  if (derived.scenario.firstYear && a.answer === null) {
    return (
      <Stack gap="md">
        <Text>{wiz.herd.firstYear(herd.registryCount)}</Text>
        <ChangeCard id="herd" onCarryOn={carryOn} />
      </Stack>
    )
  }
  if (item.status === 'awaiting_verification') return <ConflictPanel item={item} onCarryOn={carryOn} />
  if (item.status === 'action_required') return <ChangeCard id="herd" onCarryOn={carryOn} />

  return (
    <Stack gap="sm">
      <Text variant="strong">{wiz.herd.confirm(a.answer === 'yes' ? herd.registryCount : (a.ownCount ?? herd.registryCount))}</Text>
      <Text variant="secondary">{wiz.herd.confirmHint}</Text>
      {!derived.scenario.firstYear && <Text variant="small">{ui.herd.replaced}</Text>}
    </Stack>
  )
}
