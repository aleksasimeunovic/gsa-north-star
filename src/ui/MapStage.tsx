import type { ReactNode } from 'react'

/**
 * A large map with the question built in: the map fills the space between the stepper and the action bar,
 * and the panel beside it (below it on a phone) holds what he reads and answers. The panel scrolls on its
 * own, and anything marked `stage-action` stays pinned at its bottom, so the answer is always in view.
 */
/** `answering`: a phone keeps the map shorter while the panel asks a question, so the answer is in view without scrolling. */
export function MapStage({ map, children, label, working, answering }: { map: ReactNode; children: ReactNode; label: string; working?: boolean; answering?: boolean }) {
  // While he moves a line, a phone keeps the panel for the line's controls: the fact he has already read folds away.
  return (
    <div className="map-stage" data-working={working || undefined} data-answering={answering || undefined}>
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

/**
 * The panel's heading and the line under it, one group: the panel's groups stand a section apart, and a
 * heading sits close to the text it introduces.
 */
export function PanelHead({ id, title, children }: { id: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="panel-head split-head">
      <h2 id={id} tabIndex={-1}>{title}</h2>
      {children}
    </header>
  )
}
