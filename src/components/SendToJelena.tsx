import { useState } from 'react'
import { ui } from '../copy/en'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Inline, Stack, Text } from '../ui/Layout'
import { useApp } from './AppContext'

// One specific problem, sent from inside GSA, with full context attached.
export function SendToJelena({ itemId, problem, onDone }: { itemId: string; problem: string; onDone: () => void }) {
  const { dispatch } = useApp()
  const [note, setNote] = useState('')
  return (
    <Stack gap="sm">
      <Text variant="strong">{ui.jelena.title}</Text>
      <Text variant="secondary">{ui.jelena.who}</Text>
      <Banner>{problem}</Banner>
      <Field multiline label={ui.jelena.noteLabel} hint={ui.jelena.noteHint} value={note} rows={3} onChange={(e) => setNote(e.target.value)} />
      <Inline>
        <Button
          variant="primary"
          onClick={() => {
            dispatch({ type: 'send_to_jelena', itemId, note: note.trim() })
            onDone()
          }}
        >
          {ui.jelena.send}
        </Button>
        <Button onClick={onDone}>{ui.jelena.cancel}</Button>
      </Inline>
    </Stack>
  )
}
