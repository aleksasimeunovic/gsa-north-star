import { advisor, en } from './copy/en'
import { AppContext } from './components/AppContext'
import { PrototypeControls } from './components/PrototypeControls'
import { ReadinessBar } from './components/ReadinessBar'
import { derive } from './logic/derive'
import { AdvisorQueue } from './screens/AdvisorQueue'
import { Application } from './screens/Application'
import { Receipt } from './screens/Receipt'
import { Renewal } from './screens/Renewal'
import { Submit } from './screens/Submit'
import { useHashScreen } from './state/useHashScreen'
import { useStore } from './state/store'
import { DensityContext } from './ui/Density'
import { NotesContext } from './ui/Note'

export function App() {
  const { state, dispatch, savedAt } = useStore()
  const { screen, target, go } = useHashScreen()
  const derived = derive(state)
  const submitted = !!state.answers.submittedAt

  const main =
    screen === 'queue' ? (
      <AdvisorQueue />
    ) : screen === 'renewal' ? (
      <Renewal />
    ) : (screen === 'receipt' || screen === 'submit') && submitted ? (
      <Receipt />
    ) : screen === 'submit' ? (
      <Submit />
    ) : (
      <Application key={state.scenarioId} target={target} />
    )

  return (
    <AppContext.Provider value={{ state, derived, dispatch, go }}>
      <DensityContext.Provider value={derived.list.density}>
        <NotesContext.Provider value={state.prototype.showNotes}>
          <div className="page" data-screen={screen}>
            <header className="topbar">
              <a href="#/welcome" className="brand">{en.appName}</a>
              {screen !== 'queue' && <ReadinessBar />}
              {state.role === 'advisor' && (
                <nav aria-label="Advisor" className="advisor-nav">
                  <a href="#/queue" aria-current={screen === 'queue' ? 'page' : undefined}>{advisor.nav.queue}</a>
                  <a href="#/welcome" aria-current={screen !== 'queue' ? 'page' : undefined}>{advisor.nav.milan}</a>
                </nav>
              )}
              {savedAt && <span className="saved">{en.saved}</span>}
              <PrototypeControls />
            </header>
            <main className="main">{main}</main>
          </div>
        </NotesContext.Provider>
      </DensityContext.Provider>
    </AppContext.Provider>
  )
}
