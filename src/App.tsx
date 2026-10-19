import { en } from './copy/en'
import { AppContext } from './components/AppContext'
import { PrototypeControls } from './components/PrototypeControls'
import { ReadinessBar } from './components/ReadinessBar'
import { derive } from './logic/derive'
import type { StepId } from './logic/status'
import { WizardShell } from './components/WizardShell'
import { DebugView } from './screens/DebugView'
import { HerdStep } from './screens/HerdStep'
import { LandStep } from './screens/LandStep'
import { EverythingElse } from './screens/EverythingElse'
import { Receipt } from './screens/Receipt'
import { Renewal } from './screens/Renewal'
import { Submit } from './screens/Submit'
import { WelcomeBack } from './screens/WelcomeBack'
import { useHashScreen } from './state/useHashScreen'
import { useStore } from './state/store'
import { DensityContext } from './ui/Density'
import { NotesContext } from './ui/Note'

const STEPS: StepId[] = ['herd', 'land', 'everything_else', 'submit']

export function App() {
  const { state, dispatch, savedAt } = useStore()
  const { screen, target, go } = useHashScreen()
  const derived = derive(state)

  // A step the farm doesn't have (e.g. no animals) falls back to the first step he has.
  const renderStep = (requested: StepId) => {
    const id = derived.wizard.steps.some((s) => s.id === requested) ? requested : derived.wizard.steps[0].id
    if (id === 'submit' && state.answers.submittedAt) return <Receipt />
    const body =
      id === 'herd' ? (
        <HerdStep />
      ) : id === 'land' ? (
        <LandStep key={state.scenarioId} target={target} />
      ) : id === 'everything_else' ? (
        <EverythingElse />
      ) : (
        <Submit />
      )
    return <WizardShell stepId={id}>{body}</WizardShell>
  }

  const main =
    screen === 'receipt' && state.answers.submittedAt ? (
      <Receipt />
    ) : screen === 'renewal' ? (
      <Renewal />
    ) : screen === 'debug' ? (
      <DebugView state={state} derived={derived} dispatch={dispatch} />
    ) : STEPS.includes(screen as StepId) || screen === 'receipt' ? (
      renderStep(screen === 'receipt' ? 'submit' : (screen as StepId))
    ) : (
      <WelcomeBack />
    )

  return (
    <AppContext.Provider value={{ state, derived, dispatch, go }}>
      <DensityContext.Provider value={derived.wizard.density}>
      <NotesContext.Provider value={state.prototype.showNotes}>
        <div className="page">
          <header className="topbar">
            <a href="#/welcome" className="brand">{en.appName}</a>
            {savedAt && <span className="saved">{en.saved}</span>}
          </header>
          <div className="layout">
            <aside className="side" aria-label="Application status">
              <ReadinessBar />
            </aside>
            <main className="main">{main}</main>
          </div>
          <footer className="footer">
            <p>{en.footer}</p>
          </footer>
          <PrototypeControls />
        </div>
      </NotesContext.Provider>
      </DensityContext.Provider>
    </AppContext.Provider>
  )
}
