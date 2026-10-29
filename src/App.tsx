import { advisor, en, home } from './copy/en'
import { daysLeft } from './logic/readiness'
import { AppContext } from './components/AppContext'
import { PrototypeControls } from './components/PrototypeControls'
import { derive } from './logic/derive'
import { AdvisorQueue } from './screens/AdvisorQueue'
import { Application } from './screens/Application'
import { Receipt } from './screens/Receipt'
import { Renewal } from './screens/Renewal'
import { useHashScreen } from './state/useHashScreen'
import { useStore } from './state/store'
import { DensityContext } from './ui/Density'
import { Icon } from './ui/Icon'
import { Note, NotesContext } from './ui/Note'

export function App() {
  const { state, dispatch, savedAt } = useStore()
  const { screen, target, go } = useHashScreen()
  const derived = derive(state)
  const submitted = !!state.answers.submittedAt
  const left = daysLeft(derived.scenario.today, derived.scenario.window.closes)

  const main =
    screen === 'queue' ? (
      <AdvisorQueue />
    ) : screen === 'renewal' ? (
      <Renewal />
    ) : (screen === 'receipt' || screen === 'submit') && submitted ? (
      <Receipt />
    ) : (
      // Reviewing a boundary and the last part (check and submit) belong to the application screen,
      // so what his answer changed is there when he returns.
      <Application
        key={state.scenarioId}
        target={screen === 'submit' ? 'step-submit' : screen === 'review' ? null : target}
        review={screen === 'review' ? target : null}
      />
    )

  return (
    <AppContext.Provider value={{ state, derived, dispatch, go }}>
      <DensityContext.Provider value={derived.list.density}>
        <NotesContext.Provider value={false}>
          <div className="page" data-screen={screen}>
            <header className="topbar">
              <a href="#/welcome" className="brand">
                {en.appName} <span className="brand-sub">{en.appSub}</span>
              </a>
              {state.role === 'farmer' && !submitted && (
                <span className="deadline" title={home.deadline(left, derived.scenario.window.closes)}>
                  <Icon name="deadline" size="sm" /> {home.daysLeft(left)} <Note kind="eu_mandate" />
                </span>
              )}
              {state.role === 'advisor' && (
                <nav aria-label="Advisor" className="advisor-nav">
                  <a href="#/queue" aria-current={screen === 'queue' ? 'page' : undefined}>{advisor.nav.queue}</a>
                  <a href="#/welcome" aria-current={screen !== 'queue' ? 'page' : undefined}>{advisor.nav.milan}</a>
                </nav>
              )}
              {savedAt && (
                <span className="saved">
                  <Icon name="check" size="sm" /> {en.saved}
                </span>
              )}
              <PrototypeControls />
            </header>
            <main className="main">{main}</main>
          </div>
        </NotesContext.Provider>
      </DensityContext.Provider>
    </AppContext.Provider>
  )
}
