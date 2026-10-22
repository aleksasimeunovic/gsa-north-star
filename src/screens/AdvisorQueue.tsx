import { useEffect, useRef, useState } from 'react'
import { advisor, en, formatDate, formatDateYear, formatTime } from '../copy/en'
import { useApp } from '../components/AppContext'
import { SCENARIOS } from '../data/scenarios'
import { advisorQueue, type AdvisorCase } from '../logic/advisor'
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

/** Who owns the next action, in words; a named office when it's waiting on one. */
const stateLine = (c: AdvisorCase) => (c.state === 'waiting_office' ? advisor.waitingFor(en.offices[c.owner]) : advisor.state[c.state])

function CaseDetail({ c }: { c: AdvisorCase }) {
  const { dispatch, go } = useApp()
  const act = (a: 'referred' | 'asked_farmer' | 'resolved') => dispatch({ type: 'advisor_act', caseId: c.id, act: a })
  const office = en.offices[c.owner]
  return (
    <Card id="case-detail" title={`${c.farmer}: ${advisor.kind[c.kind]}`} headingLevel={2}>
      <Stack gap="sm">
        <Text variant="strong">{stateLine(c)}</Text>
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
        <Text variant="secondary">{advisor.owner(office)}</Text>
        {c.state !== 'resolved' && (
          <Inline>
            {c.state !== 'waiting_office' && <Button onClick={() => act('referred')}>{advisor.act.referred(office)}</Button>}
            {c.state !== 'waiting_farmer' && <Button onClick={() => act('asked_farmer')}>{advisor.act.asked_farmer}</Button>}
            <Button variant="primary" onClick={() => act('resolved')}>{advisor.act.resolved}</Button>
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
          <ol className="item-list">
            {cases.map((x, i) => (
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
                  <span className="queue-state">{stateLine(x)}</span>
                  <span className="queue-meta">
                    {[x.blocksSubmission && x.state !== 'resolved' && advisor.blocks, advisor.deadline(formatDate(x.deadline))].filter(Boolean).join(' · ')}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </section>
        <div className="queue-detail">{c && <CaseDetail c={c} />}</div>
      </div>
    </Stack>
  )
}
