import type { AppState } from './actions'

const KEY = 'gsa-north-star/v6'

// Storage can be missing or blocked; the app must work without it.
export function loadState(): AppState | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AppState
    return parsed.version === 6 ? parsed : null
  } catch {
    return null
  }
}

export function saveState(state: AppState): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
