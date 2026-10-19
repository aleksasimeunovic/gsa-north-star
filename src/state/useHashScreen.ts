import { useCallback, useEffect, useState } from 'react'

// Tiny hash-based screen state. Works on GitHub Pages without 404s.
const read = () => window.location.hash.replace(/^#\/?/, '') || 'debug'

export function useHashScreen() {
  const [screen, setScreen] = useState(read)
  useEffect(() => {
    const onChange = () => setScreen(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  const go = useCallback((next: string) => {
    window.location.hash = `/${next}`
  }, [])
  return { screen, go }
}
