import { useState } from 'react'
import { tasks } from '../copy/en'
import { Button } from '../ui/Button'
import { Field } from '../ui/Field'
import { Inline, Stack, Text } from '../ui/Layout'
import { useApp } from './AppContext'

// One specific problem, sent from inside GSA; Jelena gets its full context.
export function SendToJelena({ itemId, onDone }: { itemId: string; onDone: () => void }) {
  const { dispatch } = useApp()
  const [note, setNote] = useState('')
  return (
    <Stack gap="sm">
      <Text variant="secondary">{tasks.jelena.who}</Text>
      <Field multiline label={tasks.jelena.noteLabel} hint={tasks.jelena.noteHint} value={note} rows={3} onChange={(e) => setNote(e.target.value)} />
      <Inline>
        <Button
          variant="primary"
          onClick={() => {
            dispatch({ type: 'send_to_jelena', itemId, note: note.trim() })
            onDone()
          }}
        >
          {tasks.jelena.send}
        </Button>
        <Button onClick={onDone}>{tasks.jelena.cancel}</Button>
      </Inline>
    </Stack>
  )
}
