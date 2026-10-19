import { useEffect, useRef, useState } from 'react'
import { advisor, formatDateYear, formatTime } from '../copy/en'
import { useApp } from '../components/AppContext'
import { SCENARIOS } from '../data/scenarios'
import { advisorQueue, type AdvisorCase } from '../logic/advisor'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Checkbox } from '../ui/Checkbox'
import { Compare, Inline, Stack, Text } from '../ui/Layout'
import { Note } from '../ui/Note'
import { Table } from '../ui/Table'

// Dates follow the prototype clock; times are real.
const TODAY = SCENARIOS.second_year.today
const when = (iso: string) => {
  const day = iso.slice(0, 10) > TODAY ? TODAY : iso.slice(0, 10)
  return `${formatDateYear(day)}, ${formatTime(iso)}`
}

function CaseDetail({ c }: { c: AdvisorCase }) {
  const { dispatch, go } = useApp()
  const act = (a: 'asked_owner' | 'replied' | 'handled') => dispatch({ type: 'advisor_act', caseId: c.id, act: a })
  return (
    <Card id="case-detail" title={`${c.farmer}: ${advisor.kind[c.kind]}`} headingLevel={2}>
      <Stack gap="sm">
        {!c.live && c.id === 'milan_herd' && <Text variant="small">{advisor.example}</Text>}
        <Text>{advisor.detail[c.kind]}</Text>
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
        <Text variant="secondary">{advisor.owner[c.owner]}</Text>
        <Text variant="small">{advisor.sent(when(c.sentAt))}</Text>
        {c.lastAct && <Banner tone="success">{advisor.done[c.lastAct]}</Banner>}
        <Inline>
          <Button onClick={() => act('asked_owner')}>{advisor.act.asked_owner[c.owner]}</Button>
          <Button onClick={() => act('replied')}>{advisor.act.replied}</Button>
          {c.status === 'open' && (
            <Button variant="primary" onClick={() => act('handled')}>
              {advisor.act.handled}
            </Button>
          )}
          {c.id === 'milan_herd' && (
            <Button variant="link" onClick={() => go('welcome')}>
              {advisor.act.openApp}
            </Button>
          )}
        </Inline>
        <Table
          caption={advisor.historyTitle}
          head={[advisor.historyHead.when, advisor.historyHead.who, advisor.historyHead.what]}
          rows={c.history.map((h, i) => ({ key: `${i}`, cells: [when(h.at), h.actor, advisor.history[h.action] ?? h.action] }))}
        />
      </Stack>
    </Card>
  )
}

/** Advisor mode: same information, denser, issues first; her time goes to hard cases. */
export function AdvisorQueue() {
  const { state, dispatch } = useApp()
  const cases = advisorQueue(state)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const rows = useRef<(HTMLButtonElement | null)[]>([])
  const c = cases[Math.min(current, cases.length - 1)]

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.metaKey || e.ctrlKey || e.altKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
      const k = e.key.toLowerCase()
      if (k === 'j' || k === 'k') {
        const next = Math.max(0, Math.min(cases.length - 1, current + (k === 'j' ? 1 : -1)))
        setCurrent(next)
        rows.current[next]?.focus()
      } else if (k === 'o') {
        dispatch({ type: 'advisor_act', caseId: c.id, act: 'opened' })
        document.getElementById('case-detail')?.focus()
      } else if (k === 'x') toggle(c.id)
      else if (k === 'h' && c.status === 'open') dispatch({ type: 'advisor_act', caseId: c.id, act: 'handled' })
      else return
      e.preventDefault()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [cases, current, c, dispatch])

  const open = cases.filter((x) => x.status === 'open').length

  return (
    <Stack gap="md">
      <header>
        <h1>{advisor.title}</h1>
        <Text>{advisor.intro}</Text>
        <Inline>
          <Text variant="strong" as="span">{advisor.openCount(open)}</Text>
          <Note kind="north_star" />
        </Inline>
        <Text variant="small">{advisor.shortcuts}</Text>
      </header>

      <div className="queue-layout">
        <section aria-label={advisor.listLabel} className="queue-list">
          <ul className="item-list">
            {cases.map((x, i) => (
              <li key={x.id} className="queue-row" data-current={i === current || undefined}>
                <Checkbox label={advisor.select(x.farmer)} checked={selected.includes(x.id)} onChange={() => toggle(x.id)} />
                <button
                  ref={(el) => (rows.current[i] = el)}
                  type="button"
                  className="queue-open"
                  aria-current={i === current ? 'true' : undefined}
                  onClick={() => {
                    setCurrent(i)
                    dispatch({ type: 'advisor_act', caseId: x.id, act: 'opened' })
                  }}
                >
                  <span className="queue-who">{x.farmer}</span>
                  <span>{advisor.kind[x.kind]}</span>
                  <span className="queue-meta">
                    {advisor.status[x.status]} · {advisor.sent(when(x.sentAt))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Button
            disabled={selected.length === 0}
            onClick={() => {
              dispatch({ type: 'advisor_handle_many', caseIds: selected })
              setSelected([])
            }}
          >
            {advisor.bulk(selected.length)}
          </Button>
        </section>
        <div className="queue-detail">{c && <CaseDetail c={c} />}</div>
      </div>
    </Stack>
  )
}
