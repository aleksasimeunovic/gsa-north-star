import { createContext, useContext } from 'react'

// Design note tags. Shown only when design notes are on (prototype controls).
export type NoteKind = 'tested' | 'north_star' | 'eu_mandate' | 'assumption'

const LABEL: Record<NoteKind, string> = {
  tested: 'Tested (44 sessions)',
  north_star: 'North Star proposal',
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
