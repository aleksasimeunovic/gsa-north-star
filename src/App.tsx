import { en } from './copy/en'
import { derive } from './logic/derive'
import { DebugView } from './screens/DebugView'
import { useHashScreen } from './state/useHashScreen'
import { useStore } from './state/store'
import { DensityContext } from './ui/Density'

export function App() {
  const { state, dispatch, savedAt } = useStore()
  const { screen } = useHashScreen()
  const derived = derive(state)
  return (
    <DensityContext.Provider value={derived.wizard.density}>
      <div className="page">
        <main>{screen === 'debug' && <DebugView state={state} derived={derived} dispatch={dispatch} />}</main>
        <footer className="footer">
          {savedAt && <span className="saved" aria-live="polite">{en.saved}</span>}
          <p>{en.footer}</p>
        </footer>
      </div>
    </DensityContext.Provider>
  )
}
