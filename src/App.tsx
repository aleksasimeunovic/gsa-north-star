import { en, home } from './copy/en'
import { daysLeft } from './logic/readiness'
import { AdvisorSwitcher } from './components/AdvisorSwitcher'
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
  // Jelena sees a farmer's application exactly as he does; only her problems are denser.
  const density = screen === 'queue' ? 'compact' : 'comfortable'

  const main =
    screen === 'queue' ? (
      <AdvisorQueue initial={target} />
    ) : screen === 'renewal' ? (
      <Renewal />
    ) : (screen === 'receipt' || screen === 'submit') && submitted ? (
      <Receipt />
    ) : (
      // Reviewing a boundary and the last part (check and submit) belong to the application screen,
      // so what his answer changed is there when he returns.
      <Application
        key={state.scenarioId}
        target={screen === 'submit' ? 'step-submit' : screen === 'review' || screen === 'field' ? null : target}
        review={screen === 'review' ? target : null}
        field={screen === 'field' ? target : null}
      />
    )

  return (
    <AppContext.Provider value={{ state, derived, dispatch, go }}>
      <DensityContext.Provider value={density}>
        <NotesContext.Provider value={false}>
          <div className="page" data-screen={screen} data-density={density}>
            <header className="topbar">
              <a href="#/welcome" className="brand">
                {en.appName} <span className="brand-sub">{en.appSub}</span>
              </a>
              {state.role === 'advisor' && <AdvisorSwitcher screen={screen} />}
              {!submitted && screen !== 'queue' && (
                <span className="deadline" title={home.deadline(left, derived.scenario.window.closes)}>
                  <Icon name="deadline" size="sm" /> <span>{home.daysLeft(left)}<span className="deadline-more"> {home.toApply}</span></span> <Note kind="eu_mandate" />
                </span>
              )}
              {savedAt && (
                <span className="saved">
                  <Icon name="check" size="sm" /> <span className="saved-text">{en.saved}</span>
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
