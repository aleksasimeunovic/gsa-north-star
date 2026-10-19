import { useCallback, useEffect, useRef, useState } from 'react'

// Tiny hash-based screen state: #/screen/target. Works on GitHub Pages without 404s.
// The optional target is the id of the element to bring into view and focus.
const read = () => {
  const [screen = '', ...rest] = window.location.hash.replace(/^#\/?/, '').split('/')
  return { screen: screen || 'welcome', target: rest.join('/') || null }
}

export function useHashScreen() {
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const firstRoute = useRef(true)
  useEffect(() => {
    if (firstRoute.current) {
      firstRoute.current = false
      if (!route.target) return
    }
    if (!route.target) {
      // A new screen starts at the top, with focus on its heading for screen readers.
      window.scrollTo(0, 0)
      const h1 = document.querySelector<HTMLElement>('main h1')
      if (h1) {
        if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1')
        h1.focus({ preventScroll: true })
      }
      return
    }
    const el = document.getElementById(route.target)
    el?.scrollIntoView({ block: 'start' })
    el?.focus({ preventScroll: true })
  }, [route])

  const go = useCallback((screen: string, target?: string) => {
    const next = `#/${screen}${target ? `/${target}` : ''}`
    if (window.location.hash === next) setRoute(read())
    else window.location.hash = next
  }, [])
  return { ...route, go }
}
