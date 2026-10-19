import { useState } from 'react'
import { ui } from '../copy/en'
import type { Item } from '../logic/status'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Compare, Inline, Stack, Text } from '../ui/Layout'
import { StatusBadge } from '../ui/StatusBadge'
import { useApp } from './AppContext'
import { SendToJelena } from './SendToJelena'

/** Both values kept, explained, who settles it, and always a way to carry on. */
export function ConflictPanel({ item, onCarryOn }: { item: Item; onCarryOn: () => void }) {
  const { state, dispatch } = useApp()
  const [composing, setComposing] = useState(false)
  if (!item.conflict) return null
  const { record, his } = item.conflict
  const requests = state.answers.requests.filter((r) => r.itemId === item.id)
  const checkAsked = requests.some((r) => r.kind === 'record_check')
  const sent = requests.some((r) => r.kind === 'jelena')

  return (
    <Stack gap="sm">
      <Inline>
        <Text variant="strong">{ui.conflict.title}</Text>
        <StatusBadge status={item.status} />
      </Inline>
      <Compare items={[{ label: ui.conflict.record, value: record }, { label: ui.conflict.yours, value: his }]} />
      <Text>{ui.conflict.explain}</Text>
      <Text variant="secondary">{ui.conflict.nonBlocking}</Text>
      {checkAsked && <Banner tone="success">{ui.conflict.checkAsked}</Banner>}
      {sent && <Banner tone="success">{ui.jelena.sent}</Banner>}
      {composing ? (
        <SendToJelena itemId={item.id} problem={ui.jelena.problem(record, his)} onDone={() => setComposing(false)} />
      ) : (
        <Inline>
          {!checkAsked && <Button onClick={() => dispatch({ type: 'ask_record_check', itemId: item.id })}>{ui.conflict.askCheck}</Button>}
          {!sent && <Button onClick={() => setComposing(true)}>{ui.conflict.sendJelena}</Button>}
          <Button variant="primary" onClick={onCarryOn}>{ui.conflict.carryOn}</Button>
        </Inline>
      )}
    </Stack>
  )
}
