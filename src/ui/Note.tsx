import { createContext, useContext } from 'react'

// Design note tags. Shown only when design notes are on (prototype controls).
// Everything is North Star, so only real distinctions are tagged. 'ai' shows Earl where AI works; Milan never sees it.
export type NoteKind = 'tested' | 'eu_mandate' | 'assumption' | 'ai'

const LABEL: Record<NoteKind, string> = {
  tested: 'Tested (44 sessions)',
  eu_mandate: 'EU mandate',
  assumption: 'Assumption to confirm with the ministry',
  ai: 'AI behind the scenes',
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
