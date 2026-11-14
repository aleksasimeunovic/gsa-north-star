import { useRef, useState } from 'react'
import { advisor, en } from '../copy/en'
import { advisorFarmers, advisorQueue, type AdvisorFarmer } from '../logic/advisor'
import { Drawer } from '../ui/Drawer'
import { Icon } from '../ui/Icon'
import { useApp } from './AppContext'
import { readinessCount } from './ReadinessBar'

const f = advisor.farmers

/** What of a farmer's problems waits on her, on others, or is done: one line, hers first. */
const workLine = (x: AdvisorFarmer) =>
  !x.cases.length ? f.none : [x.needsHer && f.needsYou(x.needsHer), x.waiting && f.waiting(x.waiting), x.resolved && f.resolved(x.resolved)].filter(Boolean).join(' · ') || f.nothingOnYou

/**
 * Jelena's way between the farmers she works with, in her header. The button names whose application is open
 * (or her problems); beside it, what that farmer sent her and what of it waits on her. The application below
 * is the farmer's own, exactly as he sees it.
 */
export function AdvisorSwitcher({ screen }: { screen: string }) {
  const { state, derived, go } = useApp()
  const [open, setOpen] = useState(false)
  const opener = useRef<HTMLButtonElement>(null)
  const farmers = advisorFarmers(state)
  const onQueue = screen === 'queue'
  const current = onQueue ? undefined : farmers.find((x) => x.hasApplication)
  const queueNeeds = advisorQueue(state).filter((c) => c.state === 'assigned').length
  const label = current ? current.name : advisor.title

  const pick = (to: () => void) => {
    setOpen(false)
    to()
  }

  return (
    <>
      <div className="advisor-switch">
        <button ref={opener} type="button" className="advisor-switch-button" aria-haspopup="dialog" aria-expanded={open} aria-label={`${f.title}: ${label}`} onClick={() => setOpen(true)}>
          <Icon name={current ? 'farmer' : 'inbox'} size="sm" />
          <span className="advisor-switch-name">{label}</span>
          <Icon name="expand" size="sm" />
        </button>
        {/* The farmer at a glance: what he sent her and what of it waits on her. */}
        {current && (
          <span className="advisor-glance">{workLine(current)}</span>
        )}
      </div>
      <Drawer open={open} title={f.title} onClose={() => setOpen(false)} returnFocusTo={opener}>
        <ul className="farmer-list">
          <li>
            <button type="button" className="farmer-row" aria-current={onQueue || undefined} onClick={() => pick(() => go('queue'))}>
              <Icon name="inbox" />
              <span className="farmer-text">
                <strong>{advisor.title}</strong>
                <span>{queueNeeds ? f.needsYou(queueNeeds) : f.nothingOnYou}</span>
              </span>
              {onQueue ? <span className="farmer-current">{f.current}</span> : <Icon name="disclose" />}
            </button>
          </li>
          {farmers.map((x) => {
            const here = x === current
            return (
              <li key={x.name}>
                <button
                  type="button"
                  className="farmer-row"
                  aria-current={here || undefined}
                  // A farmer whose application GSA holds opens on it; another opens on the problem he sent.
                  onClick={() => pick(() => (x.hasApplication ? go('welcome') : go('queue', x.cases[0]?.id)))}
                >
                  <Icon name="farmer" />
                  <span className="farmer-text">
                    <strong>{x.name}</strong>
                    <span>{workLine(x)}</span>
                    {x.cases.map((c) => (
                      <span key={c.id} className="farmer-case">
                        {advisor.kind[c.kind]}: {advisor.next[c.state](en.offices[c.owner])}
                      </span>
                    ))}
                    {x.hasApplication && <span className="farmer-case">{f.application}: {readinessCount(derived.report)}</span>}
                  </span>
                  {here ? <span className="farmer-current">{f.current}</span> : <Icon name="disclose" />}
                </button>
              </li>
            )
          })}
        </ul>
      </Drawer>
    </>
  )
}
