import { createContext, useContext, type Dispatch } from 'react'
import type { derive } from '../logic/derive'
import type { Action, AppState } from '../state/actions'

export interface AppCtx {
  state: AppState
  derived: ReturnType<typeof derive>
  dispatch: Dispatch<Action>
  go: (screen: string, target?: string) => void
}

export const AppContext = createContext<AppCtx | null>(null)
export const useApp = () => useContext(AppContext)!
