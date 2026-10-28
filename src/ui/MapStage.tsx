import type { ReactNode } from 'react'

/**
 * A large map with the question built in: the map fills the space between the stepper and the action bar,
 * and the panel beside it (below it on a phone) holds what he reads and answers. The panel scrolls on its
 * own, and anything marked `stage-action` stays pinned at its bottom, so the answer is always in view.
 */
export function MapStage({ map, children, label, working }: { map: ReactNode; children: ReactNode; label: string; working?: boolean }) {
  // While he moves a line, a phone keeps the panel for the line's controls: the fact he has already read folds away.
  return (
    <div className="map-stage" data-working={working || undefined}>
      <div className="map-stage-map">{map}</div>
      <section className="map-stage-panel" aria-label={label}>
        {children}
      </section>
    </div>
  )
}

/** What the panel's question is for: pinned to the bottom of the panel or card it sits in. */
export function StageAction({ children }: { children: ReactNode }) {
  return <div className="stage-action">{children}</div>
}
