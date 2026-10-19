import { en, ui } from '../copy/en'
import { daysLeft, isRenewed } from '../logic/readiness'
import { isAnswered } from '../logic/changes'
import { useApp } from '../components/AppContext'
import { ChangeCard } from '../components/ChangeCard'
import { EstimateBlock } from '../components/EstimateBlock'
import { WizardPreview } from '../components/WizardPreview'
import { changeTarget } from '../components/targets'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Stack, Text } from '../ui/Layout'

/** Moment 1: opens with what GSA knows, asks only about what changed. */
export function WelcomeBack() {
  const { derived, state, go } = useApp()
  const { scenario, changes, wizard } = derived
  const firstStep = wizard.steps[0]

  // Carry on: the next open change, otherwise into the application.
  const carryOn = () => {
    const next = changes.find((c) => !isAnswered(c, state.answers))
    if (next) go('welcome', changeTarget(next))
    else go(firstStep.id)
  }

  return (
    <Stack gap="lg">
      <header>
        <h1>{scenario.firstYear ? ui.welcome.greetingFirst : ui.welcome.greeting}</h1>
        <Text>
          {ui.welcome.window(scenario.window.opens, scenario.window.closes)}{' '}
          <strong>{en.daysLeft(daysLeft(scenario.today, scenario.window.closes))}.</strong>
        </Text>
        {isRenewed(scenario, state.answers) ? (
          <Text variant="secondary">{ui.welcome.activeFarmer}</Text>
        ) : (
          <Banner tone="attention">{ui.welcome.notRenewed}</Banner>
        )}
      </header>

      <section aria-labelledby="changes-title">
        <Stack gap="md">
          <h2 id="changes-title">
            {scenario.firstYear ? ui.welcome.firstYear : changes.length ? ui.welcome.changesIntro(changes.length) : ui.welcome.noChanges}
          </h2>
          {changes.length > 0 && <Text variant="secondary">{ui.welcome.changesSub}</Text>}
          {changes.map((c) => (
            <ChangeCard key={c} id={c} onCarryOn={carryOn} />
          ))}
          <div>
            <Button variant="primary" onClick={() => go(firstStep.id)}>{ui.welcome.continue}</Button>
          </div>
        </Stack>
      </section>

      <WizardPreview />
      <EstimateBlock />
    </Stack>
  )
}
