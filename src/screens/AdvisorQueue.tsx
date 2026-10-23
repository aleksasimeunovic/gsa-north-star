import { useEffect, useRef, useState } from 'react'
import { advisor, en, formatDate, formatDateYear, formatTime } from '../copy/en'
import { useApp } from '../components/AppContext'
import { SCENARIOS } from '../data/scenarios'
import { advisorQueue, type AdvisorCase, type CaseState } from '../logic/advisor'
import { daysLeft } from '../logic/readiness'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Compare, Inline, Stack, Text } from '../ui/Layout'
import { Table } from '../ui/Table'

// Dates follow the prototype clock; times are real.
const TODAY = SCENARIOS.second_year.today
const when = (iso: string) => {
  const day = iso.slice(0, 10) > TODAY ? TODAY : iso.slice(0, 10)
  return `${formatDateYear(day)}, ${formatTime(iso)}`
}

/** The national deadline is the same for everyone: show it only when it's close. */
const CLOSE_DAYS = 7
const GROUPS: CaseState[] = ['assigned', 'waiting_farmer', 'waiting_office', 'resolved']


function CaseDetail({ c }: { c: AdvisorCase }) {
  const { dispatch, go } = useApp()
  const act = (a: 'referred' | 'asked_farmer' | 'resolved') => dispatch({ type: 'advisor_act', caseId: c.id, act: a })
  const office = en.offices[c.owner]
  return (
    <Card id="case-detail" title={`${c.farmer}: ${advisor.kind[c.kind]}`} headingLevel={2}>
      <Stack gap="sm">
        {/* Who owns the next action, said once. */}
        <Text variant="strong">{advisor.next[c.state](en.offices[c.owner])}</Text>
        {c.values && (
          <Compare
            items={[
              { label: advisor.record, value: c.values.record },
              { label: advisor.his, value: c.values.his },
            ]}
          />
        )}
        <div>
          <Text variant="small">{advisor.note}</Text>
          <Text>{c.note || advisor.noNote}</Text>
        </div>
        {c.reply && (
          <div>
            <Text variant="small">{advisor.reply}</Text>
            <Text>{c.reply}</Text>
          </div>
        )}
        <Text variant="secondary">{advisor.owner(office)}</Text>
        {/* The likely next step is primary: an official record goes to its owner; resolve once the owner has settled it. */}
        {c.state !== 'resolved' && (
          <Inline>
            {c.state === 'waiting_office' ? (
              <Button variant="primary" onClick={() => act('resolved')}>{advisor.act.resolved}</Button>
            ) : (
              <Button variant="primary" onClick={() => act('referred')}>{advisor.act.referred(office)}</Button>
            )}
            {c.state !== 'waiting_farmer' && <Button onClick={() => act('asked_farmer')}>{advisor.act.asked_farmer}</Button>}
            {c.state !== 'waiting_office' && <Button variant="link" onClick={() => act('resolved')}>{advisor.act.resolved}</Button>}
          </Inline>
        )}
        {c.id === 'milan_herd' && (
          <div>
            <Button variant="link" onClick={() => go('welcome')}>{advisor.act.openApp}</Button>
          </div>
        )}
        <Table
          caption={advisor.historyTitle}
          head={[advisor.historyHead.when, advisor.historyHead.who, advisor.historyHead.what]}
          rows={c.history.map((h, i) => ({ key: `${i}`, cells: [when(h.at), h.actor, advisor.history[h.action] ?? h.action] }))}
        />
      </Stack>
    </Card>
  )
}

/** Advisor mode: only hard cases, ordered by what matters, each saying who acts next. */
export function AdvisorQueue() {
  const { state, dispatch } = useApp()
  const cases = advisorQueue(state)
  const [currentId, setCurrentId] = useState(cases[0]?.id)
  const rows = useRef<(HTMLButtonElement | null)[]>([])
  const index = Math.max(0, cases.findIndex((x) => x.id === currentId))
  const c = cases[index]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
      const k = e.key.toLowerCase()
      if (k === 'j' || k === 'k') {
        const next = Math.max(0, Math.min(cases.length - 1, index + (k === 'j' ? 1 : -1)))
        setCurrentId(cases[next].id)
        rows.current[next]?.focus()
      } else if (k === 'o' && c) {
        dispatch({ type: 'advisor_act', caseId: c.id, act: 'opened' })
        document.getElementById('case-detail')?.focus()
      } else return
      e.preventDefault()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [cases, index, c, dispatch])

  return (
    <Stack gap="md">
      <header>
        <h1>{advisor.title}</h1>
        <Text variant="small">{advisor.shortcuts}</Text>
      </header>

      <div className="queue-layout">
        <section aria-label={advisor.listLabel} className="queue-list">
          {GROUPS.filter((g) => cases.some((x) => x.state === g)).map((g) => (
            <div key={g} className="queue-group">
              <h2 className="group-title">{advisor.state[g]}</h2>
              <ol className="item-list">
                {cases.map((x, i) =>
                  x.state !== g ? null : (
                    <li key={x.id} className="queue-row" data-current={i === index || undefined} data-state={x.state}>
                      <button
                        ref={(el) => (rows.current[i] = el)}
                        type="button"
                        className="queue-open"
                        aria-current={i === index ? 'true' : undefined}
                        aria-keyshortcuts="J K O"
                        onClick={() => {
                          setCurrentId(x.id)
                          dispatch({ type: 'advisor_act', caseId: x.id, act: 'opened' })
                        }}
                      >
                        <span className="queue-who">{x.farmer}</span>
                        <span>{advisor.kind[x.kind]}</span>
                        <span className="queue-state">{advisor.next[x.state](en.offices[x.owner])}</span>
                        <span className="queue-meta">
                          {[
                            x.blocksSubmission && x.state !== 'resolved' && advisor.blocks,
                            x.state !== 'resolved' && daysLeft(TODAY, x.deadline) <= CLOSE_DAYS && advisor.deadline(formatDate(x.deadline)),
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      </button>
                    </li>
                  ),
                )}
              </ol>
            </div>
          ))}
        </section>
        <div className="queue-detail">{c && <CaseDetail c={c} />}</div>
      </div>
    </Stack>
  )
}
