import { en } from './copy/en'
import { AppContext } from './components/AppContext'
import { ReadinessBar } from './components/ReadinessBar'
import { derive } from './logic/derive'
import type { StepId } from './logic/status'
import { DebugView } from './screens/DebugView'
import { StepPlaceholder } from './screens/StepPlaceholder'
import { WelcomeBack } from './screens/WelcomeBack'
import { useHashScreen } from './state/useHashScreen'
import { useStore } from './state/store'
import { DensityContext } from './ui/Density'

const STEPS: StepId[] = ['herd', 'land', 'everything_else', 'submit']

export function App() {
  const { state, dispatch, savedAt } = useStore()
  const { screen, go } = useHashScreen()
  const derived = derive(state)

  const main =
    screen === 'debug' ? (
      <DebugView state={state} derived={derived} dispatch={dispatch} />
    ) : STEPS.includes(screen as StepId) ? (
      <StepPlaceholder stepId={screen as StepId} />
    ) : (
      <WelcomeBack />
    )

  return (
    <AppContext.Provider value={{ state, derived, dispatch, go }}>
      <DensityContext.Provider value={derived.wizard.density}>
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
        </div>
      </DensityContext.Provider>
    </AppContext.Provider>
  )
}
