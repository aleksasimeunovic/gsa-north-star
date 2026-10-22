import { createContext, useContext } from 'react'

// Design note tags. Shown only when design notes are on (prototype controls).
// Everything is North Star, so only real distinctions are tagged.
export type NoteKind = 'tested' | 'eu_mandate' | 'assumption'

const LABEL: Record<NoteKind, string> = {
  tested: 'Tested (44 sessions)',
  eu_mandate: 'EU mandate',
  assumption: 'Assumption to confirm with the ministry',
}

export const NotesContext = createContext(false)

export function Note({ kind }: { kind: NoteKind }) {
  if (!useContext(NotesContext)) return null
  return (
    <span className="note" data-kind={kind}>
      <span className="visually-hidden">Design note: </span>
      {LABEL[kind]}
    </span>
  )
}
